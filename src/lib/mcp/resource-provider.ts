// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file resource-provider.ts
 * description MCP 动态资源读取器合同 — Resources 原语的内容提供方（v3.2.0）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief uri 模板（如 locales://{locale}）由 canRead 判定、read 提供内容；
 *       抛错将映射为 JSON-RPC -32602 资源读取失败
 */
export interface MCPResourceContent {
  text: string;
  mimeType?: string;
}

export interface MCPResourceProvider {
  /** 是否有能力读取该 uri（模板匹配/前缀判定）。 */
  canRead(uri: string): boolean;
  /** 读取内容；抛错映射为 JSON-RPC 资源读取失败。 */
  read(uri: string): Promise<MCPResourceContent> | MCPResourceContent;
}

// ============================================================
// End of resource-provider.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
