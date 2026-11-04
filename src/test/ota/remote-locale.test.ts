// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file remote-locale.test.ts
 * description OTA 远程语言包源测试（501 G4）——ETag 协商/热更新/轮询/安全校验
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.4.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[ota]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief fetchImpl 桩注入零网络；Response 用全局构造器（Node 20 原生）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import {
  createRemoteLocaleSource, startRemoteLocalePolling
} from "../../lib/ota/remote-locale.js";

type FetchCall = { url: string; headers: Record<string, string> };

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

function makeFetchStub(handler: (call: FetchCall) => Response) {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), headers: (init?.headers ?? {}) as Record<string, string> };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe("createRemoteLocaleSource", () => {
  it("200 首同步：热更新进引擎 + ETag 记忆", async () => {
    const engine = new I18nEngine({ locale: "ja" });
    const { fetchImpl, calls } = makeFetchStub(() => jsonResponse({ app: { title: "マイアプリ" } }, { headers: { etag: '"v1"' } }));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/locales/{locale}.json", fetchImpl });

    const result = await source.sync(engine, "ja");

    expect(result.changed).toBe(true);
    expect(result.version).toBe('"v1"');
    expect(result.keyCount).toBe(1);
    expect(calls[0]?.headers["If-None-Match"]).toBeUndefined();
    expect(engine.t("app.title")).toBe("マイアプリ");
    expect(source.lastSync("ja")).toMatchObject({ changed: true });
    expect(source.lastSync("en")).toBeNull();
  });

  it("二次同步 If-None-Match 命中 304：不重注册", async () => {
    const engine = new I18nEngine({ locale: "ja" });
    let status = 200;
    const { fetchImpl, calls } = makeFetchStub(() => (status === 304 ? new Response(null, { status: 304 }) : jsonResponse({ a: "1" }, { headers: { etag: '"v1"' } })));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/ja.json", fetchImpl });

    await source.sync(engine, "ja");
    status = 304;
    const second = await source.sync(engine, "ja");

    expect(second.changed).toBe(false);
    expect(second.version).toBe('"v1"');
    expect(second.keyCount).toBe(1); // 保留上次键数
    expect(calls[1]?.headers["If-None-Match"]).toBe('"v1"');
  });

  it("包裹形态 { translations, version }：版本取载荷字段", async () => {
    const engine = new I18nEngine({ locale: "fr" });
    const { fetchImpl } = makeFetchStub(() => jsonResponse({ translations: { hello: "bonjour" }, version: "2.5.0" }));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/fr.json", fetchImpl });

    const result = await source.sync(engine, "fr");
    expect(result.version).toBe("2.5.0");
    expect(engine.t("hello")).toBe("bonjour");
  });

  it("x-i18n-version 响应头优先于载荷 version", async () => {
    const engine = new I18nEngine({ locale: "de" });
    const { fetchImpl } = makeFetchStub(() => jsonResponse({ translations: {}, version: "payload" }, { headers: { "x-i18n-version": "header" } }));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/de.json", fetchImpl });
    expect((await source.sync(engine, "de")).version).toBe("header");
  });

  it("非 2xx 抛错并含状态码", async () => {
    const engine = new I18nEngine({ locale: "ko" });
    const { fetchImpl } = makeFetchStub(() => new Response("boom", { status: 500 }));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/ko.json", fetchImpl });
    await expect(source.sync(engine, "ko")).rejects.toThrow(/Locale fetch 500/);
  });

  it("非法载荷（数组/非对象）抛错", async () => {
    const engine = new I18nEngine({ locale: "es" });
    const { fetchImpl } = makeFetchStub(() => jsonResponse([1, 2, 3]));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/es.json", fetchImpl });
    await expect(source.sync(engine, "es")).rejects.toThrow(/must be an object/);
  });

  it("仅允许 http/https 协议", async () => {
    const source = createRemoteLocaleSource({ url: "file:///etc/passwd", fetchImpl: (async () => jsonResponse({})) as never });
    const engine = new I18nEngine({ locale: "en" });
    await expect(source.sync(engine, "en")).rejects.toThrow(/Unsupported protocol "file:"/);
  });

  it("URL 非法与网络异常包装为可读错误", async () => {
    const engine = new I18nEngine({ locale: "en" });
    const bad = createRemoteLocaleSource({ url: "not a url", fetchImpl: (async () => jsonResponse({})) as never });
    await expect(bad.sync(engine, "en")).rejects.toThrow(/Invalid locale URL/);

    const failing = createRemoteLocaleSource({
      url: "https://cdn.test/en.json",
      fetchImpl: (async () => { throw new Error("network down"); }) as never,
    });
    await expect(failing.sync(engine, "en")).rejects.toThrow(/Locale fetch failed .* network down/);
  });

  it("订阅者在热更新后被通知（OTA 即时生效语义）", async () => {
    const engine = new I18nEngine({ locale: "zh-CN" });
    const notified: string[] = [];
    engine.subscribe(() => notified.push("tick"));

    const { fetchImpl } = makeFetchStub(() => jsonResponse({ hi: "你好" }));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/zh-CN.json", fetchImpl });
    await source.sync(engine, "zh-CN");

    expect(engine.t("hi")).toBe("你好");
  });
});

describe("startRemoteLocalePolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("按周期触发同步，stop 后停", async () => {
    const engine = new I18nEngine({ locale: "ja" });
    let syncCount = 0;
    const { fetchImpl } = makeFetchStub(() => {
      syncCount += 1;
      return jsonResponse({ n: String(syncCount) });
    });
    const source = createRemoteLocaleSource({ url: "https://cdn.test/ja.json", fetchImpl });

    const handle = startRemoteLocalePolling(source, engine, "ja", 1_000);
    await vi.advanceTimersByTimeAsync(3_500);
    expect(syncCount).toBe(3);

    handle.stop();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(syncCount).toBe(3);
  });

  it("同步失败经 onError 上报且不中断轮询", async () => {
    const engine = new I18nEngine({ locale: "ja" });
    let status = 500;
    const { fetchImpl } = makeFetchStub(() => (status === 500 ? new Response("x", { status: 500 }) : jsonResponse({ ok: "1" })));
    const source = createRemoteLocaleSource({ url: "https://cdn.test/ja.json", fetchImpl });

    const errors: string[] = [];
    startRemoteLocalePolling(source, engine, "ja", 1_000, (e) => errors.push(e.message));

    await vi.advanceTimersByTimeAsync(1_100);
    expect(errors[0]).toMatch(/Locale fetch 500/);

    status = 200;
    await vi.advanceTimersByTimeAsync(1_100);
    expect(errors).toHaveLength(1); // 恢复后不再报错
  });

  it("非法 interval 抛错", () => {
    const source = createRemoteLocaleSource({ url: "https://cdn.test/en.json", fetchImpl: (async () => jsonResponse({})) as never });
    const engine = new I18nEngine({ locale: "en" });
    expect(() => startRemoteLocalePolling(source, engine, "en", 0)).toThrow(/intervalMs must be positive/);
  });
});

// ============================================================
// End of remote-locale.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
