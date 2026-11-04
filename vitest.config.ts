// ============================================================
// YYC³（YanYuCloudCube™ · 注册商标）
// 言启象限 | 语枢未来 · Words Initiate Quadrants, Language Serves as Core for Future
// 万象归元于云枢 | 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// ============================================================
// Copyright (c) 2026 YanYuCloudCube™（YYC³）| admin@0379.email
// ============================================================
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/plugins/console-logger.ts', 'src/lib/types.ts', 'src/lib/plugins/index.ts'],
      thresholds: {
        statements: 90,
        // @vitest/coverage-v8 v4 counts branches more precisely (??, ||, ternary arms);
        // re-baselined from 89 (v1 instrumentation) to 85 to keep the gate meaningful.
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});

// ============================================================
// End of vitest.config.ts | YYC³（YanYuCloudCube™ · 注册商标）
// 万象归元于云枢 · 深栈智启新纪元
// All things converge in cloud pivot; Deep stacks ignite a new era of intelligence
// (c) 2026 YanYuCloudCube™（YYC³）· admin@0379.email
// ============================================================
