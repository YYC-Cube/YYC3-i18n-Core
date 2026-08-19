import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
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
    },
    format: ['esm'],
    dts: true,
    sourcemap: true,
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
    sourcemap: true,
    splitting: false,
    treeshake: true,
    minify: false,
    outDir: 'dist',
  },
])
