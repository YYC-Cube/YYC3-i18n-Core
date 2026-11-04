// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
// @Project : YYC3-i18n-Core
// @File    : header-footer-check.mjs
// @Author  : YYC³ Team
// @Date    : 2026-11-04
// @Desc    : 标头标尾统一性 CI 门禁 — 代码品牌标头/标准标尾 + 强制目录文档 front matter/页脚（排除围栏代码块）
// ============================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", ".git", ".v2c", ".trae", ".mimosa", ".video_agent", ".vscode", ".github", ".zcode", ".vite"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".jsx"]);
const DOC_DIRS = [
  "docs/YYC3-团队通用-标规文档",
  "docs/YYC3-团队通用-开发指南",
  "docs/04-YYC3-项目测试-审核阶段",
];
const REQ_FIELDS = ["file", "title", "description", "author", "version", "created", "updated", "status", "tags", "category", "language", "audience", "complexity"];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };

// ---------- Part A: 代码标头标尾 ----------
function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (CODE_EXTS.has(path.extname(name))) out.push(p);
  }
  return out;
}

const codeFiles = walk(ROOT, []);
let codeOk = 0;
for (const f of codeFiles) {
  const rel = path.relative(ROOT, f);
  const lines = readFileSync(f, "utf8").split("\n");
  const head = lines.slice(0, 30).join("\n");
  const tail = lines.slice(-15).join("\n");
  const headerOk = head.includes("YYC³") && head.includes("YanYuCloudCube");
  const footerOk = /End of [^\n|]+ \| YYC³|YYC³ End of File/.test(tail);
  if (headerOk && footerOk) codeOk++;
  else {
    if (!headerOk) fail(`[代码标头] ${rel}`);
    if (!footerOk) fail(`[代码标尾] ${rel}`);
  }
}
console.log(`A. 代码标头标尾：${codeOk}/${codeFiles.length} 合规（${((codeOk / codeFiles.length) * 100).toFixed(1)}%）`);

// ---------- Part B: 强制目录文档 ----------
function stripFences(text) {
  // 剔除围栏代码块与行内代码，避免规范文档自指示例造成误报
  return text.replace(/^```[\s\S]*?^```$/gm, "").replace(/`[^`\n]+`/g, "");
}

let docTotal = 0, docChecks = 0, docPass = 0;
const docFailures = [];
for (const d of DOC_DIRS) {
  const abs = path.join(ROOT, d);
  let names;
  try { names = readdirSync(abs); } catch { console.log(`  （跳过不存在目录 ${d}）`); continue; }
  for (const n of names) {
    if (!n.endsWith(".md")) continue;
    docTotal++;
    const text = readFileSync(path.join(abs, n), "utf8");
    const plain = stripFences(text);
    const add = (rule, ok) => { docChecks++; ok ? docPass++ : docFailures.push(`${n} ${rule}`); };

    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    add("R1 front matter", !!fm);
    const fmText = fm ? fm[1] : "";
    const keys = fmText.split("\n").filter(Boolean).map((l) => l.split(":")[0].trim());
    add("R2 必填字段", REQ_FIELDS.every((k) => keys.includes(k)));
    const fileField = fmText.match(/^file:\s*(.+)$/m)?.[1]?.trim();
    add("R3 file 一致", fileField === n);
    const title = fmText.match(/^title:\s*(.+)$/m)?.[1]?.trim();
    const h1 = plain.match(/^#\s+(.+)$/m)?.[1]?.trim();
    add("R4 title=H1", title === h1 && !!h1);
    const tags = fmText.match(/^tags:\s*(.+)$/m)?.[1]?.trim() ?? "";
    add("R5 tags 流式序列", /^\[.+\]$/.test(tags) && !/\],\s*\[/.test(tags));
    const created = fmText.match(/^created:\s*(.+)$/m)?.[1]?.trim();
    const updated = fmText.match(/^updated:\s*(.+)$/m)?.[1]?.trim();
    add("R6 日期格式", /^\d{4}-\d{2}-\d{2}$/.test(created ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(updated ?? ""));
    add("R7 品牌引用块", /#\s+.+\n+>\s+\*\*_YYC³_\*\*（YanYuCloudCube™ · 注册商标）/.test(plain) && plain.includes("言启象限 | 语枢未来"));
    add("R8a 变更历史", /## 变更历史/.test(plain));
    add("R8b 居中页脚×1", (plain.match(/<p align="center">/g) ?? []).length === 1);
    add("R9 页脚版权", /© \d{4} YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379\.email">admin@0379\.email<\/a>/.test(plain));
    add("R10 无品牌残留", !/YanYuCloudCube-|yanyucloud\.com/.test(plain));
    add("R11 author", fmText.match(/^author:\s*(.+)$/m)?.[1]?.trim() === "YYC³ Team <admin@0379.email>");
    add("R12 language", fmText.match(/^language:\s*(.+)$/m)?.[1]?.trim() === "zh-CN");
  }
}
for (const f of docFailures) fail(`[文档] ${f}`);
console.log(`B. 强制目录文档：${docTotal} 篇 / ${docChecks} 校验点，通过 ${docPass}（${((docPass / docChecks) * 100).toFixed(1)}%）`);

console.log(failures === 0 ? "\n✅ 标头标尾门禁通过（0 失败）" : `\n❌ 标头标尾门禁失败：${failures} 项`);
process.exit(failures === 0 ? 0 : 1);

// ============================================================
// End of header-footer-check.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
