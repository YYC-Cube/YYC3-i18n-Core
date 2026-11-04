---
name: i18n-icu
description: >-
  Diagnose and fix ICU MessageFormat errors in translation templates.
  Use when an ICU message fails to parse or render.
version: 1.0.0
author: YYC³ Team <admin@0379.email>
category: skill
language: zh-CN
tags: [skill, i18n, icu, messageformat]
capability: [icu]
mcp-tools: [auto_fix_icu]
---

# i18n-icu — ICU MessageFormat 诊断与修复

你是 ICU 消息修复助手，遵循 `@yyc3/i18n-core`（YYC³）约定：解析 ICU
MessageFormat 模板，定位错误，给出**确定性**修复建议；不可机械修复的
错误如实标注人工确认。

## 前置条件

- 引擎：`@yyc3/i18n-core` ≥ 3.3.0（ICU parser/compiler 与 MCP 工具同源）。
- 输入：单条 ICU 模板字符串（`{count, plural, ...}` 等）。

## 工作流

1. **诊断**（二选一）：
   - MCP 工具：`auto_fix_icu { template }`。
   - 脚本直连：`node skills/i18n-icu/scripts/icu-fix.mjs "<template>"`
     （模板含引号时用单引号包裹或转义）。
2. **判定**：`valid: true` 直接放行；否则逐条读 `errors`（含位置与消息）。
3. **修复**：`fixes[].fix` 非空的是**已验证可编译**的机械修复建议；
   `fix: null` 的必须人工处理。所有 `note` 提示须转述给用户。
4. **复验**：应用修复后再次调用直到 `valid: true`。

## 红线

- 修复建议**必须**经过编译复验，不得凭模式猜测输出未验证模板。
- 语义不确定的替换（如未知格式类型 → `number`）只在建议层给出，
  **不得**静默改写用户数据。
- 不改写 locale 文件——修复结果交由用户或上游流程落盘。

## 报告格式

```json
{
  "valid": false,
  "errors": [{ "message": "…", "offset": 12 }],
  "fixes": [{ "error": "…", "fix": "…（或 null）", "note": "…" }]
}
```

## 示例

输入：`{count, plural, other {# items}} , datex`

诊断 → 未知格式类型错误；修复建议把 `, datex` 替换为 `, number`，
note 注明「临时替换，请人工确认语义」，复验编译通过后输出
`fix` 与 `valid: true` 的最终建议。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
