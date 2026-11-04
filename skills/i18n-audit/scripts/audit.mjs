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
 * file audit.mjs
 * description i18n-audit 技能薄封装 — 覆盖率/缺失键审计（check_missing_keys + compare_locales + get_locale_stats）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[audit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node audit.mjs <source.json> <target.json> [more.json ...]
 *       首文件为源语言基线，其余为目标语言；文件名（去扩展名）即语言标签。
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { I18nEngine, createI18nToolkit } from "../../../dist/index.js";

const [, , ...files] = process.argv;

function fail(msg) {
  process.stderr.write(`[i18n-audit] ${msg}\n`);
  process.exit(1);
}

if (files.length < 2) {
  fail(`用法：node audit.mjs <source.json> <target.json> [more.json ...]`);
}

const localeOf = (file) => path.basename(file, path.extname(file));
const load = async (file) => JSON.parse(await readFile(file, "utf8"));

try {
  const engine = new I18nEngine({ locale: localeOf(files[0]) });
  for (const f of files) {
    engine.registerTranslation(localeOf(f), await load(f));
  }

  const toolkit = createI18nToolkit(engine);
  const source = localeOf(files[0]);
  const perLocale = [];

  for (const f of files.slice(1)) {
    const target = localeOf(f);
    const missing = await toolkit.call("check_missing_keys", { locale: target });
    const diff = await toolkit.call("compare_locales", { localeA: source, localeB: target });
    perLocale.push({ locale: target, missing, diff });
  }

  const report = {
    sourceLocale: source,
    stats: await toolkit.call("get_locale_stats"),
    perLocale,
    pass: perLocale.every((p) => p.missing.missingCount === 0),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.pass ? 0 : 1;
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of audit.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
