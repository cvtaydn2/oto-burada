import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/*.int.test.ts'],
      testTimeout: 30000,
    },
  };
});
