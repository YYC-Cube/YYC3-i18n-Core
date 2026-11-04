// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file check-missing-keys.ts
 * description MCP 工具 check_missing_keys — 跨语言缺失键检查
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
import { flattenTranslations, type ToolDeps, type ToolDefinition } from "./shared.js";

export function createCheckMissingKeysTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "check_missing_keys",
      description: "Check for missing translation keys across locales",
      inputSchema: {
        type: "object",
        properties: {
          locale: { type: "string", description: "Locale to check" },
        },
        required: ["locale"],
      },
    },
    handler: async (args) => {
      const targetLocale = String(args.locale);
      const stats = engine.getStats();
      const missingKeys: Array<{ key: string; inLocale: string; missingIn: string }> = [];

      const sourceTranslations = engine.getTranslations(stats.locale as never);
      const targetTranslations = engine.getTranslations(targetLocale as never);

      if (sourceTranslations && targetTranslations) {
        const flatSource = flattenTranslations(sourceTranslations);
        const flatTarget = flattenTranslations(targetTranslations);
        for (const key of Object.keys(flatSource)) {
          if (!(key in flatTarget)) {
            missingKeys.push({ key, inLocale: stats.locale, missingIn: targetLocale });
          }
        }
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            sourceLocale: stats.locale,
            targetLocale,
            loadedLocales: stats.loadedLocales,
            missingKeys,
            missingCount: missingKeys.length,
          }),
        }],
      };
    },
  };
}

// ============================================================
// End of check-missing-keys.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
