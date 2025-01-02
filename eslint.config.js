// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginRefresh from 'eslint-plugin-react-refresh'
import pluginPromise from 'eslint-plugin-promise'
import pluginNode from 'eslint-plugin-n'
import globals from 'globals'

export default tseslint.config(
  // global config
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs['recommended-flat'],
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
    plugins: {
      'react': pluginReact,
      'react-hooks': pluginReactHooks,
      'react-refresh': pluginRefresh,
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      ...pluginReact.configs.flat['jsx-runtime'].rules,
      ...pluginReactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'error',
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    },
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // server-only config
  {
    files: ['server/**/*.js', 'config/webpack.config.js'],
    ...pluginNode.configs['flat/recommended-script'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 2022,
      },
    },
  },
)
