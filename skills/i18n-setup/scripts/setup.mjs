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
 * file setup.mjs
 * description i18n-setup 技能薄封装 — 接入脚手架（配置 + 语言包骨架，已存在即跳过）
 * module @yyc3/i18n-core/skills
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [skill],[i18n],[setup]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 用法：node setup.mjs <dir> [--locales en,zh-CN]（默认 en,zh-CN；
 *       生成 <dir>/i18n.config.json 与 <dir>/locales/<locale>.json，不覆盖已有文件）
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const dir = argv.find((a, i) => i === 0 && !a.startsWith("--"));

function fail(msg) {
  process.stderr.write(`[i18n-setup] ${msg}\n`);
  process.exit(1);
}

if (!dir) fail(`用法：node setup.mjs <dir> [--locales en,zh-CN]`);

const locales = (opt("--locales", "en,zh-CN") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (locales.length === 0) fail(`--locales 不能为空`);

async function writeIfAbsent(file, content) {
  try {
    await writeFile(file, content, { flag: "wx" });
    return "created";
  } catch (err) {
    if (err?.code === "EEXIST") return "skipped";
    throw err;
  }
}

try {
  const localesDir = path.join(dir, "locales");
  await mkdir(localesDir, { recursive: true });

  const config = {
    locale: locales[0],
    fallbackLocale: locales[0],
    locales,
    cache: { enabled: true, maxSize: 500 },
  };
  const configResult = await writeIfAbsent(
    path.join(dir, "i18n.config.json"),
    `${JSON.stringify(config, null, 2)}\n`,
  );

  const created = [];
  const skipped = [];
  if (configResult === "created") created.push("i18n.config.json");
  else skipped.push("i18n.config.json");

  for (const locale of locales) {
    const rel = `locales/${locale}.json`;
    const result = await writeIfAbsent(path.join(dir, rel), `${JSON.stringify({}, null, 2)}\n`);
    (result === "created" ? created : skipped).push(rel);
  }

  process.stdout.write(`${JSON.stringify({
    config: "i18n.config.json",
    created,
    skipped,
    nextSteps: ["extract keys (i18n-extract)", "translate (i18n-translate)", "audit (i18n-audit)"],
  }, null, 2)}\n`);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
}

// ============================================================
// End of setup.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
