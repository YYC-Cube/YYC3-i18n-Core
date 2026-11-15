# 🔌 MCP 协议集成

> 业界首个 i18n 领域 MCP（Model Context Protocol）服务器：**13 个内置工具 + 5 个可选工作流工具 + 3 类资源**，让 Claude、Cursor 等 AI Agent 直接读写翻译资源。

## 为什么是 MCP

传统流程里 AI 只能"建议"译文，人再手动搬运。MCP 服务器把翻译资源库变成 AI Agent 的**一等工具**：Agent 可以自主搜索缺失键、补译、校验质量、生成报告，人只做审核。

## 启动服务器

```ts
import { I18nEngine } from '@yyc3/i18n-core';
import { MCPServer, registerI18nTools } from '@yyc3/i18n-core/mcp';
import { StdioTransport } from '@yyc3/i18n-core/node';

const engine = new I18nEngine({ locale: 'en' });
engine.registerTranslation('en', { nav: { home: 'Home' } });

const server = new MCPServer({
  name: 'yyc3-i18n-tools',
  version: '3.5.0',
  transport: new StdioTransport(), // 标准输入输出传输
});

// 一行注册全部 13 个内置 i18n 工具 + 资源
registerI18nTools(server, engine);

await server.start();
console.log('MCP Server started on stdio');
```

::: warning 服务端专用
MCP 传输依赖 Node 内建能力：`StdioTransport` 从 `@yyc3/i18n-core/node` 导入；服务端共享形态用 `@yyc3/i18n-core/mcp` 的 `StreamableHttpTransport`（见[部署指南](/guide/mcp-deploy)）。
:::

## 内置工具（13 个）

| 工具 | 功能 | 关键参数 |
|------|------|----------|
| `search_translations` | 跨语言模糊搜索翻译键 | `query`、`locale?` |
| `add_translation_key` | 新增翻译键 | `key`、`value`、`locale` |
| `translate_key` | 读取指定键译文（支持 locale 切换与插值） | `key`、`locale?`、`params?` |
| `check_missing_keys` | 跨语言缺失键检查 | `locale` |
| `compare_locales` | 双语言键差异矩阵 | `localeA`、`localeB` |
| `get_locale_stats` | 各语言翻译统计 | — |
| `set_locale` | 切换活动语言 | `locale` |
| `quality_score` | 翻译对评分（百分制 + passed 判定） | `sourceText`、`translatedText`、`sourceLocale`、`targetLocale` |
| `quality_report` | 生成翻译质量报告 | 键列表（JSON 数组） |
| `extract_keys` | 从源码文本提取 `t()` 键 | `code`、`unique?` |
| `auto_fix_icu` | ICU 模板诊断与修复建议 | `template` |
| `export_formats` | 语言包多格式导出（JSON/CSV/YAML） | `locale`、`format?` |
| `glossary_lookup` | 术语表查询（exact/prefix/locale 三模式） | `mode`、`term?`/`locale?` |

### 在 AI Agent 中使用

以 Claude / Cursor 的 MCP 配置为例，将上述服务器注册为 stdio 工具源后，Agent 即可执行如下对话式操作：

```text
用户：把设置页缺失的翻译补齐到日语和阿拉伯语

Agent：
1. check_missing_keys(locale)      → 发现 settings.profile.bio 等 3 键
2. extract_keys(code)              → 从源码核对键名拼写
3. add_translation_key(…, locale)  → 逐键写入 ja / ar
4. quality_score(…)                → 校验 ICU 语法与占位符完整性
5. compare_locales(en, ja)         → 汇报覆盖率差异
```

## 资源（Resources）

除工具外，服务器声明三类只读资源：

| URI | 内容 |
|-----|------|
| `locales://{locale}` | 指定语言的语言包全文（URI 模板） |
| `coverage://report` | 全语言缺失键快照 |
| `ota://status` | OTA 远程源同步状态（仅当 `registerI18nTools` 注入 `otaSources` 时声明） |

## 编程直连（不经传输层）

技能脚本与宿主嵌入可跳过 MCP 传输直接调用 13 工具：

```ts
import { I18nEngine, createI18nToolkit } from '@yyc3/i18n-core';

const toolkit = createI18nToolkit(new I18nEngine({ locale: 'en' }));
const { keys } = await toolkit.call('extract_keys', { code: "t('nav.title')" });
// → { keys: ['nav.title'], count: 1, unique: true }

toolkit.list();                          // 13 个工具名
toolNamesForCapability('audit');         // 能力 → 工具发现映射
```

## 可选：翻译工作流工具（SSO 审批链）

显式接线才注册 5 个工作流工具（缺省工具面不变）——角色权限与 token 验证见[翻译工作流](/guide/translation-workflow)：

```ts
import { registerWorkflowTools } from '@yyc3/i18n-core/mcp';

registerWorkflowTools(server, workflow); // workflow_submit/approve/reject/publish/list
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
  const map = engine.getTranslations(args.locale as never);
  return { content: [{ type: 'text', text: JSON.stringify(map, null, 2) }] };
};

server.registerTool(tool, handler);
```

## 传输层

`StdioTransport`（本地 Agent）与 `StreamableHttpTransport`（服务端共享，MCP 规范 2025-03-26 现行标准）双内置，均为零依赖实现；`MCPTransport` / `MCPMessage` 类型已导出，可自定义传输接入。

## 下一步

- [MCP 部署与运维](/guide/mcp-deploy) —— Streamable HTTP 服务端形态
- [技能矩阵](/guide/skills-matrix) —— 13 工具的 AI 编程工具消费面
- [翻译工作流](/guide/translation-workflow) —— SSO 审批链工具组
