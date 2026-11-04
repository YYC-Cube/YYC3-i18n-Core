// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * @file next.test.ts
 * @description Next.js 集成单元测试 — middleware 语言判定优先级与 createServerEngine
 * @author YYC³ Team
 * @version 1.0.0
 * @test-target src/next.ts
 */
import { describe, it, expect } from 'vitest';
import { createI18nMiddleware, createServerEngine, DEFAULT_LOCALES } from './next';

const mw = createI18nMiddleware({ defaultLocale: 'en' });

function req(pathname: string, opts: { cookie?: string; acceptLanguage?: string } = {}) {
  return {
    nextUrl: { pathname },
    cookies: { get: (name: string) => (name === 'yyc3-locale' && opts.cookie ? { value: opts.cookie } : undefined) },
    headers: { get: (name: string) => (name === 'accept-language' ? opts.acceptLanguage ?? null : null) },
  };
}

describe('createI18nMiddleware', () => {
  it('URL 前缀命中：/zh-CN/about → zh-CN，不重定向', () => {
    expect(mw(req('/zh-CN/about'))).toEqual({ locale: 'zh-CN', shouldRedirect: false });
  });

  it('cookie 次优先：/about + yyc3-locale=ja → ja', () => {
    expect(mw(req('/about', { cookie: 'ja' })).locale).toBe('ja');
  });

  it('Accept-Language 第三优先：zh-TW,zh;q=0.9 → zh-TW', () => {
    expect(mw(req('/about', { acceptLanguage: 'zh-TW,zh;q=0.9,en;q=0.8' })).locale).toBe('zh-TW');
  });

  it('基础语言匹配：zh → zh-CN（DEFAULT_LOCALES 首个 zh 前缀）', () => {
    expect(mw(req('/about', { acceptLanguage: 'zh' })).locale).toBe('zh-CN');
  });

  it('q 值排序：en;q=0.3,ja;q=0.9 → ja', () => {
    expect(mw(req('/about', { acceptLanguage: 'en;q=0.3,ja;q=0.9' })).locale).toBe('ja');
  });

  it('全部未命中回退 defaultLocale=en', () => {
    expect(mw(req('/about'))).toEqual({ locale: 'en', shouldRedirect: false });
  });

  it('自定义 locales 生效（仅 en/ko 时 zh 请求回退默认）', () => {
    const custom = createI18nMiddleware({ locales: ['en', 'ko'], defaultLocale: 'en' });
    expect(custom(req('/zh-CN/x')).locale).toBe('en');
    expect(custom(req('/ko/x')).locale).toBe('ko');
  });

  it('DEFAULT_LOCALES 覆盖 10 语言', () => {
    expect(DEFAULT_LOCALES.length).toBe(10);
  });
});

describe('createServerEngine', () => {
  it('返回设置好 locale 的引擎实例', async () => {
    const engine = await createServerEngine('zh-CN');
    expect(engine.getLocale()).toBe('zh-CN');
  });
});

// ============================================================
// End of next.test.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
