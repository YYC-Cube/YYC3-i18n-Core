// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file quality-report.ts
 * description MCP 工具 quality_report — 键级覆盖报告
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

export function createQualityReportTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "quality_report",
      description: "Generate translation quality report",
      inputSchema: {
        type: "object",
        properties: {
          keys: { type: "string", description: "JSON array of keys to check" },
        },
      },
    },
    handler: async (args) => {
      const keys = (args.keys as string[]) ?? [];
      const results = keys.map((key) => ({
        key,
        value: engine.t(key),
        locale: engine.getLocale(),
        hasFallback: engine.t(key) === key,
      }));

      const missingCount = results.filter((r) => r.hasFallback).length;

      return {
        content: [{
          type: "text",
          text: JSON.stringify(
            {
              total: results.length,
              missing: missingCount,
              coverage: results.length > 0 ? ((1 - missingCount / results.length) * 100).toFixed(1) + "%" : "N/A",
              results,
            },
            null,
            2,
          ),
        }],
      };
    },
  };
}

// ============================================================
// End of quality-report.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
