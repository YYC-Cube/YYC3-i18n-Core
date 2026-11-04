// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file new-tools.test.ts
 * description MCP 新工具单元测试 — extract/compare/quality_score/auto_fix/export/glossary（501 G2）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[mcp],[g2]
 *
 * test-target src/lib/mcp/tools/*.ts
 * coverage 90%+
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { Glossary } from "../../lib/glossary.js";
import { MCPServer } from "../../lib/mcp/server.js";
import { registerI18nTools } from "../../lib/mcp/i18n-tools.js";

async function call(server: MCPServer, name: string, args: Record<string, unknown>): Promise<any> {
  const handler = server.getToolHandler(name);
  if (!handler) throw new Error(`tool not registered: ${name}`);
  const result = await handler(args);
  return JSON.parse(result.content[0].text);
}

function makeEngine(): I18nEngine {
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("zh-CN", {
    nav: { home: "首页", about: "关于" },
    common: { save: "保存" },
  });
  return engine;
}

describe("G2 new tools — extract_keys", () => {
  it("提取 t('key') / t(\"key\") / t(`key`) 并去重排序", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "extract_keys", {
      code: "a(); t('nav.home'); b(t(`common.save`)); c(t(\"nav.home\"));",
    });
    expect(out.keys).toEqual(["common.save", "nav.home"]);
    expect(out.count).toBe(2);
    expect(out.unique).toBe(true);
  });

  it("unique=false 保留重复与出现序", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "extract_keys", { code: "t('a'); t('a');", unique: false });
    expect(out.keys).toEqual(["a", "a"]);
    expect(out.unique).toBe(false);
  });
});

describe("G2 new tools — compare_locales", () => {
  it("双语言差异矩阵：missing 双向与相同值清单", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "compare_locales", { localeA: "en", localeB: "zh-CN" });
    expect(out.counts).toHaveProperty("common");
    expect(Array.isArray(out.missingInB)).toBe(true);
    expect(Array.isArray(out.missingInA)).toBe(true);
    expect(Array.isArray(out.identicalValues)).toBe(true);
  });
});

describe("G2 new tools — quality_score", () => {
  it("空翻译得低分并给出 issue，正常翻译得分", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const bad = await call(server, "quality_score", {
      sourceText: "Hello world", translatedText: "", sourceLocale: "en", targetLocale: "zh-CN",
    });
    const good = await call(server, "quality_score", {
      sourceText: "Hello world", translatedText: "你好，世界", sourceLocale: "en", targetLocale: "zh-CN",
    });
    expect(bad.score).toBeLessThan(good.score);
    expect(good.passed).toBe(true);
  });
});

describe("G2 new tools — auto_fix_icu", () => {
  it("合法模板 valid=true 无修复", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "auto_fix_icu", { template: "{count, plural, other {# items}}" });
    expect(out.valid).toBe(true);
    expect(out.fixes).toHaveLength(0);
  });

  it("未知格式类型给出 fixable 修复建议（二次解析验证）", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "auto_fix_icu", { template: "{n, bogus}" });
    expect(out.valid).toBe(false);
    expect(out.errors.length).toBeGreaterThan(0);
    const fix = out.fixes.find((f: any) => f.fixable);
    expect(fix.fix).toContain(", number");
  });

  it("缺 {} 子句体：标注为需人工处理（fixable=false）", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "auto_fix_icu", { template: "{x, plural, z}" });
    expect(out.fixes.every((f: any) => f.fixable === false)).toBe(true);
  });
});

describe("G2 new tools — export_formats", () => {
  it("json 导出原始嵌套结构", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "export_formats", { locale: "zh-CN", format: "json" });
    expect(out.format).toBe("application/json");
    expect(JSON.parse(out.content)).toHaveProperty("nav.home", "首页");
  });

  it("csv 转义含引号值", async () => {
    const engine = makeEngine();
    engine.registerTranslation("zh-CN", { odd: { quoted: '说 "你好"' } });
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, engine);
    const out = await call(server, "export_formats", { locale: "zh-CN", format: "csv" });
    expect(out.format).toBe("text/csv");
    expect(out.content).toContain('odd.quoted,"说 ""你好"""');
  });

  it("yaml 扁平键值输出；未加载语言报错", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "export_formats", { locale: "zh-CN", format: "yaml" });
    expect(out.format).toBe("text/yaml");
    expect(out.content).toContain("nav.home: 首页");
    const miss = await call(server, "export_formats", { locale: "ko", format: "json" });
    expect(miss.error).toContain("ko");
  });
});

describe("G2 new tools — glossary_lookup", () => {
  it("注入术语表后 exact/prefix/locale 三模式可用", async () => {
    const g = new Glossary();
    g.load([{ term: "Dashboard", translations: { "zh-CN": "仪表盘" } }]);
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine(), { glossary: g });

    const exact = await call(server, "glossary_lookup", { mode: "exact", term: "dashboard" });
    expect(exact.entry.translations["zh-CN"]).toBe("仪表盘");
    const prefix = await call(server, "glossary_lookup", { mode: "prefix", term: "Dash" });
    expect(prefix.entries).toHaveLength(1);
    const locale = await call(server, "glossary_lookup", { mode: "locale", locale: "zh-CN" });
    expect(locale.translations[0].translation).toBe("仪表盘");
  });

  it("未注入术语表时返回配置提示", async () => {
    const server = new MCPServer({ name: "t", version: "1" });
    registerI18nTools(server, makeEngine());
    const out = await call(server, "glossary_lookup", { mode: "exact", term: "x" });
    expect(out.error).toContain("No glossary configured");
  });
});

// ============================================================
// End of new-tools.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
