// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file state-machine.ts
 * description 翻译工作流状态机与角色权限矩阵（502 方案 W1）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.5.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief submitted→approved→published 主链 + rejected 分支；
 *       操作×角色权限矩阵单一事实源（越权/非法转移均为确定性错误）
 */

/** 工作流状态：待审 / 已批 / 已驳 / 已发布。 */
export type WorkflowState = "submitted" | "approved" | "rejected" | "published";

/** 工作流角色：译者（提交/修订）/ 审校（批/驳）/ 管理员（全权+发布）。 */
export type WorkflowRole = "translator" | "reviewer" | "admin";

/** 工作流操作。 */
export type WorkflowAction = "submit" | "resubmit" | "approve" | "reject" | "publish";

/** 操作 → 允许角色（权限矩阵单一事实源）。 */
export const ACTION_ROLES: Readonly<Record<WorkflowAction, readonly WorkflowRole[]>> = Object.freeze({
  submit: Object.freeze<readonly WorkflowRole[]>(["translator", "admin"]),
  resubmit: Object.freeze<readonly WorkflowRole[]>(["translator", "admin"]),
  approve: Object.freeze<readonly WorkflowRole[]>(["reviewer", "admin"]),
  reject: Object.freeze<readonly WorkflowRole[]>(["reviewer", "admin"]),
  publish: Object.freeze<readonly WorkflowRole[]>(["admin"]),
});

/** 操作 → 源状态（submit 无源状态——词条由此进入）。 */
export const ACTION_SOURCE_STATE: Readonly<Record<WorkflowAction, WorkflowState | null>> = Object.freeze({
  submit: null,
  resubmit: "rejected",
  approve: "submitted",
  reject: "submitted",
  publish: "approved",
});

/** 判定角色是否可执行操作。 */
export function roleCanAction(roles: readonly WorkflowRole[], action: WorkflowAction): boolean {
  return roles.some((r) => ACTION_ROLES[action].includes(r));
}

/** 判定操作对给定源状态是否合法（submit 的源状态须为 null，其余须精确匹配）。 */
export function isValidTransition(action: WorkflowAction, from: WorkflowState | null): boolean {
  return ACTION_SOURCE_STATE[action] === from;
}

/** 操作的目标状态。 */
export function targetStateOf(action: WorkflowAction): WorkflowState {
  switch (action) {
    case "submit":
    case "resubmit":
      return "submitted";
    case "approve":
      return "approved";
    case "reject":
      return "rejected";
    case "publish":
      return "published";
  }
}

/** 角色字面量校验（身份提供方角色映射用——非法角色静默丢弃）。 */
export function isWorkflowRole(value: unknown): value is WorkflowRole {
  return value === "translator" || value === "reviewer" || value === "admin";
}

// ============================================================
// End of state-machine.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
