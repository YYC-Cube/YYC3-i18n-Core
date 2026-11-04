// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow.test.ts
 * description 翻译工作流测试（502 W1）——状态机/权限矩阵/轨迹/发布桥/token actor
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 全转移路径 + 越权/非法状态确定性错误 + 引擎热更新断言
 */
import { describe, expect, it } from "vitest";
import { I18nEngine } from "../../lib/engine.js";
import { StaticIdentityProvider } from "../../lib/workflow/identity.js";
import type { IdentityContext } from "../../lib/workflow/identity.js";
import { isWorkflowRole, isValidTransition, roleCanAction, targetStateOf } from "../../lib/workflow/state-machine.js";
import { TranslationWorkflow, WorkflowPermissionError, WorkflowStateError } from "../../lib/workflow/workflow.js";
import type { WorkflowTransition } from "../../lib/workflow/workflow.js";

const translator: IdentityContext = { userId: "t1", roles: ["translator"] };
const reviewer: IdentityContext = { userId: "r1", roles: ["reviewer"] };
const admin: IdentityContext = { userId: "a1", roles: ["admin"] };

describe("状态机（纯函数）", () => {
  it("权限矩阵真值表", () => {
    expect(roleCanAction(["translator"], "submit")).toBe(true);
    expect(roleCanAction(["translator"], "approve")).toBe(false);
    expect(roleCanAction(["reviewer"], "approve")).toBe(true);
    expect(roleCanAction(["reviewer"], "publish")).toBe(false);
    expect(roleCanAction(["admin"], "publish")).toBe(true);
    expect(roleCanAction([], "submit")).toBe(false);
  });

  it("转移合法性与目标状态", () => {
    expect(isValidTransition("submit", null)).toBe(true);
    expect(isValidTransition("submit", "submitted")).toBe(false);
    expect(isValidTransition("approve", "submitted")).toBe(true);
    expect(isValidTransition("approve", "approved")).toBe(false);
    expect(isValidTransition("resubmit", "rejected")).toBe(true);
    expect(isValidTransition("publish", "approved")).toBe(true);
    expect(targetStateOf("submit")).toBe("submitted");
    expect(targetStateOf("resubmit")).toBe("submitted");
    expect(targetStateOf("approve")).toBe("approved");
    expect(targetStateOf("reject")).toBe("rejected");
    expect(targetStateOf("publish")).toBe("published");
  });

  it("角色字面量校验", () => {
    expect(isWorkflowRole("reviewer")).toBe(true);
    expect(isWorkflowRole("root")).toBe(false);
  });
});

describe("TranslationWorkflow", () => {
  it("主链：submit→approve→publish 且引擎热更新生效（下次读取即新值）", async () => {
    const engine = new I18nEngine({ locale: "ja" });
    const workflow = new TranslationWorkflow({ engine });

    const entry = await workflow.submit({ locale: "ja", key: "nav.title", value: "ホーム", actor: translator });
    expect(entry.state).toBe("submitted");
    expect(entry.trail).toHaveLength(1);

    const approved = await workflow.approve({ entryId: entry.id, actor: reviewer, note: "LGTM" });
    expect(approved.state).toBe("approved");

    const published = await workflow.publish({ entryId: entry.id, actor: admin });
    expect(published[0]?.state).toBe("published");
    expect(engine.t("nav.title")).toBe("ホーム");
  });

  it("驳回→修订重提→再批→发布 全环", async () => {
    const workflow = new TranslationWorkflow();
    const entry = await workflow.submit({ locale: "en", key: "a", value: "v1", actor: translator });
    await workflow.reject({ entryId: entry.id, actor: reviewer, note: "语气不当" });
    const resubmitted = await workflow.resubmit({ entryId: entry.id, value: "v2", actor: translator });
    expect(resubmitted.value).toBe("v2");
    expect(resubmitted.state).toBe("submitted");

    // 不带 value 的重提：保留原值
    await workflow.reject({ entryId: entry.id, actor: reviewer });
    const kept = await workflow.resubmit({ entryId: entry.id, actor: translator });
    expect(kept.value).toBe("v2");
    await workflow.approve({ entryId: entry.id, actor: reviewer });
    const published = await workflow.publish({ entryId: entry.id, actor: admin });
    expect(published[0]?.value).toBe("v2");
    expect(workflow.get(entry.id)?.trail).toHaveLength(7);
  });

  it("越权操作抛 WorkflowPermissionError（含矩阵上下文）", async () => {
    const workflow = new TranslationWorkflow();
    await expect(workflow.submit({ locale: "en", key: "k", value: "v", actor: reviewer }))
      .rejects.toBeInstanceOf(WorkflowPermissionError);
    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    await expect(workflow.approve({ entryId: entry.id, actor: translator })).rejects.toThrow(/无权执行 approve/);
    await expect(workflow.publish({ entryId: entry.id, actor: reviewer })).rejects.toThrow(/无权执行 publish/);
  });

  it("非法状态转移抛 WorkflowStateError", async () => {
    const workflow = new TranslationWorkflow();
    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    await expect(workflow.resubmit({ entryId: entry.id, actor: translator })).rejects.toBeInstanceOf(WorkflowStateError);
    await workflow.approve({ entryId: entry.id, actor: reviewer });
    await expect(workflow.approve({ entryId: entry.id, actor: reviewer })).rejects.toThrow(/要求状态 submitted/);
    await expect(workflow.publish({ entryId: 999, actor: admin })).rejects.toThrow(/词条不存在/);
  });

  it("publish all 批量 + 参数互斥校验", async () => {
    const engine = new I18nEngine({ locale: "en" });
    const workflow = new TranslationWorkflow({ engine });
    for (const k of ["k1", "k2"]) {
      const e = await workflow.submit({ locale: "en", key: k, value: `v-${k}`, actor: translator });
      await workflow.approve({ entryId: e.id, actor: reviewer });
    }
    const published = await workflow.publish({ all: true, actor: admin });
    expect(published).toHaveLength(2);
    expect(engine.t("k2")).toBe("v-k2");

    await expect(workflow.publish({ all: true, actor: admin })).rejects.toThrow(/无可发布/);
    await expect(workflow.publish({ actor: admin })).rejects.toThrow(/entryId 或 all/);
    await expect(workflow.publish({ entryId: 1, all: true, actor: admin })).rejects.toThrow(/entryId 或 all/);
  });

  it("list 过滤 + get 拷贝隔离", async () => {
    const workflow = new TranslationWorkflow();
    const e1 = await workflow.submit({ locale: "en", key: "k1", value: "v", actor: translator });
    await workflow.submit({ locale: "ja", key: "k2", value: "v", actor: translator });
    await workflow.approve({ entryId: e1.id, actor: reviewer });

    expect(workflow.list({ state: "approved" }).map((e) => e.key)).toEqual(["k1"]);
    expect(workflow.list({ locale: "ja" }).map((e) => e.key)).toEqual(["k2"]);
    expect(workflow.list()).toHaveLength(2);

    const got = workflow.get(e1.id)!;
    got.state = "published";
    got.trail.push({} as WorkflowTransition);
    expect(workflow.get(e1.id)?.state).toBe("approved");
    expect(workflow.get(e1.id)?.trail).toHaveLength(2);
  });

  it("submit 入参校验与 onTransition 回调", async () => {
    const transitions: WorkflowTransition[] = [];
    const workflow = new TranslationWorkflow({ onTransition: (t) => transitions.push(t) });
    await expect(workflow.submit({ locale: "en", key: "", value: "v", actor: translator })).rejects.toThrow(/locale 与 key/);

    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: translator });
    await workflow.approve({ entryId: entry.id, actor: reviewer });
    expect(transitions.map((t) => t.action)).toEqual(["submit", "approve"]);
    expect(transitions[1]?.actor).toBe("r1");
  });

  it("token 形态 actor：StaticIdentityProvider 验证路径", async () => {
    const identity = new StaticIdentityProvider({
      "tok-trans": translator,
      "tok-bad": { userId: "x", roles: [] },
    });
    const workflow = new TranslationWorkflow({ identity });

    const entry = await workflow.submit({ locale: "en", key: "k", value: "v", actor: { token: "tok-trans" } });
    expect(entry.submittedBy).toBe("t1");
    expect(await workflow.authorize("tok-trans")).toEqual(translator);

    await expect(workflow.submit({ locale: "en", key: "k", value: "v", actor: { token: "nope" } })).rejects.toThrow(/Unknown token/);
    await expect(workflow.submit({ locale: "en", key: "k", value: "v", actor: { token: "tok-bad" } })).rejects.toBeInstanceOf(WorkflowPermissionError);
  });

  it("未配置 IdentityProvider 时 token/authorize 报错", async () => {
    const workflow = new TranslationWorkflow();
    await expect(workflow.authorize("t")).rejects.toThrow(/未配置 IdentityProvider/);
    await expect(workflow.submit({ locale: "en", key: "k", value: "v", actor: { token: "t" } })).rejects.toThrow(/未配置 IdentityProvider/);
  });
});

// ============================================================
// End of workflow.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
