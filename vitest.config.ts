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
