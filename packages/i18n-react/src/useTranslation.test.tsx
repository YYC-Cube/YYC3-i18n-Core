// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * @file useTranslation.test.tsx
 * @description useTranslation Hook 单元测试 — t/locale/setLocale/engine 逐项断言
 * @author YYC³ Team
 * @version 1.0.0
 * @test-target src/useTranslation.ts
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { I18nEngine, type Locale } from '@yyc3/i18n-core';
import { I18nProvider } from './I18nProvider';
import { useTranslation } from './useTranslation';

function HookProbe({ onResult }: { onResult: (r: ReturnType<typeof useTranslation>) => void }) {
  onResult(useTranslation());
  return null;
}

function renderHook(engine: I18nEngine) {
  let result!: ReturnType<typeof useTranslation>;
  renderToString(
    <I18nProvider engine={engine}>
      <HookProbe onResult={(r) => { result = r; }} />
    </I18nProvider>,
  );
  return result;
}

describe('useTranslation', () => {
  it('返回 t/locale/ready/engine 五件套', () => {
    const engine = new I18nEngine({ locale: 'en' });
    const r = renderHook(engine);
    expect(typeof r.t).toBe('function');
    expect(r.locale).toBe('en');
    expect(typeof r.setLocale).toBe('function');
    // SSR 渲染不执行 useEffect → ready 保持 false（客户端水合后为 true）
    expect(r.ready).toBe(false);
    expect(r.engine).toBe(engine);
  });

  it('t() 经引擎产出内置译文（en 命中 common.health）', () => {
    const en = renderHook(new I18nEngine({ locale: 'en' }));
    expect(en.t('common.health')).toBe('Health');
  });

  it('t() 支持 ICU 参数插值（嵌套注册 + 点号键下钻）', () => {
    const engine = new I18nEngine({ locale: 'en' });
    engine.registerTranslation('en', { greet: { icu: 'Hello, {name}!' } });
    const r = renderHook(engine);
    expect(r.t('greet.icu', { name: 'YYC³' })).toBe('Hello, YYC³!');
  });

  it('setLocale 切换后 locale 状态更新（zh-CN → en）', async () => {
    const engine = new I18nEngine({ locale: 'zh-CN' });
    const r = renderHook(engine);
    await r.setLocale('en' as Locale);
    expect(engine.getLocale()).toBe('en');
  });
});

// ============================================================
// End of useTranslation.test.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
