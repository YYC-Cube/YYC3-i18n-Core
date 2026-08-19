/**
 * file browser.ts
 * description @yyc3/i18n-core 浏览器安全入口
 *   仅导出无 Node 内建依赖(fs/path/crypto/timers)的模块,
 *   供浏览器端 Vite/Rollup 构建消费。根入口(index.ts)包含
 *   MCP/AI/CLI/安全工具等 Node 能力,在浏览器打包时会把
 *   node:fs 等 externalize 导致构建失败——浏览器项目请改用
 *   `@yyc3/i18n-core/browser`。
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.4.1
 * created 2026-08-19
 * status active
 * tags [config]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 */

// Core Engine(含 i18n/t 单例与 SUPPORTED_LOCALES/isSupportedLocale 再导出)
export { I18nEngine, i18n, t, isSupportedLocale, SUPPORTED_LOCALES } from "./lib/engine.js";
export type { I18nEngineConfig } from "./lib/engine.js";

// Cache System
export { LRUCache } from "./lib/cache.js";
export type { CacheConfig, CacheStats } from "./lib/cache.js";

// Plugin System
export { PluginManager } from "./lib/plugins.js";
export type { I18nContext, I18nPlugin } from "./lib/plugins.js";

// Built-in Plugins
export { MissingKeyReporter, PerformanceTracker, createConsoleLogger } from "./lib/plugins/index.js";

// Formatter utilities
export { formatRelativeTime, interpolate, pluralize } from "./lib/formatter.js";
export type { TranslateParams } from "./lib/formatter.js";

// Locale detection
export { detectSystemLocale, isChineseLocale, normalizeLocale } from "./lib/detector.js";
export type { LocaleDetectionResult } from "./lib/detector.js";

// RTL Utilities
export {
  RTL_LOCALES,
  createMirroredLayout,
  flipSpacing,
  getAlignment,
  getDirection,
  getOppositeAlignment,
  isRTL,
  mirrorPosition,
  setupDocumentDirection,
  transformClassForRTL,
} from "./lib/rtl-utils.js";

// Core Types
export type {
  HorizontalAlignment,
  Locale,
  RTLLocale,
  SpacingProperty,
  TextDirection,
  TranslationMap,
} from "./lib/types.js";

// ICU MessageFormat Engine
export { ICUParser } from "./lib/icu/parser.js";
export { ICUCompiler } from "./lib/icu/compiler.js";
export type { ICUCompileContext } from "./lib/icu/compiler.js";
export type {
  ICUNode,
  ICULiteral,
  ICUArgument,
  ICUPlural,
  ICUSelect,
  ICUSelectOrdinal,
  ICUNumber,
  ICUDate,
  ICUTime,
  ICUParseResult,
  ICUParseError,
  ICUPluralClause,
  ICUSelectClause,
} from "./lib/icu/types.js";
