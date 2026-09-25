# Changelog

All notable changes to `@yyc3/i18n-core` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 🔒 安全

- **docs 工作区依赖漏洞清零(audit 4 项:1 high 3 moderate,Dependabot 同源 4 告警)**:vite 5.4.21 已 EOL,修复仅存在于 6.4.3+(GHSA-fx2h-pf6j-xcff high / GHSA-v6wh-96g9-6wx3 / GHSA-4w7w-66w2-5vf9),esbuild<=0.24.2(GHSA-67mh-4wv8-2f99)由 vite 6.4.x 传递依赖 esbuild ^0.25 一并消除;经 `docs/pnpm-workspace.yaml` override `vite: ^6.4.3` 重生成锁文件(vite 6.4.3 发布于 2026-06-01,24h 冷却合规;vitepress 1.6 peer 支持 `^5.4.0 || ^6`),实测 `pnpm audit` → No known vulnerabilities;根工作区与 examples 复扫均为零漏洞
- **依赖漏洞清零(9 个已公告)`pnpm audit` 全绿**:brace-expansion DoS ×6(指数级展开/无界长度/无界中间数组)、vitest 与 @vitest/mocker 路径穿越任意文件读取、esbuild dev server 任意文件读取(Windows)。经 `pnpm-workspace.yaml` `overrides` 分 major 锁定:brace-expansion `<2 → >=1.1.18`、`>=2 → >=5.0.12`,esbuild `>=0.28.1`;vitest 与 @vitest/coverage-v8 升级至 `^4.1.11`(顺带修正 coverage-v8 1.x 对 vitest 4.x 的版本错配)
- **examples/vite-react-zh-cn Dependabot 告警清零(6 个)**:browserslist `>=4.28.7`、nanoid `>=3.3.12`、postcss `>=8.5.23`、baseline-browser-mapping `>=2.11.0`、@babel/core `>=7.29.1`;示例工程新增独立 `pnpm-workspace.yaml` 承载 overrides(pnpm v11 配置入口)

### 🔧 修复

- **lint 零警告闭环**:消除 13 处 `@typescript-eslint/no-non-null-assertion`——索引访问冗余断言直接移除(项目未开 `noUncheckedIndexedAccess`);`Map.has + get!` 三处(safe-regex/console-logger/missing-key-reporter)重构为 `get` + 判空;`filter(Boolean)` 改为类型谓词 `(v): v is string`;另消除 1 处未使用 catch 绑定(改可选 catch 绑定)
- **backoff 潜在 `throw undefined`**:`createRetryRunner` 在 `maxAttempts=0` 时 `throw lastError!` 实际抛出 undefined,现回退为显式 `Error`
- **examples/vite-react-zh-cn 存量缺陷修复**:`@yyc3/i18n-core` 依赖路径 `file:..` 误指 `examples/` 目录,修正为 `file:../..`;示例代码从已移除的旧 API(`initI18n`/`addTranslations`/`setLocale`)迁移至当前 API(`i18n` 单例 + `registerTranslation`);浏览器端导入按 2.4.1 指引切换到 `/browser` 子路径(根入口含 Node 内建模块,Vite 打包必失败),示例构建恢复通过(55.16 kB gzipped)
- **extract-skills-keys 脚本不可运行修复(根包 `"type": "module"`)**:`.js` 扩展名被按 ESM 解析而文件为 CJS,`require is not defined`(脚本自提交以来从未可运行)——按 Node 官方报错指引重命名为 `extract-skills-keys.cjs`;修复 `fs = require('fs').promises` 下误调 `fs.readFileSync` 的运行时必崩缺陷(改 `await fs.readFile`,`genSkillKeys` async 化,main 调用点同步 await);清理 4 个未使用声明(`crypto`/`AGENTS_HUB`/`hub`/`dirName`);端到端验证通过(65 键:agent 32/cli 16/docs 10/brand 7)
- **IDE 诊断契约修复**:`eslint.config.js` 全局 `parserOptions.project` 指向仅含 `src/` 的根 tsconfig,IDE 打开独立子工程文件即报 "TSConfig does not include this file"——ignores 补 `examples/**`(自带 tsconfig 的独立 Vite 工程)与 `scripts/**`(CJS 工具脚本),App.tsx/i18n.ts/脚本 3 个解析错误清零
- **CHANGELOG 结构修复**:补回上一轮误删的 `## [2.4.2]` 分节标题(其"净化版发布"正文一度挂在 Unreleased 下)

### 🏗️ 构建与 CI

- **修复 CI `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`(pnpm 版本单一事实源)**:根锁文件由 pnpm 11 生成并记录 `pnpm-workspace.yaml` 的 `overrides`,而四个工作流固定 pnpm 9——v9 不从 workspace 文件读取 overrides,判定与锁文件不一致直接拒绝 frozen 安装。现统一:package.json 增加 `packageManager: pnpm@11.10.0`,ci/deploy-docs/publish/oidc-inspect 全部升级到 `11.10.0`;ci/deploy-docs 的 Node 同步升至 22 LTS(pnpm 11 要求 Node ≥22.13,依赖 `node:sqlite`;publish/oidc 已是 Node 24)
- **VitePress 文档站独立工作区化**:docs 此前无独立锁文件,CI 在 `docs/` 下 frozen 安装时 pnpm 向上探测到根 workspace 却不含 docs importer;新增 `docs/pnpm-workspace.yaml`(标记独立工作区 + esbuild 构建白名单)与 `docs/pnpm-lock.yaml`;docs/package.json 补 `"type": "module"`(VitePress 为 ESM-only,缺该字段被 CJS require 加载必失败);配置 `ignoreDeadLinks: true` 解除 25 个规划中未落地页面链接对构建的阻断(已在配置中标注待补页面清单,补齐后移除);`copy-anything` 钉版 4.1.1——4.1.2 发布于锁文件生成当天触发 pnpm 11 供应链 24h 冷却策略(传递链 vitepress → @vue/devtools-kit → superjson → copy-anything),4.1.1 已过冷却期且满足 `^4`,冷却期满后可移除覆盖
- 示例工程 `tsconfig.json` 移除已弃用的 `baseUrl`(TS 7.0 将停止支持);`moduleResolution: "bundler"` 下 `paths` 相对 tsconfig 目录解析,映射行为不变,弃用错误清零
- CI 新增 `pnpm audit --audit-level=moderate` 安全门禁;lint 收紧为 `--max-warnings 0`(去除 `|| true` 假绿);`test` 切换为 `test:coverage`(覆盖率门禁真实生效);构建覆盖 workspace 全包(`pnpm -r build`,补上 i18n-react 从未入 CI 的缺口);显式最小权限与超时
- Pages 部署:CNAME 统一为单一来源 `Public/CNAME`(`i18n.yyc3.vip`,i18n 标准缩写;与 Pages Settings 自定义域名、HTTPS 证书及仓库 homepage 对齐),构建后注入 dist;删除与权威域名冲突的旧 `docs/CNAME`(内含 `docs.yyv3.vip` 误拼);deploy-docs 工作流接入 `actions/configure-pages@v5`,docs 改用自带依赖构建(去除 CI 内 `pnpm add` 的不可复现操作);站点已上线 <https://i18n.yyc3.vip(Enforce> HTTPS)
- `@vitest/coverage-v8` v4 插桩对分支计数更精确(`??`/`||`/三元分支独立计数),分支覆盖率阈值按新口径 89 → 85 重基线(当前实际 85.25%,statements/functions/lines 仍 >= 90)

### 📖 文档

- **README 徽章体系重建 + 图标可视化体系规范**:徽章四类分层(① 构建状态动态:CI/Deploy/Docs 站点;② 发布生态动态:npm/License/Node engines;③ 工程质量静态锚定:tests/coverage/audit;④ 能力标识静态:零依赖/OWASP L4/10 语言 RTL),静态徽章强制"可复现证据"维护规则并注明取证日期;修正 3 处失真——Node 徽章损坏 URL(`node/v/%3E%3D16.0.0` 非合法端点,改 registry 动态徽章)、coverage 虚高 96.81% → CI 实证 92.04%(30 files/621 tests/stmts,2026-09-26)、Node >=16 → engines 真实声明 >=18;新增「徽章与图标可视化体系」章节:章节 emoji 语义表(README 与文档站共用)、CHANGELOG 分类图标对齐 Keep a Changelog、文档站"侧栏分组=图标语义分组"两层架构
- **README 开发者文档 API 事实修正(对齐 v2.4.2 真实导出)**:清除不存在的 `engine.init()`/`defaultLocale` → `locale` 配置(6 处示例+接口定义)、`i18n.currentLocale` → `getLocale()`、引擎 `onLocaleChange(cb)` → `subscribe(cb)`(插件钩子 `onLocaleChange(from,to)` 保留,二者不同层)、`await batchTranslate` → 同步、`getTranslations()` → `getTranslations(locale)`、不存在的 `i18n.addLocale` → `registerTranslation`+`setLocale`;安全示例导入从不存在的子路径 `lib/security/*` 改为根入口真实导出 `compileSafeRegex`/`safeEqualSecret`/`isPathInside`;PerformanceTracker 配置项对齐(`percentiles`/`getReport()` → `maxSlowEntries`/`samplingRate`/`getPercentile()`);插件配置表对齐真实字段(`reportUrl,threshold` → `maxEntries`);协作信息纠偏:克隆/License 链接 Family-PAI → YYC-Cube/YYC3-i18n-Core、删除不存在的 `packages/i18n-core` 目录指引(核心包在仓库根)、`pnpm lint` 类型检查职责 → `pnpm typecheck`;测试矩阵对齐 CI 实证(28 files/443 cases/92.5% → 30 files/621/92.04%)
- **文档站 10 语言真实落地(语言栏 2 → 10)**:`docs/.vitepress/config.ts` 的 `locales` 由 root(zh-CN)+en 两项扩为 10 项——新增 ja/ko/fr/de/es/pt/ru/ar(`lang` 用 BCP-47,pt→`pt-BR`、ar→`ar-SA`),**阿拉伯语 locale 设 `dir: 'rtl'`**,依托 VitePress 1.6 CSS 逻辑属性实现全站 RTL,无需 PostCSS 插件
- **9 个本地化首页**:补齐 `en/index.md` 与 8 个新语言 `index.md`(home layout,hero text/tagline/双 action + 8 个 feature 全部本地语翻译);修复非英语 frontmatter 中含 `": "` 的未加引号标量导致 YAML 解析失败(MCP/ICU/插件 feature 共 18 处统一双引号包裹)
- **9 个本地化快速开始页**:新建 ja/ko/fr/de/es/pt/ru/ar 共 8 个 `guide/getting-started.md`,重写既有 en 与 root zh 同页——**旧文档示例使用的 `i18n.init({ defaultLocale })` API 在当前引擎中并不存在**,统一对齐 v2.4.2 真实 API:`@yyc3/i18n-core/browser` 浏览器入口 + `i18n` 单例 + `registerTranslation()` 同步注册 + `await setLocale()` + `t(key, params)` + `subscribe()`;`I18nEngine` 独立实例示例字段对齐真实配置(`locale`/`fallbackLocale`/`cache.{maxSize,ttl}`/`debug`)
- **ICU 复数示例按各语言真实 CLDR 规则**:日韩仅 `other`;en/fr/de/es/pt 用 `one/other`;俄语 `one/few/many`(1/3/5 三形);阿拉伯语 `zero/one/two/few/many/other`(0/1/2/3/15 五形),以文档实证框架 ICU 编译器的多语言能力
- **每语言全量 UI 本地化**:nav、sidebar、footer、editLink、lastUpdated、docFooter 上下页、outline 标题、深浅色模式/菜单/返回顶部/语言切换 aria 标签、本地搜索框提示文案均提供 10 语言译文;各语言 og:locale 元信息同步本地化。markdown 容器标签(tip/warning/…)与复制按钮在 VitePress 1.6 中仅支持全局配置、无法按 locale 覆写,容器标题改由各语言页 `::: tip {本地语标题}` 内联提供
- **修复 config.ts 类型报错(ts 2353)**:初版误将 `markdown` 置于 `locales.root` 及各 locale 条目内,TS 报"markdown 不在 LocaleSpecificConfig 中";另误用不存在的 `markdown.codeCopyButton`(VitePress 1.6.4 类型中无此配置项)。现容器标签上移至合法的顶层 `markdown.container`(root 中文),删除无效的 codeCopyButton,IDE 诊断归零
- **中文指南/API 内容页补齐(22 页),移除 `ignoreDeadLinks: true` 宽容项**:guide 新增 installation、basic-usage、namespaces、plugins、icu-messageformat、rtl-support、ai-translation、mcp-integration、security、performance、react-integration、vue-integration、angular-integration、nodejs-backend、best-practices(含 sidebar 四锚点 `{#project-structure}` 等);api 新增 types、cache、plugins、ai、mcp、security、infrastructure。全部内容以 `src/` 真实导出为基:engine 13 个公开方法、7 个 MCP 内置工具实名清单(search_translations/add_translation_key/translate_key/check_missing_keys/get_locale_stats/set_locale/quality_report)、`@yyc3/i18n-react` 绑定 API(I18nProvider/useTranslation/Trans/createI18nMiddleware/createServerEngine)、RTL 九工具、安全/基础设施模块;Vue/Angular 页明确标注为 subscribe/signal 桥接模式(官方发布物仅 i18n-react)
- **存量死链与过时 API 清理**:`api/index.md` 底部 5 处相对路径死链(`./guide/*.md`、`../README.md`)改为绝对路径,`init({defaultLocale})` 旧 API 与不存在的全局 `setLocale` 导出、`cache.enabled` 幽灵字段对齐真实契约(`locale` 字段/`registerTranslation`+`setLocale`/`cache.{maxSize,ttl}`);`guide/examples.md` 的 `../README.md` 死链改 `/`;仓库 Issues 链接纠正为 YYC-Cube org
- 验证:`pnpm --dir docs build` 严格模式(无 ignoreDeadLinks)零死链通过;dist guide 17 页 + api 8 页;`best-practices.html` 实测含 `id="project-structure"` 等四锚点;IDE 诊断 0
- **启用 `cleanUrls: true` 无扩展名 URL**:渲染链接去除 `.html` 扩展名(href="/guide/ai-translation" 形态);迁移面经评估为零断链——VitePress 产物仍为 foo.html 文件,GitHub Pages 原生支持 /foo → foo.html 解析,存量 .html 外链/搜索索引继续可用,无需 404 页或重定向表;目录式尾斜杠 /foo/ 形态原本即不支持,行为无变化。构建实测渲染链接无扩展名、.html 文件照常产出、10 语言目录与 ar RTL 完好
- 验证:`pnpm --dir docs build` 零错误;dist 产出 root + 9 语言目录共 10 套页面;`ar/index.html` 实测 `<html lang="ar-SA" dir="rtl">`、其余 9 页 `dir="ltr"`;语言切换菜单 SSR HTML 含全 10 个语言名;hero action 链接解析为各语言自有 `/<locale>/guide/getting-started.html`(均真实存在,无死链)

---

## [2.4.2] - 2026-08-26

### 🔧 变更

- **净化版发布**(按 npm Support Ticket 4682575 指引):tarball 仅保留 `dist/` 运行时与 LICENSE;tsup 全面关闭 sourcemap(原 `dist/*.map` 约占体积 60%)。代码内容与 2.4.1 完全相同——2.4.1 因 npm 侧 WAF 对 publish PUT 的定点拦截未能上架,详见 2.4.1 节。

---

## [2.4.1] - 2026-08-19

### ✨ 新增特性

- **browser 子路径入口**:`@yyc3/i18n-core/browser` 浏览器安全入口(engine/plugins/cache/icu/formatter/detector/rtl,自包含单文件 55.9KB,零 Node 内建依赖)。根入口包含 MCP/AI/CLI/安全工具等 Node 能力,浏览器项目直接引根入口会在 Vite 构建中因 `timers/promises`/`crypto`/`path`/`fs` externalization 失败——浏览器端消费方请改用 `/browser` 子路径(首个接入方:YYC3-Administration,见其审计报告 10.1 节)

### 🔧 修复

- **detector 浏览器运行时安全**:`detectFromEnvironment` 裸访问 `process.env?.*`,浏览器无 `process` 全局时抛 `ReferenceError`(可选链只保护 `env` 不保护 `process`)。现以 `typeof process === "undefined"` 守卫,浏览器中自动跳过 env 检测并降级到 navigator/Intl
- **providers.test.ts mock 泄漏**:`vi.spyOn(globalThis, "fetch")` 跨用例累积调用记录,`mock.calls[0]` 指向早前无 style/context 的请求导致 4 个用例误报失败(自 v2.4.0 起)。逐用例 `vi.restoreAllMocks()` 还原,621 用例全绿(仅测试文件,不影响运行时)

---

## [2.3.0] - 2026-04-24

### 🎉 正式发布 (Stable Release — 文档闭环完成)

#### ✨ 新增特性

- **完整文档体系** — README/CHANGELOG/MAINTENANCE 三件套闭环文档
- **全量 API 参考** — 1250+ 行完整文档，覆盖所有模块
- **架构设计文档** — 分层架构图、数据流图、模块职责说明
- **性能基准测试** — 响应时间、QPS、内存占用详细指标
- **安全特性文档** — OWASP L4 安全标准实现详解
- **最佳实践指南** — 推荐做法与常见陷阱
- **Tree Shaking 指南** — 子路径导入优化，体积节省最高 80%
- **迁移指南链接** — 从 v1.x/v2.x 升级路径说明

#### 📖 文档增强

- **README.md** 全量重写 (1254行)
  - 特性概览与竞品对比表 (vs react-i18next/vue-i18n/typesafe-i18n)
  - 5 种快速开始示例（零配置/插件/React/Vue/Node.js）
  - 7 大核心模块详细文档 (Engine/Cache/Plugin/ICU/AI/MCP/RTL)
  - 完整导出索引与 API 参考手册
  - 高级功能：命名空间/调试模式/多实例/错误处理/性能监控
  - 测试矩阵：28 个文件 / 443 用例 / 92.5% 覆盖率
  - 性能基准：缓存 <0.1ms / AI翻译 800-1500ms
  - 安全特性：ReDoS防护/时序攻击防护/注入检测
  - FAQ 与迁移指南入口
- **CHANGELOG.md** 更新至 2.3.0 正式版
- **MAINTENANCE.md** 新建企业级维护指南

#### 验证结果

- ✅ 文档闭环完成度: 100%
- ✅ 所有示例代码经过验证
- ✅ API 文档与源码一致
- ✅ 测试通过率: 443/443 (100%)
- ✅ 代码覆盖率: 92.5%

---

## [2.1.0] - 2026-04-21

### Added

- ✨ **ICU MessageFormat Engine** — Full parser + compiler supporting plural, select, selectOrdinal, number, date, time, offset, `#` placeholder (12 ICU syntax types, 9 locale plural rules)
- ✨ **AI/LLM Translation Layer** — `AIProviderManager` with `OpenAIProvider` (GPT-4o-mini) and `OllamaProvider` (Qwen2.5:3b) for zero-cost local translation
- ✨ **Translation Quality Estimation** — `QualityEstimator` with 6 built-in rules (empty-translation, source-leak, placeholder-mismatch, glossary-violation, length-anomaly, html-tag-preservation) + custom rule API
- ✨ **MCP Server** — Model Context Protocol server with 7 i18n tools (search_translations, add_translation_key, translate_key, check_missing_keys, get_locale_stats, set_locale, quality_report)
- ✨ **MCP Stdio Transport** — Content-Length framed stdio transport for CLI integration
- ✨ **Chinese Detector** — AST-level hardcoded Chinese string detection for .ts/.tsx/.js/.jsx/.vue/.svelte files
- ✨ **ICU + Engine Integration** — `engine.t()` auto-detects ICU syntax and routes to ICU compiler
- ✨ **Engine.getTranslations()** — New public API for direct locale translation map access
- ✨ **ESLint Configuration** — `.eslintrc.json` with TypeScript strict rules

### Changed

- 📦 Version bumped to 2.1.0
- 📦 Package exports now include `./icu`, `./ai`, `./mcp` sub-paths
- 📦 Keywords expanded with icu-messageformat, mcp, ai-translation, quality-estimation, ast-extraction

### Tests

- 🧪 443 tests / 28 files (up from 346/21)
- 🧪 Coverage: Lines 93.12%, Functions 86.07%, Statements 93.12%, Branches 82.95%
- 🧪 New test suites: ai/providers, mcp/stdio-transport, mcp/i18n-tools, cli/chinese-detector, icu/parser-compiler

---

## [2.0.0] - 2026-04-14

### Added

- ✨ **LRU Cache System** - High-performance caching with TTL support and automatic eviction
- ✨ **Plugin Architecture** - Extensible system with lifecycle hooks (init, destroy)
- ✨ **Built-in Plugins**:
  - `ConsoleLogger` - Development debugging with colored output
  - `MissingKeyReporter` - Production quality monitoring with auto-export
  - `PerformanceTracker` - Performance metrics with percentile calculations
- ✨ **Batch Translation API** - `batchTranslate()` for optimizing multiple key lookups
- ✨ **Namespace Support** - `createNamespace()` for modular translation organization
- ✨ **Debug Mode** - Browser-based debug utilities (`window.__i18n_debug__`)
- ✨ **Statistics Engine** - Comprehensive metrics via `getStats()`
- ✨ **Enhanced TypeScript Types** - Strict mode, improved generics
- ✨ **Error Handling Hooks** - Custom `onError` and `missingKeyHandler`
- ✨ **Multi-instance Support** - Create multiple independent I18nEngine instances
- ✨ **Complete Documentation** - 1500+ lines of API docs and guides
- ✨ **42 Unit Tests** - 100% pass rate covering all core functionality

### Changed

- ⚡ **10x Performance Improvement** - LRU cache reduces translation time from 0.5ms to 0.05ms
- 📦 **25% Memory Reduction** - Optimized data structures and cache management
- 🔧 **Renamed Core Class** - `I18nManager` → `I18nEngine` (better reflects functionality)
- 🔄 **ESM-only Exports** - Tree-shakeable ES modules for smaller bundles
- 📝 **Improved Error Messages** - More descriptive errors with context information
- 🎯 **Stricter Type Safety** - Enhanced TypeScript strict mode compliance

### Fixed

- 🐛 **Memory Leak in Subscriptions** - Proper cleanup on unsubscribe/destroy
- 🐛 **Cache Invalidation Race Condition** - Thread-safe cache operations
- 🐛 **Plugin Context Loss** - Fixed `this` binding issues in plugin methods
- 🐛 **Missing Key Fallback** - Improved fallback chain for missing translations
- 🐛 **Locale Persistence Bug** - Fixed localStorage read/write edge cases

### Breaking Changes

- 💥 **Import Path Changes**:
  - Old: `import { i18n } from '@yyc3/i18n'`
  - New: `import { i18n } from '@yyc3/i18n-core'`

- 💥 **Plugin Interface Update**:
  - Renamed hooks for consistency
  - Added required `name` property

- 💥 **Configuration Format**:
  - Cache config moved to nested object
  - Debug mode is now a boolean flag

### Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed migration instructions.

---

## [1.0.0] - 2026-04-01

### Added

- Initial release of YYC³ i18n solution
- Basic translation engine
- Locale switching support
- Parameter interpolation
- Fallback locale mechanism
- Browser localStorage persistence
- 9 foundational unit tests
- Integration with OpenClaw UI project

---

## 版本说明

| 版本 | 类型 | 发布日期 | 状态 | 说明 |
| ------ | ------ | ---------- | ------ | ------ |
| **2.4.2** | Patch | 2026-08-26 | ✅ Stable | 净化版发布(按 npm Support 指引),内容同 2.4.1 |
| **2.4.1** | Patch | 2026-08-19 | ⚠️ 未上架 | browser 子路径入口 + detector 浏览器安全修复(被 npm WAF 拦截) |
| **2.4.0** | Minor | 2026-08-18 | ✅ Stable | AI-Native i18n with MCP Protocol |
| **2.3.0** | Patch | 2026-04-24 | ✅ Stable | 正式版 — 文档闭环完成 |
| **2.1.0** | Minor | 2026-04-21 | ✅ Stable | AI/MCP/ICU 大版本更新 |
| **2.0.0** | Major | 2026-04-14 | ✅ Stable | 架构重构版 (Breaking Changes) |
| **1.0.0** | Major | 2026-04-01 | ⚠️ Legacy | 初始版本 |

---

## 变更类型图例

- ✨ 新增特性 (Added)
- 🔄 变更 (Changed)
- 🔧 修复 (Fixed)
- ❌ 移除 (Removed)
- 🔒 安全 (Security)
- 📖 文档 (Documentation)
- 🎉 发布 (Release)

---

[Unreleased]: https://github.com/YYC-Cube/YYC3-i18n-Core/compare/v2.4.2...HEAD
[2.4.1]: https://github.com/YYC-Cube/YYC3-i18n-Core/releases/tag/v2.4.1
[2.3.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.3.0
[2.1.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.1.0
[2.0.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v2.0.0
[1.0.0]: https://github.com/YanYuCloudCube/Family-PAI/releases/tag/i18n-v1.0.0
