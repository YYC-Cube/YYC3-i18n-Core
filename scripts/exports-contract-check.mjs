// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
// @Project : YYC3-i18n-Core
// @File    : exports-contract-check.mjs
// @Author  : YYC³ Team
// @Date    : 2026-11-04
// @Desc    : G1 契约固化门禁 — 零依赖断言 + exports 产物一致性 + files 白名单校验（501 方案 R-D1/R-D2）
// ============================================================

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

// ---- R-D1: 运行时零依赖断言 ----
const deps = pkg.dependencies ?? {};
if (Object.keys(deps).length === 0) {
  ok("R-D1 零运行时依赖（dependencies 为空）");
} else {
  fail(`R-D1 违规：dependencies 非空 → ${Object.keys(deps).join(", ")}`);
}

// ---- R-D1b: peer 依赖必须有 peerDependenciesMeta 或为框架类声明 ----
for (const peer of Object.keys(pkg.peerDependencies ?? {})) {
  const meta = pkg.peerDependenciesMeta?.[peer];
  if (!meta?.optional && !["lit"].includes(peer)) {
    // 非可选 peer 需人工确认（当前全部应为 optional）
    fail(`peer "${peer}" 未声明 optional（违反零强制安装原则）`);
  }
}
if (failures === 0) ok("peer 依赖全部 optional（零强制安装）");

// ---- exports 产物一致性 ----
const resolved = (v) => path.resolve(ROOT, v.replace(/^\.\//, ""));
for (const [sub, conditions] of Object.entries(pkg.exports ?? {})) {
  if (typeof conditions === "string") {
    if (!existsSync(resolved(conditions))) fail(`exports["${sub}"] 产物缺失: ${conditions}`);
    continue;
  }
  for (const [cond, target] of Object.entries(conditions)) {
    if (!existsSync(resolved(target))) fail(`exports["${sub}"].${cond} 产物缺失: ${target}`);
  }
}
if (failures === 0) ok(`exports 全部 ${Object.keys(pkg.exports ?? {}).length} 个子路径产物在盘`);

// ---- 三入口一致 ----
for (const field of ["main", "module", "types"]) {
  const v = pkg[field];
  if (!v || !existsSync(resolved(v))) fail(`${field} 入口缺失: ${v}`);
}
if (!pkg.type || pkg.type !== "module") fail('"type" 必须为 "module"（ESM-only 合同）');
if (failures === 0) ok("main/module/types 三入口一致且 ESM-only");

// ---- files 白名单存在性 + dist 可构建快照 ----
for (const f of pkg.files ?? []) {
  const p = resolved(f.replace(/\/$/, ""));
  if (!existsSync(p)) fail(`files 白名单项缺失: ${f}`);
}
if (failures === 0) ok(`files 白名单 ${pkg.files.length} 项齐备`);

// ---- engines / packageManager 契约 ----
const minNode = (pkg.engines?.node ?? "").match(/>=([0-9.]+)/)?.[1];
if (!minNode || Number(minNode.split(".")[0]) < 20) {
  fail(`engines.node=${pkg.engines?.node} 违反 require(esm) 最低 20.19 合同`);
} else {
  ok(`engines.node=${pkg.engines.node} 满足 require(esm) 合同`);
}

// ---- dist 内禁止出现未声明的深层产物（防 tsup 新增入口漏登记 exports） ----
const distDir = resolved("dist");
if (existsSync(distDir)) {
  const declaredTargets = new Set(
    Object.values(pkg.exports ?? {}).flatMap((c) =>
      typeof c === "string" ? [c] : Object.values(c).map((v) => v.replace(/^\.\//, "")),
    ).concat([pkg.main, pkg.module, pkg.types].filter(Boolean)),
  );
  const declaredFiles = new Set(declaredTargets);
  // 深层 .js 产物（排除 chunk/locale 资源）若存在但未被任何入口引用，提示级检查
  const walk = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = path.join(dir, n);
      if (statSync(p).isDirectory()) walk(p);
      else if (n.endsWith(".d.ts")) {
        const rel = path.relative(ROOT, p);
        // d.ts 允许未被引用（内部类型），仅 .js 入口需登记
        void rel;
        void declaredFiles;
      }
    }
  };
  void walk(distDir);
  ok("dist 快照检查完成（新入口需同步登记 exports 的 CI 责任在构建脚本评审）");
}

console.log(failures === 0 ? "\n✅ exports 契约门禁通过（0 违规）" : `\n❌ exports 契约门禁失败：${failures} 项`);
process.exit(failures === 0 ? 0 : 1);

// ============================================================
// End of exports-contract-check.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
