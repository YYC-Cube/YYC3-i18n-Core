// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow-panel.tsx
 * description 审批队列面板（502 W4）——按状态分组的翻译工作流只读视图
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.2.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [component],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 纯展示（data-state 分组锚点）；useWorkflowQueue 轮询供数
 */
import { useEffect, useMemo, useState } from "react";
import type { TranslationWorkflow, WorkflowEntry, WorkflowState } from "@yyc3/i18n-core";

const STATE_LABELS: Record<WorkflowState, string> = {
  submitted: "待审",
  approved: "待发布",
  rejected: "待修订",
  published: "已生效",
};

/** 面板词条视图模型（核心 WorkflowEntry 的展示子集）。 */
export type WorkflowPanelEntry = Pick<WorkflowEntry, "id" | "locale" | "key" | "value" | "state" | "submittedBy">;

export interface WorkflowPanelProps {
  entries: WorkflowPanelEntry[];
  /** 面板标题。 */
  title?: string;
  /** 每组最多条数（默认 10）。 */
  limit?: number;
}

/** 审批队列面板：submitted/approved/rejected/published 四组只读视图。 */
export function WorkflowPanel({ entries, title = "翻译工作流", limit = 10 }: WorkflowPanelProps): JSX.Element {
  const groups = useMemo(() => {
    const by: Record<WorkflowState, WorkflowPanelEntry[]> = { submitted: [], approved: [], rejected: [], published: [] };
    for (const e of entries) by[e.state]?.push(e);
    return by;
  }, [entries]);

  const total = entries.length;
  return (
    <section data-panel="workflow">
      <h3>{title}</h3>
      {total === 0
        ? <p data-state="empty">队列为空</p>
        : (["submitted", "approved", "rejected", "published"] as const).map((state) => (
          groups[state].length > 0 && (
            <details key={state} data-group={state} open={state === "submitted"}>
              <summary>{STATE_LABELS[state]} · {groups[state].length}</summary>
              <ul>
                {groups[state].slice(0, limit).map((e) => (
                  <li key={e.id} data-entry-id={e.id}>
                    #{e.id} · {e.locale} · <code>{e.key}</code> → {e.value}（{e.submittedBy}）
                  </li>
                ))}
              </ul>
            </details>
          )
        ))}
    </section>
  );
}

/**
 * 工作流队列轮询钩子：refreshMs 周期拉取 workflow.list()（默认 5000；0 = 仅初始快照）。
 * SSR 安全——初始快照同步可得。
 */
export function useWorkflowQueue(workflow: TranslationWorkflow, refreshMs = 5_000): WorkflowPanelEntry[] {
  const [entries, setEntries] = useState<WorkflowPanelEntry[]>(() => workflow.list());

  useEffect(() => {
    if (refreshMs <= 0) return;
    const timer = setInterval(() => setEntries(workflow.list()), refreshMs);
    return () => clearInterval(timer);
  }, [workflow, refreshMs]);

  return useMemo(() => entries, [entries]);
}

// ============================================================
// End of workflow-panel.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
