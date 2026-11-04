// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow-tools.test.ts
 * description MCP 工作流选择性工具面测试（502 W3）——五工具 + 缺省面不变断言
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[mcp],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 复用 i18n-tools.test 的 mock server 模式；token 经 StaticIdentityProvider
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { registerI18nTools } from "../../lib/mcp/i18n-tools.js";
import { MCPServer } from "../../lib/mcp/server.js";
import type { MCPToolResult, MCPTransport } from "../../lib/mcp/types.js";
import { registerWorkflowTools } from "../../lib/mcp/workflow-tools.js";
import { StaticIdentityProvider } from "../../lib/workflow/identity.js";
import { TranslationWorkflow } from "../../lib/workflow/workflow.js";

function createMockServer(): {
  server: MCPServer;
  getHandler: (name: string) => ((args: Record<string, unknown>) => Promise<MCPToolResult>) | undefined;
} {
  const handlers = new Map<string, (args: Record<string, unknown>) => Promise<MCPToolResult>>();
  const mockTransport: MCPTransport = { connected: true, connect: async () => { }, send: async () => { }, onMessage: () => { }, close: async () => { } };
  const server = new MCPServer({ name: "t", version: "1", transport: mockTransport });
  const origRegister = server.registerTool.bind(server);
  server.registerTool = (tool, handler) => {
    handlers.set(tool.name, handler);
    origRegister(tool, handler);
  };
  return { server, getHandler: (name) => handlers.get(name) };
}

function makeStack(): { getHandler: (name: string) => ((args: Record<string, unknown>) => Promise<MCPToolResult>) | undefined; workflow: TranslationWorkflow; engine: I18nEngine } {
  const engine = new I18nEngine({ locale: "ja" });
  const identity = new StaticIdentityProvider({
    "tok-t": { userId: "t1", roles: ["translator"] },
    "tok-r": { userId: "r1", roles: ["reviewer"] },
    "tok-a": { userId: "a1", roles: ["admin"] },
  });
  const workflow = new TranslationWorkflow({ engine, identity });
  const { server, getHandler } = createMockServer();
  registerWorkflowTools(server, workflow);
  return { getHandler, workflow, engine };
}

const text = (result: MCPToolResult): string => result.content[0]?.text ?? "";

describe("registerWorkflowTools（选择性接线）", () => {
  it("五工具注册，且缺省 registerI18nTools 面保持 13 不变", () => {
    const { server } = createMockServer();
    const identity = new StaticIdentityProvider({ t: { userId: "u", roles: ["admin"] } });
    registerWorkflowTools(server, new TranslationWorkflow({ identity }));
    expect(server.getTools().filter((t) => t.name.startsWith("workflow_"))).toHaveLength(5);

    const bare = createMockServer();
    registerI18nTools(bare.server, new I18nEngine({ locale: "en" }));
    expect(bare.server.getTools()).toHaveLength(13);
    expect(bare.server.getTools().some((t) => t.name.startsWith("workflow_"))).toBe(false);
  });

  it("submit→approve→publish 全链（token 现验）+ 引擎生效", async () => {
    const { getHandler, engine } = makeStack();

    const submitResult = await getHandler("workflow_submit")!({ locale: "ja", key: "nav.home", value: "ホーム", token: "tok-t" });
    expect(JSON.parse(text(submitResult))).toMatchObject({ ok: true, entryId: 1, state: "submitted" });

    const approveResult = await getHandler("workflow_approve")!({ entryId: 1, note: "LGTM", token: "tok-r" });
    expect(JSON.parse(text(approveResult))).toMatchObject({ ok: true, state: "approved" });

    const publishResult = await getHandler("workflow_publish")!({ entryId: 1, token: "tok-a" });
    expect(JSON.parse(text(publishResult)).published).toHaveLength(1);
    expect(engine.t("nav.home")).toBe("ホーム");
  });

  it("越权与非法操作返回 isError（不抛出到传输层）", async () => {
    const { getHandler } = makeStack();
    const forbidden = await getHandler("workflow_approve")!({ entryId: 1, token: "tok-t" });
    expect(forbidden.isError).toBe(true);
    expect(JSON.parse(text(forbidden)).error).toMatch(/无权执行 approve/);

    const notFound = await getHandler("workflow_publish")!({ entryId: 42, token: "tok-a" });
    expect(notFound.isError).toBe(true);
  });

  it("reject 流转 + workflow_list 过滤", async () => {
    const { getHandler } = makeStack();
    await getHandler("workflow_submit")!({ locale: "en", key: "k", value: "v", token: "tok-t" });
    await getHandler("workflow_reject")!({ entryId: 1, note: "重译", token: "tok-r" });

    const listAll = JSON.parse(text(await getHandler("workflow_list")!({})));
    expect(listAll.count).toBe(1);

    const listRejected = JSON.parse(text(await getHandler("workflow_list")!({ state: "rejected" })));
    expect(listRejected.entries[0]).toMatchObject({ state: "rejected", submittedBy: "t1" });

    const listJa = JSON.parse(text(await getHandler("workflow_list")!({ locale: "ja" })));
    expect(listJa.count).toBe(0);
  });
});

// ============================================================
// End of workflow-tools.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
