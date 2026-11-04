// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file glossary.test.ts
 * description 术语表模块单元测试 — 查询/前缀搜索/译法注入/违规检测
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[glossary]
 *
 * test-target src/lib/glossary.ts
 * coverage 90%+
 */
import { describe, expect, it } from "vitest";
import { Glossary, type GlossaryEntry } from "../lib/glossary.js";

const entries: GlossaryEntry[] = [
  { term: "Dashboard", translations: { "zh-CN": "仪表盘", ja: "ダッシュボード", de: "Übersicht" }, note: "产品主控台" },
  { term: "Workspace", translations: { "zh-CN": "工作台", ja: "ワークスペース" } },
  { term: "api_key", forbidSourceTerm: false, translations: { "zh-CN": "API 密钥" } },
];

describe("Glossary", () => {
  const g = new Glossary();
  g.load(entries);

  it("load 返回词条总数且 lookup 大小写不敏感", () => {
    expect(g.size()).toBe(3);
    expect(g.lookup("dashboard")?.translations["zh-CN"]).toBe("仪表盘");
    expect(g.lookup("DASHBOARD")?.term).toBe("Dashboard");
    expect(g.lookup("missing")).toBeUndefined();
  });

  it("search 前缀匹配并按 term 排序", () => {
    const hits = g.search("da");
    expect(hits.map((h) => h.term)).toEqual(["Dashboard"]);
    expect(g.search("work")).toHaveLength(1);
    expect(g.search("zzz")).toHaveLength(0);
  });

  it("translationsFor 输出某语言固定译法清单（按 term 排序）", () => {
    const zh = g.translationsFor("zh-CN");
    expect(zh.map((x) => x.term)).toEqual(["api_key", "Dashboard", "Workspace"]);
    expect(zh.find((x) => x.term === "api_key")?.forbidSourceTerm).toBe(false);
    expect(g.translationsFor("ko")).toHaveLength(0);
  });

  it("checkTranslations：译文含源词且有固定译法 → 违规并带上下文摘录", () => {
    const r = g.checkTranslations([
      { locale: "zh-CN", sourceText: "Go to Dashboard", translatedText: "前往 Dashboard 查看详情" },
      { locale: "zh-CN", sourceText: "Open Workspace", translatedText: "打开工作台" },
    ]);
    expect(r.checked).toBe(2);
    expect(r.violations).toHaveLength(1);
    expect(r.violations[0]).toMatchObject({ term: "Dashboard", locale: "zh-CN", expected: "仪表盘" });
    expect(r.violations[0].excerpt).toContain("Dashboard");
  });

  it("checkTranslations：forbidSourceTerm=false 词条放行源词", () => {
    const r = g.checkTranslations([
      { locale: "zh-CN", sourceText: "Rotate api_key", translatedText: "轮换 api_key" },
    ]);
    expect(r.violations).toHaveLength(0);
  });

  it("checkTranslations：源文不含术语时不误伤译文", () => {
    const r = g.checkTranslations([
      { locale: "ja", sourceText: "Unrelated sentence", translatedText: "Dashboard という単語が含まれていても" },
    ]);
    expect(r.violations).toHaveLength(0);
  });

  it("重复 load 同 term 以最后者为准", () => {
    const g2 = new Glossary();
    g2.load([{ term: "X", translations: { "zh-CN": "旧" } }]);
    g2.load([{ term: "X", translations: { "zh-CN": "新" } }]);
    expect(g2.lookup("x")?.translations["zh-CN"]).toBe("新");
  });
});

// ============================================================
// End of glossary.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
