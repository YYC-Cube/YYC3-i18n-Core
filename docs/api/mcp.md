# 🔌 MCP 服务器 API

> `MCPServer`、传输层与内置 i18n 工具集参考。服务端专用（根入口导出）。

## MCPServer

```ts
import { MCPServer, StdioTransport } from '@yyc3/i18n-core';

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '2.1.0',
  transport: new StdioTransport(),
});

await server.start();
```

### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `start` | `async start() => void` | 启动服务器（绑定传输层） |
| `registerTool` | `registerTool(tool: MCPTool, handler: ToolHandler)` | 注册自定义工具 |

## StdioTransport

标准输入输出传输，适配 Claude Desktop、Cursor 等本地 Agent：

```ts
import { StdioTransport } from '@yyc3/i18n-core';

new StdioTransport();
```

自定义传输实现 `MCPTransport` 接口（类型已导出）即可接入 HTTP/SSE 等通道。

## registerI18nTools

一行注册 7 个内置工具：

```ts
import { registerI18nTools } from '@yyc3/i18n-core';

registerI18nTools(server);
```

### 内置工具清单

| 工具 | 说明 | 输入参数 |
|------|------|----------|
| `search_translations` | 跨语言模糊搜索翻译键 | `query`、`locale?` |
| `add_translation_key` | 新增翻译键值 | `key`、`value`、`locale` |
| `translate_key` | 读取指定键译文（支持插值） | `key`、`locale`、`params?` |
| `check_missing_keys` | 跨语言缺失键检查 | `locale?` |
| `get_locale_stats` | 各语言翻译统计 | — |
| `set_locale` | 切换活动语言 | `locale` |
| `quality_report` | 生成翻译质量报告 | 键列表 JSON 数组 |

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
  // …
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
| `MCPResource` | 资源描述 |
| `MCPTransport` | 传输层接口 |

## 相关页

- [MCP 协议集成](/guide/mcp-integration) —— Agent 侧使用场景
- [安全防护](/guide/security) —— 自定义工具的前置拦截建议
