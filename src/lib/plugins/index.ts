// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file index.ts
 * description @yyc3/i18n-core 模块入口
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [config],[plugin]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief @yyc3/i18n-core 模块入口
 */
export { createConsoleLogger } from "./console-logger.js";
export type { ConsoleLoggerConfig } from "./console-logger.js";

export { MissingKeyReporter } from "./missing-key-reporter.js";
export type { MissingKeyReporterConfig } from "./missing-key-reporter.js";

export { PerformanceTracker } from "./performance-tracker.js";
export type { PerformanceTrackerConfig, PerformanceMetrics } from "./performance-tracker.js";

// 插件合同 v2（3.2.0 起，501 G1）+ 能力词汇表（3.3.0 起，501 G3——技能包同源）
export {
  definePlugin, DEFAULT_PLUGIN_PRIORITY,
  CAPABILITY_VOCABULARY, unknownCapabilities
} from "../plugins.js";
export type { I18nPlugin, I18nPluginV2, RegisterPluginOptions, Capability } from "../plugins.js";

// 术语表（3.2.0 起，501 G2——与 MCP glossary_lookup 同源）
export { Glossary } from "../glossary.js";
export type { GlossaryEntry, GlossaryViolation, GlossaryCheckResult } from "../glossary.js";

// 企业审计日志（3.4.0 起，501 G4——五钩子审计 + 参数脱敏 + 环形缓冲）
export { AuditLogger } from "./audit-logger.js";
export type { AuditEntry, AuditEventType, AuditLoggerConfig } from "./audit-logger.js";

// ============================================================
// End of index.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
