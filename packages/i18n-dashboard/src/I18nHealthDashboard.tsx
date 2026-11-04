// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file I18nHealthDashboard.tsx
 * description i18n 健康总览组合根——useI18nHealth 快照喂养五面板（501 G4.2）
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.1.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [component],[dashboard]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 面板可独立使用（panels.tsx 直取 props）；本组件负责采集与编排
 */
import type { I18nEngine } from "@yyc3/i18n-core";
import { AuditPanel, CoveragePanel, MissingKeysPanel, OtaPanel, PerformancePanel } from "./panels.js";
import { useI18nHealth } from "./use-i18n-health.js";
import type { UseI18nHealthOptions } from "./use-i18n-health.js";

export type I18nHealthDashboardProps = UseI18nHealthOptions & {
  engine: I18nEngine;
  /** 总览标题。 */
  title?: string;
};

/** i18n 健康总览：性能/覆盖率/缺键/OTA/审计五面板一屏。 */
export function I18nHealthDashboard({ engine, title = "YYC³ i18n 健康", ...options }: I18nHealthDashboardProps): JSX.Element {
  const health = useI18nHealth(engine, options);
  return (
    <div data-yyc3-i18n-dashboard>
      <header>
        <h2>{title}</h2>
        <p data-meta>
          当前语言 <strong>{health.locale}</strong> · 装载 {health.loadedLocales.length} · 订阅者 {health.subscriberCount}
        </p>
      </header>
      <PerformancePanel metrics={health.performance} />
      <CoveragePanel coverage={health.coverage} />
      <MissingKeysPanel entries={health.missingKeys} />
      <OtaPanel ota={health.ota} />
      <AuditPanel entries={health.audit} />
    </div>
  );
}

// ============================================================
// End of I18nHealthDashboard.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
