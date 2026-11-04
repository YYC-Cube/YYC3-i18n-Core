// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file streamable-http-transport.ts
 * description Streamable HTTP 传输 — MCP 规范 2025-03-26 现行标准（零依赖 node:http）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [module],[mcp],[transport]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 单端点 POST（JSON-RPC 单消息或数组）→ application/json 响应；
 *       Mcp-Session-Id 会话管理（initialize 建立、DELETE 终止）；
 *       Origin 校验防 DNS rebinding；GET 返回 405（本实现不提供
 *       server-initiated 流，规范允许 server MAY NOT）；响应统一 JSON
 *       模式（规范允许 server MAY return application/json or SSE）。
 *       安全边界：单会话模型（一个 HTTP 实例承载一个活跃 MCP 会话）。
 */
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { MCPMessage } from "./types.js";

export interface StreamableHttpTransportConfig {
  port?: number;
  host?: string;
  /** 端点路径（默认 /mcp） */
  endpoint?: string;
  /** 允许的 Origin 列表；未配置 = 不校验（本地回环场景） */
  corsOrigins?: string[];
}

interface SessionState {
  id: string;
}

function randomSessionId(): string {
  return `mcp-session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class StreamableHttpTransport {
  private messageHandler: ((message: MCPMessage) => void) | null = null;
  private server: http.Server | null = null;
  private session: SessionState | null = null;
  /** 当前 POST 请求的响应收集（dispatch 与 send 之间的桥） */
  private pendingResponses: MCPMessage[] = [];

  constructor(private readonly config: StreamableHttpTransportConfig = {}) {}

  onMessage(handler: (message: MCPMessage) => void): void {
    this.messageHandler = handler;
  }

  /** JSON-RPC 响应回传：由 MCPServer 在消息处理中调用，暂存至当前请求缓冲。 */
  async send(message: MCPMessage): Promise<void> {
    this.pendingResponses.push(message);
  }

  async start(): Promise<void> {
    const endpoint = this.config.endpoint ?? "/mcp";
    this.server = http.createServer((req, res) => {
      void this.handleRequest(req, res, endpoint).catch(() => {
        if (!res.headersSent) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Internal transport error" } }));
        }
        res.end();
      });
    });

    const port = this.config.port ?? 0;
    const host = this.config.host ?? "127.0.0.1";
    const srv = this.server;
    await new Promise<void>((resolve) => {
      srv.listen(port, host, () => resolve());
    });
  }

  /** MCPServer.start() 契约别名。 */
  async connect(): Promise<void> {
    await this.start();
  }

  /** 实际监听地址（start 后可用）。 */
  address(): { port: number; host: string } {
    const addr = this.server?.address() as AddressInfo | null;
    return addr ? { port: addr.port, host: addr.address } : { port: Number(this.config.port ?? 0), host: this.config.host ?? "127.0.0.1" };
  }

  getSessionId(): string | null {
    return this.session?.id ?? null;
  }

  async close(): Promise<void> {
    this.session = null;
    this.pendingResponses = [];
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    this.server = null;
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse, endpoint: string): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname !== endpoint) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    // 安全：Origin 校验（防 DNS rebinding；规范建议）
    const origins = this.config.corsOrigins;
    const origin = req.headers.origin;
    if (origins && origins.length > 0 && origin && !origins.includes(origin)) {
      res.writeHead(403, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Origin not allowed" }));
      return;
    }

    if (req.method === "GET") {
      // 规范：不提供 server-initiated 流的 server 应返回 405
      res.writeHead(405, { allow: "POST, DELETE" });
      res.end();
      return;
    }

    if (req.method === "DELETE") {
      this.session = null;
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method !== "POST") {
      res.writeHead(405, { allow: "POST, DELETE, GET" });
      res.end();
      return;
    }

    const body = await this.readBody(req);
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" } }));
      return;
    }

    const messages: MCPMessage[] = Array.isArray(parsed) ? (parsed as MCPMessage[]) : [parsed as MCPMessage];
    if (messages.length === 0) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid Request: empty batch" } }));
      return;
    }

    // 会话管理：initialize 总是建立新会话（单会话模型下的客户端接入/重置语义）；
    // 已存在会话时，非 initialize 请求必须携带匹配 Mcp-Session-Id
    const isInitialize = messages.some((m) => m.method === "initialize");
    const clientSession = req.headers["mcp-session-id"] as string | undefined;

    if (isInitialize) {
      this.session = { id: randomSessionId() };
    } else if (this.session && !clientSession) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Bad Request: Mcp-Session-Id header required" } }));
      return;
    } else if (this.session && clientSession !== this.session.id) {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32001, message: "Session not found" } }));
      return;
    } else if (!this.session && !isInitialize) {
      // 无活跃会话：携带了 session-id 视为失效会话（404 可触发客户端重新 initialize）；完全未携带 → 400
      const code = clientSession ? -32001 : -32000;
      const message = clientSession ? "Session not found" : "Bad Request: initialize first";
      res.writeHead(clientSession ? 404 : 400, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message } }));
      return;
    }

    // 分发并收集响应
    this.pendingResponses = [];
    for (const message of messages) {
      await this.messageHandler?.(message);
    }

    const activeSession = this.session;
    if (!activeSession) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Internal error: session missing" } }));
      return;
    }
    res.setHeader("Mcp-Session-Id", activeSession.id);
    if (this.pendingResponses.length === 0) {
      // 仅通知（无 id 消息）→ 202 Accepted 无正文
      res.writeHead(202);
      res.end();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(this.pendingResponses.length === 1 ? this.pendingResponses[0] : this.pendingResponses));
    this.pendingResponses = [];
  }

  private readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk: Buffer) => {
        data += chunk.toString("utf8");
      });
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }
}

// ============================================================
// End of streamable-http-transport.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
