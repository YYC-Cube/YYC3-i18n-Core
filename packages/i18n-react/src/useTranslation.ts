// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * @file useTranslation.ts
 * @description useTranslation hook — zero boilerplate i18n for React
 */

import { useCallback } from 'react';
import { useI18nContext } from './I18nProvider';
import type { Locale } from '@yyc3/i18n-core';

export interface UseTranslationReturn {
  /** Translate a key with optional ICU parameters */
  t: (key: string, params?: Record<string, string>) => string;
  /** Current active locale */
  locale: Locale;
  /** Change the active locale */
  setLocale: (locale: Locale) => Promise<void>;
  /** Whether the engine is ready */
  ready: boolean;
  /** The underlying I18nEngine instance */
  engine: ReturnType<typeof useI18nContext>['engine'];
}

export function useTranslation(): UseTranslationReturn {
  const ctx = useI18nContext();

  const t = useCallback(
    (key: string, params?: Record<string, string>) => ctx.t(key, params),
    [ctx],
  );

  return {
    t,
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    ready: ctx.ready,
    engine: ctx.engine,
  };
}

// ============================================================
// End of useTranslation.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
