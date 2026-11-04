// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file add-translation-key.ts
 * description MCP 工具 add_translation_key — 新增翻译键
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

export function createAddTranslationKeyTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "add_translation_key",
      description: "Add a new translation key with value",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Translation key" },
          value: { type: "string", description: "Translation value" },
          locale: { type: "string", description: "Target locale" },
        },
        required: ["key", "value", "locale"],
      },
    },
    handler: async (args) => {
      const key = String(args.key);
      const value = String(args.value);
      const locale = String(args.locale);

      engine.registerTranslation(locale as never, { [key]: value });

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, key, value, locale }) }],
      };
    },
  };
}

// ============================================================
// End of add-translation-key.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
