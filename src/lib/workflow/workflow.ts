// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow.ts
 * description 翻译工作流服务（502 方案 W1）——角色门控流转 + 审计轨迹 + 引擎发布桥
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
 * brief 操作接受 actor（服务端既有会话）或 token（经 IdentityProvider 现场验证）；
 *       publish 桥接 engine.registerTranslation 热更新（下次 t() 读取即新值）
 */
import type { I18nEngine } from "../engine.js";
import type { Locale, TranslationMap } from "../types.js";
import type { IdentityContext, IdentityProvider } from "./identity.js";
import { ACTION_ROLES, isValidTransition, roleCanAction } from "./state-machine.js";
import type { WorkflowAction, WorkflowRole, WorkflowState } from "./state-machine.js";

/** 流转轨迹条目（每次操作追加）。 */
export interface WorkflowTransition {
  ts: number;
  actor: string;
  roles: WorkflowRole[];
  action: WorkflowAction;
  from: WorkflowState | null;
  to: WorkflowState;
  note?: string;
}

/** 工作流词条：一次翻译提案及其全轨迹。 */
export interface WorkflowEntry {
  id: number;
  locale: Locale;
  key: string;
  value: string;
  state: WorkflowState;
  submittedBy: string;
  submittedAt: number;
  trail: WorkflowTransition[];
}

/** 越权操作错误（含权限矩阵上下文）。 */
export class WorkflowPermissionError extends Error {
  constructor(action: WorkflowAction, roles: WorkflowRole[]) {
    super(`角色 [${roles.join(", ") || "无"}] 无权执行 ${action}（允许：${ACTION_ROLES[action].join(", ")}）`);
    this.name = "WorkflowPermissionError";
  }
}

/** 非法状态转移错误。 */
export class WorkflowStateError extends Error {
  constructor(action: WorkflowAction, entryId: number, actual: WorkflowState) {
    super(`${action} 要求状态 ${ACTION_SOURCE_STATE_LABEL[action]}，词条 #${entryId} 当前为 ${actual}`);
    this.name = "WorkflowStateError";
  }
}

const ACTION_SOURCE_STATE_LABEL: Record<WorkflowAction, string> = {
  submit: "（新建）",
  resubmit: "rejected",
  approve: "submitted",
  reject: "submitted",
  publish: "approved",
};

/** actor 双形态：已验证身份 或 待验证令牌。 */
export type ActorInput = IdentityContext | { token: string };

export interface TranslationWorkflowOptions {
  /** 发布桥：publish 时热更新进引擎。 */
  engine?: I18nEngine;
  /** 身份提供方（token 形态 actor 必需）。 */
  identity?: IdentityProvider;
  /** 流转回调（外接 AuditLogger/SIEM 的桥接点）。 */
  onTransition?: (transition: WorkflowTransition, entry: WorkflowEntry) => void;
}

export interface SubmitInput {
  locale: Locale;
  key: string;
  value: string;
  actor: ActorInput;
}

export interface EntryOpInput {
  entryId: number;
  note?: string;
  /** resubmit 可选修订值。 */
  value?: string;
  actor: ActorInput;
}

export interface PublishInput {
  entryId?: number;
  /** 发布全部 approved 词条。 */
  all?: boolean;
  actor: ActorInput;
}

/** 翻译工作流服务（502 W1）：状态机门控 + 轨迹 + 发布桥。 */
export class TranslationWorkflow {
  private entries: WorkflowEntry[] = [];
  private nextId = 1;
  private readonly options: TranslationWorkflowOptions;

  constructor(options: TranslationWorkflowOptions = {}) {
    this.options = options;
  }

  /** 验证令牌 → 身份（未配置 IdentityProvider 则抛错）。 */
  async authorize(token: string): Promise<IdentityContext> {
    if (!this.options.identity) throw new Error("未配置 IdentityProvider——token 形态 actor 不可用");
    return this.options.identity.verify(token);
  }

  async submit(input: SubmitInput): Promise<WorkflowEntry> {
    const actor = await this.resolveActor(input.actor);
    this.assertPermission("submit", actor.roles);
    if (!input.key || !input.locale) throw new Error("submit 需要 locale 与 key");
    const ts = Date.now();
    const entry: WorkflowEntry = {
      id: this.nextId++,
      locale: input.locale,
      key: input.key,
      value: input.value,
      state: "submitted",
      submittedBy: actor.userId,
      submittedAt: ts,
      trail: [],
    };
    this.appendTrail(entry, actor, "submit", null, "submitted");
    this.entries.push(entry);
    return this.clone(entry);
  }

  async resubmit(input: EntryOpInput): Promise<WorkflowEntry> {
    const entry = await this.take(input.entryId, "resubmit", input.actor);
    if (input.value !== undefined) entry.value = input.value;
    this.appendTrail(entry, await this.resolveActor(input.actor), "resubmit", "rejected", "submitted");
    entry.state = "submitted";
    return this.clone(entry);
  }

  async approve(input: EntryOpInput): Promise<WorkflowEntry> {
    const entry = await this.take(input.entryId, "approve", input.actor);
    this.appendTrail(entry, await this.resolveActor(input.actor), "approve", "submitted", "approved", input.note);
    entry.state = "approved";
    return this.clone(entry);
  }

  async reject(input: EntryOpInput): Promise<WorkflowEntry> {
    const entry = await this.take(input.entryId, "reject", input.actor);
    this.appendTrail(entry, await this.resolveActor(input.actor), "reject", "submitted", "rejected", input.note);
    entry.state = "rejected";
    return this.clone(entry);
  }

  /** 发布（admin）：单条或全部 approved——经引擎桥热更新。 */
  async publish(input: PublishInput): Promise<WorkflowEntry[]> {
    const actor = await this.resolveActor(input.actor);
    this.assertPermission("publish", actor.roles);
    if ((input.entryId === undefined) === !input.all) {
      throw new Error("publish 须指定 entryId 或 all=true 其一");
    }
    const targets = input.all
      ? this.entries.filter((e) => e.state === "approved")
      : [await this.take(input.entryId as number, "publish", input.actor)];
    if (targets.length === 0) throw new Error("无可发布词条（approved 为空）");

    for (const entry of targets) {
      this.appendTrail(entry, actor, "publish", "approved", "published");
      entry.state = "published";
      this.options.engine?.registerTranslation(entry.locale, this.asNested(entry));
    }
    return targets.map((e) => this.clone(e));
  }

  /** 词条查询（按状态/语言过滤；返回拷贝）。 */
  list(filter: { state?: WorkflowState; locale?: Locale } = {}): WorkflowEntry[] {
    return this.entries
      .filter((e) => (filter.state ? e.state === filter.state : true))
      .filter((e) => (filter.locale ? e.locale === filter.locale : true))
      .map((e) => this.clone(e));
  }

  get(entryId: number): WorkflowEntry | null {
    const entry = this.entries.find((e) => e.id === entryId);
    return entry ? this.clone(entry) : null;
  }

  /** 点分键 → 嵌套注册树（与引擎 registerTranslation 语义对齐）。 */
  private asNested(entry: WorkflowEntry): TranslationMap {
    const root: TranslationMap = {};
    let node = root;
    const parts = entry.key.split(".");
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = entry.value;
      else {
        const next: TranslationMap = {};
        node[part] = next;
        node = next;
      }
    });
    return root;
  }

  /** 取词条并校验转移合法性（操作目标状态的前置校验统一入口）。 */
  private async take(entryId: number, action: WorkflowAction, actorInput: ActorInput): Promise<WorkflowEntry> {
    const actor = await this.resolveActor(actorInput);
    this.assertPermission(action, actor.roles);
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) throw new Error(`词条不存在: #${entryId}`);
    if (!isValidTransition(action, entry.state)) throw new WorkflowStateError(action, entryId, entry.state);
    return entry;
  }

  private appendTrail(
    entry: WorkflowEntry,
    actor: IdentityContext,
    action: WorkflowAction,
    from: WorkflowState | null,
    to: WorkflowState,
    note?: string,
  ): void {
    const transition: WorkflowTransition = { ts: Date.now(), actor: actor.userId, roles: [...actor.roles], action, from, to, ...(note !== undefined ? { note } : {}) };
    entry.trail.push(transition);
    this.options.onTransition?.(transition, this.clone(entry));
  }

  private assertPermission(action: WorkflowAction, roles: WorkflowRole[]): void {
    if (!roleCanAction(roles, action)) throw new WorkflowPermissionError(action, roles);
  }

  private async resolveActor(actor: ActorInput): Promise<IdentityContext> {
    if ("token" in actor) return this.authorize(actor.token);
    return actor;
  }

  private clone(entry: WorkflowEntry): WorkflowEntry {
    return { ...entry, trail: entry.trail.map((t) => ({ ...t })) };
  }
}

// ============================================================
// End of workflow.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
