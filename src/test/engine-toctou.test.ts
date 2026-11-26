// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file engine-toctou.test.ts
 * description setLocale 异步懒加载 × 消费者 registerTranslation TOCTOU 回归测试 — 构造后同步注册的词条必须活过内置包异步加载（Admin 37 失败根因回归墙）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-27
 * updated 2026-11-27
 * status active
 * tags [test],[engine],[toctou],[race],[setlocale]
 *
 * test-target src/lib/engine.ts
 * coverage setLocale 异步加载完成段 × registerTranslation 竞态窗口
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageMock } from "../../test-helpers/storage.js";
import { I18nEngine } from "../lib/engine.js";
import type { TranslationMap } from "../lib/types.js";

/**
 * 懒加载拦截器：对"已布防"的 locale 返回手动 deferred，使 setLocale 的
 * await 挂起窗口可以被测试精确控制（resolve 时机 = 竞态窗口关闭时机）。
 * 未布防的 locale 透传真实实现（动态 import 内置语言包）。
 */
const lazyLoadHarness = vi.hoisted(() => {
  type Deferred = { promise: Promise<unknown>; resolve: (value: unknown) => void };
  return {
    armed: new Set<string>(),
    deferreds: new Map<string, Deferred>(),
    reset(): void {
      this.armed.clear();
      this.deferreds.clear();
    },
  };
});

vi.mock("../lib/registry.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/registry.js")>();
  return {
    ...actual,
    loadLazyLocaleTranslation: (locale: string) => {
      if (lazyLoadHarness.armed.has(locale)) {
        let deferred = lazyLoadHarness.deferreds.get(locale);
        if (!deferred) {
          let resolve!: (value: unknown) => void;
          const promise = new Promise((r) => {
            resolve = r;
          });
          deferred = { promise, resolve };
          lazyLoadHarness.deferreds.set(locale, deferred);
        }
        return deferred.promise;
      }
      return actual.loadLazyLocaleTranslation(locale as never);
    },
  };
});

/** 内置包替身：与消费者词条键空间互斥，用于裁决"谁的字段赢了" */
const builtinPackStandIn = {
  builtin: { marker: "内置包字段" },
} as unknown as TranslationMap;

/**
 * Admin 仓消费模式复刻：App 自有词条字典（flatToNested 后注册），
 * 键空间与内置 zh-CN 包（common/nav/overview/welcome…）刻意不重叠，
 * 以便区分"消费者词条"与"内置包词条"两套来源。
 */
const appTranslations = {
  brand: { title: "云枢控制台" },
  nav: { apiDocs: "API 文档", tasks: "任务板" },
  tsb: { themeCyberpunk: "赛博朋克" },
  actions: { markAllRead: "全部标为已读" },
} as unknown as TranslationMap;

describe("I18nEngine — setLocale 懒加载 × registerTranslation TOCTOU", () => {
  beforeEach(() => {
    vi.resetModules();
    lazyLoadHarness.reset();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("navigator", { language: "en-US" } as Navigator);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("构造期 fire-and-forget 加载完成时不得整体替换消费者已注册的同 locale 词条（Admin 消费模式复现）", async () => {
    lazyLoadHarness.armed.add("zh-CN");
    // Admin 单例模式：显式 locale 构造 → 构造函数内部 void setLocale('zh-CN') 异步懒加载挂起
    const engine = new I18nEngine({ locale: "zh-CN" });
    // 构造期加载确实被拦截挂起（竞态窗口开启）
    const deferred = lazyLoadHarness.deferreds.get("zh-CN");
    expect(deferred).toBeDefined();
    // 消费者在构造后同一同步段立即接管 zh-CN（真实消费面：registerTranslation('zh-CN', …)）
    engine.registerTranslation("zh-CN", appTranslations);
    expect(engine.getTranslations("zh-CN")).toBe(appTranslations);

    // 竞态窗口关闭：懒加载完成（修复前此处会把内置包整体赋给 translations['zh-CN']）
    deferred!.resolve(builtinPackStandIn);
    await deferred!.promise;
    await Promise.resolve(); // 放行 setLocale await 恢复段

    // locale 切换本身照常完成（修复只豁免词条整体替换，不阻断切换）
    expect(engine.getLocale()).toBe("zh-CN");
    // TOCTOU 断言：消费者词条必须存活
    expect(engine.getTranslations("zh-CN")).toBe(appTranslations);
    expect(engine.t("brand.title")).toBe("云枢控制台");
    expect(engine.t("nav.apiDocs")).toBe("API 文档");
    expect(engine.t("tsb.themeCyberpunk")).toBe("赛博朋克");
    expect(engine.t("actions.markAllRead")).toBe("全部标为已读");
    // 内置包没有混入（跳过整体替换而非按键合并的语义锚定）
    expect(engine.t("builtin.marker")).toBe("builtin.marker");
  });

  it("显式 setLocale await 窗口内同步 registerTranslation 同样不被内置包覆盖", async () => {
    lazyLoadHarness.armed.add("zh-CN");
    const engine = new I18nEngine({ locale: "en" });
    const pending = engine.setLocale("zh-CN");
    // await 恢复前，消费者接管 zh-CN
    const deferred = lazyLoadHarness.deferreds.get("zh-CN");
    expect(deferred).toBeDefined();
    engine.registerTranslation("zh-CN", appTranslations);

    deferred!.resolve(builtinPackStandIn);
    await pending;
    await Promise.resolve();

    expect(engine.getLocale()).toBe("zh-CN");
    expect(engine.getTranslations("zh-CN")).toBe(appTranslations);
    expect(engine.t("nav.apiDocs")).toBe("API 文档");
  });

  it("无消费者注册时内置懒加载行为不变（防过度阻塞）", async () => {
    const engine = new I18nEngine({ locale: "en" });
    await engine.setLocale("zh-CN");

    // 未注册场景：内置 zh-CN 包照常装入并生效
    expect(engine.t("common.health")).toBe("健康状况");
  });

  it("消费者注册先于 setLocale 时不触发懒加载（needsTranslationLoad 短路）", async () => {
    lazyLoadHarness.armed.add("zh-CN");
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("zh-CN", appTranslations);
    await engine.setLocale("zh-CN");

    // 加载路径根本不进入：deferred 未被创建，消费者词条原样保留
    expect(lazyLoadHarness.deferreds.has("zh-CN")).toBe(false);
    expect(engine.getTranslations("zh-CN")).toBe(appTranslations);
    expect(engine.t("brand.title")).toBe("云枢控制台");
  });
});

// ============================================================
// End of engine-toctou.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
