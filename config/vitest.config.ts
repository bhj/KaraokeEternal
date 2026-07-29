import { configDefaults, defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // mirrors webpack's resolve.modules/alias so client modules can be imported
  // by their app-relative paths
  resolve: {
    alias: {
      components: path.resolve(__dirname, '../src/components'),
      lib: path.resolve(__dirname, '../src/lib'),
      routes: path.resolve(__dirname, '../src/routes'),
      shared: path.resolve(__dirname, '../shared'),
      store: path.resolve(__dirname, '../src/store'),
    },
  },
  test: {
    // build/ holds compiled copies of these same specs, which fail because the
    // setup file initializes the source logger and not the built one
    exclude: [...configDefaults.exclude, '**/build/**'],
    setupFiles: [path.resolve(__dirname, '../server/lib/test-setup.ts')],
  },
})
