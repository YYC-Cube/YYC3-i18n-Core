// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file remote-locale.ts
 * description OTA 语言包远程源 — fetch + ETag/版本协商 + 轮询热更新（501 G4）
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.4.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[ota]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 零依赖（原生 fetch，engines ≥20.19 基线已含 Node/浏览器双端）；
 *       fetchImpl 可注入——测试零网络，宿主可换自定义传输
 */
import type { I18nEngine } from "../engine.js";
import type { Locale, TranslationMap } from "../types.js";

/** 远程语言包响应载荷：裸翻译树或 { translations, version? } 包裹形态。 */
export type RemoteLocalePayload = TranslationMap | { translations: TranslationMap; version?: string };

export interface RemoteLocaleSourceConfig {
  /** URL 或含 {locale} 占位符的模板（如 https://cdn.example.com/locales/{locale}.json）。 */
  url: string;
  /** 附加请求头（认证 token 等；If-None-Match 由源自动管理，勿重复传）。 */
  headers?: Record<string, string>;
  /** fetch 实现注入（默认 globalThis.fetch；测试桩/自定义传输入口）。 */
  fetchImpl?: typeof fetch;
  /** 单次请求超时（默认 10_000ms；AbortController 实现）。 */
  requestTimeoutMs?: number;
}

export interface RemoteSyncResult {
  locale: Locale;
  /** 200 且载荷合法 → true（已热更新进引擎）；304 → false。 */
  changed: boolean;
  /** 协商版本：响应 ETag 或载荷 version 字段或 x-i18n-version 头。 */
  version: string | null;
  fetchedAt: number;
  /** 翻译树键数（304 时为上次值）。 */
  keyCount: number;
}

export interface RemoteLocaleSource {
  /** 单次同步：协商拉取并热更新（registerTranslation → 订阅者即时生效）。 */
  sync(engine: I18nEngine, locale: Locale): Promise<RemoteSyncResult>;
  /** 指定 locale 最近一次同步结果（未同步过为 null）。 */
  lastSync(locale: Locale): RemoteSyncResult | null;
}

const DEFAULT_TIMEOUT_MS = 10_000;

/** URL 安全校验：仅 http/https（拦截 file:/data: 等协议注入）。 */
function assertHttpUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid locale URL: ${url}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported protocol "${parsed.protocol}"（仅 http/https）: ${url}`);
  }
}

/** 载荷形态归一：裸树或 { translations } 包裹 → 翻译树。 */
function extractTranslations(payload: RemoteLocalePayload): TranslationMap {
  const wrapped = payload as { translations?: unknown };
  const map = (wrapped && typeof wrapped === "object" && "translations" in wrapped
    ? wrapped.translations
    : payload) as TranslationMap;
  if (!map || typeof map !== "object" || Array.isArray(map)) {
    throw new Error("Locale payload must be an object (translation map or { translations })");
  }
  return map;
}

function countKeys(map: TranslationMap): number {
  return Object.keys(map).length;
}

/**
 * 创建远程语言包源（501 G4 OTA）：ETag/If-None-Match 协商，200 才热更新。
 * 同一源可对多个 locale 复用（url 模板 {locale} 占位；每 locale 独立 ETag 状态）。
 */
export function createRemoteLocaleSource(config: RemoteLocaleSourceConfig): RemoteLocaleSource {
  const doFetch = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const timeoutMs = config.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const etags = new Map<Locale, string | null>();
  const lastResults = new Map<Locale, RemoteSyncResult>();

  async function sync(engine: I18nEngine, locale: Locale): Promise<RemoteSyncResult> {
    const url = config.url.includes("{locale}")
      ? config.url.replaceAll("{locale}", encodeURIComponent(locale))
      : config.url;
    assertHttpUrl(url);

    const etag = etags.get(locale) ?? null;
    const headers: Record<string, string> = { ...config.headers };
    if (etag) headers["If-None-Match"] = etag;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await doFetch(url, { headers, signal: controller.signal });
    } catch (err) {
      throw new Error(`Locale fetch failed (${locale}): ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 304 && etag) {
      const previous = lastResults.get(locale);
      const result: RemoteSyncResult = {
        locale,
        changed: false,
        version: etag,
        fetchedAt: Date.now(),
        keyCount: previous?.keyCount ?? 0,
      };
      lastResults.set(locale, result);
      return result;
    }

    if (!response.ok) {
      throw new Error(`Locale fetch ${response.status} (${locale}): ${url}`);
    }

    const bodyVersion = response.headers?.get?.("x-i18n-version") ?? null;
    const payload = (await response.json()) as RemoteLocalePayload;
    const translations = extractTranslations(payload);
    engine.registerTranslation(locale, translations);

    const version = bodyVersion
      ?? ((payload as { version?: unknown }).version !== undefined
        ? String((payload as { version: unknown }).version)
        : null)
      ?? response.headers?.get?.("etag")
      ?? null;
    etags.set(locale, response.headers?.get?.("etag") ?? version);
    const result: RemoteSyncResult = { locale, changed: true, version, fetchedAt: Date.now(), keyCount: countKeys(translations) };
    lastResults.set(locale, result);
    return result;
  }

  return {
    sync,
    lastSync: (locale: Locale) => lastResults.get(locale) ?? null,
  };
}

/**
 * 轮询热更新：按 intervalMs 周期 sync；错误经 onError 上报（默认 logger.warn），
 * 绝不冒泡进定时器。返回 stop() 句柄。
 */
export interface PollingHandle {
  stop(): void;
}

export function startRemoteLocalePolling(
  source: RemoteLocaleSource,
  engine: I18nEngine,
  locale: Locale,
  intervalMs: number,
  onError?: (error: Error) => void,
): PollingHandle {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error(`intervalMs must be positive: ${intervalMs}`);
  }
  const timer = setInterval(() => {
    void source.sync(engine, locale).catch((err: unknown) => {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    });
  }, intervalMs);
  return { stop: () => clearInterval(timer) };
}

// ============================================================
// End of remote-locale.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
