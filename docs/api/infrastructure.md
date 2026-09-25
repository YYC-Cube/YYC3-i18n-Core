# ⚙️ 基础设施 API

> 高可用组件：退避重试、限流、结构化日志、安全随机与通用工具。服务端专用（根入口导出）。

## 退避与重试

```ts
import {
  computeBackoff,
  createRetryRunner,
  sleepWithAbort,
  DEFAULT_BACKOFF_POLICY,
} from '@yyc3/i18n-core';
```

### computeBackoff

```ts
function computeBackoff(attempt: number, policy?: BackoffPolicy): number;
```

```ts
interface BackoffPolicy {
  baseDelayMs?: number;  // 默认 1000
  maxDelayMs?: number;   // 默认 30000
  multiplier?: number;   // 默认 2
  jitter?: boolean;      // 默认 true（防惊群）
}
```

### createRetryRunner

```ts
async function createRetryRunner<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;          // 默认 3
    baseDelayMs?: number;
    maxDelayMs?: number;
    retryableErrorFilter?: (error: Error) => boolean;
  },
): Promise<T>;
```

```ts
const data = await createRetryRunner(() => fetchRemoteBundle(), {
  maxRetries: 3,
  retryableErrorFilter: (e) => e.name === 'TimeoutError',
});
```

### sleepWithAbort

可中断的延时，配合 `AbortController` 实现优雅停机。

## 固定窗口限流

```ts
import { createFixedWindowRateLimiter } from '@yyc3/i18n-core';

const limiter = createFixedWindowRateLimiter({
  windowMs: 60_000,   // 窗口
  maxRequests: 100,   // 窗口内上限
});

limiter.tryAcquire();  // true = 放行
limiter.getStats();
// { remaining, resetTime, totalRequests }
```

类型：`FixedWindowRateLimiter`。

## 结构化日志

```ts
import {
  logger,
  createLogger,
  setLogLevel,
  getLogLevel,
} from '@yyc3/i18n-core';

setLogLevel('debug');   // trace | debug | info | warn | error | silent

logger.info('engine ready', { locales: ['zh-CN', 'en'] });
logger.error('bundle load failed');

const custom = createLogger({ name: 'my-app', level: 'debug' });
```

类型：`LogLevel` / `Logger`。

## 安全随机

```ts
import {
  generateSecureUuid,
  generateSecureToken,
  generateSecureHex,
  generateSecureInt,
  generateSecureFraction,
} from '@yyc3/i18n-core';

generateSecureUuid();       // v4 UUID（crypto 级熵源）
generateSecureToken(32);    // 32 字节高熵令牌
generateSecureHex(16);      // 16 字符十六进制
generateSecureInt(1, 100);  // [1, 100] 均匀整数
generateSecureFraction();   // [0, 1) 浮点
```

## 通用工具

### 时间格式化

```ts
import { formatRelativeTimestamp, formatTimeAgo } from '@yyc3/i18n-core';

formatTimeAgo(Date.now() - 3_600_000); // "1 hour ago"（选项见 FormatTimeAgoOptions）
```

### 路径防护（穿越预防）

```ts
import {
  isPathInside,
  isNotFoundPathError,
  isSymlinkOpenError,
  hasNodeErrorCode,
  isNodeError,
  normalizeWindowsPathForComparison,
} from '@yyc3/i18n-core';

isPathInside(userPath, baseDir); // 拒绝越界路径，MCP 文件类工具必备
```

### JSON 文件

```ts
import {
  loadJsonFile,
  saveJsonFile,
  deleteJsonFile,
  jsonFileExists,
} from '@yyc3/i18n-core';

await saveJsonFile('./locales/zh-CN.json', bundle);
const bundle = await loadJsonFile('./locales/zh-CN.json');
```

## 相关页

- [安全防护](/guide/security) —— 限流/退避在安全矩阵中的角色
- [Node.js 后端集成](/guide/nodejs-backend) —— 服务端整体用法
