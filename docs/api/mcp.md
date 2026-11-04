# 🔌 MCP 服务器 API（v3.2.0）

> `MCPServer`、传输矩阵与 13 个内置 i18n 工具参考。服务端专用（`@yyc3/i18n-core/mcp` 子路径）。

## MCPServer

```ts
import { MCPServer, StdioTransport } from '@yyc3/i18n-core';

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '3.2.0',
  transport: new StdioTransport(),
});

await server.start();
```

### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `start` | `async start() => void` | 启动服务器（绑定传输层） |
| `registerTool` | `registerTool(tool: MCPTool, handler)` | 注册自定义工具 |
| `registerResource` | `registerResource(resource: MCPResource)` | 注册静态资源声明 |
| `registerResourceProvider` | `registerResourceProvider(provider: MCPResourceProvider)` | 注册动态资源读取器（v3.2.0） |
| `getTools` / `getResources` | — | 只读清单 |
| `getToolHandler` | `getToolHandler(name: string)` | 读取工具处理器（registry 消费端入口，v3.2.0） |

## 传输矩阵

### StdioTransport

标准输入输出，适配 Claude Desktop、Cursor 等本地 Agent：

```ts
import { StdioTransport } from '@yyc3/i18n-core';

new StdioTransport();
```

### StreamableHttpTransport（v3.2.0，MCP 2025-03-26 现行标准）

零依赖（`node:http` 原生），单端点 POST + JSON 响应模式，`Mcp-Session-Id` 会话管理，Origin 校验防 DNS rebinding：

```ts
import { MCPServer, StreamableHttpTransport } from '@yyc3/i18n-core';

const transport = new StreamableHttpTransport({
  port: 3001,                          // 缺省 0（随机端口，用 transport.address() 读取）
  host: '127.0.0.1',                   // 反代部署时绑定回环
  endpoint: '/mcp',                    // 默认 /mcp
  corsOrigins: ['https://claude.ai'],  // 可选：白名单外 Origin → 403
});

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '3.2.0',
  transport,
});
await server.start();
console.log(transport.address()); // { port: 3001, host: '127.0.0.1' }
```

协议行为（经一致性测试验证）：

| 行为 | 响应 |
|------|------|
| `initialize` | 200 + `Mcp-Session-Id` 头（协议版本协商：2024-11-05 / 2025-03-26 回显） |
| 非 initialize 未携带会话头 | 400 `-32000` |
| 会话 id 不匹配（含 DELETE 后旧 id） | 404 `-32001`（客户端应重新 initialize） |
| 仅通知（无 id 消息） | 202 无正文 |
| `GET /mcp` | 405（不提供 server-initiated 流，规范允许） |
| `DELETE /mcp` | 204 终止会话 |
| 非法 JSON / 空 batch | 400 `-32700` / `-32600` |

自定义传输实现 `MCPTransport` 接口（类型已导出）即可接入其他通道。

## registerI18nTools

一行注册 13 个内置工具（v3.2.0 起 7 存量 + 6 新增）：

```ts
import { registerI18nTools } from '@yyc3/i18n-core';
import { Glossary } from '@yyc3/i18n-core/plugins';

const glossary = new Glossary();
glossary.load([{ term: 'Dashboard', translations: { 'zh-CN': '仪表盘' } }]);

// glossary 可选注入：启用 glossary_lookup 的完整查询能力
registerI18nTools(server, engine, { glossary });
```

### 内置工具清单

| 工具 | 版本 | 说明 | 输入参数 |
|------|------|------|----------|
| `search_translations` | 存量 | 跨语言模糊搜索翻译键 | `query`、`locale?` |
| `add_translation_key` | 存量 | 新增翻译键值 | `key`、`value`、`locale` |
| `translate_key` | 存量 | 读取指定键译文（支持插值） | `key`、`locale?`、`params?` |
| `check_missing_keys` | 存量 | 跨语言缺失键检查 | `locale` |
| `get_locale_stats` | 存量 | 各语言翻译统计 | — |
| `set_locale` | 存量 | 切换活动语言 | `locale` |
| `quality_report` | 存量 | 键级覆盖报告 | `keys?`（JSON 数组） |
| `extract_keys` | **3.2.0** | 从代码文本提取 t() 键 | `code`、`unique?` |
| `compare_locales` | **3.2.0** | 双语言差异矩阵 | `localeA`、`localeB` |
| `quality_score` | **3.2.0** | 规则化翻译质量评分 | `sourceText`、`translatedText`、`sourceLocale`、`targetLocale` |
| `auto_fix_icu` | **3.2.0** | ICU 错误定位 + 已验证修复建议 | `template` |
| `export_formats` | **3.2.0** | 多格式导出 | `locale`、`format?`(json/csv/yaml) |
| `glossary_lookup` | **3.2.0** | 术语查询 | `mode`(exact/prefix/locale)、`term?`、`locale?` |

## Resources 面（v3.2.0）

| URI | 内容 |
|------|------|
| `locales://{locale}` | 已加载语言包只读资源（JSON；未加载语言 → -32602） |
| `coverage://report` | 全部已加载语言缺失键快照（perLocale 统计） |

动态内容由 `MCPResourceProvider`（`canRead`/`read` 合同）提供——自定义 provider 抛错映射为 JSON-RPC -32602。

## Glossary 术语表（v3.2.0）

`new Glossary()` → `load(entries)` / `lookup(term)`（大小写不敏感）/ `search(prefix)` / `translationsFor(locale)` / `size()` / `checkTranslations(items)`（违规检测：译文出现源词而有固定译法 → 违规，含 excerpt 与 expected）。`forbidSourceTerm` 默认 true。

## 自定义工具

```ts
import type { MCPTool, ToolHandler } from '@yyc3/i18n-core';

const tool: MCPTool = {
  name: 'my_tool',
  description: '…',
  inputSchema: {
    type: 'object',
    properties: { /* JSON Schema */ },
    required: [],
  },
};

const handler: ToolHandler = async (args) => {
  return { content: [{ type: 'text', text: '…' }] };
};

server.registerTool(tool, handler);
```

## 类型总表

| 类型 | 用途 |
|------|------|
| `MCPServerConfig` | 服务器构造配置（name/version/transport…） |
| `MCPServerInfo` | 服务器元信息 |
| `MCPServerCapabilities` | 能力协商声明 |
| `MCPTool` / `MCPToolResult` / `ToolHandler` | 工具契约 |
| `MCPMessage` | 传输层消息 |
| `MCPResource` / `MCPResourceProvider`（v3.2.0） | 资源描述 / 动态资源读取器 |
| `MCPTransport` | 传输层接口 |
| `Glossary` / `GlossaryEntry`（v3.2.0） | 术语表 |
| `I18nPluginV2` / `definePlugin` / `RegisterPluginOptions`（v3.2.0） | 插件合同 v2 |

## 相关页

- [MCP 协议集成](/guide/mcp-integration) —— Agent 侧使用场景
- [部署与运维](/guide/mcp-deploy) —— Streamable HTTP 部署、反代与安全基线
- [安全防护](/guide/security) —— 自定义工具的前置拦截建议
