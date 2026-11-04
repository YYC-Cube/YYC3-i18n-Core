// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file extract-keys.ts
 * description MCP 工具 extract_keys — 从代码文本提取 t() 翻译键
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
 * brief 输入为代码文本（MCP 语义下不经沙箱文件系统），正则与
 *       cli-integration extractKeys 单源同款
 */
import { KEY_PATTERN, type ToolDefinition } from "./shared.js";

export function createExtractKeysTool(): ToolDefinition {
  return {
    tool: {
      name: "extract_keys",
      description: "Extract i18n translation keys from source code text (t('key') calls)",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Source code text to scan" },
          unique: { type: "boolean", description: "Deduplicate keys (default true)" },
        },
        required: ["code"],
      },
    },
    handler: async (args) => {
      const code = String(args.code ?? "");
      const unique = args.unique !== false;
      const all: string[] = [];

      const scanner = new RegExp(KEY_PATTERN.source, "g");
      for (const m of code.matchAll(scanner)) {
        all.push(m[1]);
      }

      const result = unique ? [...new Set<string>(all)].sort() : all;
      return {
        content: [{ type: "text", text: JSON.stringify({ keys: result, count: result.length, unique }, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of extract-keys.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
