// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file panels.tsx
 * description 健康面板四件——性能/覆盖率/OTA/审计（纯展示，可独立使用）
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.1.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [component],[metrics]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 无样式语义化 HTML（无 CSS 依赖——宿主自带样式系统接管外观）
 */
import type { AuditEntry, MissingKeyEntry, PerformanceMetrics } from "@yyc3/i18n-core";
import type { LocaleCoverage, OtaLocaleStatus } from "./use-i18n-health.js";

export interface PanelProps {
  /** 面板标题。 */
  title?: string;
}

/** 性能面板：调用量/缓存命中/平均时延/慢翻译清单。 */
export function PerformancePanel({ metrics, title = "性能", slowLimit = 5 }: PanelProps & { metrics: PerformanceMetrics | null; slowLimit?: number }): JSX.Element {
  if (!metrics) return <section data-panel="performance"><h3>{title}</h3><p data-state="empty">未接入 PerformanceTracker</p></section>;
  const hitRate = metrics.totalCalls > 0 ? Math.round((metrics.cacheHits / metrics.totalCalls) * 100) : 0;
  return (
    <section data-panel="performance">
      <h3>{title}</h3>
      <dl>
        <dt>调用总数</dt><dd data-metric="total-calls">{metrics.totalCalls}</dd>
        <dt>缓存命中率</dt><dd data-metric="cache-hit-rate">{hitRate}%</dd>
        <dt>平均时延</dt><dd data-metric="avg-duration">{metrics.averageDuration.toFixed(2)}ms</dd>
        <dt>最大时延</dt><dd data-metric="max-duration">{metrics.maxDuration.toFixed(2)}ms</dd>
      </dl>
      {metrics.slowTranslations.length > 0 && (
        <details>
          <summary>慢翻译 {metrics.slowTranslations.length} 条</summary>
          <ul data-metric="slow">
            {metrics.slowTranslations.slice(0, slowLimit).map((e) => (
              <li key={`${e.key}-${e.timestamp}`}>{e.key} · {e.duration.toFixed(2)}ms</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/** 覆盖率面板：各目标语言缺失键统计与清单。 */
export function CoveragePanel({ coverage, title = "覆盖率", missingLimit = 5 }: PanelProps & { coverage: LocaleCoverage[]; missingLimit?: number }): JSX.Element {
  if (coverage.length === 0) return <section data-panel="coverage"><h3>{title}</h3><p data-state="empty">仅源语言装载</p></section>;
  return (
    <section data-panel="coverage">
      <h3>{title}</h3>
      <ul>
        {coverage.map((c) => (
          <li key={c.locale} data-locale={c.locale} data-missing-count={c.missingCount}>
            <strong>{c.locale}</strong>：{c.totalKeys - c.missingCount}/{c.totalKeys}
            {c.missingCount > 0 && (
              <details>
                <summary>缺失 {c.missingCount}</summary>
                <ul>{c.missing.slice(0, missingLimit).map((k) => <li key={k}>{k}</li>)}</ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** OTA 面板：各语言远程源最近同步状态。 */
export function OtaPanel({ ota, title = "OTA 同步" }: PanelProps & { ota: OtaLocaleStatus[] }): JSX.Element {
  if (ota.length === 0) return <section data-panel="ota"><h3>{title}</h3><p data-state="empty">未接入远程源</p></section>;
  return (
    <section data-panel="ota">
      <h3>{title}</h3>
      <ul>
        {ota.map((o) => (
          <li key={o.locale} data-locale={o.locale}>
            <strong>{o.locale}</strong>
            {o.syncs.map((s, i) => (
              <span key={i} data-sync={s ? (s.changed ? "updated" : "fresh") : "never"}>
                {s ? `${s.changed ? "已更新" : "无变化"} · ${s.version ?? "?"}` : "未同步"}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 审计面板：最近审计条目（时间倒序，默认 20 条）。 */
export function AuditPanel({ entries, title = "审计", limit = 20 }: PanelProps & { entries: AuditEntry[] | null; limit?: number }): JSX.Element {
  if (!entries) return <section data-panel="audit"><h3>{title}</h3><p data-state="empty">未接入 AuditLogger</p></section>;
  const recent = [...entries].reverse().slice(0, limit);
  return (
    <section data-panel="audit">
      <h3>{title}</h3>
      {recent.length === 0
        ? <p data-state="empty">暂无条目</p>
        : (
          <ul>
            {recent.map((e) => (
              <li key={`${e.ts}-${e.type}-${e.key ?? ""}`} data-type={e.type}>
                <time>{new Date(e.ts).toISOString()}</time> · {e.type}{e.key ? ` · ${e.key}` : ""}{e.error ? ` · ${e.error}` : ""}
              </li>
            ))}
          </ul>
        )}
    </section>
  );
}

/** 缺键面板：MissingKeyReporter 聚合视图（按次数降序）。 */
export function MissingKeysPanel({ entries, title = "缺失键", limit = 10 }: PanelProps & { entries: MissingKeyEntry[] | null; limit?: number }): JSX.Element {
  if (!entries) return <section data-panel="missing-keys"><h3>{title}</h3><p data-state="empty">未接入 MissingKeyReporter</p></section>;
  return (
    <section data-panel="missing-keys">
      <h3>{title}</h3>
      {entries.length === 0
        ? <p data-state="empty">零缺失</p>
        : (
          <ul>
            {entries.slice(0, limit).map((e) => (
              <li key={`${e.locale}-${e.key}`}>{e.locale} · {e.key} ×{e.count}</li>
            ))}
          </ul>
        )}
    </section>
  );
}

// ============================================================
// End of panels.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
