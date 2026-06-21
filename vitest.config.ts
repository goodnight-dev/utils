import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    benchmark: {
      include: ['packages/*/src/**/*.bench.ts'],
    },
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      // Exclude entry barrels and repo-only files (tests, benchmark inputs, and
      // the rejected alternatives) — none of them ship in `dist`.
      exclude: [
        '**/*.test.ts',
        '**/index.ts',
        '**/*.bench.ts',
        '**/*.alternatives.ts',
        '**/*.fixtures.ts',
      ],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});
