// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file server.ts
 * description MCP 服务端实现
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 服务端实现
 */
import { logger } from "../infra/logger.js";
import type { MCPResourceProvider } from "./resource-provider.js";
import type {
  MCPMessage,
  MCPResource,
  MCPServerCapabilities,
  MCPServerConfig,
  MCPServerInfo,
  MCPTool,
  MCPToolResult,
  MCPTransport,
} from "./types.js";

export type ToolHandler = (args: Record<string, unknown>) => Promise<MCPToolResult>;

export interface MCPToolRegistration {
  tool: MCPTool;
  handler: ToolHandler;
}

export class MCPServer {
  private config: MCPServerConfig;
  private transport: MCPTransport;
  private toolRegistrations = new Map<string, MCPToolRegistration>();
  private resources: MCPResource[] = [];
  private resourceProviders: MCPResourceProvider[] = [];

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.transport = config.transport;
  }

  registerTool(tool: MCPTool, handler: ToolHandler): void {
    this.toolRegistrations.set(tool.name, { tool, handler });
    logger.info(`MCP tool registered: "${tool.name}"`);
  }

  registerResource(resource: MCPResource): void {
    this.resources.push(resource);
  }

  /**
   * 注册动态资源读取器（v3.2.0）：uri 匹配 canRead 即由 provider 提供内容，
   * 未命中 provider 的 uri 回落静态 resources 表。i18n-tools 以此暴露
   * locales://{locale} 与 coverage://report。
   */
  registerResourceProvider(provider: MCPResourceProvider): void {
    this.resourceProviders.push(provider);
  }

  getTools(): MCPTool[] {
    return Array.from(this.toolRegistrations.values()).map((r) => r.tool);
  }

  /** 读取已注册工具的处理器（tool-registry 消费端/测试入口）。 */
  getToolHandler(name: string): ToolHandler | undefined {
    return this.toolRegistrations.get(name)?.handler;
  }

  getResources(): MCPResource[] {
    return [...this.resources];
  }

  async start(): Promise<void> {
    this.transport.onMessage((message: MCPMessage) => {
      this.handleMessage(message).catch((error) => {
        logger.error(`MCP message handling error: ${error}`);
      });
    });

    await this.transport.connect();
    logger.info(`MCP Server "${this.config.name}" v${this.config.version} started`);
  }

  private async handleMessage(message: MCPMessage): Promise<void> {
    if (message.method) {
      switch (message.method) {
        case "initialize":
          await this.handleInitialize(message);
          break;
        case "notifications/initialized":
          break;
        case "tools/list":
          await this.sendResponse(message.id, { tools: this.getTools() });
          break;
        case "tools/call":
          await this.handleToolCall(message);
          break;
        case "resources/list":
          await this.sendResponse(message.id, { resources: this.resources });
          break;
        case "resources/read":
          await this.handleResourceRead(message);
          break;
        case "ping":
          await this.sendResponse(message.id, {});
          break;
        default:
          await this.sendError(message.id, -32601, `Method not found: ${message.method}`);
      }
    }
  }

  private async handleInitialize(message: MCPMessage): Promise<void> {
    const requested = (message.params as { protocolVersion?: string } | undefined)?.protocolVersion;
    // 版本协商：客户端请求的版本受支持则回显，否则回落服务端支持版本（规范语义）
    const SUPPORTED_PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26"];
    const protocolVersion = requested && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : "2024-11-05";

    const serverInfo: MCPServerInfo = {
      name: this.config.name,
      version: this.config.version,
      protocolVersion,
    };

    const capabilities: MCPServerCapabilities = {
      tools: { listChanged: false },
      resources: { subscribe: false, listChanged: false },
    };

    await this.sendResponse(message.id, {
      protocolVersion,
      capabilities,
      serverInfo,
    });
  }

  private async handleToolCall(message: MCPMessage): Promise<void> {
    const params = message.params ?? {};
    const toolName = params.name as string;
    const args = (params.arguments as Record<string, unknown>) ?? {};

    const registration = this.toolRegistrations.get(toolName);
    if (!registration) {
      await this.sendError(message.id, -32602, `Unknown tool: ${toolName}`);
      return;
    }

    try {
      const result = await registration.handler(args);
      await this.sendResponse(message.id, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.sendResponse(message.id, {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      });
    }
  }

  private async handleResourceRead(message: MCPMessage): Promise<void> {
    const params = message.params ?? {};
    const uri = params.uri as string;

    // v3.2.0：动态 provider 优先（模板 URI 如 locales://{locale}）
    for (const provider of this.resourceProviders) {
      if (!provider.canRead(uri)) continue;
      try {
        const content = await provider.read(uri);
        await this.sendResponse(message.id, {
          contents: [{ uri, mimeType: content.mimeType ?? "application/json", text: content.text }],
        });
      } catch (error) {
        await this.sendError(message.id, -32602, `Resource read failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    const resource = this.resources.find((r) => r.uri === uri);

    if (!resource) {
      await this.sendError(message.id, -32602, `Resource not found: ${uri}`);
      return;
    }

    await this.sendResponse(message.id, {
      contents: [{ uri, mimeType: resource.mimeType ?? "text/plain", text: "" }],
    });
  }

  private async sendResponse(
    id: string | number | undefined,
    result: unknown
  ): Promise<void> {
    if (id === undefined) return;
    const response: MCPMessage = { jsonrpc: "2.0", id, result };
    await this.transport.send(response);
  }

  private async sendError(
    id: string | number | undefined,
    code: number,
    message: string
  ): Promise<void> {
    if (id === undefined) return;
    const response: MCPMessage = {
      jsonrpc: "2.0",
      id,
      error: { code, message },
    };
    await this.transport.send(response);
  }

  async stop(): Promise<void> {
    await this.transport.close();
    logger.info(`MCP Server "${this.config.name}" stopped`);
  }
}

// 3.2.2：./mcp 子路径聚合出口——Streamable HTTP 传输随子路径直达（此前仅能从
// 深层文件路径导入，registry 冒烟暴露的导出面遗漏）
export { StreamableHttpTransport } from "./streamable-http-transport.js";
export type { StreamableHttpTransportConfig } from "./streamable-http-transport.js";

// 3.2.3：工具集聚合出口补齐（同类遗漏第二次发现——新建公共模块必须同步聚合出口）
export { registerI18nTools } from "./i18n-tools.js";
export type { RegisterI18nToolsOptions } from "./i18n-tools.js";

// 3.3.0：编程调用面聚合（501 G3——技能脚本直连入口，随建随聚合）
export { createI18nToolkit, toolNamesForCapability } from "./toolkit.js";
export type { I18nToolkit, I18nToolkitOptions } from "./toolkit.js";
export { buildI18nTools } from "./i18n-tools.js";

// ============================================================
// End of server.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
