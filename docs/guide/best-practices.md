# 🏆 最佳实践 {#best-practices}

> 生产环境 i18n 落地的四根支柱：结构、流程、性能与容错。

## 项目结构建议 {#project-structure}

### 语言包与代码同构

```text
src/
├── locales/
│   ├── zh-CN/
│   │   ├── index.ts        # 汇总导出
│   │   ├── common.ts       # 跨模块复用词条
│   │   ├── settings.ts     # 模块私有词条
│   │   └── errors.ts
│   ├── en/
│   └── ar/                 # 每语言同构，新增语言零决策
├── i18n/
│   ├── engine.ts           # 引擎创建与初始化（唯一出口）
│   └── detect.ts           # 语言协商逻辑
└── modules/
    └── settings/
        └── useSettingsI18n.ts   # 命名空间翻译器消费
```

### 关键原则

- **引擎单例只在 `i18n/engine.ts` 创建**，全应用从它导入，杜绝多实例状态分裂
- **语言包按模块拆文件**，与[命名空间](/guide/namespaces)一一对应；键评审时能定位到唯一文件
- **浏览器/服务端入口分离**：浏览器只 import `/browser`，Node 专属能力收敛在服务端模块
- **键名用名词空间而非英文句子**：`settings.profile.email` ✅，`emailSettingsLabel` ❌

## 翻译管理流程 {#translation-workflow}

### 四阶段闭环

```text
① 发现 → ② 补译 → ③ 校验 → ④ 合入
```

1. **发现缺失**：CI 中运行集成测试并启用 [`MissingKeyReporter`](/guide/plugins)，`exportJSON()` 产物作为制品归档；键缺失即测试失败
2. **AI 补译**：缺失清单喂给 [`AIProviderManager.batchTranslate`](/guide/ai-translation)，术语表（`glossary`）保证品牌词一致
3. **机器校验**：[`QualityEstimator`](/guide/ai-translation) 评分 + ICU 语法校验（`ICUParser` 错误列表）；阿语/俄语等复数分支齐全性人工抽查
4. **人审合入**：`qualityScore < 0.8` 或高危 `issues` 进入人审队列，通过后 `registerTranslation` 合入并更新语言包文件

### 键变更纪律

- 删除键前先跑 `check_missing_keys`（[MCP 工具](/guide/mcp-integration)可直接交给 Agent 执行）确认无引用
- 词条语义变化时新建键而非改写（`submitLabel_v2`），避免缓存与回退链脏读

### RTL 发布检查

阿拉伯语上线前：`setupDocumentDirection` 已接入语言切换链路；布局用 CSS 逻辑属性或 [RTL 工具](/guide/rtl-support)翻转；数字/日期格式经 ICU 编译验证。

## 性能优化策略 {#performance-optimization}

- **启动全量注册**：语言包静态 import 一次性 `registerTranslation`，避免运行期增量注册反复清缓存
- **度量先行**：`PerformanceTracker` 采样（生产 10%）确认 `hitRate > 95%`、P99 < 1ms，再谈调优
- **批量消费**：列表页用 `batchTranslate` / [命名空间](/guide/namespaces) `batchTranslate` 一次取回
- **包体纪律**：浏览器构建禁止 import 根入口（AI/MCP/Node 模块不进包），CI 中加包体断言
- **按需分割**：非首屏语言包与路由同级懒加载，首屏语言静态内联

完整论证见[性能优化](/guide/performance)。

## 错误处理模式 {#error-handling}

### 三层防线

```ts
const engine = new I18nEngine({
  fallbackLocale: 'en',            // ① 资源级：缺失键回退
  missingKeyHandler: (key, locale) => `[缺译:${locale}]${key}`, // ② 策略级：显式标记
  onError: (error, { key, locale }) => {                        // ③ 监控级：上报
    Sentry.captureException(error, { tags: { key, locale } });
  },
});
```

### 分级处置

| 场景 | 策略 |
|------|------|
| 开发/测试 | `debug: true` + `createConsoleLogger`，缺失键立即可见 |
| 预发 | `MissingKeyReporter` 报告非空即阻断发布 |
| 生产 | 静默回退 + `onError` 上报监控，用户侧永不裸露键名或异常堆栈 |

### 网络与外呼容错

AI 补译、远程语言包拉取等外呼一律经 [`createRetryRunner`](/guide/security)（指数退避 + 抖动），配合 `createFixedWindowRateLimiter` 防止配额击穿。

### 引擎生命周期

微前端/测试环境结束时 `await engine.destroy()` 释放缓存与调试挂载；常驻单例无需销毁。

## 下一步

- [安装与配置](/guide/installation) —— 回顾双入口与配置项
- [API 参考](/api/) —— 全量 API 速查
