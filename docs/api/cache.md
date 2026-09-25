# 💾 缓存系统

> `LRUCache` 类与引擎缓存的完整参考。

## 引擎内置缓存

引擎实例的 `cache` 属性公开，`t()` 内部自动读写：

- 键格式：`{locale}:{key}`
- 值：未插值的模板原文（插值/ICU 编译在每次调用时执行）
- 失效时机：`registerTranslation` 同语言覆盖、条目 TTL 过期、容量淘汰

```ts
engine.cache.getStats();  // 运行期观测
engine.cache.clear();     // 手动全量失效
```

## LRUCache 类

引擎外部也可独立使用（两个入口均有导出）：

```ts
import { LRUCache } from '@yyc3/i18n-core/browser';

const cache = new LRUCache<string>({ maxSize: 500, defaultTTL: 300_000 });
```

### 构造配置

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxSize` | `number` | `1000` | 最大条目数；超出时淘汰最近最少使用条目 |
| `defaultTTL` | `number` | `300000` | 默认过期时间（毫秒） |

### 方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `get` | `get(key) => V \| null` | 命中即提升为最新使用；过期返回 `null` |
| `set` | `set(key, value, ttl?)` | 写入；可选覆盖单条 TTL；满容量时先淘汰 |
| `has` | `has(key) => boolean` | 存在性检查（含过期判定） |
| `delete` | `delete(key) => boolean` | 删除指定键 |
| `clear` | `clear()` | 清空全部 |
| `getStats` | `getStats() => CacheStats` | 统计快照 |

### 使用示例

```ts
cache.set('a', '1');
cache.set('b', '2', 5_000); // 该条 5 秒后过期

cache.get('a');   // '1'（命中）
cache.get('zzz'); // null（未命中）

cache.getStats();
// {
//   size: 2,
//   maxSize: 500,
//   hits: 1,
//   misses: 1,
//   hitRate: 0.5,
// }
```

## 统计口径

- `hits`：`get` 命中且未过期的次数
- `misses`：未命中或已过期的次数
- `hitRate`：`hits / (hits + misses)`
- 引擎 `getStats().cache` 即为该统计的透传

## 调优指引

- 大键量应用调高 `maxSize`（键总数 × 语言数的 1.5–2 倍起）
- 稳态热数据可延长 `ttl`；语言包热更新场景保持默认并依赖 `registerTranslation` 自动清缓存
- 观测接入见[性能优化](/guide/performance)的 PerformanceTracker 一节

## 相关页

- [插件 API](/api/plugins) —— PerformanceTracker 指标
- [类型定义](/api/types) —— `CacheConfig` / `CacheStats`
