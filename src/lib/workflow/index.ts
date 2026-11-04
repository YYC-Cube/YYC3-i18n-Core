// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file index.ts
 * description 工作流模块出口（502 方案）——状态机/服务/身份抽象
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
 * brief ./workflow 子路径与主入口双聚合（新建公共模块必须同步聚合出口）
 */
export {
  ACTION_ROLES, ACTION_SOURCE_STATE, isWorkflowRole,
  isValidTransition, roleCanAction, targetStateOf
} from "./state-machine.js";
export type { WorkflowAction, WorkflowRole, WorkflowState } from "./state-machine.js";

export { TranslationWorkflow, WorkflowPermissionError, WorkflowStateError } from "./workflow.js";
export type {
  ActorInput, EntryOpInput, PublishInput, SubmitInput,
  TranslationWorkflowOptions, WorkflowEntry, WorkflowTransition
} from "./workflow.js";

export { OidcIdentityError, OidcIdentityProvider, StaticIdentityProvider } from "./identity.js";
export type { IdentityContext, IdentityProvider, OidcIdentityProviderConfig } from "./identity.js";

// ============================================================
// End of index.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
