// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file store.ts
 * description 工作流持久化抽象（502 P1-a）——WorkflowStore 接口与快照契约
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.6.0
 * created 2026-11-16
 * updated 2026-11-16
 * status active
 * tags [module],[workflow],[persistence]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 环境中立接口（Node 实现见 ./node 的 JsonFileWorkflowStore）；
 *       TranslationWorkflow.restore() 装载 / 每次流转后自动持久化
 */
import type { WorkflowEntry } from "./workflow.js";

/** 工作流可持久化快照：词条全量 + id 序号发生器状态。 */
export interface WorkflowSnapshot {
  entries: WorkflowEntry[];
  /** 下一词条 id（恢复后继续自增，杜绝跨进程 id 撞号）。 */
  nextId: number;
  savedAt: number;
}

/**
 * 工作流存储抽象：save 全量覆写 / load 装载（无存档返回 null）。
 * 实现须保证 save 的原子性（不可见半写状态）；单进程假设——
 * 多进程并发写同一存储需上层串行化（如文件锁/队列）。
 */
export interface WorkflowStore {
  save(snapshot: WorkflowSnapshot): Promise<void>;
  load(): Promise<WorkflowSnapshot | null>;
}

// ============================================================
// End of store.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
