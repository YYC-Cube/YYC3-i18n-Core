// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file branch-closure-wave2.test.ts
 * description 分支闭合第二波 — 插件/RTL/性能追踪/审计与 ICU 剩余边角（90% 策略线补强）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[plugins],[branch-closure]
 *
 * test-target src/lib/plugins/*, src/lib/rtl-utils.ts, src/lib/i18n-audit.ts, src/lib/icu/*
 * coverage 90%+
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ICUParser } from "../lib/icu/parser.js";
import { ICUCompiler as Compiler } from "../lib/icu/compiler.js";
import { MissingKeyReporter } from "../lib/plugins/missing-key-reporter.js";
import { PerformanceTracker } from "../lib/plugins/performance-tracker.js";
import { i18nAudit, createAuditedT } from "../lib/i18n-audit.js";
import { createMirroredLayout } from "../lib/rtl-utils.js";
import { I18nEngine, i18n } from "../lib/engine.js";

const parse = (input: string) => new ICUParser().parse(input);
const compile = (input: string, params: Record<string, unknown> = {}, locale = "en") => {
  const { nodes } = parse(input);
  return new Compiler().compile(nodes, { locale, params });
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("wave2 — ICU compiler 缺省参数与规则分支", () => {
  it("select/selectOrdinal/date/time/number 参数缺省侧", () => {
    expect(compile("{g, select, a{A}}", {})).toBe("");
    expect(compile("{n, selectOrdinal, one{1st}}", {})).toBe("0");
    expect(compile("{d, date}", {})).toBe("");
    expect(compile("{t, time}", {})).toBe("");
    expect(compile("{n, number}", {})).toBe("");
  });

  it("es/de/fr 规则 other 侧", () => {
    expect(compile("{n, plural, one{one} other{o}}", { n: 2 }, "es")).toBe("o");
    expect(compile("{n, plural, one{one} other{o}}", { n: 0 }, "de")).toBe("o");
    expect(compile("{n, plural, one{one} other{o}}", { n: 2 }, "fr")).toBe("o");
  });

  it("无规则语言（空 locale）回退 en", () => {
    expect(compile("{n, plural, one{one} other{o}}", { n: 1 }, "")).toBe("one");
  });

  it("date/time 无回调走 Intl try 路径", () => {
    expect(compile("{d, date, medium}", { d: "2026-01-02" })).not.toBe("");
    expect(compile("{t, time, medium}", { t: "2026-01-02T10:00:00Z" })).not.toBe("");
  });
});

describe("wave2 — ICU parser 选择器与子句边角", () => {
  it("plural 空选择器（%）与缺 { 两分支", () => {
    expect((parse("{x, plural, %}").nodes[0] as { clauses: unknown[] }).clauses).toHaveLength(0);
    expect(parse("{x, plural, z}").errors.some((e) => e.message.includes("Expected '{'"))).toBe(true);
  });

  it("select 空选择器与未闭合子句", () => {
    expect((parse("{x, select, %}").nodes[0] as { clauses: unknown[] }).clauses).toHaveLength(0);
    const r = parse("{x, select, a{b}");
    expect(r.nodes[0]).toHaveProperty("clauses");
    expect(parse("{x, select, z}").errors.some((e) => e.message.includes("Expected '{'"))).toBe(true);
  });

  it("plural offset:0 命中 parseInt||0 兜底侧", () => {
    expect(compile("{x, plural, offset:0 =1{one} other{o}}", { x: 1 })).toBe("one");
  });

  it("子句 # 前字面量先入节点", () => {
    const r = parse("{x, plural, other {a#}}");
    expect(JSON.stringify(r.nodes)).toContain('"a"');
  });

  it("parseSelector 数字解析（=12）", () => {
    expect(compile("{x, plural, =12 {twelve} other{o}}", { x: 12 })).toBe("twelve");
  });
});

describe("wave2 — MissingKeyReporter autoExport 与报告截断", () => {
  it("autoExport 构造分支 + stopAutoExport 有无定时器两态", () => {
    vi.useFakeTimers();
    const onReport = vi.fn();
    const reporter = new MissingKeyReporter({ autoExport: true, exportInterval: 10, onReport });
    vi.advanceTimersByTime(35);
    reporter.stopAutoExport();
    reporter.stopAutoExport(); // 无定时器分支
    expect(onReport.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("超 20 条缺失键触发报告截断分支", () => {
    const reporter = new MissingKeyReporter();
    const plugin = reporter.createPlugin();
    for (let i = 0; i < 23; i++) plugin.onMissingKey?.(`key.${i}`, "zh-CN");
    const text = reporter.generateReport();
    expect(text).toContain("more");
  });
});

describe("wave2 — PerformanceTracker 截断与报告截断", () => {
  it("慢翻译超 maxSlowEntries 触发 shift 截断", () => {
    const tracker = new PerformanceTracker({ slowThreshold: 5, maxSlowEntries: 3, samplingRate: 1 });
    const plugin = tracker.createPlugin();
    const nowSpy = vi.spyOn(performance, "now");
    for (let i = 0; i < 6; i++) {
      nowSpy.mockReturnValueOnce(1000 + i);
      plugin.beforeTranslate?.(`k${i}`);
      nowSpy.mockReturnValueOnce(1000 + i + 100 + i); // duration 递增：100+i ms
      plugin.afterTranslate?.("r", `k${i}`);
    }
    nowSpy.mockRestore();
    const metrics = tracker.getMetrics();
    expect(metrics.slowTranslations.length).toBeLessThanOrEqual(3);
    expect(metrics.slowTranslations[0]?.key).toBe("k5");
  });

  it("generateReport 含慢翻译明细与 >10 截断", () => {
    const tracker = new PerformanceTracker({ slowThreshold: 5, maxSlowEntries: 15, samplingRate: 1 });
    const plugin = tracker.createPlugin();
    const nowSpy = vi.spyOn(performance, "now");
    for (let i = 0; i < 12; i++) {
      nowSpy.mockReturnValueOnce(1000 + i);
      plugin.beforeTranslate?.(`k${i}`);
      nowSpy.mockReturnValueOnce(1000 + i + 50);
      plugin.afterTranslate?.("r", `k${i}`);
    }
    nowSpy.mockRestore();
    const report = tracker.generateReport();
    expect(report).toContain("more");
    expect(report).toContain("⚠️");
  });
});

describe("wave2 — RTL 镜像双侧分支", () => {
  it("ar 下单侧 Left 属性镜像到 Right", () => {
    const mirrored = createMirroredLayout("ar", { marginLeft: "10px", padding: "1px" });
    expect(mirrored).toMatchObject({ marginRight: "10px", padding: "1px" });
    expect(mirrored).not.toHaveProperty("marginLeft");
  });

  it("双侧属性并存时互换（双侧镜像语义）", () => {
    const mirrored = createMirroredLayout("ar", { marginLeft: "10px", marginRight: "20px" });
    expect(mirrored).toEqual({ marginLeft: "20px", marginRight: "10px" });
  });

  it("非 RTL 语言原样返回", () => {
    const cfg = { marginLeft: "10px" };
    expect(createMirroredLayout("en", cfg)).toBe(cfg);
  });
});

describe("wave2 — auditedT label/help 回退分支", () => {
  it("译文命中 key.label 形态时记录剥离后缀", () => {
    i18nAudit.enable();
    i18n.registerTranslation("en", { wave2: { probe: "wave2.probe.label" } });
    const audited = createAuditedT("wave2:test");
    expect(audited("wave2.probe")).toBe("wave2.probe.label");
    expect(i18nAudit.getReport().total).toBeGreaterThanOrEqual(1);
    i18nAudit.clear();
    i18nAudit.disable();
  });
});

describe("wave2 — engine 剩余分支", () => {
  it("debug + 缓存禁用构造（初始化日志 ternary 另一侧）", () => {
    const engine = new I18nEngine({ debug: true, locale: "en", cache: { enabled: false } });
    expect(engine.getLocale()).toBe("en");
    engine.setDebug(false);
  });

  it("已注册翻译的 locale 切换跳过懒加载", async () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("zh-CN", { hi: { x: "你好" } });
    await engine.setLocale("zh-CN");
    expect(engine.getLocale()).toBe("zh-CN");
    expect(engine.t("hi.x")).toBe("你好");
  });

  it("插件注入 params 的 modifiedParams-only 分支", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { k: "v={added}" });
    engine.plugins.register({
      name: "inject",
      beforeTranslate: () => ({ key: "k", params: { added: "1" } }),
    });
    expect(engine.t("k")).toBe("v=1");
  });
});

// ============================================================
// End of branch-closure-wave2.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
