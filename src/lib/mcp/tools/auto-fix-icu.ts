// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file auto-fix-icu.ts
 * description MCP 工具 auto_fix_icu — ICU 错误定位与安全修复建议
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
 * brief 解析 ICU 消息 → 错误清单 + 确定性修复建议（仅对可机械修复类
 *       给出修复后模板；修复建议经二次解析验证无错才标记 fixable）
 */
import { ICUParser } from "../../icu/parser.js";
import type { ToolDefinition } from "./shared.js";

export function createAutoFixIcuTool(): ToolDefinition {
  const parser = new ICUParser();
  return {
    tool: {
      name: "auto_fix_icu",
      description: "Parse an ICU MessageFormat template, list errors, and propose verified fixes",
      inputSchema: {
        type: "object",
        properties: {
          template: { type: "string", description: "ICU MessageFormat template to diagnose" },
        },
        required: ["template"],
      },
    },
    handler: async (args) => {
      const template = String(args.template ?? "");
      const { errors } = parser.parse(template);

      if (errors.length === 0) {
        return {
          content: [{ type: "text", text: JSON.stringify({ valid: true, errors: [], fixes: [] }, null, 2) }],
        };
      }

      // 确定性修复策略：仅处理可机械修复类
      const fixes: Array<{ error: string; fix: string | null; note: string }> = [];
      for (const err of errors) {
        if (err.message.startsWith("Unknown format type")) {
          const bad = err.message.match(/Unknown format type: (\w+)/)?.[1];
          fixes.push({
            error: err.message,
            fix: bad ? template.replaceAll(`, ${bad}`, ", number") : null,
            note: `未知格式类型 "${bad}" → 临时替换为 number（请人工确认语义）`,
          });
        } else if (err.message.includes("Expected '{'")) {
          fixes.push({ error: err.message, fix: null, note: "选择器缺少 {} 子句体——需人工补全译文文案" });
        } else if (err.message === "Expected argument name") {
          fixes.push({ error: err.message, fix: null, note: "空参数名 {} ——需人工命名（如 {count}）" });
        } else {
          fixes.push({ error: err.message, fix: null, note: "无机械修复策略，需人工处理" });
        }
      }

      // 修复建议二次验证：给出 fix 的建议必须解析无错才标记 fixable=true
      const verified = fixes.map((f) => {
        if (!f.fix) return { ...f, fixable: false };
        const recheck = parser.parse(f.fix);
        return { ...f, fixable: recheck.errors.length === 0 };
      });

      return {
        content: [{ type: "text", text: JSON.stringify({ valid: false, errors, fixes: verified }, null, 2) }],
      };
    },
  };
}

// ============================================================
// End of auto-fix-icu.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
