// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file audit-logger.test.ts
 * description 企业审计日志插件测试（501 G4）——五钩子审计/脱敏/环形缓冲/sink
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.4.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[plugin],[audit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 引擎全集成（t()/setLocale 真实钩子链）+ 缓冲语义单测
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../lib/engine.js";
import { AuditLogger } from "../lib/plugins/audit-logger.js";
import type { AuditEntry } from "../lib/plugins/audit-logger.js";

function makeEngine(audit: AuditLogger): I18nEngine {
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("en", { greet: "Hello {name}", nav: { home: "Home" } });
  engine.registerTranslation("zh-CN", { greet: "你好 {name}" });
  engine.plugins.register(audit);
  return engine;
}

describe("AuditLogger（引擎集成）", () => {
  it("翻译请求记录 translate 条目（key/原始模板/params/latency）", () => {
    const audit = new AuditLogger();
    const engine = makeEngine(audit);

    engine.t("greet", { name: "YYC³" });

    const entry = audit.getEntries().find((e) => e.type === "translate");
    // afterTranslate 在插值前执行——审计记录目录模板而非终值（PII 只在脱敏 params）
    expect(entry).toMatchObject({ key: "greet", result: "Hello {name}", locale: "en" });
    expect(entry?.params).toEqual({ name: "YYC³" });
    expect(entry?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("redactKeys 命中项脱敏为 ***（大小写不敏感）", () => {
    const audit = new AuditLogger({ redactKeys: ["password"] });
    const engine = makeEngine(audit);

    engine.t("greet", { name: "Ada", Password: "hunter2" });

    const entry = audit.getEntries().find((e) => e.type === "translate");
    expect(entry?.params).toEqual({ name: "Ada", Password: "***" });
  });

  it("缺键记录 missing 条目", () => {
    const audit = new AuditLogger();
    const engine = makeEngine(audit);

    engine.t("no.such.key");

    expect(audit.getEntries().some((e) => e.type === "missing" && e.key === "no.such.key")).toBe(true);
  });

  it("语言切换记录 locale-change 条目且后续条目携带新 locale", async () => {
    const audit = new AuditLogger();
    const engine = makeEngine(audit);

    await engine.setLocale("zh-CN");
    engine.t("greet", { name: "小方" });

    const change = audit.getEntries().find((e) => e.type === "locale-change");
    expect(change).toBeDefined();
    const last = audit.getEntries()[audit.getEntries().length - 1];
    expect(last).toMatchObject({ type: "translate", locale: "zh-CN", result: "你好 {name}" });
  });

  it("sink 实时下沉每条审计记录", () => {
    const sunk: AuditEntry[] = [];
    const audit = new AuditLogger({ sink: (e) => sunk.push(e) });
    const engine = makeEngine(audit);

    engine.t("nav.home");

    expect(sunk.some((e) => e.type === "translate" && e.key === "nav.home")).toBe(true);
  });

  it("onError 钩子记录 error 条目（含错误消息与上下文键）", () => {
    const audit = new AuditLogger();
    audit.onError(new Error("ICU boom"), { locale: "en", key: "greet" });

    const entry = audit.getEntries().find((e) => e.type === "error");
    expect(entry).toMatchObject({ key: "greet", error: "ICU boom", locale: "en" });
  });

  it("超长值按 maxValueLength 截断", () => {
    const audit = new AuditLogger({ maxValueLength: 5 });
    const engine = makeEngine(audit);

    engine.t("greet", { name: "0123456789" });

    const entry = audit.getEntries().find((e) => e.type === "translate");
    expect(entry?.params?.name).toBe("01234…");
  });
});

describe("AuditLogger（缓冲语义）", () => {
  it("环形缓冲：容量 3 滚动保留最近 3 条（时间升序；不同键——缓存命中会短路钩子链）", () => {
    const audit = new AuditLogger({ bufferSize: 3 });
    const engine = new I18nEngine({ locale: "en" });
    engine.plugins.register(audit);
    for (const k of ["k1", "k2", "k3", "k4", "k5"]) {
      engine.registerTranslation("en", { [k]: `v-${k}` });
      engine.t(k);
    }

    const entries = audit.getEntries().filter((e) => e.type === "translate");
    expect(entries.map((e) => e.key)).toEqual(["k3", "k4", "k5"]);
  });

  it("exportJSON/clear 与 meta 能力声明", () => {
    const audit = new AuditLogger({ bufferSize: 1 });
    const engine = makeEngine(audit);
    engine.t("nav.home");

    const parsed = JSON.parse(audit.exportJSON()) as { entries: AuditEntry[]; count: number };
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.entries).toHaveLength(parsed.count);

    audit.clear();
    expect(audit.getEntries()).toHaveLength(0);

    expect(audit.meta.capability).toEqual(["audit-trail"]);
    expect(Object.isFrozen(audit.meta.capability)).toBe(true);
  });
});

// ============================================================
// End of audit-logger.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
