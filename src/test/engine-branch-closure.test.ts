// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file engine-branch-closure.test.ts
 * description 引擎/探测/注册表分支闭合测试 — debug、错误处理、懒加载与区域探测边角（90% 策略线补强）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[engine],[branch-closure]
 *
 * test-target src/lib/engine.ts, src/lib/detector.ts, src/lib/registry.ts
 * coverage 90%+
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nEngine } from "../lib/engine.js";
import { detectSystemLocale, isChineseLocale, normalizeLocale } from "../lib/detector.js";
import { loadLazyLocaleTranslation } from "../lib/registry.js";
import { createStorageMock } from "../../test-helpers/storage.js";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete globalThis.localStorage;
  delete process.env.LANGUAGE;
  delete process.env.LANG;
  delete process.env.LC_ALL;
  delete process.env.LC_MESSAGES;
});

describe("engine — debug mode branches", () => {
  it("debug:true 触发初始化日志与变更日志分支", async () => {
    const engine = new I18nEngine({ debug: true, locale: "en" });
    engine.setDebug(true);
    await engine.setLocale("zh-CN");
    engine.setDebug(false);
    expect(engine.getLocale()).toBe("zh-CN");
    expect(typeof engine.getStats()).toBe("object");
  });

  it("setDebug(true) 挂载 __i18n_debug__，registerTranslation 走日志分支", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.setDebug(true);
    expect((globalThis as Record<string, unknown>).__i18n_debug__).toBeDefined();
    engine.registerTranslation("en", { hi: { there: "hello" } });
    expect(engine.t("hi.there")).toBe("hello");
    engine.setDebug(false);
  });
});

describe("engine — cache/hit/interpolate branches", () => {
  it("缓存命中分支：带参与不带参各走一条", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { greet: { hello: "Hi {name}!" } });
    expect(engine.t("greet.hello", { name: "A" })).toBe("Hi A!");
    expect(engine.t("greet.hello", { name: "B" })).toBe("Hi B!");
    expect(engine.t("greet.hello")).toBe("Hi {name}!");
  });

  it("interpolate 缺参保留占位符", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { tpl: "v{ver}" });
    expect(engine.t("tpl")).toBe("v{ver}");
  });

  it("ICU 模板经引擎编译，含 plural 与 select", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", {
      items: "{n, plural, one{# item} other{# items}}",
      menu: "{choice, select, a{Alpha} other{Beta}}",
    });
    expect(engine.t("items", { n: "3" })).toBe("3 items");
    expect(engine.t("menu", { choice: "a" })).toBe("Alpha");
  });

  it("ICU 解析错误时回退插值路径", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { broken: "{x, bogus} {v}" });
    expect(engine.t("broken", { v: "V" })).toContain("V");
  });

  it("t() 异常路径经 handleError 返回键名（beforeTranslate 抛错插件）", () => {
    const onError = vi.fn();
    const engine = new I18nEngine({ locale: "en", onError });
    engine.registerTranslation("en", { k: "v" });
    engine.plugins.register({
      name: "boom",
      beforeTranslate: () => {
        throw new Error("boom");
      },
    });
    expect(engine.t("k")).toBe("k");
    expect(onError).toHaveBeenCalled();
  });
});

describe("engine — setLocale error branches", () => {
  it("不支持的 locale 触发懒加载失败 → onError 回调", async () => {
    const onError = vi.fn();
    const engine = new I18nEngine({ locale: "en", onError });
    await engine.setLocale("xx" as never);
    expect(onError).toHaveBeenCalled();
    expect(engine.getLocale()).toBe("en");
  });

  it("同 locale 早返回分支", async () => {
    const engine = new I18nEngine({ locale: "en" });
    await engine.setLocale("en");
    expect(engine.getLocale()).toBe("en");
  });
});

describe("engine — stored locale adoption（window.localStorage 契约）", () => {
  it("无显式 locale 时采纳存储偏好（异步懒加载完成后生效）", async () => {
    const mock = createStorageMock();
    mock.setItem("yyc3.i18n.locale", "zh-CN");
    (globalThis as Record<string, unknown>).window = { localStorage: mock };
    const engine = new I18nEngine();
    await vi.waitFor(() => expect(engine.getLocale()).toBe("zh-CN"));
    delete (globalThis as Record<string, unknown>).window;
  });

  it("存储抛错被吞掉（persistLocale catch 分支）", async () => {
    const throwing = createStorageMock();
    vi.spyOn(throwing, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    (globalThis as Record<string, unknown>).window = { localStorage: throwing };
    const engine = new I18nEngine({ locale: "ja" });
    await engine.setLocale("ko");
    expect(engine.getLocale()).toBe("ko");
    delete (globalThis as Record<string, unknown>).window;
  });
});

describe("engine — batchTranslate", () => {
  it("批量翻译返回映射", () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", { a: { x: "AX", y: "AY" } });
    const out = engine.batchTranslate(["a.x", "a.y"]);
    expect(out).toMatchObject({ "a.x": "AX", "a.y": "AY" });
  });
});

describe("detector — normalizeLocale 深边角", () => {
  it("带编码后缀的点分区域：zh-CN.UTF-8", () => {
    expect(normalizeLocale("zh-CN.UTF-8")).toBe("zh-CN");
    expect(normalizeLocale("zh_CN.UTF-8")).toBe("zh-CN");
  });

  it("点开头无主语言返回 null", () => {
    expect(normalizeLocale(".env")).toBeNull();
  });

  it("主语言别名映射 zh/en/ja/ko/fr/de/es/pt/ar", () => {
    expect(normalizeLocale("zh-Hans-CN-x-implicit")).toBe("zh-CN");
    expect(normalizeLocale("pt")).toBe("pt-BR");
    expect(normalizeLocale("ar")).toBe("ar");
    expect(normalizeLocale("sv")).toBeNull();
  });

  it("纯分隔符输入返回 null", () => {
    expect(normalizeLocale("_")).toBeNull();
  });
});

describe("detector — detectSystemLocale 全分支", () => {
  it("env LANGUAGE 命中（confidence>0.8 早返回）", () => {
    process.env.LANGUAGE = "zh_CN.UTF-8";
    const r = detectSystemLocale("ja");
    expect(r).toMatchObject({ locale: "zh-CN", source: "env", confidence: 0.95 });
  });

  it("env 全空 → storage 命中（zh_hk 别名）", () => {
    const r = detectSystemLocale("zh_hk");
    expect(r.source).toBe("storage");
    expect(r.locale).toBe("zh-TW");
  });

  it("storage 无效 → 回落 default en（navigator 置空）", () => {
    vi.stubGlobal("navigator", undefined);
    const r = detectSystemLocale("xx-XX");
    expect(r).toMatchObject({ locale: "en", source: "default" });
  });

  it("navigator.languages 循环内失败后 language 回退分支", () => {
    process.env.LANG = "";
    vi.stubGlobal("navigator", { language: "de-DE", languages: ["xx-XX", "yy-YY"] });
    const r = detectSystemLocale();
    expect(r).toMatchObject({ locale: "de", source: "system", confidence: 0.8 });
  });

  it("isChineseLocale 判定", () => {
    expect(isChineseLocale("zh-CN")).toBe(true);
    expect(isChineseLocale("zh-TW")).toBe(true);
    expect(isChineseLocale("en")).toBe(false);
  });
});

describe("registry — 懒加载 loader 全量调用", () => {
  it.for(["ja", "ko", "fr", "de", "es", "ar"] as const)("加载 %s 语言包", async (locale) => {
    const map = await loadLazyLocaleTranslation(locale);
    expect(map && typeof map === "object").toBe(true);
  });
});

// ============================================================
// End of engine-branch-closure.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
