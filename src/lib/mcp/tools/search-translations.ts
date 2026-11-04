// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file search-translations.ts
 * description MCP 工具 search_translations — 跨语言模糊搜索翻译键与值
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

export function createSearchTranslationsTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "search_translations",
      description: "Fuzzy search translation keys across all locales",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (key or value)" },
          locale: { type: "string", description: "Optional locale filter" },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const query = String(args.query).toLowerCase();
      const stats = engine.getStats();
      const matches: Array<{ key: string; value: string; locale: string }> = [];

      for (const loadedLocale of stats.loadedLocales) {
        if (args.locale && loadedLocale !== String(args.locale)) continue;
        const translations = engine.getTranslations(loadedLocale as never);
        if (!translations) continue;
        const flat = flattenTranslations(translations as Record<string, unknown>);
        for (const [key, value] of Object.entries(flat)) {
          if (key.toLowerCase().includes(query) || value.toLowerCase().includes(query)) {
            matches.push({ key, value, locale: loadedLocale });
          }
        }
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ query, matches, count: matches.length }, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of search-translations.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
