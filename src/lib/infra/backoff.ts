// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file backoff.ts
 * description 指数退避重试
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 2.3.0
 * created 2026-04-24
 * updated 2026-04-24
 * status active
 * tags [module],[infra]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 指数退避重试
 */
import { setTimeout as delay } from "node:timers/promises";

export type BackoffPolicy = {
  initialMs: number;
  maxMs: number;
  factor: number;
  jitter: number;
};

const DEFAULT_BACKOFF_POLICY: BackoffPolicy = {
  initialMs: 1000,
  maxMs: 30000,
  factor: 2,
  jitter: 0.1,
};

export function computeBackoff(policy: BackoffPolicy, attempt: number): number {
  const base = policy.initialMs * policy.factor ** Math.max(attempt - 1, 0);
  const jitter = base * policy.jitter * Math.random();
  return Math.min(policy.maxMs, Math.round(base + jitter));
}

export async function sleepWithAbort(ms: number, abortSignal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return;
  }
  try {
    await delay(ms, undefined, { signal: abortSignal });
  } catch (err) {
    if (abortSignal?.aborted) {
      throw new Error("aborted", { cause: err });
    }
    throw err;
  }
}

export function createRetryRunner<T>(options: {
  maxAttempts?: number;
  backoffPolicy?: Partial<BackoffPolicy>;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const policy: BackoffPolicy = { ...DEFAULT_BACKOFF_POLICY, ...options.backoffPolicy };
  const shouldRetry = options.shouldRetry ?? ((_: Error, attempt: number) => attempt < maxAttempts);

  return async function retryRunner(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        if (attempt < maxAttempts) {
          const delayMs = computeBackoff(policy, attempt);
          await sleepWithAbort(delayMs);
        }
      }
    }

    throw lastError ?? new Error("retry runner exhausted without executing any attempt");
  };
}

export { DEFAULT_BACKOFF_POLICY };

// ============================================================
// End of backoff.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
