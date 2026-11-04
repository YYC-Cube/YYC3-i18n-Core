// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: false,
    clean: true,
    splitting: true,
    treeshake: true,
    minify: false,
    outDir: 'dist',
  },
  {
    entry: {
      'lib/cache': 'src/lib/cache.ts',
      'lib/plugins/index': 'src/lib/plugins/index.ts',
      'lib/icu/parser': 'src/lib/icu/parser.ts',
      'lib/ai/provider': 'src/lib/ai/provider.ts',
      'lib/mcp/server': 'src/lib/mcp/server.ts',
      'lib/ota/index': 'src/lib/ota/index.ts',
      'lib/workflow/index': 'src/lib/workflow/index.ts',
      'node': 'src/node.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: false,
    splitting: true,
    treeshake: true,
    minify: false,
    outDir: 'dist',
  },
  {
    // 浏览器安全入口:关闭 splitting 生成自包含单文件,
    // 避免共享 chunk hash 与既有 dist 冲突、便于 patch 分发
    entry: {
      browser: 'src/browser.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: false,
    splitting: false,
    treeshake: true,
    minify: false,
    outDir: 'dist',
  },
])

// ============================================================
// End of tsup.config.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
