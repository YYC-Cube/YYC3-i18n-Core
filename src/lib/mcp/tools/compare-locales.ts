// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file compare-locales.ts
 * description MCP 工具 compare_locales — 双语言键差异矩阵
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [module],[mcp],[tool]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 */
import { flattenTranslations, type ToolDeps, type ToolDefinition } from "./shared.js";

export function createCompareLocalesTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "compare_locales",
      description: "Compare translation key sets between two locales (missing/extra matrix)",
      inputSchema: {
        type: "object",
        properties: {
          localeA: { type: "string", description: "First locale (baseline)" },
          localeB: { type: "string", description: "Second locale" },
        },
        required: ["localeA", "localeB"],
      },
    },
    handler: async (args) => {
      const a = String(args.localeA);
      const b = String(args.localeB);
      const flatA = flattenTranslations((engine.getTranslations(a as never) ?? {}) as Record<string, unknown>);
      const flatB = flattenTranslations((engine.getTranslations(b as never) ?? {}) as Record<string, unknown>);

      const keysA = new Set(Object.keys(flatA));
      const keysB = new Set(Object.keys(flatB));
      const missingInB = [...keysA].filter((k) => !keysB.has(k)).sort();
      const missingInA = [...keysB].filter((k) => !keysA.has(k)).sort();
      const common = [...keysA].filter((k) => keysB.has(k)).sort();
      const valueDiff = common.filter((k) => flatA[k] === flatB[k]);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(
            {
              localeA: a,
              localeB: b,
              counts: { a: keysA.size, b: keysB.size, common: common.length },
              missingInB,
              missingInA,
              identicalValues: valueDiff,
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
// End of compare-locales.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
