import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Client-side path aliases matching tsconfig.client.json
      store: path.resolve(__dirname, '../src/store'),
      routes: path.resolve(__dirname, '../src/routes'),
      components: path.resolve(__dirname, '../src/components'),
      lib: path.resolve(__dirname, '../src/lib'),
      shared: path.resolve(__dirname, '../shared'),
    },
  },
  test: {
    setupFiles: [path.resolve(__dirname, '../server/lib/test-setup.ts')],
    exclude: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
    ],
    // Use jsdom for client-side tests (src directory)
    environmentMatchGlobs: [
      ['src/**/*.test.{ts,tsx}', 'jsdom'],
    ],
  },
})
