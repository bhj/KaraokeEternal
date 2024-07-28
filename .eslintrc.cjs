module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:promise/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'promise',
  ],
  env: {
    browser: true,
  },
  globals: {
    __DEV__: false,
    __TEST__: false,
    __PROD__: false,
    __COVERAGE__: false,
  },
  rules: {
    'comma-dangle': [0, 'always-multiline'],
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none',
      },
    }],

    'promise/always-return': 0,
  },
  settings: {
    react: {
      version: 'detect',
    }
  },
  overrides: [
    {
      files: ['config/**'],
      rules: {
        '@typescript-eslint/no-var-requires': 0,
      },
    },
  ],
}
