// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file toolkit.ts
 * description MCP i18n 工具编程调用面 — 技能脚本与宿主嵌入的零传输直连入口
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.3.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[mcp],[skill]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief createI18nToolkit(engine, options?) 返回 13 工具的编程调用面；
 *       与 registerI18nTools 共用 buildI18nTools 单一事实源（501 G3）
 */
import type { I18nEngine } from "../engine.js";
import type { Glossary } from "../glossary.js";
import type { Capability } from "../plugins.js";
import { buildI18nTools } from "./i18n-tools.js";
import type { ToolDefinition } from "./tools/shared.js";
import type { MCPTool } from "./types.js";

export interface I18nToolkitOptions {
  /** 术语表注入后启用 glossary_lookup 工具的完整查询能力 */
  glossary?: Glossary;
}

export interface I18nToolkit {
  /** 13 个工具声明（name/description/inputSchema）——供索引与校验。 */
  readonly tools: readonly MCPTool[];
  /** 工具名清单（排序稳定，来自构造序）。 */
  list(): string[];
  /**
   * 直连调用工具（不经传输层）：返回首个 text 内容的 JSON 解析结果。
   * 未知工具名 reject（错误信息附可用工具清单）；工具内部异常原样冒泡。
   */
  call<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;
}

/** 能力 → MCP 工具名映射（技能包发现语义；插件层能力返回空数组）。 */
const CAPABILITY_TOOLS: Readonly<Record<Capability, readonly string[]>> = Object.freeze({
  extract: Object.freeze(["extract_keys"]),
  audit: Object.freeze(["check_missing_keys", "compare_locales", "get_locale_stats"]),
  translate: Object.freeze(["translate_key", "add_translation_key", "search_translations"]),
  quality: Object.freeze(["quality_score", "quality_report", "glossary_lookup"]),
  icu: Object.freeze(["auto_fix_icu"]),
  setup: Object.freeze(["set_locale"]),
  export: Object.freeze(["export_formats"]),
  glossary: Object.freeze(["glossary_lookup"]),
  reporting: Object.freeze([]),
  performance: Object.freeze([]),
  logging: Object.freeze([]),
  "audit-trail": Object.freeze([]),
});

/** 查询能力对应的 MCP 工具名（不在词汇表的能力抛错——词汇表即合同）。 */
export function toolNamesForCapability(capability: Capability): readonly string[] {
  const mapped = CAPABILITY_TOOLS[capability];
  if (!mapped) throw new Error(`Unknown capability: ${capability}（见 CAPABILITY_VOCABULARY）`);
  return mapped;
}

/**
 * 编程式工具调用面（501 G3）：技能脚本（skills/&lt;pkg&gt;/scripts/*.mjs）与
 * 宿主应用不经 MCP 传输层直接复用 13 工具；与 registerI18nTools 同源。
 */
export function createI18nToolkit(engine: I18nEngine, options: I18nToolkitOptions = {}): I18nToolkit {
  const definitions: ToolDefinition[] = buildI18nTools({ engine, glossary: options.glossary });
  const handlers = new Map<string, ToolDefinition["handler"]>();

  for (const { tool, handler } of definitions) {
    if (handlers.has(tool.name)) throw new Error(`Duplicate tool name: ${tool.name}`);
    handlers.set(tool.name, handler);
  }

  return {
    tools: definitions.map((d) => d.tool),
    list: () => definitions.map((d) => d.tool.name),
    async call<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
      const handler = handlers.get(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}（可用：${[...handlers.keys()].join(", ")}）`);
      }
      const result = await handler(args);
      // 13 工具合同：恰好一条 text 内容承载 JSON（buildI18nTools 单源保证）
      const [first] = result.content;
      return JSON.parse(first.type === "text" ? (first.text ?? "{}") : "{}") as T;
    },
  };
}

// ============================================================
// End of toolkit.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
