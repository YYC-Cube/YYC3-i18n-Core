# 🛡️ 安全模块 API

> ReDoS 防护、常量时间比较与危险操作检测参考。服务端专用（根入口导出）。

## compileSafeRegex

静态分析正则危险模式，不安全则拒绝编译：

```ts
import { compileSafeRegex } from '@yyc3/i18n-core';

function compileSafeRegex(regex: RegExp): SafeRegexCompileResult;
```

```ts
interface SafeRegexCompileResult {
  safe: boolean;
  regex?: RegExp;                 // 仅 safe 时存在
  reason?: SafeRegexRejectReason; // 仅不安全时存在
}
```

### 拒绝原因

| `SafeRegexRejectReason` | 模式特征 | 示例 |
|--------------------------|----------|------|
| `nested_repetition` | 嵌套量词 | `/(a+)+/` |
| `alternation_quantifier` | 选择与量词组合 | `/^(a|aa)*$/` |
| `deep_nesting` | 超深分组嵌套 | 多层括号叠加 |

```ts
const ok = compileSafeRegex(/^[a-z]+$/);
ok.safe && ok.regex!.test('hello'); // true

const bad = compileSafeRegex(/^(a+)+$/);
bad.safe;   // false
bad.reason; // 'nested_repetition'
```

## testSafeRegex

仅分析模式字符串，不产出 RegExp 实例（轻量预检）：

```ts
import { testSafeRegex } from '@yyc3/i18n-core';

function testSafeRegex(pattern: string): {
  safe: boolean;
  reason?: SafeRegexRejectReason;
}
```

## clearSafeRegexCache

安全正则带结果缓存；动态生成正则的高频场景可手动失效：

```ts
import { clearSafeRegexCache } from '@yyc3/i18n-core';

clearSafeRegexCache();
```

## safeEqualSecret

常量时间字符串比较，防时序攻击：

```ts
import { safeEqualSecret } from '@yyc3/i18n-core';

function safeEqualSecret(a: string, b: string): boolean;

safeEqualSecret('token123', 'token123'); // true
safeEqualSecret('token123', 'wrong');    // false
```

适用：API Token 校验、Webhook 签名比对、MCP 自定义工具的调用方鉴权。

## 危险操作检测

```ts
import {
  isDangerousOperation,
  getDangerousOperations,
  DANGEROUS_OPERATION_NAMES,
  DANGEROUS_OPERATIONS_SET,
} from '@yyc3/i18n-core';

isDangerousOperation('DROP TABLE users');    // true
isDangerousOperation('SELECT * FROM users'); // false

DANGEROUS_OPERATION_NAMES; // ['DROP', 'DELETE', 'TRUNCATE', …]
getDangerousOperations();  // DangerousOperation 明细
```

类型：`DangerousOperation`。

## 引擎内置 XSS 防护

`t()` 插值参数默认 HTML 转义：

```ts
t('hello', { name: '<b>yy</b>' });
// => "Hello, &lt;b&gt;yy&lt;/b&gt;!"
```

## 相关页

- [安全防护](/guide/security) —— 能力总览与工程实践
- [基础设施](/api/infrastructure) —— 限流/退避配套
