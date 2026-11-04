#!/usr/bin/env node
// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file icu-fix.mjs
 * description i18n-icu 技能薄封装 — ICU 模板诊断与修复建议（auto_fix_icu）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[icu]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node icu-fix.mjs "<icu-template>"
 */
import { I18nEngine, createI18nToolkit } from "../../../dist/index.js";

const template = process.argv.slice(2).join(" ");

function fail(msg) {
  process.stderr.write(`[i18n-icu] ${msg}\n`);
  process.exit(1);
}

if (!template) {
  fail(`用法：node icu-fix.mjs "<icu-template>"`);
}

try {
  const toolkit = createI18nToolkit(new I18nEngine({ locale: "en" }));
  const result = await toolkit.call("auto_fix_icu", { template });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.valid ? 0 : 1;
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of icu-fix.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
