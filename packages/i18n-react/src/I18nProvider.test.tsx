// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * @file I18nProvider.test.tsx
 * @description I18nProvider 单元测试 — 入参校验、context 注入与 locale 订阅
 * @author YYC³ Team
 * @version 1.0.0
 * @test-target src/I18nProvider.tsx
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { I18nEngine } from '@yyc3/i18n-core';
import { I18nProvider, useI18nContext } from './I18nProvider';
import { useTranslation } from './useTranslation';

function Probe() {
  const ctx = useI18nContext();
  return <div data-testid="probe">{`${ctx.locale}|${ctx.ready}|${ctx.t('common.health')}`}</div>;
}

describe('I18nProvider', () => {
  it('缺失 engine prop 时抛出含指引的明确错误', () => {
    expect(() =>
      renderToString(
        <I18nProvider engine={undefined as unknown as I18nEngine}>{<Probe />}</I18nProvider>,
      ),
    ).toThrow(/requires an `engine` prop/);
  });

  it('engine 非法（无 getLocale）时同样拒绝', () => {
    expect(() =>
      renderToString(<I18nProvider engine={{ fake: true } as unknown as I18nEngine}>{<Probe />}</I18nProvider>),
    ).toThrow(/requires an `engine` prop/);
  });

  it('注入 context：显式 locale 生效，SSR 下译文回退 en（zh-CN 未及懒加载）', () => {
    const engine = new I18nEngine({ locale: 'zh-CN' });
    const html = renderToString(
      <I18nProvider engine={engine}>
        <Probe />
      </I18nProvider>,
    );
    // 显式 locale 不被覆盖（引擎修复后 zh-CN 保留）；SSR 同步渲染 ready=false；
    // zh-CN 懒加载未完成 → resolveTranslation 回退 en 内置译文 "Health"
    expect(html).toContain('zh-CN');
    expect(html).toContain('|false|');
    expect(html).toContain('Health');
  });

  it('未包裹 Provider 时 useTranslation 报出用法指引错误', () => {
    function Bare() {
      useTranslation();
      return null;
    }
    expect(() => renderToString(<Bare />)).toThrow(/must be used within an <I18nProvider>/);
  });
});

// ============================================================
// End of I18nProvider.test.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
