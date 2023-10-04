module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
  },
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:n/recommended',
    'plugin:promise/recommended',
  ],
  plugins: [
    'promise',
  ],
  env: {
    node: true,
  },
  globals: {
    __DEV__: false,
    __TEST__: false,
    __PROD__: false,
    __COVERAGE__: false,
  },
  rules: {
    'comma-dangle': [0, 'always-multiline'],
    'promise/always-return': 0,
    // extending 'standard' incorrectly allows these globals,
    // in a Node environment, so explicitly disable them here
    'no-restricted-globals': [2, 'window', 'document'],
  },
}
