# 🧩 技能矩阵

> 插件 × MCP × 技能三位一体：能力层一比一暴露为协议层（13 工具），再一比一描述为认知层（技能包）——AI 编程工具「何时用、怎么用」的说明书随 npm 包分发。

## 什么是技能包

技能包是 [Agent Skills 开放标准](https://agentskills.io)（兼容 Claude Code / Codex / Cursor / Amp / VS Code）的消费单元。安装 `@yyc3/i18n-core` 后，六个 i18n 技能包即随包就位：

```
node_modules/@yyc3/i18n-core/skills/
├── i18n-extract/   # 「给这段代码提取翻译键」
├── i18n-audit/     # 「检查翻译覆盖率/缺失键」
├── i18n-translate/ # 「把 en.json 翻成 ja」
├── i18n-quality/   # 「评估翻译质量」
├── i18n-icu/       # 「修复这条 ICU 报错」
└── i18n-setup/     # 「给项目接入 i18n」
```

每个技能包含 `SKILL.md`（双 front matter：开放规范必填字段 + YYC³ 扩展）与 `scripts/*.mjs` 薄封装——可执行脚本优先于长流程描述，经 `createI18nToolkit` 直连 13 工具，不经 MCP 传输层。

## 快速使用

```bash
# 技能脚本直连（薄封装，零配置）
node node_modules/@yyc3/i18n-core/skills/i18n-extract/scripts/extract.mjs src/**/*.ts
node node_modules/@yyc3/i18n-core/skills/i18n-audit/scripts/audit.mjs locales/en.json locales/ja.json
```

或在 Claude Code / Cursor 中把 `skills/` 目录注册为技能源，Agent 按描述自动激活对应技能。

## 能力词汇表

技能包 `capability` 字段与插件合同 v2 的 `meta.capability` 共享单一词汇表 `CAPABILITY_VOCABULARY`（12 词条）——插件注册即可被技能索引：

```ts
import { CAPABILITY_VOCABULARY, unknownCapabilities } from '@yyc3/i18n-core/plugins';

CAPABILITY_VOCABULARY;          // extract/audit/translate/quality/icu/setup/export/glossary/reporting/performance/logging/audit-trail
unknownCapabilities(['hack']);  // → ['hack']（词汇表外即非法）
```

## 规范与校验

- front matter：`name`（ASCII kebab-case）+ `description` 必填（开放规范），`version`/`capability`/`mcp-tools` 等为 YYC³ 扩展
- 正文预算 < 5000 tokens（渐进披露纪律）
- 双侧校验：`src/test/skills.test.ts` 合同测试（结构/预算/词汇表一致性/脚本端到端）+ YYC3-CLI `yyc3 skills validate`

## 下一步

- [MCP 协议集成](/guide/mcp-integration) —— 工具面全景
- [翻译工作流](/guide/translation-workflow) —— 企业审批链
