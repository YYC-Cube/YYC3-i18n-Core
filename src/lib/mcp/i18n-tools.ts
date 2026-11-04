// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file i18n-tools.ts
 * description MCP i18n 工具集聚合入口 — tool-registry 模式（每工具一文件，见 ./tools/）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.2.0
 * created 2026-04-24
 * updated 2026-11-04
 * status active
 * tags [module],[mcp]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief registerI18nTools(server, engine, options?) 公共签名不变；
 *       3.2.0 起工具面 7→13（501 方案 G2），术语表经 options 注入
 */
import type { I18nEngine } from "../engine.js";
import type { Glossary } from "../glossary.js";
import type { MCPServer } from "./server.js";
import { createAddTranslationKeyTool } from "./tools/add-translation-key.js";
import { createAutoFixIcuTool } from "./tools/auto-fix-icu.js";
import { createCheckMissingKeysTool } from "./tools/check-missing-keys.js";
import { createCompareLocalesTool } from "./tools/compare-locales.js";
import { createExportFormatsTool } from "./tools/export-formats.js";
import { createExtractKeysTool } from "./tools/extract-keys.js";
import { createGlossaryLookupTool } from "./tools/glossary-lookup.js";
import { createLocaleStatsTool } from "./tools/locale-stats.js";
import { createQualityReportTool } from "./tools/quality-report.js";
import { createQualityScoreTool } from "./tools/quality-score.js";
import { createSearchTranslationsTool } from "./tools/search-translations.js";
import { createSetLocaleTool } from "./tools/set-locale.js";
import type { ToolDeps, ToolDefinition } from "./tools/shared.js";
import { createTranslateKeyTool } from "./tools/translate-key.js";

export interface RegisterI18nToolsOptions {
  /** 术语表注入后启用 glossary_lookup 工具的完整查询能力 */
  glossary?: Glossary;
}

/**
 * 构造全部 13 个 i18n 工具定义——registerI18nTools（MCP 面）与
 * createI18nToolkit（编程面）的单一事实源（501 G3）。
 */
export function buildI18nTools(deps: ToolDeps): ToolDefinition[] {
  return [
    // 存量 7 工具（行为保持，tests/mcp 保护）
    createSearchTranslationsTool(deps),
    createAddTranslationKeyTool(deps),
    createTranslateKeyTool(deps),
    createCheckMissingKeysTool(deps),
    createLocaleStatsTool(deps),
    createSetLocaleTool(deps),
    createQualityReportTool(deps),
    // 3.2.0 新增（501 方案 G2）
    createExtractKeysTool(),
    createCompareLocalesTool(deps),
    createQualityScoreTool(deps),
    createAutoFixIcuTool(),
    createExportFormatsTool(deps),
    createGlossaryLookupTool(deps),
  ];
}

export function registerI18nTools(server: MCPServer, engine: I18nEngine, options: RegisterI18nToolsOptions = {}): void {
  const deps: ToolDeps = { engine, glossary: options.glossary };

  for (const { tool, handler } of buildI18nTools(deps)) {
    server.registerTool(tool, handler);
  }

  registerI18nResources(server, engine);
}

/**
 * Resources 面（501 G2.4）：locales://{locale} 语言包只读资源 +
 * coverage://report 覆盖率快照。模板 URI 经 provider 动态读取。
 */
function registerI18nResources(server: MCPServer, engine: I18nEngine): void {
  server.registerResource({ uri: "locales://{locale}", name: "Locale translations", description: "Read-only translations of a loaded locale", mimeType: "application/json" });
  server.registerResource({ uri: "coverage://report", name: "Coverage report", description: "Missing-key snapshot of all loaded locales", mimeType: "application/json" });

  server.registerResourceProvider({
    canRead: (uri) => uri.startsWith("locales://") || uri === "coverage://report",
    read: async (uri) => {
      if (uri === "coverage://report") {
        const stats = engine.getStats();
        const sourceFlat = flattenAll(engine.getTranslations(stats.locale as never));
        const perLocale = stats.loadedLocales
          .filter((l) => l !== stats.locale)
          .map((l) => {
            const flat = flattenAll(engine.getTranslations(l as never));
            const missing = Object.keys(sourceFlat).filter((k) => !(k in flat));
            return { locale: l, sourceKeys: Object.keys(sourceFlat).length, missingCount: missing.length, missing };
          });
        return { text: JSON.stringify({ sourceLocale: stats.locale, loadedLocales: stats.loadedLocales, perLocale }, null, 2) };
      }

      const locale = decodeURIComponent(uri.slice("locales://".length));
      const translations = engine.getTranslations(locale as never);
      if (!translations) throw new Error(`Locale not loaded: ${locale}`);
      return { text: JSON.stringify({ locale, translations }, null, 2) };
    },
  });
}

function flattenAll(obj: Record<string, unknown> | undefined, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(out, flattenAll(v as Record<string, unknown>, key));
    else out[key] = String(v);
  }
  return out;
}

// ============================================================
// End of i18n-tools.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
