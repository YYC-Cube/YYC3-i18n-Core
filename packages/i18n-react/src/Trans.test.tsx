// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * @file Trans.test.tsx
 * @description Trans 组件单元测试 — ICU 插值、JSX 组件插值、fallback 行为
 * @author YYC³ Team
 * @version 1.0.0
 * @test-target src/Trans.tsx
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { I18nEngine } from '@yyc3/i18n-core';
import { I18nProvider } from './I18nProvider';
import { Trans } from './Trans';

function renderWith(engine: I18nEngine, node: React.ReactNode) {
  return renderToString(<I18nProvider engine={engine}>{node}</I18nProvider>);
}

describe('Trans', () => {
  const engine = new I18nEngine({ locale: 'en' });
  engine.registerTranslation('en', {
    docs: { read: 'Read the <link>documentation</link> for v{version}' },
    plain: { hello: 'Hello {name}' },
  });

  it('纯文本插值：values 注入 ICU 参数', () => {
    const html = renderWith(engine, <Trans id="plain.hello" values={{ name: 'YYC³' }} />);
    expect(html).toContain('Hello YYC³');
  });

  it('JSX 组件插值：<link> 文本替换为组件并保留内容', () => {
    const html = renderWith(
      engine,
      <Trans id="docs.read" values={{ version: '2.0' }} components={{ link: <a href="/docs" /> }} />,
    );
    expect(html).toContain('<a href="/docs">');
    expect(html).toContain('documentation</a>');
    expect(html).toContain('v2.0');
  });

  it('键缺失时回退 fallback，再回退 id', () => {
    const html = renderWith(engine, <Trans id="missing.key" fallback="FB" />);
    expect(html).toContain('FB');
    const html2 = renderWith(engine, <Trans id="missing.key" />);
    expect(html2).toContain('missing.key');
  });

  it('无 components 时不做 JSX 解析，直接输出译文（SSR 转义）', () => {
    const html = renderWith(engine, <Trans id="docs.read" values={{ version: '9' }} />);
    expect(html).toContain('&lt;link&gt;documentation&lt;/link&gt;');
    expect(html).toContain('v9');
  });
});

// ============================================================
// End of Trans.test.tsx | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
