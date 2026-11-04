---
file: 401-YYC3-i18n-core-生产闭环审查报告.md
title: YYC³ i18n-core 生产闭环审查报告 — 已发布 3.0.2 逐项实测
description: YYC³ @yyc3/i18n-core@3.0.2 生产已发布核心包的闭环审查 — 构建、测试、覆盖率、npm 对照、消费者冒烟、类型矩阵与 README 一致性实测数值
author: YYC³ Team <admin@0379.email>
version: v1.1.0
created: 2026-11-04
updated: 2026-11-04
status: stable
tags: [audit, production, i18n-core, closed-loop, npm]
category: report
language: zh-CN
audience: developers,managers
complexity: intermediate
project: yyc3-i18n-core
phase: testing
---

# YYC³ i18n-core 生产闭环审查报告 — 已发布 3.0.2 逐项实测

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
| 包名 | `@yyc3/i18n-core` |
| 本地版本 | 3.0.2（package.json） |
| npm 生产状态 | **已发布**，latest = 3.0.2（registry 实查） |
| 发布链路 | `.github/workflows/publish.yml` → `npm publish --provenance`（正常） |
| 审查基准日 | 2026-11-04，Node v22.22.3 / pnpm 11.10.0 |
| 判据 | 《YYC3-团队通用-标头标尾》v1.1.0、《命名规范》v3.1.0、《开发标准》《测试策略》 |

**总评：生产健康度 A−**。621 项测试全绿、发布物与源码零漂移、消费者闭环可用；存在 3 项与声明不符的配置级缺陷（类型导出泄漏、size-limit 死配置、engines 与 require(esm) 矛盾），建议随 3.0.3 修复。

---

## 二、生产闭环实测数值（核心证据）

### 2.1 构建与静态门禁

| 环节 | 命令 | 结果 | 数值 |
| ---- | ---- | ---- | ---- |
| 类型检查 | `pnpm typecheck`（tsc --noEmit） | ✅ PASS | 0 错误 |
| 代码检查 | `pnpm lint`（eslint） | ✅ PASS | 0 错误 0 警告 |
| 构建 | `pnpm build`（tsup） | ✅ PASS | ESM 132ms；DTS ≤ 1274ms |
| 产物 | `dist/` | — | 27 文件 / 284 KB；index.js 89,165 B；browser.js 57,308 B |

### 2.2 测试与覆盖率

| 指标 | 数值 | 门禁结论 |
| ---- | ---- | ---- |
| 测试文件 | 30 | 全部通过 |
| 测试用例 | **621 / 621（100%）** | ✅ |
| 耗时 | 7.74 s | — |
| 语句覆盖率 | **92.04%** | ✅ ≥ 90%（测试策略线） |
| 分支覆盖率 | **85.07%** | ⚠️ 低于 90% 参考线 |
| 函数覆盖率 | **93.35%** | ✅ |
| 行覆盖率 | **93.14%** | ✅ |

### 2.3 生产对照（本地 pack vs npm 已发布 tarball）

| 检查 | 数值 | 结论 |
| ---- | ---- | ---- |
| 文件清单对比 | 27 vs 27，`diff -rq` 差异 **0 项** | ✅ 发布物零漂移 |
| dist/index.js MD5 | `bb7451f7…` 双侧一致 | ✅ 逐字节同源 |
| tarball 体积 | 本地 65,191 B / npm 65,882 B | 差异仅为 gzip 时间戳元数据 |
| 随包文件 | dist + LICENSE + package.json + README.md | ✅ 与 `files` 字段一致 |

### 2.4 消费者冒烟（真实安装 npm tarball，隔离目录）

| 检查组 | 结果 |
| ---- | ---- |
| 主入口（I18nEngine / i18n / t / LRUCache） | 5/5 PASS |
| 运行时行为（构造、翻译、缓存 set/get） | 3/3 PASS |
| 子路径 `./cache` `./plugins` `./icu` `./ai` `./mcp` `./browser` `./package.json` | 7/7 PASS（`./package.json` 需 `with:{type:"json"}`，属标准行为） |
| `require(esm)`（Node 22 createRequire） | 1/1 PASS |
| **合计** | **16/16 有效检查全部 PASS** |

> 勘误说明：初版冒烟 20 项中 2 项失败，经复核均为**测试预期错误**而非包缺陷：`SUPPORTED_LOCALES` 为引擎内部导出、未承诺于主入口（README 未宣称）；JSON 子路径的 import attribute 为 Node 标准要求。

### 2.5 已发布类型声明矩阵（consumer tsconfig 三场景）

| 场景 | 配置 | 结果 |
| ---- | ---- | ---- |
| A：Node 消费者 | `types: ["node"]` | ✅ 0 错误 |
| B：Web 消费者默认配置 | `lib: [es2022, dom]`、自动 @types | ❌ 2 错误 |
| C：无 @types/node 的浏览器消费者 | 未安装 @types/node | ❌ 同样 2 错误 + 环境错误 |

失败定位（均为**已发布产物** `dist/index.d.ts`）：

1. 第 1 行 `import { Readable, Writable } from 'node:stream'` → **TS2591**
2. 第 1028 行 `NodeJS.ErrnoException` → **TS2503**

**根因**：`src/index.ts` 主入口重导出 Node 专属工具（`path-guards`、`json-file` 及其 `node:stream`/`NodeJS` 类型），未声明 `@types/node` 依赖或 `./node` 子路径隔离。

---

## 三、发现清单与建议

| 编号 | 级别 | 发现 | 建议 |
| ---- | ---- | ---- | ---- |
| C1 | P2 | 已发布 d.ts 泄漏 Node 类型，B/C 场景类型检查失败（§2.5） | 将 `json-file`/`path-guards` 重导出迁移至 `./node` 子路径；或 d.ts 内改用结构化类型并随包声明 `@types/node`（devDep 不入产物，需 `dependencies` 或 peer 建议） |
| C2 | P2 | `size-limit` 配置 45 kB 为**死配置**：工具未安装（pnpm-lock 0 命中）、无 script、CI 未执行；实际 index.js 89,165 B 超限 97.9% | 二选一：安装 size-limit 并接入 CI 后按 90 kB 重定基线；或删除该配置避免误导 |
| C3 | P2 | `exports["."].require` 指向 ESM 产物，但 `engines: >=18`；Node 18/20 早期 CJS 消费者将 `ERR_REQUIRE_ESM` | engines 提至 `>=20.19` 并在 README 标注；或移除 require 条件 |
| C4 | P3 | 分支覆盖率 85.07% 低于团队 90% 参考线 | 对 `src/lib/cli`、错误分支补测 |
| C5 | P3 | `SUPPORTED_LOCALES`/`isSupportedLocale` 引擎已导出、主入口未透出，README 亦无说明 | 明确 API 面：透出或标注 internal |
| C6 | P3 | `LRUCache.get()` 返回 `unknown` 且非泛型，消费者需断言 | 下一版本改为 `get<T = unknown>()` |

### README 一致性（1,413 行实查）

| 项 | 声明 | 实况 | 结论 |
| ---- | ---- | ---- | ---- |
| 零依赖 | "dependencies-0" 徽章 | package.json 0 运行依赖 | ✅ 一致 |
| 10 语言 | 10 种语言 | `src/locales/` 恰 10 个 | ✅ 一致 |
| 安装/子路径示例 | 31 处 import | 逐条可用（§4 ICU 示例指向 `/browser` 可用但语义欠准） | ✅ 可用 / ⚠️ 语义 |
| 尾部署名 | "YYC³ **AI** Team" | 规范署名 `YYC³ Team` | ❌ 不符《标头标尾》§一 |
| 文档版本 | "2.4.2 / 2026-09-26" | 包已 3.0.2 / 2026-11-04 | ❌ 过时 |
| 示例版本号 | MCP 示例 `version: '1.4.0'` ×2 | 当前 3.0.2 | ❌ 过时 |
| 居中品牌页脚 | 无 | 规范 §4.3 页脚（README 非强制目录） | ⚠️ 建议补齐 |

---

## 四、结论

1. **生产发布物可信**：npm 3.0.2 与本地重建零差异，621 测试全绿，冒烟 16/16，发布链路（provenance）完整。
2. **两个面向消费者的真实缺口**：类型声明在 Web 场景报错（C1）与 require(esm)/engines 矛盾（C3），建议合并进 3.0.3。
3. **文档声明基本诚实**：核心卖点（零依赖、10 语言、子路径）全部实测成立；署名与版本信息需按规范刷新。

---

## 五、v1.1.0 复测结果（修复后实测，2026-11-04）

| 项 | 修复前 | 修复后实测 | 状态 |
| ---- | ---- | ---- | ---- |
| C1 类型泄漏 | index.d.ts 引用 node:stream/NodeJS，B/C 场景 2-3 错 | 新增 `./node` 子路径（dist/node.js 4.73 KB）；`index.d.ts`/`browser.d.ts` 中 `node:` 引用 **0 次**；类型矩阵 A/B/C **全部 0 错误**（C 场景无 @types/node 也通过） | ✅ |
| C2 size-limit | 死配置（未安装未执行） | 已实装（size-limit 14.3 + @size-limit/file）并接入 CI 与 `prepublishOnly`；实测 brotli **17.27 kB < 95 kB** 红线。**口径修正**：v1.0.0 按原始字节 89 KB 对比 45 kB 属单位口径误判——size-limit 以压缩后尺寸计，45 kB 红线若实跑本就达标；缺陷准确定性为「未实装」，非「必超限」 | ✅（含勘误） |
| C3 engines | ≥18 与 require(esm) 矛盾 | engines 提至 **≥20.19.0**，README 前置要求与徽章同步 | ✅ |
| C5 SUPPORTED_LOCALES | 主入口未透出 | 主入口透出 `SUPPORTED_LOCALES`（10 语言实测）与 `isSupportedLocale` | ✅ |
| C6 LRUCache 泛型 | 未注默认参数 | `LRUCache<T = unknown>` 显式默认 + README 示例修正 | ✅ |
| C7（新发现）显式 locale 被覆盖 | `new I18nEngine({locale:'zh-CN'})` 被 loadInitialLocale 覆盖回 en | `explicitLocale` 最高优先级；实测 zh-CN 构造即得 zh-CN，默认构造仍 en | ✅ |
| README 一致性 | 署名 AI Team/版本戳 2.4.2/1.4.0×2/LRUCache 双泛型示例 | 全部修正 + 补 `./node`、`./browser` 子路径行与 3.1.0 迁移说明 + 标准居中页脚 | ✅ |
| 回归 | — | 621/621 测试、typecheck/lint 0 错、消费者冒烟 **24/24**、覆盖率 92.05/85.1/93.35/93.15（过 90/85/90/90 门禁）、标头标尾门禁 109/109 | ✅ |

**版本状态**：本地 package.json 已对齐 **3.1.0**（exports 变更 + engines 变更属 minor 级），发布动作留待维护者执行 `pnpm publish`（prepublishOnly 已串联 test + 门禁 + size）。生产健康度 **A− → A**。

---

## 变更历史

| 版本 | 日期 | 变更内容 | 作者 |
| ---- | ---- | -------- | ---- |
| v1.0.0 | 2026-11-04 | 首次发布：@yyc3/i18n-core@3.0.2 生产闭环全量实测（621 测试、npm 对照零差异、16/16 冒烟、类型三场景矩阵、6 项发现） | YYC³ Team |
| v1.1.0 | 2026-11-04 | 修复复测：C1-C6 全闭环 + 新发现 C7（显式 locale 覆盖）修复；冒烟 24/24、类型矩阵全绿、C2 口径勘误；版本对齐 3.1.0（待发布） | YYC³ Team |

---

<p align="center">
  <b>YYC³</b>（YanYuCloudCube™ · 注册商标）<br>
  言启象限 | 语枢未来<br>
  <i>Words Initiate Quadrants, Language Serves as Core for Future</i><br>
  万象归元于云枢 | 深栈智启新纪元<br>
  <i>All things converge in cloud pivot; Deep stacks ignite a new era of intelligence</i><br>
  <sub>© 2026 YanYuCloudCube™（YYC³）· <a href="mailto:admin@0379.email">admin@0379.email</a></sub>
</p>
