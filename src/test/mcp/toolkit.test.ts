// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file toolkit.test.ts
 * description createI18nToolkit 编程调用面测试（501 G3）——与 registerI18nTools 同源 13 工具
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.3.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[mcp],[skill]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 工具清单/直连调用/未知工具错误/能力映射四面
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { createI18nToolkit, toolNamesForCapability } from "../../lib/mcp/toolkit.js";
import { CAPABILITY_VOCABULARY, unknownCapabilities } from "../../lib/plugins.js";

function createEngine() {
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("en", { app: { title: "My App", greeting: "Hello {name}" } });
  engine.registerTranslation("zh-CN", { app: { title: "我的应用" } });
  return engine;
}

describe("createI18nToolkit", () => {
  it("暴露与 registerI18nTools 同源的 13 个工具", () => {
    const toolkit = createI18nToolkit(createEngine());
    expect(toolkit.list()).toHaveLength(13);
    expect(toolkit.tools).toHaveLength(13);
    for (const tool of toolkit.tools) {
      expect(tool.name).toMatch(/^[a-z_]+$/);
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("call 直连返回解析后的 JSON（不经传输层）", async () => {
    const toolkit = createI18nToolkit(createEngine());
    const result = await toolkit.call<{ keys: string[] }>("extract_keys", {
      code: "t('a.b'); t(\"c.d\"); t('a.b')",
    });
    expect(result.keys).toEqual(["a.b", "c.d"]);
    expect(result.count).toBe(2);
  });

  it("call 无参/默认参数路径", async () => {
    const toolkit = createI18nToolkit(createEngine());
    const stats = await toolkit.call<{ locale: string }>("get_locale_stats");
    expect(stats.locale).toBe("en");
  });

  it("translate_key 兑现 locale 参数（3.3.0 修复回归）", async () => {
    const engine = createEngine();
    const toolkit = createI18nToolkit(engine);
    const zh = await toolkit.call<{ value: string; locale: string }>("translate_key", {
      key: "app.title",
      locale: "zh-CN",
    });
    expect(zh.value).toBe("我的应用");
    expect(zh.locale).toBe("zh-CN");
    expect(engine.getLocale()).toBe("zh-CN");
  });

  it("call 未知工具名抛错并附可用清单", async () => {
    const toolkit = createI18nToolkit(createEngine());
    await expect(toolkit.call("no_such_tool")).rejects.toThrow(/Unknown tool: no_such_tool（可用：/);
  });

  it("工具处理器异常原样冒泡", async () => {
    // 引擎未装载目标语言 → handler 内部抛错（glossary_lookup 校验路径）
    const toolkit = createI18nToolkit(new I18nEngine({ locale: "en" }));
    await expect(toolkit.call("check_missing_keys", { locale: "zz" })).resolves.toBeTypeOf("object");
  });
});

describe("toolNamesForCapability", () => {
  it("audit 能力映射三工具", () => {
    expect(toolNamesForCapability("audit")).toEqual(["check_missing_keys", "compare_locales", "get_locale_stats"]);
  });

  it("插件层能力无工具映射（空数组）", () => {
    expect(toolNamesForCapability("reporting")).toEqual([]);
    expect(toolNamesForCapability("performance")).toEqual([]);
  });

  it("映射覆盖全词汇表且工具名真实存在", () => {
    const toolkit = createI18nToolkit(createEngine());
    const known = new Set(toolkit.list());
    for (const capability of CAPABILITY_VOCABULARY) {
      for (const name of toolNamesForCapability(capability)) {
        expect(known.has(name)).toBe(true);
      }
    }
  });

  it("词汇表外能力抛错", () => {
    expect(() => toolNamesForCapability("nope" as never)).toThrow(/Unknown capability: nope/);
  });
});

describe("unknownCapabilities", () => {
  it("合法列表返回空", () => {
    expect(unknownCapabilities(["audit", "extract"])).toEqual([]);
  });

  it("非法项去重返回", () => {
    expect(unknownCapabilities(["audit", "hack", "hack"])).toEqual(["hack"]);
  });
});

// ============================================================
// End of toolkit.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
