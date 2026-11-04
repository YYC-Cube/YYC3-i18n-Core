// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file streamable-http.test.ts
 * description Streamable HTTP 传输一致性测试 — JSON-RPC 全流程（MCP 2025-03-26）
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
let baseUrl = "";

async function post(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; json: any; headers: Headers }> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined, headers: res.headers };
}

const INIT = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } } };

beforeAll(async () => {
  transport = new StreamableHttpTransport({ port: 0 });
  const engine = new I18nEngine({ locale: "en" });
  engine.registerTranslation("zh-CN", { nav: { home: "首页" } });
  const server = new MCPServer({ name: "i18n-test", version: "3.2.0", transport: transport as never });
  registerI18nTools(server, engine);
  await server.start();
  const addr = transport.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await transport.close();
});

describe("Streamable HTTP — 会话建立", () => {
  it("initialize → 200 + Mcp-Session-Id + serverInfo", async () => {
    const r = await post("/mcp", INIT);
    expect(r.status).toBe(200);
    expect(r.headers.get("mcp-session-id")).toBeTruthy();
    expect(r.json.result.serverInfo.name).toBe("i18n-test");
    expect(r.json.result.protocolVersion).toBe("2025-03-26");
  });

  it("已建立会话后，无 Mcp-Session-Id 的请求 → 400", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", id: 2, method: "ping" });
    expect(r.status).toBe(400);
    expect(r.json.error.code).toBe(-32000);
  });

  it("错误的 Mcp-Session-Id → 404 Session not found", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", id: 3, method: "ping" }, { "mcp-session-id": "bogus" });
    expect(r.status).toBe(404);
    expect(r.json.error.code).toBe(-32001);
  });
});

describe("Streamable HTTP — 工具与资源（带会话全链路）", () => {
  let sessionId = "";
  it("建立会话", async () => {
    const r = await post("/mcp", INIT);
    sessionId = r.headers.get("mcp-session-id")!;
    expect(sessionId).toBeTruthy();
  });

  it("tools/list 返回 13 工具（7 存量 + 6 新增）", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", id: 10, method: "tools/list" }, { "mcp-session-id": sessionId });
    const names = r.json.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toContain("search_translations");
    expect(names).toContain("extract_keys");
    expect(names).toContain("compare_locales");
    expect(names).toContain("quality_score");
    expect(names).toContain("auto_fix_icu");
    expect(names).toContain("export_formats");
    expect(names).toContain("glossary_lookup");
    expect(names.length).toBe(13);
  });

  it("tools/call extract_keys 端到端可用", async () => {
    const r = await post("/mcp", {
      jsonrpc: "2.0", id: 11, method: "tools/call",
      params: { name: "extract_keys", arguments: { code: "t('nav.home')" } },
    }, { "mcp-session-id": sessionId });
    const payload = JSON.parse(r.json.result.content[0].text);
    expect(payload.keys).toEqual(["nav.home"]);
  });

  it("resources/read locales://en 走 HTTP", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", id: 12, method: "resources/read", params: { uri: "locales://en" } }, { "mcp-session-id": sessionId });
    const payload = JSON.parse(r.json.result.contents[0].text);
    expect(payload.locale).toBe("en");
  });

  it("ping → 空结果", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", id: 13, method: "ping" }, { "mcp-session-id": sessionId });
    expect(r.status).toBe(200);
    expect(r.json.result).toEqual({});
  });

  it("仅通知（无 id）→ 202 无正文", async () => {
    const r = await post("/mcp", { jsonrpc: "2.0", method: "notifications/initialized" }, { "mcp-session-id": sessionId });
    expect(r.status).toBe(202);
    expect(r.json).toBeUndefined();
  });
});

describe("Streamable HTTP — 安全与其他", () => {
  let sid = "";
  it("新实例 Origin 校验：不在白名单 → 403", async () => {
    const t2 = new StreamableHttpTransport({ port: 0, corsOrigins: ["https://allowed.example"] });
    const engine = new I18nEngine({ locale: "en" });
    const server = new MCPServer({ name: "t2", version: "1", transport: t2 as never });
    registerI18nTools(server, engine);
    await server.start();
    const { port } = t2.address();
    const blocked = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      body: JSON.stringify(INIT),
    });
    expect(blocked.status).toBe(403);
    const allowed = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://allowed.example" },
      body: JSON.stringify(INIT),
    });
    expect(allowed.status).toBe(200);
    sid = allowed.headers.get("mcp-session-id")!;
    await fetch(`http://127.0.0.1:${port}/mcp`, { method: "DELETE", headers: { "mcp-session-id": sid } });
    await t2.close();
  });

  it("DELETE 终止会话后原会话 id 失效 → 404", async () => {
    const r1 = await post("/mcp", INIT);
    const s = r1.headers.get("mcp-session-id")!;
    const del = await fetch(`${baseUrl}/mcp`, { method: "DELETE", headers: { "mcp-session-id": s } });
    expect(del.status).toBe(204);
    const r2 = await post("/mcp", { jsonrpc: "2.0", id: 20, method: "ping" }, { "mcp-session-id": s });
    expect(r2.status).toBe(404);
  });

  it("非法 JSON → 400 Parse error；GET → 405；未知路径 → 404", async () => {
    const bad = await fetch(`${baseUrl}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{not json" });
    expect(bad.status).toBe(400);
    const get = await fetch(`${baseUrl}/mcp`);
    expect(get.status).toBe(405);
    const nf = await fetch(`${baseUrl}/other`, { method: "POST", body: "{}" });
    expect(nf.status).toBe(404);
  });
});

// ============================================================
// End of streamable-http.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
