# YYC³ i18n 技能矩阵（501 G3）

> 插件 × MCP × 技能三位一体：能力层（`src/lib/`）一比一暴露为协议层（MCP 13 工具），
> 再一比一描述为认知层（本目录 SKILL.md）。单一事实源，三面同源。

## 首批六技能

| 技能包 | 触发场景 | capability | MCP 工具入口 |
| ---- | ---- | ---- | ---- |
| `i18n-extract` | 「给这段代码提取翻译键」 | `extract` | `extract_keys` |
| `i18n-audit` | 「检查翻译覆盖率/缺失键」 | `audit` | `check_missing_keys` + `compare_locales` + `get_locale_stats` |
| `i18n-translate` | 「把 en.json 翻成 ja」 | `translate` | `translate_key` + `add_translation_key` |
| `i18n-quality` | 「评估翻译质量」 | `quality`, `glossary` | `quality_score` + `glossary_lookup` |
| `i18n-icu` | 「修复这条 ICU 报错」 | `icu` | `auto_fix_icu` |
| `i18n-setup` | 「给项目接入 i18n」 | `setup` | `set_locale`（+ CLI `yyc3 i18n init`） |

## 技能包规范

- `SKILL.md`：双 front matter 融合——开放规范（agentskills.io）必填字段
  `name`（ASCII kebab-case）+ `description` 在前，YYC³ 扩展字段
  （`version`/`author`/`category`/`language`/`tags`/`capability`/`mcp-tools`）随后。
- `capability` 取值必须 ⊆ `CAPABILITY_VOCABULARY`（`@yyc3/i18n-core` 导出，
  与插件合同 v2 `meta.capability` 同词汇表）。
- 正文渐进披露预算 < 5000 tokens；可执行脚本优先于长流程描述。
- `scripts/*.mjs`：薄封装，经 `createI18nToolkit`（`@yyc3/i18n-core` 编程调用面）
  直连 13 工具，不经 MCP 传输层。

## 校验

```bash
npx vitest run src/test/skills.test.ts   # 结构/合同/预算/脚本冒烟
yyc3 skills validate                      # YYC3-CLI 侧规范性校验（skills-hub 同步后）
```

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
