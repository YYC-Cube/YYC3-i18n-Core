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
 * file extract.mjs
 * description i18n-extract 技能薄封装 — 源码 t() 键提取（extract_keys）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[extract]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node extract.mjs <file...> [--raw]（--raw 保留出现次序不去重）
 */
import { readFile } from "node:fs/promises";
import { I18nEngine, createI18nToolkit } from "../../../dist/index.js";

const files = process.argv.slice(2).filter((a) => a !== "--raw");
const unique = !process.argv.includes("--raw");

function fail(msg) {
  process.stderr.write(`[i18n-extract] ${msg}\n`);
  process.exit(1);
}

if (files.length === 0) {
  fail(`用法：node extract.mjs <file...> [--raw]`);
}

try {
  const toolkit = createI18nToolkit(new I18nEngine({ locale: "en" }));
  let code = "";
  for (const f of files) {
    code += `${await readFile(f, "utf8")}\n`;
  }
  const result = await toolkit.call("extract_keys", { code, unique });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of extract.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
