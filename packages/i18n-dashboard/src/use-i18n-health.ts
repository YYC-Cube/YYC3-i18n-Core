// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file use-i18n-health.ts
 * description i18n 健康快照钩子——引擎统计/覆盖率/性能/缺键/OTA/审计六面采集
 * module @yyc3/i18n-dashboard
 * author YanYuCloudCube Team <admin@0379.email>
 * version 0.1.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [hook],[metrics]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief SSR 安全（初始快照同步可得）；刷新双通道：engine.subscribe 事件 +
 *       refreshMs 轮询（默认 5000，0 关闭）
 */
import { useEffect, useMemo, useState } from "react";
import type {
  AuditEntry, I18nEngine, MissingKeyEntry, MissingKeyReporter,
  PerformanceMetrics, PerformanceTracker, RemoteLocaleSource, RemoteSyncResult,
  TranslationMap,
} from "@yyc3/i18n-core";

export interface LocaleCoverage {
  locale: string;
  totalKeys: number;
  missingCount: number;
  /** 缺失键清单（与源语言比对；源语言本身恒空）。 */
  missing: string[];
}

export interface OtaLocaleStatus {
  locale: string;
  /** 各源最近同步结果（未同步为 null）。 */
  syncs: Array<RemoteSyncResult | null>;
}

export interface I18nHealthSnapshot {
  locale: string;
  loadedLocales: string[];
  subscriberCount: number;
  coverage: LocaleCoverage[];
  performance: PerformanceMetrics | null;
  missingKeys: MissingKeyEntry[] | null;
  audit: AuditEntry[] | null;
  ota: OtaLocaleStatus[];
  collectedAt: number;
}

export interface UseI18nHealthOptions {
  performanceTracker?: PerformanceTracker;
  missingKeyReporter?: MissingKeyReporter;
  auditLogger?: { getEntries(): AuditEntry[] };
  otaSources?: RemoteLocaleSource[];
  /** ota 面展示的 locale（默认全部已装载语言）。 */
  otaLocales?: string[];
  /** 轮询刷新间隔（默认 5000ms；0 = 仅事件驱动）。 */
  refreshMs?: number;
}

/** 翻译树扁平化（与引擎/coverage://report 同语义：`.` 连接深层键）。 */
function flatten(obj: TranslationMap | undefined, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!obj) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") Object.assign(out, flatten(v as TranslationMap, key));
    else out[key] = String(v);
  }
  return out;
}

function collectCoverage(engine: I18nEngine): LocaleCoverage[] {
  const stats = engine.getStats();
  const source = flatten(engine.getTranslations(stats.locale as never));
  const totalKeys = Object.keys(source).length;
  return stats.loadedLocales
    .filter((l) => l !== stats.locale)
    .map((locale) => {
      const flat = flatten(engine.getTranslations(locale as never));
      const missing = Object.keys(source).filter((k) => !(k in flat)).sort();
      return { locale, totalKeys, missingCount: missing.length, missing };
    });
}

function collectSnapshot(engine: I18nEngine, options: UseI18nHealthOptions): I18nHealthSnapshot {
  const stats = engine.getStats();
  const otaLocales = options.otaLocales ?? stats.loadedLocales;
  return {
    locale: stats.locale,
    loadedLocales: [...stats.loadedLocales],
    subscriberCount: stats.subscriberCount,
    coverage: collectCoverage(engine),
    performance: options.performanceTracker ? options.performanceTracker.getMetrics() : null,
    missingKeys: options.missingKeyReporter ? options.missingKeyReporter.getMissingKeys() : null,
    audit: options.auditLogger ? options.auditLogger.getEntries() : null,
    ota: (options.otaSources ?? []).length > 0
      ? otaLocales.map((locale) => ({
        locale,
        syncs: (options.otaSources ?? []).map((s) => s.lastSync(locale as never)),
      }))
      : [],
    collectedAt: Date.now(),
  };
}

/**
 * i18n 健康快照钩子（501 G4.2）：同步初始快照（SSR 可渲染），
 * 挂载后按 engine.subscribe 事件 + refreshMs 轮询重采集。
 */
export function useI18nHealth(engine: I18nEngine, options: UseI18nHealthOptions = {}): I18nHealthSnapshot {
  const [snapshot, setSnapshot] = useState<I18nHealthSnapshot>(() => collectSnapshot(engine, options));
  const refreshMs = options.refreshMs ?? 5_000;

  useEffect(() => {
    const recollect = (): void => setSnapshot(collectSnapshot(engine, options));
    const unsubscribe = engine.subscribe(recollect);

    let timer: ReturnType<typeof setInterval> | undefined;
    if (refreshMs > 0) {
      timer = setInterval(recollect, refreshMs);
    }
    return () => {
      unsubscribe();
      if (timer) clearInterval(timer);
    };
    // options 为每次渲染的新对象时依赖 engine+refreshMs 即可：collectSnapshot 读的都是实时值
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, refreshMs]);

  return useMemo(() => snapshot, [snapshot]);
}

// ============================================================
// End of use-i18n-health.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
