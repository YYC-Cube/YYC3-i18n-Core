// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file quality-score.ts
 * description MCP 工具 quality_score — 翻译质量评分（QualityEstimator 协议化）
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
import { QualityEstimator } from "../../ai/quality-estimator.js";
import type { ToolDeps, ToolDefinition } from "./shared.js";

export function createQualityScoreTool(_deps: ToolDeps): ToolDefinition {
  const estimator = new QualityEstimator();
  return {
    tool: {
      name: "quality_score",
      description: "Score translation quality (rule-based estimator: placeholders, empty, length, terminology)",
      inputSchema: {
        type: "object",
        properties: {
          sourceText: { type: "string", description: "Source text" },
          translatedText: { type: "string", description: "Translated text" },
          sourceLocale: { type: "string", description: "Source locale" },
          targetLocale: { type: "string", description: "Target locale" },
        },
        required: ["sourceText", "translatedText", "sourceLocale", "targetLocale"],
      },
    },
    handler: async (args) => {
      const result = estimator.estimate({
        sourceText: String(args.sourceText),
        translatedText: String(args.translatedText),
        sourceLocale: String(args.sourceLocale),
        targetLocale: String(args.targetLocale),
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of quality-score.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
