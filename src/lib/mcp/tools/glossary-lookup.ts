// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file glossary-lookup.ts
 * description MCP 工具 glossary_lookup — 术语表精确/前缀/全量译法查询
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
import type { ToolDeps, ToolDefinition } from "./shared.js";

export function createGlossaryLookupTool({ glossary }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "glossary_lookup",
      description: "Look up enforced terminology (exact/prefix/all translations for a locale)",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["exact", "prefix", "locale"], description: "Lookup mode" },
          term: { type: "string", description: "Term to look up (exact/prefix modes)" },
          locale: { type: "string", description: "Locale (locale mode: list all enforced translations)" },
        },
        required: ["mode"],
      },
    },
    handler: async (args) => {
      if (!glossary) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "No glossary configured — pass one via registerI18nTools options" }) }],
        };
      }

      const mode = String(args.mode);
      let body: Record<string, unknown>;
      switch (mode) {
        case "exact":
          body = { mode, entry: glossary.lookup(String(args.term ?? "")) ?? null };
          break;
        case "prefix":
          body = { mode, entries: glossary.search(String(args.term ?? "")) };
          break;
        case "locale":
          body = { mode, locale: String(args.locale ?? ""), translations: glossary.translationsFor(String(args.locale ?? "")) };
          break;
        default:
          body = { error: `Unknown mode: ${mode}` };
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ size: glossary.size(), ...body }, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of glossary-lookup.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
