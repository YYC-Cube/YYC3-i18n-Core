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
 * file translate.mjs
 * description i18n-translate 技能薄封装 — 按语言取译文/登记新键（translate_key + add_translation_key）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[translate]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node translate.mjs <key> [--locale ja] [--load ja.json ...] [--set "译文"] [--params '{"n":"1"}']
 *       --set 先登记新键再取译文；--load 装载语言包（文件名即语言标签）
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { I18nEngine, createI18nToolkit } from "../../../dist/index.js";

const argv = process.argv.slice(2);
const key = argv[0];
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const loads = argv.filter((_, i) => argv[i - 1] === "--load");

function fail(msg) {
  process.stderr.write(`[i18n-translate] ${msg}\n`);
  process.exit(1);
}

if (!key) fail(`用法：node translate.mjs <key> [--locale ja] [--load ja.json ...] [--set "译文"] [--params '{"n":"1"}']`);

try {
  const engine = new I18nEngine({ locale: opt("--locale") ?? "en" });
  for (const f of loads) {
    engine.registerTranslation(path.basename(f, path.extname(f)), JSON.parse(await readFile(f, "utf8")));
  }
  const toolkit = createI18nToolkit(engine);

  let registered = null;
  const setValue = opt("--set");
  if (setValue !== undefined) {
    registered = await toolkit.call("add_translation_key", {
      key, value: setValue, locale: opt("--locale") ?? engine.getLocale(),
    });
  }

  const params = opt("--params") ? JSON.parse(opt("--params")) : undefined;
  const result = await toolkit.call("translate_key", { key, locale: opt("--locale"), params });
  process.stdout.write(`${JSON.stringify({ ...result, ...(registered ? { registered } : {}) }, null, 2)}\n`);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of translate.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
