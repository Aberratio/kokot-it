import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/**/*.test.ts',
      'scripts/**/*.test.ts',
      'docs-templates/**/*.test.ts',
      'tests/**/*.test.ts',
    ],
    environment: 'node',
  },
});
