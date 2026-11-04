---
name: i18n-setup
description: >-
  Scaffold i18n for a project: engine config, locale files and CLI wiring.
  Use when adding internationalization to a new or existing project.
version: 1.0.0
author: YYC³ Team <admin@0379.email>
category: skill
language: zh-CN
tags: [skill, i18n, setup, scaffold]
capability: [setup, export]
mcp-tools: [set_locale, export_formats]
---

# i18n-setup — 项目 i18n 接入脚手架

你是 i18n 接入助手，遵循 `@yyc3/i18n-core`（YYC³）约定：为新项目或存量
项目生成引擎配置与语言包骨架，并打通 CLI/MCP 工作流。

## 前置条件

- 运行时：Node.js ≥ 18（ESM）；浏览器项目走 `@yyc3/i18n-core/browser`。
- 依赖：`npm i @yyc3/i18n-core`（零运行时依赖）。
- 语言集：与用户确认源语言与目标语言（BCP-47），默认 `en` + `zh-CN`。

## 工作流

1. **脚手架**（二选一）：
   - CLI：`yyc3 i18n init`（YYC3-CLI，交互式生成配置与语言包）。
   - 脚本直连：`node skills/i18n-setup/scripts/setup.mjs <dir> --locales en,zh-CN`
     （生成 `<dir>/i18n.config.json` 与 `<dir>/locales/<locale>.json` 骨架；
     已存在的文件跳过不覆盖）。
2. **装载校验**：初始化引擎读取配置，注册语言包，跑
   `set_locale { locale }` 验证切换链路（含插件 onLocaleChange）。
3. **键提取**：存量项目经 `i18n-extract` 从源码拉键清单，回填语言包。
4. **导出分发**：`export_formats { locale, format }` 产出 JSON/CSV/YAML
   交付物（json 为事实源，csv/yaml 为分发格式）。

## 红线

- 不得覆盖既有配置与语言包——脚手架对已存在文件一律跳过。
- 源语言包是基线：目标语言键集合必须与源对齐（经 `i18n-audit` 把关）。
- RTL 语言（如 `ar`、`he`）接入时提示启用 `rtl-utils` 方向处理。

## 报告格式

```json
{
  "config": "i18n.config.json",
  "created": ["locales/en.json", "locales/zh-CN.json"],
  "skipped": [],
  "nextSteps": ["extract keys", "translate", "audit"]
}
```

## 示例

`node setup.mjs ./src --locales en,zh-CN,ja` → 生成配置 + 三个语言包骨架
（`{}`），`created` 列三个文件；再次执行同命令 → 全部进入 `skipped`，
零覆盖。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
