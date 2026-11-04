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
 * file quality.mjs
 * description i18n-quality 技能薄封装 — 翻译质量评分（quality_score）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[quality]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node quality.mjs <sourceText> <translatedText> [--sl en] [--tl ja] [--threshold 80]
 *       评分为百分制；pass = 工具 passed 判定 && score ≥ threshold（默认 80）
 */
import { I18nEngine, createI18nToolkit } from "../../../dist/index.js";

const argv = process.argv.slice(2);
const OPTION_FLAGS = new Set(["--sl", "--tl", "--threshold"]);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const positionals = [];
for (let i = 0; i < argv.length; i++) {
  if (OPTION_FLAGS.has(argv[i])) { i += 1; continue; }
  positionals.push(argv[i]);
}
const [sourceText, translatedText] = positionals;

function fail(msg) {
  process.stderr.write(`[i18n-quality] ${msg}\n`);
  process.exit(1);
}

if (!sourceText || !translatedText) {
  fail(`用法：node quality.mjs <sourceText> <translatedText> [--sl en] [--tl ja] [--threshold 80]`);
}

const threshold = Number(opt("--threshold", "80"));

try {
  const toolkit = createI18nToolkit(new I18nEngine({ locale: "en" }));
  const result = await toolkit.call("quality_score", {
    sourceText,
    translatedText,
    sourceLocale: opt("--sl", "en"),
    targetLocale: opt("--tl", "zh-CN"),
  });
  const score = typeof result.score === "number" ? result.score : Number(result.score ?? 0);
  const pass = result.passed !== false && score >= threshold;
  process.stdout.write(`${JSON.stringify({ ...result, threshold, pass }, null, 2)}\n`);
  process.exitCode = pass ? 0 : 1;
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of quality.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
