// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢内部测试 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file streamable-http-branches.test.ts
 * description Streamable HTTP 传输分支闭合 — 批量/方法/会话/Origin 边角（90 门禁补强）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 1.0.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [test],[mcp],[transport]
 *
 * test-target src/lib/mcp/streamable-http-transport.ts
 * coverage 90%+
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { MCPServer } from "../../lib/mcp/server.js";
import { StreamableHttpTransport } from "../../lib/mcp/streamable-http-transport.js";
import { registerI18nTools } from "../../lib/mcp/i18n-tools.js";

let transport: StreamableHttpTransport;
let base = "";
let sessionId = "";

beforeAll(async () => {
  transport = new StreamableHttpTransport({ port: 0 });
  const engine = new I18nEngine({ locale: "en" });
  const server = new MCPServer({ name: "branch-test", version: "1", transport: transport as never });
  registerI18nTools(server, engine);
  await server.start();
  base = `http://127.0.0.1:${transport.address().port}`;
  const init = await fetch(`${base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
  sessionId = init.headers.get("mcp-session-id")!;
});

afterAll(async () => {
  await transport.close();
});

async function post(body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; json: any; headers: Headers; text: string }> {
  const res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", "mcp-session-id": sessionId, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined, headers: res.headers, text };
}

describe("HTTP 传输分支闭合", () => {
  it("batch 数组：双请求双响应（数组回包）", async () => {
    const r = await post([
      { jsonrpc: "2.0", id: 21, method: "ping" },
      { jsonrpc: "2.0", id: 22, method: "ping" },
    ]);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.json)).toBe(true);
    expect(r.json.map((x: any) => x.id)).toEqual([21, 22]);
  });

  it("空 batch 数组 → 400 -32600", async () => {
    const r = await post([]);
    expect(r.status).toBe(400);
    expect(r.json.error.code).toBe(-32600);
  });

  it("PUT 等其他方法 → 405 allow POST, DELETE, GET", async () => {
    const r = await fetch(`${base}/mcp`, { method: "PUT", headers: { "mcp-session-id": sessionId }, body: "{}" });
    expect(r.status).toBe(405);
    expect(r.headers.get("allow")).toContain("POST");
  });

  it("带 Origin 白名单内的请求放行（corsOrigins 配置下的匹配分支）", async () => {
    const t2 = new StreamableHttpTransport({ port: 0, corsOrigins: ["https://ok.example"] });
    const engine = new I18nEngine({ locale: "en" });
    const server = new MCPServer({ name: "t2", version: "1", transport: t2 as never });
    registerI18nTools(server, engine);
    await server.start();
    const p = t2.address().port;
    const ok = await fetch(`http://127.0.0.1:${p}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://ok.example" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(ok.status).toBe(200);
    await t2.close();
  });

  it("无 Origin 头（非浏览器客户端）在白名单模式下放行", async () => {
    const r = await post({ jsonrpc: "2.0", id: 23, method: "ping" });
    expect(r.status).toBe(200);
  });

  it("initialize 重置已有会话：携带旧 session 头发 initialize → 新会话生效", async () => {
    const old = sessionId;
    const r = await post({ jsonrpc: "2.0", id: 24, method: "initialize", params: {} });
    const fresh = r.headers.get("mcp-session-id")!;
    expect(fresh).toBeTruthy();
    expect(fresh).not.toBe(old);
    sessionId = fresh;
    const follow = await post({ jsonrpc: "2.0", id: 25, method: "ping" });
    expect(follow.status).toBe(200);
  });

  it("宿主异常 → 500 内部错误兜底（handler 抛错路径）", async () => {
    // messageHandler 抛错由 http.createServer 回调 catch → 500
    const anyTransport = transport as unknown as { messageHandler: ((m: never) => Promise<void>) | null };
    const original = anyTransport.messageHandler;
    (transport as unknown as { messageHandler: ((m: never) => Promise<void>) | null }).messageHandler = (async () => {
      throw new Error("boom");
    }) as never;
    const r = await post({ jsonrpc: "2.0", id: 26, method: "ping" });
    (transport as unknown as { messageHandler: ((m: never) => Promise<void>) | null }).messageHandler = original;
    expect(r.status).toBe(500);
    expect(r.json.error.code).toBe(-32700);
  });

  it("DELETE 终止后无会话头请求 → 400 initialize first（区分失效 id 的 404）", async () => {
    const t2 = new StreamableHttpTransport({ port: 0 });
    const engine = new I18nEngine({ locale: "en" });
    const server = new MCPServer({ name: "t3", version: "1", transport: t2 as never });
    registerI18nTools(server, engine);
    await server.start();
    const p = t2.address().port;
    const init = await fetch(`http://127.0.0.1:${p}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) });
    const sid = init.headers.get("mcp-session-id")!;
    await fetch(`http://127.0.0.1:${p}/mcp`, { method: "DELETE", headers: { "mcp-session-id": sid } });
    const after = await fetch(`http://127.0.0.1:${p}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }) });
    expect(after.status).toBe(400);
    expect(((await after.json()) as any).error.code).toBe(-32000);
    await t2.close();
  });

  it("address()/getSessionId() 在未 start 实例上走回退分支", () => {
    const fresh = new StreamableHttpTransport({ port: 3456 });
    expect(fresh.address()).toEqual({ port: 3456, host: "127.0.0.1" });
    expect(fresh.getSessionId()).toBeNull();
  });
});

// ============================================================
// End of streamable-http-branches.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
