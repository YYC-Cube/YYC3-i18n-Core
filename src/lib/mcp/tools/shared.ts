// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file shared.ts
 * description MCP 工具共享 helper — 翻译树扁平化
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-04-24
 * updated 2026-11-04
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief MCP 工具间共享的翻译树扁平化
 */
export function flattenTranslations(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") {
      Object.assign(result, flattenTranslations(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

/** t() 调用键提取正则（与 cli-integration extractKeys 单源同款）。 */
export const KEY_PATTERN = /\bt\(\s*['"`]([^'"`]+)['"`]/g;

export type { MCPTool, MCPToolResult } from "../types.js";
import type { MCPTool, MCPToolResult } from "../types.js";
import type { I18nEngine } from "../../engine.js";

/** 单个 MCP 工具定义：声明 + 处理器。 */
export interface ToolDefinition {
  tool: MCPTool;
  handler: (args: Record<string, unknown>) => Promise<MCPToolResult>;
}

/** 工具工厂依赖：引擎 + 可选术语表（glossary_lookup 使用）。 */
export interface ToolDeps {
  engine: I18nEngine;
  glossary?: import("../../glossary.js").Glossary;
}

// ============================================================
// End of shared.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
