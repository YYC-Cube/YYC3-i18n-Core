// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
/**
 * file index.ts
 * description OTA 模块出口（501 G4）——远程语言包源 + 轮询热更新
 * module @yyc3/i18n-core
 * author YanYuCloudCube Team <admin@0379.email>
 * version 3.4.0
 * created 2026-11-05
 * updated 2026-11-05
 * status active
 * tags [module],[ota]
 *
 * copyright YanYuCloudCube Team
 * license MIT
 *
 * brief ./ota 子路径与主入口双聚合（新建公共模块必须同步聚合出口）
 */
export {
  createRemoteLocaleSource, startRemoteLocalePolling
} from "./remote-locale.js";
export type {
  PollingHandle, RemoteLocalePayload, RemoteLocaleSource,
  RemoteLocaleSourceConfig, RemoteSyncResult
} from "./remote-locale.js";

// ============================================================
// End of index.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™ · admin@0379.email
// ============================================================
