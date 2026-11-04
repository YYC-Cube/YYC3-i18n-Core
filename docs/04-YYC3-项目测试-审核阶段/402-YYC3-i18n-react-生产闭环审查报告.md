---
file: 402-YYC3-i18n-react-生产闭环审查报告.md
title: YYC³ i18n-react 生产闭环审查报告 — 0.1.0 未发布预审
description: YYC³ @yyc3/i18n-react@0.1.0 发布前预审 — 类型检查失败根因、零测试缺口、pack 与消费者 SSR 冒烟实测及 README API 一致性
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-04
updated: 2026-11-04
status: stable
tags: [audit, prerelease, i18n-react, closed-loop, react]
category: report
language: zh-CN
audience: developers,managers
complexity: intermediate
project: yyc3-i18n-core
phase: testing
---

# YYC³ i18n-react 生产闭环审查报告 — 0.1.0 未发布预审

> **_YYC³_**（YanYuCloudCube™ · 注册商标）
> _言启象限 | 语枢未来_
> **_Words Initiate Quadrants, Language Serves as Core for Future_**
> _万象归元于云枢 | 深栈智启新纪元_
> **_All things converge in cloud pivot; Deep stacks ignite a new era of intelligence_**

---

## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维

---

## 一、审查对象与生产状态

| 项 | 实况 |
| ---- | ---- |
| 包名 | `@yyc3/i18n-react` |
| 本地版本 | 0.1.0 |
| npm 生产状态 | **未发布**（registry 404，实测） |
| 源文件 | 5 个（I18nProvider.tsx / useTranslation.ts / Trans.tsx / index.ts / next.ts） |
| 判据 | 同 401 报告；另加《测试策略》覆盖率 90%+ 要求 |

**总评：发布就绪度 C（不可发布）**。运行时链路本身健康（SSR 冒烟 6/6），但类型门禁失败、测试为零、README 首例代码即错——三项均在发布前必须清零。

---

## 二、生产闭环实测数值

### 2.1 门禁矩阵

| 环节 | 命令 | 结果 | 数值 |
| ---- | ---- | ---- | ---- |
| 类型检查 | `pnpm typecheck` | ❌ **FAIL（exit 2）** | **2 错误** |
| 构建 | `pnpm build`（tsup） | ✅ PASS | index.js 3.16 KB / next.js 3.9 KB；DTS 1.99 KB / 1.37 KB |
| 测试 | — | ❌ **无测试** | 测试文件 **0** 个；package.json **无 test script** |
| 覆盖率 | — | ❌ 无法产生 | 0%（策略要求 ≥ 90%） |
| pack | `npm pack` | ✅ | 6 文件（dist ×4 + package.json + README） |

### 2.2 类型检查失败根因（2 错误，逐条定位）

| # | 报错 | 定位 | 根因 |
| ---- | ---- | ---- | ---- |
| 1 | TS2554：Expected 0-1 arguments, but got 2 | `src/lib/infra/backoff.ts:47` `new Error("aborted", { cause: err })` | `Error cause` 需 lib ≥ ES2022 |
| 2 | TS2500：Property 'replaceAll' does not exist | `src/lib/utils/path-guards.ts:30` | `replaceAll` 需 lib ≥ ES2021 |

两处错误均为**根包源码**被本包 tsconfig 的 `paths` 别名（`@yyc3/i18n-core → ../../src/index.ts`）拖入本包编译上下文，而本包 `lib: ["ES2020"]` 低于根包 `ES2022`。CI 只在根包跑 `typecheck`，故该缺口长期漏检。

### 2.3 消费者 SSR 冒烟（pack tarball + 已发布 i18n-core@3.0.2 + react@18）

| 检查 | 结果 |
| ---- | ---- |
| 主入口 useTranslation / Trans / I18nProvider 导出 | 3/3 PASS |
| 子路径 `./next` 可导入 | 1/1 PASS |
| SSR：`renderToString(I18nProvider(engine) + useTranslation App)` 输出非空 | 1/1 PASS |
| 与 @yyc3/i18n-core@3.0.2 互操作（双包共存加载） | 1/1 PASS |
| **合计** | **6/6 PASS** |

> 勘误说明：首轮 SSR 失败源于冒烟脚本误用 `locale` prop（真实 API 为 `engine`，必填）——脚本修正后通过。该事件顺带暴露 R5：Provider 对缺失 engine 无友好校验。

---

## 三、发现清单与建议

| 编号 | 级别 | 发现 | 建议 |
| ---- | ---- | ---- | ---- |
| R1 | **P1** | typecheck 失败（§2.2），CI 未覆盖本包 typecheck | 双管齐下：tsconfig `lib` 升至 ES2022 对齐根包；paths 别名改指 `../../dist/index.d.ts`（消费构建产物而非源码）；CI 增 `pnpm -r typecheck` |
| R2 | **P1** | 0 测试文件、无 test script，违背《测试策略》90%+ 覆盖线 | 发布前补齐：Provider/hook/Trans/next.middleware 至少 4 个测试文件（Vitest + RTL，`@vitest-environment jsdom`） |
| R3 | **P1** | README Quick Start 首例 `new I18nEngine({ defaultLocale: 'en' })` **选项名错误**（真实字段为 `locale`，`I18nEngineConfig` 无 `defaultLocale`），消费者照抄即编译报错 | 修正为 `{ locale: 'en' }` |
| R4 | P2 | README 安装指引 `npm install @yyc3/i18n-react` 当前不可用（包未发布，registry 404） | 发布前在 README 顶部标注「未发布，暂以 workspace/git 方式引入」，发布后回收标注 |
| R5 | P3 | `I18nProvider` 对缺失 `engine` prop 报晦涩错误（`Cannot read properties of undefined (reading 'getLocale')`） | 入参校验并抛出指引用法的明确错误信息 |
| R6 | P3 | peerDeps 声明 `@yyc3/i18n-core >=2.4.0`，但冒烟实测仅对 3.0.2 验证 | 建议收紧为 `>=3.0.0` 或补 2.4.x 兼容实测 |

### README 一致性（105 行实查）

| 项 | 声明 | 实况 | 结论 |
| ---- | ---- | ---- | ---- |
| `createI18nMiddleware({ defaultLocale })` | next.ts `I18nMiddlewareConfig.defaultLocale` | 存在 | ✅ 一致 |
| `createServerEngine(locale)` | next.ts 导出、签名一致 | 存在 | ✅ 一致 |
| API 表 5 项导出 | 逐一核对 src | 全部存在 | ✅ 一致 |
| `new I18nEngine({ defaultLocale })` | 引擎配置无此字段 | ❌ | **R3** |
| 安装命令 | npm 安装 | registry 404 | ❌ **R4** |

---

## 四、结论

1. **运行时质量可用**：构建、pack、SSR 冒烟、与核心包互操作全部通过，产物轻量（< 4 KB/入口）。
2. **工程门禁不达标**：类型检查红、测试为零、CI 覆盖缺口——三者叠加意味着该包当前**不满足团队发布标准**，维持未发布状态是正确的。
3. **发布路径**：修 R1→R3（半天量级）→ 补 R2 测试 → README 双修（R3/R4）→ 再走 `pnpm -r typecheck && vitest && pack` 闭环后发布 0.2.0。

---

---

## 五、v1.1.0 复测结果（修复后实测，2026-11-04）

| 项 | 修复前 | 修复后实测 | 状态 |
| ---- | ---- | ---- | ---- |
| R1 typecheck | 2 错误（lib ES2020 拖入根包 ES2022 源码） | tsconfig `target/lib` 对齐 **ES2022**；实测 `tsc --noEmit` **0 错误**；CI 升级为 `pnpm -r typecheck` 全仓覆盖 | ✅ |
| R2 测试为零 | 0 文件 0 用例 | 新增 **4 个测试文件 / 21 用例全绿**（I18nProvider 4 + useTranslation 4 + Trans 4 + next 9），vitest.config 就位，CI 增加 `pnpm --filter @yyc3/i18n-react test` | ✅ |
| R3 README 选项名 | `defaultLocale`（不存在） | 修正为 `{ locale: 'en' }` 并注明显式 locale 语义与 SSR 懒加载注意事项 | ✅ |
| R4 安装指引 | npm 安装（404） | 顶部增加「未发布」状态说明与 workspace/git 引用方式 | ✅ |
| R5 Provider 校验 | 晦涩 undefined 崩溃 | 缺失/非法 engine 抛含用法指引的明确错误（有测试覆盖） | ✅ |
| R6 peerDeps | `>=2.4.0` | 收紧为 `>=3.1.0`（显式 locale 语义依赖核心包 C7 修复） | ✅ |
| R7（新发现）workspace 链接 | peer 被 pnpm 自动安装为 npm 3.0.2 副本，测试跑在旧产物上 | devDependencies 增加 `"@yyc3/i18n-core": "workspace:*"`，实测解析至本地包 | ✅ |
| T1（新发现）Trans fallback | 引擎缺键返回键名穿透，fallback 永不生效 | 组件按 `text === id` 判定缺失，fallback→id 链生效（有测试覆盖） | ✅ |
| 回归 | — | 构建 ✅、SSR 冒烟 **6/6**、与 npm 已发布 3.0.2 互操作 ✅ | ✅ |

**发布就绪度 C → B+**：工程门禁与文档全部达标；首发前仅需维护者定夺版本号（建议 0.2.0）并待核心包 3.1.0 发布后联动首发。

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-04 | 首次发布：@yyc3/i18n-react@0.1.0 预审（typecheck 2 错根因、0 测试、SSR 冒烟 6/6、README 2 处不符、6 项发现） | YYC³ Team |
| v1.1.0 | 2026-11-04 | 修复复测：R1-R6 全闭环 + 新发现 R7（workspace 链接）、T1（Trans fallback）修复；21/21 测试全绿、SSR 冒烟 6/6 | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
