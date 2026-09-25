# ⚡ 性能优化

> LRU 缓存 + 性能追踪插件，翻译调用 P99 亚毫秒。

## 缓存工作原理

引擎内置 LRU 缓存，以 `locale:key` 为键存储**未插值的模板原文**：

- `t()` 首次调用：资源解析（含回退链）→ 写入缓存
- 后续调用：O(1) 命中，仅执行轻量插值/ICU 编译
- `registerTranslation` 覆盖某语言时自动清空缓存，保证一致性

## 缓存调优

```ts
import { I18nEngine } from '@yyc3/i18n-core/browser';

const engine = new I18nEngine({
  cache: {
    maxSize: 2000,        // 大键量应用调大（默认 1000）
    ttl: 10 * 60 * 1000,  // 热数据延长过期（默认 5 分钟）
  },
});
```

`cache` 属性公开可读，可独立操作：

```ts
engine.cache.getStats(); // { size, maxSize, hits, misses, hitRate, ... }
engine.cache.clear();    // 手动失效（如热更新资源后）
```

## 用 PerformanceTracker 度量

凭感觉调优不如先测量。内置性能追踪插件提供命中率与分位数延迟：

```ts
import { PerformanceTracker } from '@yyc3/i18n-core/browser';

const tracker = new PerformanceTracker({
  slowThreshold: 10,  // 超过 10ms 记为慢查询
  samplingRate: 0.1,  // 生产环境 10% 采样
});

i18n.plugins.register(tracker.createPlugin());

tracker.getCacheHitRate();   // 期望 > 95%
tracker.getPercentile(50);   // P50 延迟（毫秒）
tracker.getPercentile(99);   // P99 延迟（毫秒）
tracker.generateReport();    // 完整报告（接入监控告警）
```

## 优化清单

### 1. 提升命中率

- 语言包在启动时**一次性全量注册**，避免运行期反复 `registerTranslation` 清缓存
- 稳态应用的 `hitRate` 应接近 100%；偏低通常是键被动态拼接造成——改用[命名空间](/guide/namespaces)收敛

### 2. 减少模板字符串开销

- ICU 消息在缓存命中后仍需编译；超热点键（每帧渲染）可预编译结果自行缓存
- 大列表翻译用 `batchTranslate` 一次取回，避免渲染路径上的逐键调用

### 3. 控制包体

- 浏览器端始终走 `@yyc3/i18n-core/browser`，Node 专属模块（AI/MCP/CLI/安全）不进包
- 全库 tree-shakable，按需导入：只引 `i18n, t` 时增量极小

### 4. 渲染层节流

- `subscribe` 回调中重渲染整树前，先比对 locale 是否真的变化
- React 项目直接使用官方绑定 [`@yyc3/i18n-react`](/guide/react-integration)，内部已做 Context 隔离与回调稳定化

### 5. 网络与构建期

- 语言包与代码同构建产物分割，按 locale 懒加载
- CI 中用 `MissingKeyReporter` 报告防止线上回退到键名（触发回退链 = 额外开销）

## 下一步

- [插件系统](/guide/plugins) —— PerformanceTracker 完整配置
- [缓存系统 API](/api/cache) —— LRUCache 类参考
