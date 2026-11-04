// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file translate-key.ts
 * description MCP 工具 translate_key — 读取指定键翻译（含插值）
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

export function createTranslateKeyTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "translate_key",
      description: "Get translation for a specific key",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Translation key" },
          locale: { type: "string", description: "Target locale" },
          params: { type: "object", description: "Interpolation parameters" },
        },
        required: ["key"],
      },
    },
    handler: async (args) => {
      const key = String(args.key);
      const params = args.params as Record<string, string> | undefined;
      const result = engine.t(key, params);

      return {
        content: [{ type: "text", text: JSON.stringify({ key, value: result, locale: engine.getLocale() }) }],
      };
    },
  };
}

// ============================================================
// End of translate-key.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
