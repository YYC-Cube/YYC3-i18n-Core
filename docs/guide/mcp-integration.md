# 🔌 MCP 协议集成

> 业界首个 i18n 领域 MCP（Model Context Protocol）服务器：7 个工具让 Claude、Cursor 等 AI Agent 直接读写翻译资源。

## 为什么是 MCP

传统流程里 AI 只能"建议"译文，人再手动搬运。MCP 服务器把翻译资源库变成 AI Agent 的**一等工具**：Agent 可以自主搜索缺失键、补译、校验质量、生成报告，人只做审核。

## 启动服务器

```ts
import {
  MCPServer,
  StdioTransport,
  registerI18nTools,
} from '@yyc3/i18n-core';

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '2.1.0',
  transport: new StdioTransport(), // 标准输入输出传输
});

// 一行注册全部内置 i18n 工具
registerI18nTools(server);

await server.start();
console.log('MCP Server started on stdio');
```

::: warning 服务端专用
MCP 模块依赖 Node 内建能力，仅从根入口 `@yyc3/i18n-core` 导入；浏览器端不可用。
:::

## 内置工具（7 个）

| 工具 | 功能 | 关键参数 |
|------|------|----------|
| `search_translations` | 跨语言模糊搜索翻译键 | `query`、`locale?` |
| `add_translation_key` | 新增翻译键 | `key`、`value`、`locale` |
| `translate_key` | 读取指定键译文（支持插值参数） | `key`、`locale`、`params?` |
| `check_missing_keys` | 跨语言缺失键检查 | `locale?` |
| `get_locale_stats` | 各语言翻译统计 | — |
| `set_locale` | 切换活动语言 | `locale` |
| `quality_report` | 生成翻译质量报告 | 键列表（JSON 数组） |

### 在 AI Agent 中使用

以 Claude / Cursor 的 MCP 配置为例，将上述服务器注册为 stdio 工具源后，Agent 即可执行如下对话式操作：

```text
用户：把设置页缺失的翻译补齐到日语和阿拉伯语

Agent：
1. check_missing_keys()            → 发现 settings.profile.bio 等 3 键
2. add_translation_key(…, locale)  → 逐键写入 ja / ar
3. quality_report([…])             → 校验 ICU 语法与占位符完整性
4. get_locale_stats()              → 汇报覆盖率变化
```

## 自定义工具

`registerTool` 接收 JSON Schema 描述的工具定义与处理函数：

```ts
import type { MCPTool, ToolHandler } from '@yyc3/i18n-core';

const tool: MCPTool = {
  name: 'export_locale',
  description: 'Export a locale bundle as JSON',
  inputSchema: {
    type: 'object',
    properties: {
      locale: { type: 'string', description: 'Locale to export' },
    },
    required: ['locale'],
  },
};

const handler: ToolHandler = async (args) => {
  const map = i18n.getTranslations(args.locale);
  return { content: [{ type: 'text', text: JSON.stringify(map, null, 2) }] };
};

server.registerTool(tool, handler);
```

## 传输层

内置 `StdioTransport` 覆盖本地 Agent 场景；`MCPTransport` / `MCPMessage` 类型已导出，可实现 HTTP/SSE 等自定义传输接入远程 Agent。

## 配置项参考

`MCPServerConfig` 支持 `name`、`version`、`transport` 等字段；能力协商通过 `MCPServerCapabilities` 声明，服务器信息经 `MCPServerInfo` 暴露给客户端。

## 下一步

- [AI 翻译集成](/guide/ai-translation) —— 批量补译引擎
- [安全防护](/guide/security) —— Agent 写操作的安全边界
