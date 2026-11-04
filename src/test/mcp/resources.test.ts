// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file resources.test.ts
 * description MCP Resources 面单元测试 — locales://{locale} 与 coverage://report 动态读取
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[mcp],[resources]
 *
 * test-target src/lib/mcp/server.ts, src/lib/mcp/i18n-tools.ts
 * coverage 90%+
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { MCPServer } from "../../lib/mcp/server.js";
import { registerI18nTools } from "../../lib/mcp/i18n-tools.js";
import { createRemoteLocaleSource } from "../../lib/ota/remote-locale.js";

/** 捕获型 transport：记录 send 输出，允许测试侧注入消息。 */
class CapturingTransport {
  sent: Array<{ id?: string | number; result?: unknown; error?: unknown }> = [];
  private handler: ((m: unknown) => void) | null = null;

  async send(message: unknown): Promise<void> {
    this.sent.push(message as { id?: string | number });
  }
  onMessage(handler: (m: unknown) => void): void {
    this.handler = handler;
  }
  async connect(): Promise<void> {}
  async close(): Promise<void> {}

  emit(message: unknown): void {
    this.handler?.(message);
  }
  lastResponse(id?: string | number): { result?: any; error?: any } | undefined {
    const candidates = id === undefined ? this.sent : this.sent.filter((m) => m.id === id);
    return candidates[candidates.length - 1] as { result?: any; error?: any } | undefined;
  }
}

function makeServer(): { server: MCPServer; transport: CapturingTransport; nextId: () => number } {
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("zh-CN", { nav: { home: "首页" } });
  const transport = new CapturingTransport();
  const server = new MCPServer({ name: "t", version: "1", transport: transport as never });
  registerI18nTools(server, engine);
  return { server, transport, nextId: (() => { let i = 1; return () => i++; })() };
}

async function readResource(server: MCPServer, transport: CapturingTransport, id: number, uri: string): Promise<{ result?: any; error?: any }> {
  transport.emit({ jsonrpc: "2.0", id, method: "resources/read", params: { uri } });
  await new Promise((r) => setTimeout(r, 5));
  return transport.lastResponse(id) ?? {};
}

describe("MCP Resources — locales://{locale}", () => {
  it("resources/list 声明两类资源", () => {
    const { server } = makeServer();
    expect(server.getResources().map((r) => r.uri)).toContain("locales://{locale}");
    expect(server.getResources().map((r) => r.uri)).toContain("coverage://report");
  });

  it("locales://zh-CN 动态读取返回语言包", async () => {
    const { server, transport, nextId } = makeServer();
    await server.start();
    const id = nextId();
    const res = await readResource(server, transport, id, "locales://zh-CN");
    const payload = JSON.parse(res.result.contents[0].text);
    expect(payload.locale).toBe("zh-CN");
    expect(payload.translations.nav.home).toBe("首页");
  });

  it("locales://ko 未加载语言 → JSON-RPC -32602", async () => {
    const { server, transport, nextId } = makeServer();
    await server.start();
    const id = nextId();
    const res = await readResource(server, transport, id, "locales://ko");
    expect(res.error.code).toBe(-32602);
  });

  it("provider 未覆盖且未声明的 uri → Resource not found", async () => {
    const { server, transport, nextId } = makeServer();
    await server.start();
    const id = nextId();
    const res = await readResource(server, transport, id, "unknown://x");
    expect(res.error.code).toBe(-32602);
    expect(res.error.message).toContain("Resource not found");
  });
});

describe("MCP Resources — coverage://report", () => {
  it("覆盖率快照含各语言缺失统计", async () => {
    const { server, transport, nextId } = makeServer();
    await server.start();
    const id = nextId();
    const res = await readResource(server, transport, id, "coverage://report");
    const payload = JSON.parse(res.result.contents[0].text);
    expect(payload.sourceLocale).toBe("en");
    expect(payload.perLocale).toBeInstanceOf(Array);
    const zh = payload.perLocale.find((p: any) => p.locale === "zh-CN");
    expect(zh).toBeDefined();
    expect(zh.missingCount).toBeGreaterThanOrEqual(0);
  });
});

describe("MCP Resources — ota://status（501 G4）", () => {
  it("未注入 otaSources 时不声明资源（缺省面不变）", () => {
    const { server } = makeServer();
    expect(server.getResources().map((r) => r.uri)).not.toContain("ota://status");
  });

  it("注入后声明并返回各 locale 同步状态（null=未同步）", async () => {
    const engine = new I18nEngine({ locale: "en" });
    engine.registerTranslation("en", {});
    engine.registerTranslation("zh-CN", { nav: { home: "首页" } });
    const transport = new CapturingTransport();
    const server = new MCPServer({ name: "t", version: "1", transport: transport as never });

    let etag: string | null = null;
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (headers["If-None-Match"] === '"v9"') return new Response(null, { status: 304 });
      etag = '"v9"';
      return new Response(JSON.stringify({ nav: { home: "首页 v9" } }), { status: 200, headers: { etag: '"v9"' } });
    }) as unknown as typeof fetch;

    const source = createRemoteLocaleSource({ url: "https://cdn.test/{locale}.json", fetchImpl });
    await source.sync(engine, "zh-CN"); // 一次真实同步 → changed:true
    await source.sync(engine, "zh-CN"); // 304 → changed:false

    registerI18nTools(server, engine, { otaSources: [source], otaLocales: ["zh-CN", "ja"] });
    await server.start();
    const id = 1;
    transport.emit({ jsonrpc: "2.0", id, method: "resources/read", params: { uri: "ota://status" } });
    await new Promise((r) => setTimeout(r, 5));
    const payload = JSON.parse(transport.lastResponse(id).result.contents[0].text);

    expect(payload.perLocale).toHaveLength(2);
    const zh = payload.perLocale.find((p: any) => p.locale === "zh-CN");
    expect(zh.syncs[0]).toMatchObject({ changed: false, version: '"v9"', keyCount: 1 });
    const ja = payload.perLocale.find((p: any) => p.locale === "ja");
    expect(ja.syncs[0]).toBeNull(); // 从未同步
  });
});

// ============================================================
// End of resources.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
