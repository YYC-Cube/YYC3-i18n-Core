# 🔒 安全防护

> OWASP L4 安全矩阵：ReDoS 防护、常量时间密钥比较、危险操作检测与限流/退避基础设施。

## 安全能力总览

| 能力 | 模块 | 威胁 |
|------|------|------|
| 正则安全编译 | `compileSafeRegex` / `testSafeRegex` | ReDoS（正则拒绝服务） |
| 常量时间比较 | `safeEqualSecret` | 时序攻击 |
| 危险操作检测 | `isDangerousOperation` | SQL 注入 / 破坏性语句 |
| 固定窗口限流 | `createFixedWindowRateLimiter` | 资源滥用 |
| 指数退避重试 | `computeBackoff` / `createRetryRunner` | 雪崩放大 |
| 安全随机数 | `generateSecureToken` 等 | 弱随机可预测 |
| 插值转义 | 引擎内置 | XSS 注入 |

::: warning 导入入口
安全与基础设施模块仅从根入口 `@yyc3/i18n-core` 导出（Node.js 环境）。
:::

## ReDoS 防护

用户可输入正则的场景（如 ICU 自定义格式校验、MCP 工具参数）必须经安全编译：

```ts
import { compileSafeRegex, testSafeRegex } from '@yyc3/i18n-core';

const result = compileSafeRegex(/^[a-z]+$/);
if (result.safe && result.regex) {
  result.regex.test('hello'); // true
}

// 危险模式在编译前即被拒绝
const unsafe = compileSafeRegex(/^(a+)+$/);
console.log(unsafe.safe);   // false
console.log(unsafe.reason); // 'nested_repetition'
```

拒绝原因类型 `SafeRegexRejectReason`：

| 原因 | 模式特征 |
|------|----------|
| `nested_repetition` | 嵌套量词，如 `(a+)+` |
| `alternation_with_quantifier` | 选择分支与量词叠加 |
| `deep_nesting` | 超深分组嵌套 |

轻量检查（不编译、仅分析模式字符串）：

```ts
testSafeRegex('^(a|b)*$'); // { safe: true } 或 { safe: false, reason }
```

## 常量时间密钥比较

比较 API Token、Webhook 签名等机密值时，普通 `===` 会因提前返回泄露前缀匹配信息。`safeEqualSecret` 恒定时间扫描全文：

```ts
import { safeEqualSecret } from '@yyc3/i18n-core';

safeEqualSecret(expected, received); // true / false，耗时与内容无关
```

## 危险操作检测

对来自 Agent / 用户输入的指令文本做破坏性语句识别：

```ts
import { isDangerousOperation, DANGEROUS_OPERATION_NAMES } from '@yyc3/i18n-core';

isDangerousOperation('DROP TABLE users');  // true
isDangerousOperation('SELECT * FROM users'); // false

console.log(DANGEROUS_OPERATION_NAMES); // ['DROP', 'DELETE', 'TRUNCATE', ...]
```

适合放在 [MCP 工具](/guide/mcp-integration)的自定义 handler 入口做前置拦截。

## 限流与退避

```ts
import {
  createFixedWindowRateLimiter,
  createRetryRunner,
} from '@yyc3/i18n-core';

// 固定窗口限流：AI 翻译等昂贵外呼
const limiter = createFixedWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100,
});

if (limiter.tryAcquire()) {
  await callAiTranslate();
}

// 指数退避重试：网络抖动容错
const data = await createRetryRunner(() => fetchRemoteTranslations(), {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
});
```

详见 [基础设施 API](/api/infrastructure)。

## XSS：插值转义

`t()` 的插值参数默认 HTML 转义，恶意值无法逃逸为可执行标记：

```ts
i18n.registerTranslation('en', { hello: 'Hello, {name}!' });

t('hello', { name: '<script>alert(1)</script>' });
// => "Hello, &lt;script&gt;alert(1)&lt;/script&gt;!"
```

## 下一步

- [基础设施](/api/infrastructure) —— 限流/退避/日志完整 API
- [最佳实践](/guide/best-practices#error-handling) —— 错误处理模式
