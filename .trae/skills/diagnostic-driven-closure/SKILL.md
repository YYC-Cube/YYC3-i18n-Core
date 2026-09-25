---
name: "diagnostic-driven-closure"
description: "Evidence-driven minimal patch loop for TS/React/CI errors: fix each listed diagnostic to zero, verify with exact CI commands, update CHANGELOG, push and confirm Actions green. Invoke when user asks to fix #problems, lint/audit/CI failures, or dependency/lockfile build breaks."
---

# 诊断驱动的最小补丁闭环 (Diagnostic-Driven Closure)

> 言启千行代码，语枢万物智能 —— 补丁任务只做"收敛"，不做"扩散"。

## 何时触发

- 用户给出 `#problems:文件`、IDE 诊断、ESLint/tsc 报错、`pnpm audit`、Dependabot、GitHub Actions 失败日志
- 用户要求"修复报错/扫描问题/修复 CI 失败/闭环修复"
- frozen-lockfile、模块解析、类型声明缺失等工程契约类阻断

## 核心铁律

1. **原始诊断清单是唯一任务边界**：先用 `GetDiagnostics`（逐文件）或 CI/audit 原文输出建表（文件:行:类型:文本），逐条闭环，禁止顺手重构、禁止"本地能跑"替代用户证据。
2. **阻断项优先**：模块解析失败 → tsconfig/依赖可见性闭包 → 类型不匹配 → 未使用变量。阻断项会制造连锁报错，先清警告是假进展。
3. **最小差异**：只读报错指向文件的 import/export 与符号定义，定点改片段；保持入口与导出名稳定；不新增依赖、不切换依赖策略，除非证据直指版本问题。
4. **修后必复查归零**：对每个原始文件重新 `GetDiagnostics` 确认 0，而不是凭推断宣称修复。
5. **按 CI 实际命令本地复跑**：`pnpm install --frozen-lockfile` → audit → tsc → eslint --max-warnings 0 → test:coverage → -r build；文档站进其目录独立 frozen + build。
6. **推送不是终点**：`gh run list/view` 观察 Actions 实证全绿；失败则取 `--log-failed` 原文进入下一轮，直到线上绿。
7. **全程留痕**：CHANGELOG `[Unreleased]` 按 🔒安全/🔧修复/🏗️构建与CI 分类记录根因与方案；提交信息含根因+验证矩阵。

## 标准流程

```text
采集证据(诊断/CI日志) → 建清单 → 根因聚合(同源错误合并)
→ 阻断项排序 → 定点最小修复 → 诊断复查归零
→ CI 命令本地复跑 → CHANGELOG → 提交推送 → Actions 实证
```

根因聚合示例：多个"TSConfig does not include this file"解析错误 = 同一个 ESLint `parserOptions.project` 闭包问题，一次改 ignores，而非逐文件加注释。

## 本仓库已验证的陷阱速查（pnpm 11 + Node 22 + VitePress + GitHub Pages）

| 现象 | 根因 | 修法 |
|------|------|------|
| `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` (overrides) | pnpm 9 不读 `pnpm-workspace.yaml` 的 overrides；锁文件由 pnpm 11 生成 | 工具链单一事实源：package.json `packageManager: pnpm@11.10.0`，全部工作流统一版本 |
| `No such builtin module: node:sqlite` | pnpm ≥10.6 要求 Node ≥22.13 | 工作流 NODE_VERSION 22 LTS（publish/oidc 用 24） |
| 子目录 frozen 安装串到根 workspace | pnpm 向上探测父级 `pnpm-workspace.yaml` | 独立工程（examples/docs）放自带 `pnpm-workspace.yaml` + 自带 `pnpm-lock.yaml` |
| `ERR_PNPM_IGNORED_BUILDS` (esbuild) | pnpm 10+ 默认拦截构建脚本 | workspace.yaml `allowBuilds: { esbuild: true }` |
| `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` | 供应链 24h 冷却：锁文件含当天发布的包 | 查依赖链，override 钉到 24h 前的满足版本，注释写明冷却期满移除 |
| `require is not defined in ES module` | 根包 `"type": "module"` 下 `.js` 被当 ESM | CJS 脚本改 `.cjs`（Node 报错原文即建议） |
| ESM file cannot be loaded by require (VitePress) | docs 缺 `"type": "module"` | docs/package.json 补字段 |
| vite 打包 externalize `timers/promises`/`crypto` | 浏览器端误用含 Node 内建的根入口 | 导入 `@yyc3/i18n-core/browser` 子路径 |
| TSConfig does not include this file (ESLint) | 根 project 仅含 src/，独立子工程被全局 lint | eslint ignores 补 `examples/**`、`scripts/**` |
| VitePress dead links 阻断构建 | 规划中页面缺失（非本次补丁范围） | `ignoreDeadLinks: true` + TODO 注释列出待补页面，内容补齐后移除 |
| 自定义域名 404 | CNAME 文件与 Pages Settings 不一致 | 以平台 Settings（已验证域名/证书）为权威，CNAME 文件对齐 |

## 经验教训（本仓库实证）

- `pnpm-workspace.yaml` 是 pnpm v10+ 配置入口；package.json 的 `pnpm.overrides` 已被忽略（只有 warning）。
- override 宽泛范围（如 `>=1.1.18`）可能被旧 major 满足造成假修复，必要时分 major 钉：`pkg@<2` / `pkg@>=2`。
- 升级插桩/测试框架大版本后覆盖率口径会变（coverage-v8 v4 分支计数更细），阈值按新基线校准并注释原因。
- Map 取值用 `get() + 判空`，不要 `has() + get()!`；未开 `noUncheckedIndexedAccess` 时索引断言直接删。
- CI 中 lint 不许带 `|| true`；test 必须跑带阈值的 coverage；build 用 `-r` 覆盖整个 workspace。
- Dependabot 扫所有 lockfile（含 examples/docs）；根 `pnpm audit` 清零 ≠ Dependabot 清零，用 `gh api repos/:owner/:repo/dependabot/alerts` 按 manifest 分组核查。
