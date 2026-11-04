// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file set-locale.ts
 * description MCP 工具 set_locale — 切换活跃语言
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

export function createSetLocaleTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "set_locale",
      description: "Change the active locale",
      inputSchema: {
        type: "object",
        properties: {
          locale: { type: "string", description: "New locale to set" },
        },
        required: ["locale"],
      },
    },
    handler: async (args) => {
      const locale = String(args.locale);
      const oldLocale = engine.getLocale();
      await engine.setLocale(locale as never);

      return {
        content: [{ type: "text", text: JSON.stringify({ previousLocale: oldLocale, currentLocale: engine.getLocale() }) }],
      };
    },
  };
}

// ============================================================
// End of set-locale.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
