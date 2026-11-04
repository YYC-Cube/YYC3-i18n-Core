// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow-tools.ts
 * description MCP 工作流选择性工具面（502 方案 W3）——五工具仅显式接线时注册
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[mcp],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 缺省 13 工具面零变化（与 ota://status 同纪律）；
 *       token 每调用现验（workflow 侧 IdentityProvider 裁定）
 */
import type { TranslationWorkflow } from "../workflow/workflow.js";
import type { WorkflowState } from "../workflow/state-machine.js";
import type { MCPServer } from "./server.js";
import type { MCPTool, MCPToolResult } from "./types.js";

function jsonResult(data: unknown): MCPToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown): MCPToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }, null, 2) }],
    isError: true,
  };
}

/** 注册工作流五工具（502 W3）：submit/approve/reject/publish/list——选择性接线。 */
export function registerWorkflowTools(server: MCPServer, workflow: TranslationWorkflow): void {
  const submit: MCPTool = {
    name: "workflow_submit",
    description: "Submit a translation proposal into the review workflow (translator/admin)",
    inputSchema: {
      type: "object",
      properties: {
        locale: { type: "string", description: "Target locale (BCP-47)" },
        key: { type: "string", description: "Dot-named translation key" },
        value: { type: "string", description: "Proposed translation value" },
        token: { type: "string", description: "SSO token (resolved by IdentityProvider)" },
      },
      required: ["locale", "key", "value", "token"],
    },
  };
  server.registerTool(submit, async (args) => {
    try {
      const entry = await workflow.submit({
        locale: String(args.locale) as never,
        key: String(args.key),
        value: String(args.value),
        actor: { token: String(args.token) },
      });
      return jsonResult({ ok: true, entryId: entry.id, state: entry.state });
    } catch (err) {
      return errorResult(err);
    }
  });

  const approve: MCPTool = {
    name: "workflow_approve",
    description: "Approve a submitted translation entry (reviewer/admin)",
    inputSchema: {
      type: "object",
      properties: {
        entryId: { type: "number", description: "Workflow entry id" },
        note: { type: "string", description: "Optional review note" },
        token: { type: "string", description: "SSO token" },
      },
      required: ["entryId", "token"],
    },
  };
  server.registerTool(approve, async (args) => {
    try {
      const entry = await workflow.approve({
        entryId: Number(args.entryId),
        note: args.note === undefined ? undefined : String(args.note),
        actor: { token: String(args.token) },
      });
      return jsonResult({ ok: true, entryId: entry.id, state: entry.state });
    } catch (err) {
      return errorResult(err);
    }
  });

  const reject: MCPTool = {
    name: "workflow_reject",
    description: "Reject a submitted translation entry (reviewer/admin)",
    inputSchema: {
      type: "object",
      properties: {
        entryId: { type: "number", description: "Workflow entry id" },
        note: { type: "string", description: "Rejection reason" },
        token: { type: "string", description: "SSO token" },
      },
      required: ["entryId", "token"],
    },
  };
  server.registerTool(reject, async (args) => {
    try {
      const entry = await workflow.reject({
        entryId: Number(args.entryId),
        note: args.note === undefined ? undefined : String(args.note),
        actor: { token: String(args.token) },
      });
      return jsonResult({ ok: true, entryId: entry.id, state: entry.state });
    } catch (err) {
      return errorResult(err);
    }
  });

  const publish: MCPTool = {
    name: "workflow_publish",
    description: "Publish approved entries into the engine (admin; hot-updates translations)",
    inputSchema: {
      type: "object",
      properties: {
        entryId: { type: "number", description: "Single entry id" },
        all: { type: "boolean", description: "Publish all approved entries" },
        token: { type: "string", description: "SSO token" },
      },
      required: ["token"],
    },
  };
  server.registerTool(publish, async (args) => {
    try {
      const published = await workflow.publish({
        entryId: args.entryId === undefined ? undefined : Number(args.entryId),
        all: args.all === true,
        actor: { token: String(args.token) },
      });
      return jsonResult({ ok: true, published: published.map((e) => ({ id: e.id, locale: e.locale, key: e.key })) });
    } catch (err) {
      return errorResult(err);
    }
  });

  const list: MCPTool = {
    name: "workflow_list",
    description: "List workflow entries (filter by state/locale)",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", enum: ["submitted", "approved", "rejected", "published"], description: "State filter" },
        locale: { type: "string", description: "Locale filter" },
      },
      required: [],
    },
  };
  server.registerTool(list, async (args) => {
    const entries = workflow.list({
      state: (args.state as WorkflowState | undefined) ?? undefined,
      locale: args.locale === undefined ? undefined : (String(args.locale) as never),
    });
    return jsonResult({ ok: true, count: entries.length, entries: entries.map((e) => ({ id: e.id, locale: e.locale, key: e.key, state: e.state, submittedBy: e.submittedBy })) });
  });
}

// ============================================================
// End of workflow-tools.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
