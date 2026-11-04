// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file export-formats.ts
 * description MCP 工具 export_formats — 多格式导出（JSON/CSV/YAML-lite）
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
 *
 * brief 零依赖序列化：JSON 原生；CSV 自实现（RFC 4180 引号转义）；
 *       YAML 输出扁平 key: value 流（键含特殊字符时自动转 JSON 行内格式）
 */
import { flattenTranslations, type ToolDeps, type ToolDefinition } from "./shared.js";

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

function toCsv(flat: Record<string, string>): string {
  const rows = ["key,value"];
  for (const [k, v] of Object.entries(flat)) rows.push(`${csvEscape(k)},${csvEscape(v)}`);
  return rows.join("\n");
}

function toYamlFlat(flat: Record<string, string>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(flat)) {
    const safeKey = /^[\w.-]+$/.test(k) ? k : JSON.stringify(k);
    const safeVal = /^[\w\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af .,!?%()\[\]:@/+\\-]+$/.test(v) ? v : JSON.stringify(v);
    lines.push(`${safeKey}: ${safeVal}`);
  }
  return lines.join("\n");
}

export function createExportFormatsTool({ engine }: ToolDeps): ToolDefinition {
  return {
    tool: {
      name: "export_formats",
      description: "Export a locale's translations as JSON, CSV, or flat YAML",
      inputSchema: {
        type: "object",
        properties: {
          locale: { type: "string", description: "Locale to export" },
          format: { type: "string", enum: ["json", "csv", "yaml"], description: "Output format (default json)" },
        },
        required: ["locale"],
      },
    },
    handler: async (args) => {
      const locale = String(args.locale);
      const format = String(args.format ?? "json").toLowerCase();
      const translations = engine.getTranslations(locale as never);
      if (!translations) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Locale not loaded: ${locale}` }) }],
        };
      }

      const flat = flattenTranslations(translations as Record<string, unknown>);
      let payload: string;
      let contentType: string;
      switch (format) {
        case "csv":
          payload = toCsv(flat);
          contentType = "text/csv";
          break;
        case "yaml":
          payload = toYamlFlat(flat);
          contentType = "text/yaml";
          break;
        default:
          payload = JSON.stringify(translations, null, 2);
          contentType = "application/json";
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ locale, format: contentType, content: payload }, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of export-formats.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
