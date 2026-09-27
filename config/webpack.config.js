import path from 'path'
import webpack from 'webpack'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import applyLicenseConfig from './webpack.license.config.js'

const NODE_ENV = process.env.NODE_ENV || 'production'
const __DEV__ = NODE_ENV === 'development'
const __TEST__ = NODE_ENV === 'test'
const __PROD__ = NODE_ENV === 'production'
const baseDir = path.resolve(import.meta.dirname, '..')
const WORKLET_ENTRY = 'pitchShifterProcessor'

/** @type {import('webpack').Configuration} */
let config = {
  mode: __PROD__ ? 'production' : 'development',
  entry: {
    main: [
      './src/main',
      __DEV__ && 'webpack-hot-middleware/client', // https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/213
    ].filter(Boolean),
    // AudioWorklet processor. Loaded by URL at runtime rather than imported, so
    // it needs a stable unhashed filename; koa-static revalidates it like any
    // other asset. Must match PROCESSOR_FILENAME in
    // src/lib/pitchShifter/bespoke/constants.ts.
    [WORKLET_ENTRY]: {
      import: './src/lib/pitchShifter/bespoke/processor',
      filename: 'pitchShifterProcessor.js',
      // Neither of these is optional in development, where HMR adds runtimes to
      // every chunk that reach at top level for globals AudioWorkletGlobalScope
      // doesn't have, taking the bundle down before registerProcessor() runs:
      // publicPath 'auto' infers the path from document.currentScript and
      // throws when it can't, and jsonp chunk loading assigns
      // self["webpackHotUpdate..."]. addModule() resolves regardless — an
      // evaluation error is reported to the worklet scope, not the promise — so
      // the sole symptom is the processor name being undefined when the node is
      // constructed. This bundle fetches nothing, so it needs neither, and
      // chunkLoading: false also keeps a stray dynamic import inlined here
      // rather than split into a chunk the worklet could never load.
      publicPath: '',
      chunkLoading: false,
    },
  },
  output: {
    filename: __DEV__ ? '[name].js' : '[name].[fullhash].js',
    path: path.join(baseDir, 'build', 'client'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [
      path.join(baseDir, 'src'),
      'node_modules',
    ],
    alias: {
      '<PROJECT_ROOT>': baseDir,
      'assets': path.join(baseDir, 'assets'),
      'fonts': path.join(baseDir, 'docs', 'assets', 'fonts'),
      'shared': path.join(baseDir, 'shared'),
    },
    symlinks: false,
  },
  module: { rules: [] },
  plugins: [
    new webpack.DefinePlugin(Object.assign({
      __DEV__,
      __TEST__,
      __PROD__,
      __KE_VERSION__: JSON.stringify(process.env.npm_package_version),
      __KE_URL_HOME__: JSON.stringify('https://www.karaoke-eternal.com'),
      __KE_URL_LICENSE__: JSON.stringify('/licenses.txt'),
      __KE_URL_PITCH_HELP__: JSON.stringify('https://www.karaoke-eternal.com/faq/#pitch-shifting-https'),
      __KE_URL_REPO__: JSON.stringify('https://www.karaoke-eternal.com/repo'),
      __KE_URL_SPONSOR__: JSON.stringify('https://www.karaoke-eternal.com/sponsor'),
    })),
    new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
      filename: __DEV__ ? '[name].css' : '[name].[fullhash].css',
      chunkFilename: __DEV__ ? '[id].css' : '[id].[fullhash].css',
    }),
    __DEV__ && new webpack.HotModuleReplacementPlugin(),
    __DEV__ && new ReactRefreshWebpackPlugin({ overlay: { sockIntegration: 'whm' } }),
  ].filter(Boolean),
  optimization: {
    splitChunks: {
      // the worklet bundle has to stay one self-contained file: its global
      // scope can't import or fetch anything a split would move out of it
      chunks: chunk => chunk.name !== WORKLET_ENTRY,
    },
  },
  stats: 'minimal',
}

// HTML Template
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/index.html',
  base: '/',
  excludeChunks: [WORKLET_ENTRY], // the AudioWorklet loads it, not the document
}))

// Loaders
// ------------------------------------

// JavaScript
config.module.rules.push({
  test: /\.(ts|js)x?$/,
  exclude: /node_modules/,
  use: [{
    loader: 'babel-loader',
    options: {
      cacheDirectory: __DEV__,
      configFile: path.join(baseDir, 'config', 'babel.config.js'),
      plugins: [
        __DEV__ && import.meta.resolve('react-refresh/babel'),
      ].filter(Boolean),
    },
  }],
})

// Global Style
config.module.rules.push({
  test: /(global)\.css$/,
  use: [{
    loader: MiniCssExtractPlugin.loader,
  }, {
    loader: 'css-loader',
    options: {
      modules: false,
      sourceMap: false,
    },
  }],
})

// CSS Modules
config.module.rules.push({
  test: /\.css$/,
  exclude: /(global)\.css$/,
  use: [
    {
      loader: MiniCssExtractPlugin.loader,
    }, {
      loader: 'css-loader',
      options: {
        modules: {
          namedExport: false,
          exportLocalsConvention: 'as-is',
          localIdentName: __DEV__ ? '[name]__[local]--[hash:base64:5]' : '[hash:base64]',
        },
      },
    },
  ],
})

// Files
config.module.rules.push(
  {
    test: /\.woff2(\?.*)?$/,
    type: 'asset/resource',
  },
  {
    test: /\.svg(\?.*)?$/,
    type: 'asset',
  },
  {
    test: /\.(png|jpg|gif)$/,
    type: 'asset',
  },
)

// Markdown
config.module.rules.push({
  test: /\.md$/,
  use: [
    {
      loader: 'html-loader',
    },
    {
      loader: 'markdown-loader',
    },
  ],
})

if (__PROD__) config = applyLicenseConfig(config)

export default config
