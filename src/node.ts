// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file node.ts
 * description @yyc3/i18n-core Node 专属工具入口（./node 子路径）
 * module @yyc3/i18n-core/node
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.1.0
 * created 2026-11-04
 * updated 2026-11-04
 * status active
 * tags [module],[node],[utilities]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief 汇聚 node:fs / node:path / node:stream 依赖的工具导出，
 *       使主入口与 ./browser 的类型声明保持浏览器环境友好
 */

// MCP Stdio Transport（node:stream）
export { StdioTransport } from "./lib/mcp/stdio-transport.js";

// Path Guards (Traversal Prevention)
export {
  hasNodeErrorCode, isNodeError, isNotFoundPathError, isPathInside, isSymlinkOpenError, normalizeWindowsPathForComparison
} from "./lib/utils/path-guards.js";

// JSON File Operations
export {
  deleteJsonFile, jsonFileExists, loadJsonFile,
  saveJsonFile
} from "./lib/utils/json-file.js";

// ============================================================
// End of node.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
