# 🔄 OTA 语言包热更新与企业审计

> 远程语言包源 ETag 协商拉取 + 五钩子审计日志——501 方案 G4 平台化的两根企业支柱，零依赖（原生 fetch 与纯数据结构）。

## OTA 远程语言包源

语言包不再随构建冻结：远程源按需拉取，200 即热更新进引擎（下次 `t()` 读取即新值），304 零开销跳过。

```ts
import { I18nEngine } from '@yyc3/i18n-core';
import { createRemoteLocaleSource, startRemoteLocalePolling } from '@yyc3/i18n-core/ota';

const engine = new I18nEngine({ locale: 'ja' });
const source = createRemoteLocaleSource({
  url: 'https://cdn.example.com/locales/{locale}.json', // {locale} 占位，一源多语言
  headers: { authorization: 'Bearer …' },               // 认证头
});

// 单次同步：协商拉取并热更新
const result = await source.sync(engine, 'ja');
// → { changed: true, version: '"v9"', keyCount: 42, fetchedAt: … }

// 轮询热更新（错误经 onError 上报，绝不冒泡进定时器）
const polling = startRemoteLocalePolling(source, engine, 'ja', 60_000);
polling.stop();
```

**版本协商优先级**：`x-i18n-version` 响应头 → 载荷 `{ translations, version }` 的 `version` 字段 → `ETag`。If-None-Match 自动携带，命中即 304。

**安全边界**：仅允许 http/https 协议；AbortController 请求超时（默认 10s）；`fetchImpl` 可注入（测试零网络 / 自定义传输）。

**载荷形态**：裸翻译树 `{ "nav": { "home": "ホーム" } }` 或包裹 `{ "translations": {…}, "version": "1.2.0" }` 均可。

## MCP 资源 ota://status

把远程源接入 MCP 服务器后，同步状态经只读资源暴露（不注入则不声明，缺省面零变化）：

```ts
import { registerI18nTools } from '@yyc3/i18n-core/mcp';
registerI18nTools(server, engine, { otaSources: [source], otaLocales: ['ja', 'ko'] });
// → resources/read ota://status 返回各 locale 最近同步结果
```

## 企业审计日志（AuditLogger）

五钩子全审计 + 参数脱敏 + 环形缓冲 + SIEM sink——零合同变更挂既有插件钩子：

```ts
import { I18nEngine, AuditLogger } from '@yyc3/i18n-core';

const audit = new AuditLogger({
  sink: (entry) => shipToSIEM(entry), // 实时下沉（可选）
  bufferSize: 1000,                   // 环形缓冲容量（默认 500）
  redactKeys: ['password', 'token', 'secret', 'authorization', 'apikey'],
  maxValueLength: 120,                // 超长值截断
});
engine.plugins.register(audit);

engine.t('login', { user: 'Ada', password: 'hunter2' });
audit.getEntries();  // → [{ type: 'translate', key: 'login', params: { user: 'Ada', password: '***' }, … }]
audit.exportJSON();  // → { entries, count }
```

### 审计语义两条（设计决策）

1. **PII 安全**：`afterTranslate` 记录的是插值**前**的目录模板——终端用户 PII 只出现在脱敏后的 `params`，永不进入 `result`。
2. **缓存可见性**：引擎缓存命中短路钩子链——同 `(locale:key)` 仅首次解析被审计；全量请求审计需关闭缓存。

## 可观测面板

`@yyc3/i18n-dashboard` 的五面板总览直接消费这些数据源（性能/覆盖率/缺键/OTA/审计），见 [npm: @yyc3/i18n-dashboard](https://www.npmjs.com/package/@yyc3/i18n-dashboard)。

## 下一步

- [MCP 部署与运维](/guide/mcp-deploy) —— 服务端共享形态
- [翻译工作流](/guide/translation-workflow) —— 审批链配合 OTA 发布
