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
 * @File    : registry-smoke.mjs
 * @Description : registry 真实安装冒烟（发布后回归资产——四轮手工冒烟 33 项断言收敛）
 * @Author  : YanYuCloudCube Team <admin@0379.email>
 * @Version : 1.0.0
 * @Created : 2026-11-16
 * @Updated : 2026-11-16
 * @Usage  : node scripts/registry-smoke.mjs [version] [--with-dashboard]
 *           缺省 version = dist-tags.latest；断言按版本能力门控（低版本跳过并标注 SKIP）
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const REGISTRY = "https://registry.npmjs.org/";
const args = process.argv.slice(2);
const withDashboard = args.includes("--with-dashboard");
const versionArg = args.find((a) => !a.startsWith("--"));

// ---------- 版本解析 ----------
const requested = versionArg
  ?? execFileSync("npm", ["view", "@yyc3/i18n-core", "dist-tags.latest", "--registry", REGISTRY], { encoding: "utf8" }).trim();
const [major, minor] = requested.split(".").map(Number);
const ge = (m, n) => major > m || (major === m && minor >= n);

console.log(`[registry-smoke] 目标版本 @yyc3/i18n-core@${requested}${withDashboard ? " + dashboard" : ""}`);

// ---------- 安装 ----------
const tmp = mkdtempSync(path.join(os.tmpdir(), "yyc3-smoke-"));
const PKG = path.join(tmp, "node_modules", "@yyc3", "i18n-core");
const results = [];
const check = (id, ok, note = "") => results.push({ id, ok: ok === true ? "PASS" : ok === false ? "FAIL" : "SKIP", note });

try {
  execFileSync("npm", ["init", "-y"], { cwd: tmp, stdio: "pipe" });
  const installArgs = ["install", `@yyc3/i18n-core@${requested}`, "--registry", REGISTRY, "--no-audit", "--no-fund"];
  if (withDashboard) installArgs.push(`@yyc3/i18n-dashboard@latest`, "react@18", "react-dom@18");
  execFileSync("npm", installArgs, { cwd: tmp, stdio: "pipe" });

  // ---------- 断言（版本门控） ----------
  const pkg = JSON.parse(readFileSync(path.join(PKG, "package.json"), "utf8"));
  check("S1 版本+零依赖", pkg.version === requested && Object.keys(pkg.dependencies ?? {}).length === 0, `v${pkg.version}`);

  const main = await import(`${PKG}/dist/index.js`);

  if (ge(3, 3)) {
    check("S2 toolkit 编程面", typeof main.createI18nToolkit === "function", "");
    const tk = main.createI18nToolkit(new main.I18nEngine({ locale: "en" }));
    check("S3 13 工具面", tk.list().length === 13, `tools=${tk.list().length}`);
    const skillsOk = ["i18n-extract", "i18n-audit", "i18n-translate", "i18n-quality", "i18n-icu", "i18n-setup"]
      .every((s) => existsSync(path.join(PKG, "skills", s, "SKILL.md")));
    check("S4 skills 六包随 tarball", skillsOk, "");
    if (skillsOk) {
      const srcA = path.join(tmp, "a.ts");
      const srcB = path.join(tmp, "b.ts");
      const { writeFileSync } = await import("node:fs");
      writeFileSync(srcA, "const x = t('nav.title'); const y = t('hello');\n");
      writeFileSync(srcB, "const z = t('nav.title');\n");
      const out = execFileSync(process.execPath, [path.join(PKG, "skills", "i18n-extract", "scripts", "extract.mjs"), srcA, srcB], { encoding: "utf8" });
      check("S5 extract.mjs 安装布局执行", JSON.parse(out).keys.join(",") === "hello,nav.title", "");
    }
  }

  if (ge(3, 3)) {
    const engine = new main.I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { app: { title: "My App" } });
    engine.registerTranslation("ja", { app: { title: "マイアプリ" } });
    const tk = main.createI18nToolkit(engine);
    const zh = await tk.call("translate_key", { key: "app.title", locale: "ja" });
    check("S6 translate_key locale 兑现", zh.value === "マイアプリ" && zh.locale === "ja", zh.value);
  }

  if (ge(3, 4)) {
    const ota = await import(`${PKG}/dist/lib/ota/index.js`);
    check("S7 ./ota 子路径", typeof ota.createRemoteLocaleSource === "function", "");
    check("S8 AuditLogger", typeof main.AuditLogger === "function" && main.CAPABILITY_VOCABULARY.includes("audit-trail"),
      `words=${main.CAPABILITY_VOCABULARY.length}`);
    // OTA 200→304 协商（stub fetch 零网络）
    const engine = new main.I18nEngine({ locale: "ja" });
    const stub = (async (_u, init) => {
      const h = init?.headers ?? {};
      if (h["If-None-Match"] === '"v1"') return new Response(null, { status: 304 });
      return new Response(JSON.stringify({ app: { title: "OTA" } }), { status: 200, headers: { etag: '"v1"' } });
    });
    const source = ota.createRemoteLocaleSource({ url: "https://cdn.test/{locale}.json", fetchImpl: stub });
    const first = await source.sync(engine, "ja");
    const second = await source.sync(engine, "ja");
    check("S9 OTA 200→304", first.changed === true && engine.t("app.title") === "OTA" && second.changed === false, "");
    const mcp = await import(`${PKG}/dist/lib/mcp/server.js`);
    const server = new mcp.MCPServer({ name: "s", version: "1" });
    mcp.registerI18nTools(server, engine, { otaSources: [source] });
    check("S10 ota://status 资源", server.getResources().some((r) => r.uri === "ota://status"), "");
  }

  if (ge(3, 5)) {
    const wf = await import(`${PKG}/dist/lib/workflow/index.js`);
    check("S11 ./workflow 子路径", typeof wf.TranslationWorkflow === "function" && typeof wf.OidcIdentityProvider === "function", "");
    const mcp = await import(`${PKG}/dist/lib/mcp/server.js`);
    const identity = new wf.StaticIdentityProvider({
      "t": { userId: "t1", roles: ["translator"] }, "r": { userId: "r1", roles: ["reviewer"] }, "a": { userId: "a1", roles: ["admin"] },
    });
    const engine = new main.I18nEngine({ locale: "ja" });
    const workflow = new wf.TranslationWorkflow({ engine, identity });
    const entry = await workflow.submit({ locale: "ja", key: "k", value: "v", actor: { token: "t" } });
    await workflow.approve({ entryId: entry.id, actor: { token: "r" } });
    await workflow.publish({ entryId: entry.id, actor: { token: "a" } });
    let permErr = "";
    try { await workflow.publish({ entryId: 999, actor: { token: "r" } }); } catch (e) { permErr = e.name; }
    check("S12 工作流主链+权限", engine.t("k") === "v" && permErr === "WorkflowPermissionError", permErr);
    const server = new mcp.MCPServer({ name: "s2", version: "1" });
    mcp.registerWorkflowTools(server, workflow);
    const bare = new mcp.MCPServer({ name: "s3", version: "1" });
    mcp.registerI18nTools(bare, engine);
    check("S13 MCP 选择性面",
      server.getTools().filter((t) => t.name.startsWith("workflow_")).length === 5 && bare.getTools().length === 13, "");
  }

  if (ge(3, 6)) {
    const nodeMod = await import(`${PKG}/dist/node.js`);
    check("S16 ./node JsonFileWorkflowStore", typeof nodeMod.JsonFileWorkflowStore === "function", "");
    const storeFile = path.join(tmp, "wf.json");
    const wf = new main.TranslationWorkflow({ store: new nodeMod.JsonFileWorkflowStore(storeFile) });
    const entry = await wf.submit({ locale: "ja", key: "persist.k", value: "持久", actor: { userId: "t", roles: ["translator"] } });
    // 跨实例恢复（模拟进程重启）：状态与 id 序号续存
    const revived = await main.TranslationWorkflow.restore({ store: new nodeMod.JsonFileWorkflowStore(storeFile) });
    const next = await revived.submit({ locale: "ja", key: "persist.k2", value: "v2", actor: { userId: "t", roles: ["translator"] } });
    check("S17 持久化恢复+id 续增",
      revived.get(entry.id)?.state === "submitted" && next.id === entry.id + 1, `nextId=${next.id}`);
  }

  if (withDashboard && ge(3, 4)) {
    const DASH = path.join(tmp, "node_modules", "@yyc3", "i18n-dashboard");
    const dash = await import(`${DASH}/dist/index.js`);
    const { renderToString } = await import(path.join(tmp, "node_modules", "react-dom", "server.js"));
    const React = (await import(path.join(tmp, "node_modules", "react", "index.js"))).default;
    const engine = new main.I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { app: { title: "T", sub: "S" } });
    engine.registerTranslation("ja", { app: { title: "マ" } });
    const html = renderToString(React.createElement(dash.I18nHealthDashboard, { engine }));
    check("S14 dashboard SSR 五面板", html.includes('data-panel="performance"') && html.replaceAll("<!-- -->", "").includes("1/2"), "");
    if (ge(3, 5)) {
      check("S15 dashboard WorkflowPanel", typeof dash.WorkflowPanel === "function" && typeof dash.useWorkflowQueue === "function", "");
    }
  }
} catch (err) {
  results.push({ id: "安装/执行", ok: "FAIL", note: err instanceof Error ? err.message : String(err) });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ---------- 汇总 ----------
let failed = 0;
for (const r of results) {
  const icon = r.ok === "PASS" ? "✅" : r.ok === "SKIP" ? "⏭️ " : "❌";
  if (r.ok === "FAIL") failed += 1;
  console.log(`${icon} ${r.id} — ${r.note || r.ok}`);
}
const passed = results.filter((r) => r.ok !== "FAIL").length;
console.log(`\n${failed === 0 ? `🎉 ${passed}/${results.length} 通过（含 SKIP）` : `💥 ${failed} 项失败`}`);
process.exit(failed === 0 ? 0 : 1);

// ============================================================
// End of registry-smoke.mjs | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
