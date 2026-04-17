import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/tests/setup.ts'],
    // Integration tests share a single mysql-test database and mutate
    // overlapping rows (user.level, sessions, etc.). Running files in
    // parallel produces nondeterministic failures. Serial execution is
    // cheap for this suite and removes the flakiness.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
