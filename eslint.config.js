// @ts-check

import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import pluginReact from '@eslint-react/eslint-plugin'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import pluginPromise from 'eslint-plugin-promise'
import pluginNode from 'eslint-plugin-n'
import globals from 'globals'

export default defineConfig(
  // global config
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.recommended,
  // https://github.com/eslint-community/eslint-plugin-promise/issues/488
  // @ts-expect-error - eslint-plugin-promise types are incomplete
  pluginPromise.configs['flat/recommended'],
  {
    plugins: {
      '@stylistic': stylistic,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/space-before-function-paren': ['error', 'always'],
    },
  },
  {
    ignores: ['build/**', 'docs/**', 'dist/**', 'node_modules/**'],
  },
  // client-only config
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'shared/**/*.{js,ts}'],
    extends: [pluginReact.configs['recommended-typescript']],
    plugins: {
      // @ts-expect-error - eslint-plugin-react-hooks types are incomplete
      'react-hooks': pluginReactHooks,
      'react-refresh': reactRefresh.plugin,
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // react-hooks reports these from the React Compiler itself, so skip @eslint-react's copies
      ...Object.fromEntries(Object.keys(pluginReact.configs['disable-conflict-eslint-plugin-react-hooks'].rules)
        .map(rule => [rule.replace('react-hooks/', '@eslint-react/'), 'off'])),
      'react-refresh/only-export-components': 'error',
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
    },
  },
  // server-only config
  {
    files: ['server/**/*.{ts,js}', 'config/**/*.{js,ts}', '*.js'],
    ...pluginNode.configs['flat/recommended-module'],
    rules: {
      ...pluginNode.configs['flat/recommended-module'].rules,
      'n/hashbang': 'off', // suppress incorrect warning
      'n/no-unsupported-features/node-builtins': ['error', {
        ignores: ['crypto.argon2'], // experimental in Node 24 but intentionally used
      }],
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 2022,
      },
    },
  },
)
