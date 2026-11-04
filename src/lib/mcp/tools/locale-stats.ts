// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file locale-stats.ts
 * description MCP 工具 get_locale_stats — 全语言翻译统计
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-04-24
 * updated 2026-11-04
 * status active
 * tags [module],[mcp],[tool]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 */
import type { ToolDeps, ToolDefinition } from "./shared.js";

export function createLocaleStatsTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "get_locale_stats",
      description: "Get translation statistics for all locales",
      inputSchema: { type: "object", properties: {} },
    },
    handler: async () => {
      const stats = engine.getStats();
      return {
        content: [{ type: "text", text: JSON.stringify(stats, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of locale-stats.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
