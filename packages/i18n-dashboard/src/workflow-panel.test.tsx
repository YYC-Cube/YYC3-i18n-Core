// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file workflow-panel.test.tsx
 * description 审批队列面板测试（502 W4）——分组渲染/空态/轮询钩子初始快照
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.2.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [test],[workflow]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief SSR renderToString 范式（与本仓其余面板测试同构）
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { I18nEngine, StaticIdentityProvider, TranslationWorkflow } from "@yyc3/i18n-core";
import { WorkflowPanel, useWorkflowQueue } from "./workflow-panel.js";
import type { WorkflowPanelEntry } from "./workflow-panel.js";
import React from "react";

const SAMPLE: WorkflowPanelEntry[] = [
  { id: 1, locale: "ja", key: "nav.home", value: "ホーム", state: "submitted", submittedBy: "t1" },
  { id: 2, locale: "en", key: "cta.save", value: "Save", state: "submitted", submittedBy: "t2" },
  { id: 3, locale: "ja", key: "nav.list", value: "リスト", state: "approved", submittedBy: "t1" },
  { id: 4, locale: "ko", key: "cta.cancel", value: "취소", state: "rejected", submittedBy: "t3" },
  { id: 5, locale: "en", key: "app.title", value: "My App", state: "published", submittedBy: "t1" },
];

/** 剥离 React 18 SSR 文本分隔注释（<!-- -->），恢复连续文本比对。 */
const asText = (html: string): string => html.replaceAll("<!-- -->", "");

describe("WorkflowPanel（SSR）", () => {
  it("四状态分组渲染：计数锚点 + 词条内容", () => {
    const html = renderToString(<WorkflowPanel entries={SAMPLE} />);
    const text = asText(html);
    expect(html).toContain('data-group="submitted"');
    expect(text).toContain("待审 · 2");
    expect(text).toContain("待发布 · 1");
    expect(text).toContain("待修订 · 1");
    expect(text).toContain("已生效 · 1");
    expect(text).toContain("#1 · ja · <code>nav.home</code>");
    expect(text).toContain("（t1）");
  });

  it("limit 截断每组条数", () => {
    const html = renderToString(<WorkflowPanel entries={SAMPLE} limit={1} />);
    expect(asText(html)).toContain("待审 · 2");
    expect((html.match(/data-entry-id=/g) ?? []).length).toBe(4); // 每组各 1（四组非空）
  });

  it("空队列空态", () => {
    const html = renderToString(<WorkflowPanel entries={[]} />);
    expect(html).toContain('data-state="empty"');
    expect(html).toContain("队列为空");
  });
});

describe("useWorkflowQueue（初始快照）", () => {
  it("SSR 单帧物化 workflow.list() 快照", async () => {
    const workflow = new TranslationWorkflow({
      engine: new I18nEngine({ locale: "en" }),
      identity: new StaticIdentityProvider({ tok: { userId: "t1", roles: ["translator"] } }),
    });
    await workflow.submit({ locale: "ja", key: "nav.home", value: "ホーム", actor: { token: "tok" } });

    function Probe({ workflow }: { workflow: TranslationWorkflow }): JSX.Element {
      const entries = useWorkflowQueue(workflow, 0);
      return <ul>{entries.map((e) => <li key={e.id} data-state={e.state}>{e.key}</li>)}</ul>;
    }
    const html = renderToString(React.createElement(Probe, { workflow }));
    expect(html).toContain('data-state="submitted"');
    expect(html).toContain("nav.home");
  });
});

// ============================================================
// End of workflow-panel.test.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
