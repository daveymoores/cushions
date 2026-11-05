// Its own config, so vitest does not climb to the storefront's vite.config.ts.
import {defineConfig} from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  test: {include: ['test/**/*.test.ts'], environment: 'node'},
});
