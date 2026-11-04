# 🚀 MCP 部署与运维指南

> `@yyc3/i18n-core/mcp` 的部署形态、反代基线、健康检查与故障排查。配套 [MCP API 参考](/api/mcp)。

## 一、部署形态选型

| 形态 | 传输 | 适用 | 启动方式 |
|------|------|------|----------|
| 本地 Agent | StdioTransport | Claude Desktop / Cursor / Trae 单机接入 | 客户端拉起进程，无需自行部署 |
| 服务端共享 | **StreamableHttpTransport** | 团队共享翻译能力、CI 任务、远程 Agent | 自行托管 HTTP 服务（本指南主体） |
| 嵌入宿主 | 自定义 MCPTransport | 已有 HTTP 框架的宿主应用 | 实现 `MCPTransport` 三方法接入 |

## 二、Stdio 接入配置（客户端侧）

`claude_desktop_config.json` / Cursor MCP 配置片段：

```json
{
  "mcpServers": {
    "yyc3-i18n": {
      "command": "npx",
      "args": ["-y", "-e", "import { StdioTransport } from '@yyc3/i18n-core/mcp'"],
      "env": {}
    }
  }
}
```

> Stdio 形态下进程生命周期由客户端管理；`env` 可注入 `NODE_OPTIONS` 等。

## 三、Streamable HTTP 部署

### 3.1 基础启动

```ts
// scripts/mcp-http-server.mjs（随包 scripts 示例，node 直接运行）
import { MCPServer, StreamableHttpTransport } from '@yyc3/i18n-core';

const transport = new StreamableHttpTransport({
  port: Number(process.env.MCP_PORT ?? 3001),
  host: process.env.MCP_HOST ?? '127.0.0.1',
  endpoint: '/mcp',
  corsOrigins: process.env.MCP_CORS_ORIGINS?.split(','),
});

const server = new MCPServer({ name: 'yyc3-i18n-tools', version: '3.2.0', transport });
await server.start();
console.log('[mcp] listening', transport.address());
```

环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `MCP_PORT` | `3001` | 监听端口 |
| `MCP_HOST` | `127.0.0.1` | 绑定地址（公网暴露务必走反代） |
| `MCP_CORS_ORIGINS` | 未设置=不校验 | 逗号分隔 Origin 白名单 |

### 3.2 反向代理基线（Nginx）

```nginx
location /mcp {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header Origin $scheme://$host;   # 供 corsOrigins 校验
    proxy_read_timeout 300s;                   # initialize/工具调用长响应
    proxy_buffering off;                       # 保留未来 SSE 流式响应能力
}
```

要点：
- **TLS 终止在反代**，传输层只绑回环
- **会话粘性**：`Mcp-Session-Id` 由本服务签发；单实例部署无粘性问题，多实例需 L7 会话粘滞或改为外部会话存储（当前实现为单会话模型，水平扩容前先评估）

### 3.3 容器化

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY node_modules/@yyc3/i18n-core node_modules/@yyc3/i18n-core
ENV MCP_HOST=0.0.0.0 MCP_PORT=3001
CMD ["node", "scripts/mcp-http-server.mjs"]
```

健康检查：`GET /mcp` 期望 **405**（非 5xx 即存活）；`POST /mcp` 空体 → 400。

## 四、运维手册

### 4.1 会话生命周期

| 现象 | 语义 | 处置 |
|------|------|------|
| 客户端持续收到 404 `-32001` | 会话已失效（服务重启/DELETE/超时策略） | 客户端自动重新 `initialize` |
| 大量 400 `-32000` | 客户端未回传 `Mcp-Session-Id` 头 | 排查客户端/反代是否剥头 |
| `DELETE /mcp` 204 | 客户端主动终止 | 正常 |

### 4.2 监控指标建议

- `POST /mcp` 计数按 `method` 维度（从请求体采样）
- `tools/call` 按 `name` 与耗时直方图（`extract_keys`/`compare_locales` 为纯内存操作 P99 < 10ms；`translate_key` 涉及懒加载语言时首调耗时上升属预期）
- 资源读取失败率（-32602）

### 4.3 故障排查

| 症状 | 定位 | 处置 |
|------|------|------|
| `Failed to resolve entry for package "@yyc3/i18n-core"` | 先于构建消费（无 dist） | `pnpm build` 先行（CI 已保证顺序） |
| 工具清单缺失某工具 | 消费了旧版本包 | `npm view @yyc3/i18n-core version` 核对 ≥3.2.0 |
| `glossary_lookup` 返回 No glossary configured | 未注入术语表 | `registerI18nTools(server, engine, { glossary })` |
| HTTP 403 | Origin 不在 `corsOrigins` | 反代需透传 `Origin` 头并加入白名单 |

## 五、安全基线

1. **Origin 白名单**必配（公网部署），防 DNS rebinding
2. `add_translation_key` / `set_locale` 为**写操作**——多租户共享部署时置于鉴权网关之后（本传输层不含鉴权，按零依赖原则交由反代/网关）
3. 反代剥离外层 TLS 头后仅透传标准头；不要透传客户端伪造的 `Mcp-Session-Id` 之外的自定义会话头
4. 版本升级遵循 exports 契约门禁（`pnpm audit:contract`），子路径变更视为 minor 以上发布

## 六、CI 门禁清单（维护者）

| 门禁 | 命令 | 红线 |
|------|------|------|
| 标头标尾 | `pnpm audit:headers` | 代码 114/114 + 文档 273+ 校验点 100% |
| exports 契约 | `pnpm audit:contract` | 零依赖断言 + 产物一致性 + engines ≥20.19 |
| 测试覆盖 | `pnpm test:coverage` | 90/90/90/90 四维阈值（现值 96.67/91.47/96.82/97.6） |
| Bundle 体积 | `pnpm size` | ≤95 kB brotli（现值 ~20 kB） |
| CLI 语法门 | `pnpm --filter @yyc3/cli-integration check` | node --check |

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-04 | 首次发布：部署形态选型、Streamable HTTP 启动与反代基线、会话生命周期运维、安全基线、CI 门禁清单（501 G2 配套） | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
