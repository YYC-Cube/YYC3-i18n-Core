// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file plugins.ts
 * description @yyc3/i18n-core lib/plugins.ts 模块
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[plugin]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core lib/plugins.ts 模块
 */
import { logger } from './infra/logger.js';
import type { Locale } from './types.js';

export type I18nContext = {
  locale: Locale;
  key: string;
  params?: Record<string, string>;
  result?: string;
};

export type I18nPlugin = {
  name: string;
  version?: string;

  // Lifecycle hooks
  init?: (context: I18nContext) => void | Promise<void>;
  destroy?: () => void | Promise<void>;

  // Translation hooks (executed in order)
  beforeTranslate?: (key: string, params?: Record<string, string>) => { key: string; params?: Record<string, string> } | void;
  afterTranslate?: (result: string, key: string, params?: Record<string, string>) => string | void;

  // System hooks
  onLocaleChange?: (newLocale: Locale, oldLocale: Locale) => void;
  onError?: (error: Error, context: I18nContext) => void;
  onMissingKey?: (key: string, locale: Locale) => string | void;
};

/** 默认钩子优先级——v1 插件未声明时的行为基线（小者先执行，同值保持注册序）。 */
export const DEFAULT_PLUGIN_PRIORITY = 100;

/**
 * 插件合同 v2：v1 的纯超集（v1 裸对象零改动可注册）。
 * - priority：钩子执行优先级（小者先执行，同值保持注册序）
 * - meta.capability：能力声明词汇表——供 MCP 工具与技能包（SKILL.md）发现索引
 */
export type I18nPluginV2 = I18nPlugin & {
  priority?: number;
  meta?: { capability: readonly string[] };
};

/**
 * 能力词汇表（501 G1 定、G3 落地）：插件 meta.capability 与技能包 SKILL.md
 * front matter `capability` 字段的单一事实源。冻结防篡改；新增能力须同步
 * 本表与对应 MCP 工具/技能（tests/skills 保护一致性）。
 */
export const CAPABILITY_VOCABULARY = Object.freeze([
  'extract',      // 翻译键提取（extract_keys 工具 / i18n-extract 技能）
  'audit',        // 覆盖率与缺失审计（check_missing_keys、compare_locales / i18n-audit）
  'translate',    // 翻译执行（translate_key、add_translation_key / i18n-translate）
  'quality',      // 翻译质量评估（quality_score、quality_report / i18n-quality）
  'icu',          // ICU 消息修复（auto_fix_icu / i18n-icu）
  'setup',        // 项目接入初始化（i18n-setup 技能）
  'export',       // 多格式语言包导出（export_formats 工具）
  'glossary',     // 术语表（Glossary 插件 + glossary_lookup 工具同源）
  'reporting',    // 缺失键上报（MissingKeyReporter 插件）
  'performance',  // 性能追踪（PerformanceTracker 插件）
  'logging',      // 控制台日志（console-logger）
  'audit-trail',  // 企业审计日志（AuditLogger 插件，501 G4）
] as const);

export type Capability = (typeof CAPABILITY_VOCABULARY)[number];

/** 校验 capability 列表是否全部在词汇表内；返回非法项（空数组即合法）。 */
export function unknownCapabilities(capabilities: readonly string[]): string[] {
  const known = new Set<string>(CAPABILITY_VOCABULARY);
  return [...new Set(capabilities)].filter((c) => !known.has(c));
}

/** 插件注册选项（v2）。 */
export interface RegisterPluginOptions {
  /** 钩子执行优先级，默认 DEFAULT_PLUGIN_PRIORITY；小者先执行，同值保持注册序 */
  priority?: number;
}

/**
 * 工厂形态辅助（对齐 vite/rollup 生态约定）：推导 I18nPluginV2 类型并校验
 * capability 为只读字面量元组。裸对象注册依旧兼容，文档与脚手架一律示范本形态。
 */
export function definePlugin<const T extends I18nPluginV2>(plugin: T): T {
  if (plugin.meta?.capability && !Object.isFrozen(plugin.meta.capability)) {
    (plugin.meta as { capability: readonly string[] }).capability = Object.freeze([...plugin.meta.capability]);
  }
  return plugin;
}

export class PluginManager {
  private plugins = new Map<string, I18nPlugin>();
  private hookOrder: string[] = [];
  private priorities = new Map<string, number>();

  register(plugin: I18nPlugin, options?: RegisterPluginOptions): void {
    if (this.plugins.has(plugin.name)) {
      logger.warn(`Plugin "${plugin.name}" is already registered. Overwriting.`);
    }

    this.plugins.set(plugin.name, plugin);

    const priority = options?.priority ?? (plugin as I18nPluginV2).priority ?? DEFAULT_PLUGIN_PRIORITY;
    this.priorities.set(plugin.name, priority);

    // 稳定排序插入：同优先级保持注册序（新插件追加在同优先级尾部）
    if (!this.hookOrder.includes(plugin.name)) {
      const insertAt = this.hookOrder.findIndex((n) => (this.priorities.get(n) ?? DEFAULT_PLUGIN_PRIORITY) > priority);
      if (insertAt === -1) {
        this.hookOrder.push(plugin.name);
      } else {
        this.hookOrder.splice(insertAt, 0, plugin.name);
      }
    } else {
      // 覆盖注册：按新优先级重排执行序
      this.hookOrder = this.hookOrder.filter((n) => n !== plugin.name);
      const insertAt = this.hookOrder.findIndex((n) => (this.priorities.get(n) ?? DEFAULT_PLUGIN_PRIORITY) > priority);
      if (insertAt === -1) {
        this.hookOrder.push(plugin.name);
      } else {
        this.hookOrder.splice(insertAt, 0, plugin.name);
      }
    }

    logger.info(`✅ Plugin "${plugin.name}" registered${plugin.version ? ` v${plugin.version}` : ''}${priority !== DEFAULT_PLUGIN_PRIORITY ? ` (priority ${priority})` : ''}`);
  }

  /** 钩子执行优先级（v2）。 */
  getPriority(name: string): number | undefined {
    return this.priorities.get(name);
  }

  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    if (plugin.destroy) {
      plugin.destroy();
    }

    this.plugins.delete(name);
    this.hookOrder = this.hookOrder.filter((n) => n !== name);

    logger.info(`🗑️ Plugin "${name}" unregistered`);
    return true;
  }

  getPlugin(name: string): I18nPlugin | undefined {
    return this.plugins.get(name);
  }

  getRegisteredPlugins(): string[] {
    return [...this.hookOrder];
  }

  async initAll(context: I18nContext): Promise<void> {
    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      if (plugin?.init) {
        await plugin.init(context);
      }
    }
  }

  async destroyAll(): Promise<void> {
    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      if (plugin?.destroy) {
        await plugin.destroy();
      }
    }
    this.plugins.clear();
    this.priorities.clear();
    this.hookOrder = [];
  }

  executeBeforeTranslate(key: string, params?: Record<string, string>): { key: string; params?: Record<string, string> } {
    let currentKey = key;
    let currentParams = params;

    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      if (plugin?.beforeTranslate) {
        const result = plugin.beforeTranslate(currentKey, currentParams);
        if (result) {
          currentKey = result.key;
          currentParams = result.params;
        }
      }
    }

    return { key: currentKey, params: currentParams };
  }

  executeAfterTranslate(result: string, key: string, params?: Record<string, string>): string {
    let currentResult = result;

    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      if (plugin?.afterTranslate) {
        const modified = plugin.afterTranslate(currentResult, key, params);
        if (modified !== undefined) {
          currentResult = modified as string;
        }
      }
    }

    return currentResult;
  }

  notifyLocaleChange(newLocale: Locale, oldLocale: Locale): void {
    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      plugin?.onLocaleChange?.(newLocale, oldLocale);
    }
  }

  handleError(error: Error, context: I18nContext): void {
    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      const handler = plugin?.onError;
      if (handler) {
        handler(error, context);
      }
    }
  }

  handleMissingKey(key: string, locale: Locale): string | undefined {
    let fallback: string | undefined;

    for (const name of this.hookOrder) {
      const plugin = this.plugins.get(name);
      const handler = plugin?.onMissingKey;
      if (handler) {
        const result = handler(key, locale);
        if (result !== undefined) {
          fallback = result as string | undefined;
        }
      }
    }

    return fallback;
  }
}

// ============================================================
// End of plugins.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
