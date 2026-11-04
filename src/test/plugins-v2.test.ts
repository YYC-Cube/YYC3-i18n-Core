// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file plugins-v2.test.ts
 * description 插件合同 v2 单元测试 — 优先级排序、v1 兼容、definePlugin 与能力声明
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[plugin],[contract-v2]
 *
 * test-target src/lib/plugins.ts
 * coverage 90%+
 */
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLUGIN_PRIORITY,
  PluginManager,
  definePlugin,
  type I18nPlugin,
  type I18nPluginV2,
} from "../lib/plugins.js";

function hookPlugin(name: string, log: string[], marker = name): I18nPlugin {
  return {
    name,
    beforeTranslate: (key) => {
      log.push(marker);
      return { key };
    },
  };
}

describe("plugins v2 — priority ordering", () => {
  it("priority 小者先执行（数字序）", () => {
    const mgr = new PluginManager();
    const log: string[] = [];
    mgr.register(hookPlugin("late", log), { priority: 200 });
    mgr.register(hookPlugin("early", log), { priority: 10 });
    mgr.register(hookPlugin("mid", log), { priority: 50 });
    mgr.executeBeforeTranslate("k");
    expect(log).toEqual(["early", "mid", "late"]);
  });

  it("未声明 priority 的 v1 插件取默认值并保持注册序", () => {
    const mgr = new PluginManager();
    const log: string[] = [];
    mgr.register(hookPlugin("a-default", log));
    mgr.register(hookPlugin("b-default", log));
    mgr.register(hookPlugin("early", log), { priority: 1 });
    mgr.executeBeforeTranslate("k");
    expect(log).toEqual(["early", "a-default", "b-default"]);
    expect(mgr.getPriority("a-default")).toBe(DEFAULT_PLUGIN_PRIORITY);
  });

  it("插件自带 priority 字段（v2 形态）生效", () => {
    const mgr = new PluginManager();
    const log: string[] = [];
    const p: I18nPluginV2 = { ...hookPlugin("self", log), priority: 1 };
    mgr.register({ ...hookPlugin("normal", log) });
    mgr.register(p);
    mgr.executeBeforeTranslate("k");
    expect(log).toEqual(["self", "normal"]);
  });

  it("覆盖注册按新优先级重排", () => {
    const mgr = new PluginManager();
    const log: string[] = [];
    mgr.register(hookPlugin("x", log, "x1"), { priority: 100 });
    mgr.register(hookPlugin("y", log, "y1"), { priority: 50 });
    mgr.register({ ...hookPlugin("x", log, "x2"), priority: 1 });
    mgr.executeBeforeTranslate("k");
    expect(log).toEqual(["x2", "y1"]);
    expect(mgr.getRegisteredPlugins()).toEqual(["x", "y"]);
  });
});

describe("plugins v2 — definePlugin factory contract", () => {
  it("definePlugin 返回原对象且 capability 被冻结（防运行时篡改）", () => {
    const p = definePlugin({
      name: "glossary",
      meta: { capability: ["glossary-lookup", "glossary-enforce"] },
      beforeTranslate: () => undefined,
    });
    expect(p.meta?.capability).toEqual(["glossary-lookup", "glossary-enforce"]);
    expect(Object.isFrozen(p.meta?.capability)).toBe(true);
  });

  it("v1 裸对象仍可注册（纯超集兼容承诺）", () => {
    const mgr = new PluginManager();
    const log: string[] = [];
    mgr.register(hookPlugin("legacy-plain", log));
    expect(mgr.executeBeforeTranslate("k")).toEqual({ key: "k" });
    expect(log).toEqual(["legacy-plain"]);
    expect(mgr.getPlugin("legacy-plain")).toBeDefined();
  });

  it("destroyAll 清理优先级表", async () => {
    const mgr = new PluginManager();
    mgr.register(hookPlugin("z", []), { priority: 7 });
    await mgr.destroyAll();
    expect(mgr.getRegisteredPlugins()).toHaveLength(0);
    expect(mgr.getPriority("z")).toBeUndefined();
  });

  it("initAll 对无 init 钩子的插件安全跳过（initAll 分支）", async () => {
    const mgr = new PluginManager();
    const inited: string[] = [];
    mgr.register(hookPlugin("no-init", []));
    mgr.register({
      name: "with-init",
      init: () => {
        inited.push("with-init");
      },
    });
    await mgr.initAll({} as never);
    expect(inited).toEqual(["with-init"]);
  });
});

// ============================================================
// End of plugins-v2.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
