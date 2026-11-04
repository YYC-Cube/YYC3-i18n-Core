# @yyc3/i18n-dashboard

> YYC³ i18n 健康面板——`@yyc3/i18n-core` 运行时可观测性的 React 组件层（501 G4.2）

消费 `performance-tracker` / `missing-key-reporter` / `AuditLogger` / OTA 远程源与引擎统计，渲染五面板健康总览。SSR 安全（`renderToString` 单帧可得初始快照）；无样式依赖（语义化 HTML + `data-*` 锚点，宿主样式系统接管外观）。

## 安装

```bash
npm i @yyc3/i18n-dashboard
# peer: @yyc3/i18n-core >=3.4.1, react >=18
```

## 快速开始

```tsx
import { I18nEngine, PerformanceTracker, MissingKeyReporter, AuditLogger } from '@yyc3/i18n-core';
import { I18nHealthDashboard } from '@yyc3/i18n-dashboard';

const engine = new I18nEngine({ locale: 'en' });
const tracker = new PerformanceTracker();
const reporter = new MissingKeyReporter();
const audit = new AuditLogger();

engine.plugins.register(tracker.createPlugin());
engine.plugins.register(reporter.createPlugin());
engine.plugins.register(audit);

// 一屏总览：性能 / 覆盖率 / 缺失键 / OTA 同步 / 审计
<I18nHealthDashboard
  engine={engine}
  performanceTracker={tracker}
  missingKeyReporter={reporter}
  auditLogger={audit}
  otaSources={[source]}   // createRemoteLocaleSource 实例（可选）
  refreshMs={5000}        // 轮询间隔，0 = 仅 engine.subscribe 事件驱动
/>;
```

## 独立面板

`PerformancePanel` / `CoveragePanel` / `MissingKeysPanel` / `OtaPanel` / `AuditPanel` 均可脱离钩子单独消费（纯 props）。

## 翻译工作流面板（0.2.0，502 方案）

```tsx
import { WorkflowPanel, useWorkflowQueue } from '@yyc3/i18n-dashboard';

const entries = useWorkflowQueue(workflow, 5000);   // TranslationWorkflow 轮询（SSR 初始快照同步可得）
<WorkflowPanel entries={entries} />                  // 待审/待发布/待修订/已生效 四组只读视图
```

## API 一览

| 导出 | 说明 |
| ---- | ---- |
| `useI18nHealth(engine, options?)` | 健康快照钩子：`{ locale, loadedLocales, subscriberCount, coverage, performance, missingKeys, audit, ota, collectedAt }`；刷新双通道 = `engine.subscribe` 事件 + `refreshMs` 轮询 |
| `I18nHealthDashboard` | 组合根组件（五面板一屏） |
| 五面板组件 | 纯展示；数据源未接入时渲染 `data-state="empty"` 空态 |
| `WorkflowPanel` / `useWorkflowQueue`（0.2.0） | 审批队列四状态分组只读视图 / workflow 轮询钩子 |

覆盖率语义与 MCP `coverage://report` 同源：以引擎当前语言为基线，目标语言按 `.` 扁平化比对。

---
© 2026 YanYuCloudCube™（YYC³）· admin@0379.email · MIT
