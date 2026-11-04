// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file dashboard.test.tsx
 * description i18n 健康面板测试（501 G4.2）——SSR 渲染 + 数据正确性
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.1.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[dashboard]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief renderToString 一次成帧（与 i18n-react SSR 方案同构，免 jsdom）
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RemoteLocaleSource, RemoteSyncResult } from "@yyc3/i18n-core";
import { AuditLogger, I18nEngine, MissingKeyReporter, PerformanceTracker } from "@yyc3/i18n-core";
import { I18nHealthDashboard } from "./I18nHealthDashboard.js";
import { AuditPanel, CoveragePanel, MissingKeysPanel, OtaPanel, PerformancePanel } from "./panels.js";
import { useI18nHealth } from "./use-i18n-health.js";

function makeEngine(): { engine: I18nEngine; tracker: PerformanceTracker; reporter: MissingKeyReporter; audit: AuditLogger } {
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("en", { app: { title: "My App", sub: "Sub" } });
  engine.registerTranslation("ja", { app: { title: "マイアプリ" } });
  const tracker = new PerformanceTracker();
  const reporter = new MissingKeyReporter();
  const audit = new AuditLogger();
  engine.plugins.register(tracker.createPlugin());
  engine.plugins.register(reporter.createPlugin());
  engine.plugins.register(audit);
  return { engine, tracker, reporter, audit };
}

/** 剥离 React 18 SSR 文本分隔注释（<!-- -->），恢复连续文本比对。 */
const asText = (html: string): string => html.replaceAll("<!-- -->", "");

/** 快照直测组件：把 hook 初始快照物化进 DOM（SSR 单帧内完成采集断言）。 */
function SnapshotProbe(props: { engine: I18nEngine; marker: string }): JSX.Element {
  const health = useI18nHealth(props.engine);
  return <div data-marker={props.marker} data-locale={health.locale} data-locales={health.loadedLocales.join(",")} />;
}

describe("I18nHealthDashboard（SSR）", () => {
  it("零接入渲染：源语言元信息 + 各面板空态", () => {
    const { engine } = makeEngine();
    const html = renderToString(<I18nHealthDashboard engine={engine} />);
    expect(html).toContain("YYC³ i18n 健康");
    expect(html).toContain("<strong>en</strong>");
    expect(html).toContain("未接入 PerformanceTracker");
    expect(html).toContain("未接入 MissingKeyReporter");
    expect(html).toContain("未接入 AuditLogger");
    expect(html).toContain("未接入远程源");
  });

  it("全接入渲染：覆盖率/缺键/性能/审计/OTA 数据到位", () => {
    const { engine, tracker, reporter, audit } = makeEngine();
    engine.t("app.title");            // 命中：性能计数
    engine.t("app.missing-nope");     // 缺键：reporter+audit 各记一条
    engine.t("app.sub");              // 第二键：性能计数

    const fakeSource = {
      lastSync: (locale: string): RemoteSyncResult | null =>
        locale === "ja" ? { locale, changed: true, version: '"v7"', fetchedAt: 1, keyCount: 1 } : null,
      sync: async () => { throw new Error("not used in render"); },
    } as unknown as RemoteLocaleSource;

    const html = renderToString(
      <I18nHealthDashboard
        engine={engine}
        performanceTracker={tracker}
        missingKeyReporter={reporter}
        auditLogger={audit}
        otaSources={[fakeSource]}
        otaLocales={["ja", "ko"]}
      />,
    );
    // 覆盖率：ja 缺 app.sub → 1/2
    expect(asText(html)).toContain("1/2");
    // 缺键面板
    expect(html).toContain("app.missing-nope");
    // 性能面板：两次命中 + 一次缓存内解析（缺键回退同被缓存）
    expect(asText(html)).toMatch(/data-metric="total-calls">\d+</);
    // 审计面板：translate/missing 条目存在
    expect(html).toContain('data-type="translate"');
    expect(html).toContain('data-type="missing"');
    // OTA：ja 已更新带版本，ko 未同步
    expect(html).toContain("已更新");
    expect(html).toContain('&quot;v7&quot;');
    expect(html).toContain("未同步");
  });
});

describe("useI18nHealth（初始快照）", () => {
  it("快照字段：locale/loadedLocales/coverage 语义", () => {
    const { engine } = makeEngine();
    const html = renderToString(<SnapshotProbe engine={engine} marker="probe" />);
    expect(html).toContain('data-locale="en"');
    expect(html).toContain('data-locales="en,ja"');
  });
});

describe("独立面板（可单独消费）", () => {
  it("CoveragePanel：缺失清单与计数", () => {
    const html = renderToString(
      <CoveragePanel coverage={[{ locale: "ja", totalKeys: 2, missingCount: 1, missing: ["app.sub"] }]} />,
    );
    expect(asText(html)).toContain("1/2");
    expect(html).toContain("app.sub");
  });

  it("PerformancePanel：命中率与时延", () => {
    const html = renderToString(
      <PerformancePanel metrics={{ totalCalls: 10, cacheHits: 4, cacheMisses: 6, averageDuration: 1.5, maxDuration: 9.25, slowTranslations: [] }} />,
    );
    expect(asText(html)).toContain('data-metric="cache-hit-rate">40%<');
    expect(asText(html)).toContain("9.25ms");
  });

  it("OtaPanel：无变化/未同步双态", () => {
    const html = renderToString(
      <OtaPanel ota={[{ locale: "ja", syncs: [{ locale: "ja", changed: false, version: null, fetchedAt: 1, keyCount: 5 }, null] }]} />,
    );
    expect(html).toContain("无变化");
    expect(html).toContain("未同步");
  });

  it("AuditPanel：null 空态与条目倒序渲染", () => {
    const emptyHtml = renderToString(<AuditPanel entries={null} />);
    expect(emptyHtml).toContain("未接入 AuditLogger");

    const html = renderToString(
      <AuditPanel entries={[{ ts: 1, type: "translate", locale: "en", key: "a" }, { ts: 2, type: "error", locale: "en", error: "boom" }]} />,
    );
    expect(html).toContain('data-type="translate"');
    expect(html).toContain("boom");
  });

  it("MissingKeysPanel：零缺失与聚合视图", () => {
    const zeroHtml = renderToString(<MissingKeysPanel entries={[]} />);
    expect(zeroHtml).toContain("零缺失");
    const html = renderToString(<MissingKeysPanel entries={[{ key: "k", locale: "ja", timestamp: 1, count: 3 }]} />);
    expect(asText(html)).toContain("ja · k ×3");
  });
});

// ============================================================
// End of dashboard.test.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
