// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file skills.test.ts
 * description 技能矩阵合同测试（501 G3）——SKILL.md 规范/预算/词汇表一致性 + 脚本冒烟
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.3.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[skill],[contract]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 六技能包结构与内容合同 + extract/audit/icu/translate/quality/setup 脚本端到端。
 *       脚本 import dist/（发布布局同构）——dist 缺失或落后时跳过冒烟并大声提示；
 *       CI/publish 均已把 build 前置于本测试（ci.yml 注释）。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { I18nEngine } from "../lib/engine.js";
import { createI18nToolkit } from "../lib/mcp/toolkit.js";
import { CAPABILITY_VOCABULARY } from "../lib/plugins.js";

const ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(ROOT, "skills");
const SKILL_PACKAGES = [
  "i18n-extract",
  "i18n-audit",
  "i18n-translate",
  "i18n-quality",
  "i18n-icu",
  "i18n-setup",
] as const;

/** 折叠标量感知的 front matter 解析（测试侧镜像，CLI 侧在 skills-indexer）。 */
function parseFrontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return {};
  const out: Record<string, string> = {};
  let lastKey = "";
  for (const line of m[1].split("\n")) {
    const cont = line.match(/^\s+(.+)$/);
    if (cont && lastKey) {
      out[lastKey] = `${out[lastKey]} ${cont[1]}`.trim();
      continue;
    }
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    const raw = line.slice(i + 1).trim();
    out[key] = raw === ">-" || raw === ">" || raw === "|" || raw === "|-" ? "" : raw;
    lastKey = key;
  }
  return out;
}

const parseList = (value: string | undefined): string[] =>
  (value ?? "").replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean);

const readSkill = (pkg: string) => readFileSync(path.join(SKILLS_DIR, pkg, "SKILL.md"), "utf8");

describe("技能包结构合同（skills/）", () => {
  it("六技能包目录齐备且各含 SKILL.md 与 scripts/", () => {
    for (const pkg of SKILL_PACKAGES) {
      expect(existsSync(path.join(SKILLS_DIR, pkg, "SKILL.md")), `${pkg}/SKILL.md`).toBe(true);
      const scripts = readdirSync(path.join(SKILLS_DIR, pkg, "scripts")).filter((f) => f.endsWith(".mjs"));
      expect(scripts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("front matter 双合同：开放规范必填 + YYC³ 扩展", () => {
    for (const pkg of SKILL_PACKAGES) {
      const meta = parseFrontmatter(readSkill(pkg));
      expect(meta.name, `${pkg}.name`).toBe(pkg);
      expect(meta.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); // ASCII kebab-case
      expect(meta.description.length, `${pkg}.description`).toBeGreaterThan(20);
      expect(meta.version, `${pkg}.version`).toMatch(/^\d+\.\d+\.\d+$/);
      expect(meta.author).toContain("YYC³");
      expect(meta.language).toBe("zh-CN");
    }
  });

  it("capability ⊆ CAPABILITY_VOCABULARY（插件/技能同词汇表）", () => {
    const known = new Set<string>(CAPABILITY_VOCABULARY);
    for (const pkg of SKILL_PACKAGES) {
      for (const capability of parseList(parseFrontmatter(readSkill(pkg)).capability)) {
        expect(known.has(capability), `${pkg}.capability "${capability}" 不在词汇表`).toBe(true);
      }
    }
  });

  it("mcp-tools 与 toolkit 实际工具面一致（技能引用的工具名必须存在）", () => {
    const toolkit = createI18nToolkit(new I18nEngine({ locale: "en" }));
    const known = new Set(toolkit.list());
    for (const pkg of SKILL_PACKAGES) {
      for (const toolName of parseList(parseFrontmatter(readSkill(pkg))["mcp-tools"])) {
        expect(known.has(toolName), `${pkg} 引用不存在的工具 ${toolName}`).toBe(true);
      }
    }
  });

  it("SKILL.md 正文预算 < 5000 tokens（≈16KB 上限）", () => {
    for (const pkg of SKILL_PACKAGES) {
      const body = readSkill(pkg).replace(/^---\n[\s\S]*?\n---\n/, "");
      expect(Buffer.byteLength(body, "utf8"), `${pkg} 正文超预算`).toBeLessThan(16000);
    }
  });

  it("scripts 标头标尾合规", () => {
    for (const pkg of SKILL_PACKAGES) {
      for (const script of readdirSync(path.join(SKILLS_DIR, pkg, "scripts"))) {
        const text = readFileSync(path.join(SKILLS_DIR, pkg, "scripts", script), "utf8");
        const head = text.split("\n").slice(0, 30).join("\n");
        const tail = text.split("\n").slice(-15).join("\n");
        expect(head.includes("YYC³") && head.includes("YanYuCloudCube"), `${pkg}/${script} 标头`).toBe(true);
        expect(/End of [^\n|]+ \| YYC³/.test(tail), `${pkg}/${script} 标尾`).toBe(true);
      }
    }
  });

  it("矩阵 README 覆盖全部技能包", () => {
    const readme = readFileSync(path.join(SKILLS_DIR, "README.md"), "utf8");
    for (const pkg of SKILL_PACKAGES) {
      expect(readme.includes(pkg), `README 缺 ${pkg}`).toBe(true);
    }
  });
});

describe("脚本端到端冒烟（脚本 import dist/——发布布局同构）", () => {
  let tmp = "";
  let distFresh: boolean;

  beforeAll(() => {
    // dist 新鲜度：入口存在且不落后于本特性触及的源文件（CI/publish 已前置 build）
    const distEntry = path.join(ROOT, "dist/index.js");
    const watchSources = [
      path.join(ROOT, "src/lib/mcp/toolkit.ts"),
      path.join(ROOT, "src/lib/plugins.ts"),
      path.join(ROOT, "src/lib/mcp/i18n-tools.ts"),
      path.join(ROOT, "src/lib/mcp/tools/translate-key.ts"),
    ];
    distFresh = existsSync(distEntry)
      && watchSources.every((src) => !existsSync(src) || statSync(src).mtimeMs <= statSync(distEntry).mtimeMs);
    if (!distFresh) {
      console.warn("[skills] dist 缺失或落后——冒烟跳过。请先 npm run build（CI/publish 已前置）");
      return;
    }
    tmp = mkdtempSync(path.join(os.tmpdir(), "yyc3-skills-"));
  });

  /** 运行技能脚本——containment 校验：解析结果必须仍在 skills/ 内。 */
  function runScript(pkg: string, scriptName: string, args: string[]) {
    const target = path.resolve(SKILLS_DIR, pkg, "scripts", scriptName);
    if (!target.startsWith(SKILLS_DIR + path.sep)) {
      throw new Error(`路径越界：${target}`);
    }
    return spawnSync(process.execPath, [target, ...args], { cwd: ROOT, encoding: "utf8" });
  }

  it("extract.mjs：多文件合并去重提取", () => {
    if (!distFresh) return;
    writeFileSync(path.join(tmp, "a.ts"), "const x = t('nav.title'); const y = t('hello');\n");
    writeFileSync(path.join(tmp, "b.ts"), "const z = t('nav.title');\n");
    const r = runScript("i18n-extract", "extract.mjs", [path.join(tmp, "a.ts"), path.join(tmp, "b.ts")]);
    expect(r.status).toBe(0);
    const out = JSON.parse(r.stdout);
    expect(out.keys).toEqual(["hello", "nav.title"]);
    expect(out.count).toBe(2);
  });

  it("audit.mjs：缺失键判定不通过（exit 1）", () => {
    if (!distFresh) return;
    writeFileSync(path.join(tmp, "en.json"), JSON.stringify({ app: { title: "My App", sub: "Sub" } }));
    writeFileSync(path.join(tmp, "ja.json"), JSON.stringify({ app: { title: "マイアプリ" } }));
    const r = runScript("i18n-audit", "audit.mjs", [path.join(tmp, "en.json"), path.join(tmp, "ja.json")]);
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.sourceLocale).toBe("en");
    expect(out.pass).toBe(false);
    expect(out.perLocale[0].missing.missingCount).toBe(1);
  });

  it("icu-fix.mjs：合法模板 exit 0", () => {
    if (!distFresh) return;
    const r = runScript("i18n-icu", "icu-fix.mjs", ["{count, plural, other {# items}}"]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).valid).toBe(true);
  });

  it("translate.mjs：--load + locale 切换取译文", () => {
    if (!distFresh) return;
    const r = runScript("i18n-translate", "translate.mjs", [
      "app.title", "--locale", "ja", "--load", path.join(tmp, "ja.json"),
    ]);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ key: "app.title", locale: "ja", value: "マイアプリ" });
  });

  it("quality.mjs：占位符缺失判不通过（exit 1，百分制阈值）", () => {
    if (!distFresh) return;
    const r = runScript("i18n-quality", "quality.mjs", ["Hello {name}", "こんにちは", "--sl", "en", "--tl", "ja"]);
    expect(r.status).toBe(1);
    const out = JSON.parse(r.stdout);
    expect(out.pass).toBe(false);
    expect(out.threshold).toBe(80);
    expect(out.issues.some((i: { ruleId: string }) => i.ruleId === "placeholder-mismatch")).toBe(true);
  });

  it("setup.mjs：骨架生成幂等（二次执行全部 skipped）", () => {
    if (!distFresh) return;
    const target = path.join(tmp, "proj");
    const first = runScript("i18n-setup", "setup.mjs", [target, "--locales", "en,zh-CN"]);
    expect(first.status).toBe(0);
    const out1 = JSON.parse(first.stdout);
    expect(out1.created).toContain("locales/en.json");
    expect(out1.created).toContain("locales/zh-CN.json");

    const second = runScript("i18n-setup", "setup.mjs", [target, "--locales", "en,zh-CN"]);
    const out2 = JSON.parse(second.stdout);
    expect(out2.created).toEqual([]);
    expect(out2.skipped.length).toBe(3);
  });
});

// ============================================================
// End of skills.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
