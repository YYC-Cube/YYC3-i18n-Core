// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file audit-logger.ts
 * description 企业审计日志插件（501 G4）——五钩子全审计 + 参数脱敏 + 环形缓冲
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.4.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[plugin],[audit]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 零合同变更：挂既有 v1/v2 钩子（before/afterTranslate、onError、
 *       onMissingKey、onLocaleChange、init/destroy）；params 脱敏后入缓冲。
 *       审计语义两条：①afterTranslate 记录的是插值前的目录模板（终端用户
 *       PII 只出现在脱敏后的 params，不进 result）——审计面 PII 安全；
 *       ②引擎缓存命中短路钩子链——同 (locale:key) 仅首次解析被审计，
 *       全量请求审计须关闭缓存或记录缓存命中率另行补偿。
 */
import type { I18nContext, I18nPlugin } from "../plugins.js";
import type { Locale } from "../types.js";

/** 审计事件类型：翻译请求完成 / 缺键 / 错误 / 语言切换 / 插件生命周期。 */
export type AuditEventType = "translate" | "missing" | "error" | "locale-change" | "lifecycle";

export interface AuditEntry {
  ts: number;
  type: AuditEventType;
  locale: Locale;
  key?: string;
  result?: string;
  /** 脱敏后的插值参数（redactKeys 命中项值为 ***）。 */
  params?: Record<string, string>;
  latencyMs?: number;
  error?: string;
  detail?: string;
}

export interface AuditLoggerConfig {
  /** 实时下沉（SIEM/远程审计管道）；未配置时仅入环形缓冲。 */
  sink?: (entry: AuditEntry) => void;
  /** 环形缓冲容量（默认 500；0 视为 1）。 */
  bufferSize?: number;
  /** 需脱敏的参数键（小写比较；默认 password/token/secret/authorization/apikey）。 */
  redactKeys?: string[];
  /** 单值截断长度（默认 120；防超长注入审计面）。 */
  maxValueLength?: number;
}

const DEFAULT_REDACT_KEYS = ["password", "token", "secret", "authorization", "apikey"];
const DEFAULT_BUFFER_SIZE = 500;
const DEFAULT_MAX_VALUE_LENGTH = 120;

const now = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

export class AuditLogger implements I18nPlugin {
  /** v2 能力声明（与 SKILL.md/词汇表同源）。 */
  readonly meta = { capability: Object.freeze(["audit-trail"] as const) };

  private config: Required<AuditLoggerConfig>;
  private buffer: AuditEntry[] = [];
  private head = 0;
  private filled = 0;
  /** 同步 t() 调用的计时栈（before→after LIFO，无并发交错）。 */
  private startStack: number[] = [];
  private currentLocale: Locale = "en";

  name = "audit-logger";
  version = "1.0.0";

  constructor(config: AuditLoggerConfig = {}) {
    this.config = {
      sink: config.sink ?? (() => { }),
      bufferSize: Math.max(1, config.bufferSize ?? DEFAULT_BUFFER_SIZE),
      redactKeys: config.redactKeys ?? DEFAULT_REDACT_KEYS,
      maxValueLength: config.maxValueLength ?? DEFAULT_MAX_VALUE_LENGTH,
    };
  }

  /** I18nPlugin 生命周期。 */
  init = (context: I18nContext): void => {
    this.currentLocale = context.locale;
    this.record({ type: "lifecycle", detail: "audit-logger init" });
  };

  destroy = (): void => {
    this.record({ type: "lifecycle", detail: "audit-logger destroy" });
  };

  beforeTranslate = (key: string): void => {
    this.startStack.push(now());
    void key;
  };

  afterTranslate = (result: string, key: string, params?: Record<string, string>): string => {
    const startedAt = this.startStack.pop();
    this.record({
      type: "translate",
      key,
      result: this.truncate(result),
      params: this.redact(params),
      latencyMs: startedAt !== undefined ? Math.max(0, now() - startedAt) : undefined,
    });
    return result;
  };

  onMissingKey = (key: string, locale: Locale): void => {
    this.record({ type: "missing", key, locale });
  };

  onError = (error: Error, context: I18nContext): void => {
    this.record({ type: "error", key: context.key, error: this.truncate(error.message), locale: context.locale });
  };

  onLocaleChange = (newLocale: Locale): void => {
    this.currentLocale = newLocale;
    this.record({ type: "locale-change" });
  };

  /** 缓冲快照（时间升序拷贝）。 */
  getEntries(): AuditEntry[] {
    const out: AuditEntry[] = [];
    for (let i = 0; i < this.filled; i += 1) {
      const entry = this.buffer[(this.head + i) % this.buffer.length];
      if (entry) out.push(entry);
    }
    return out;
  }

  exportJSON(): string {
    return JSON.stringify({ entries: this.getEntries(), count: this.filled }, null, 2);
  }

  clear(): void {
    this.buffer = [];
    this.head = 0;
    this.filled = 0;
  }

  private record(entry: Omit<AuditEntry, "ts" | "locale"> & { locale?: Locale }): void {
    const full: AuditEntry = { ts: Date.now(), locale: entry.locale ?? this.currentLocale, ...entry };
    if (this.buffer.length === 0) {
      this.buffer = new Array<AuditEntry>(this.config.bufferSize);
    }
    if (this.filled < this.buffer.length) {
      this.buffer[this.filled] = full;
      this.filled += 1;
    } else {
      this.buffer[this.head] = full;
      this.head = (this.head + 1) % this.buffer.length;
    }
    this.config.sink(full);
  }

  private redact(params?: Record<string, string>): Record<string, string> | undefined {
    if (!params) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      out[k] = this.config.redactKeys.includes(k.toLowerCase()) ? "***" : this.truncate(String(v));
    }
    return out;
  }

  private truncate(value: string): string {
    return value.length > this.config.maxValueLength ? `${value.slice(0, this.config.maxValueLength)}…` : value;
  }
}

// ============================================================
// End of audit-logger.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
