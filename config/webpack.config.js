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

let config = {
  mode: __PROD__ ? 'production' : 'development',
  entry: {
    main: [
      './src/main',
      __DEV__ && 'webpack-hot-middleware/client', // https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/213
    ].filter(Boolean),
  },
  output: {
    filename: __DEV__ ? '[name].js' : '[name].[fullhash].js',
    path: path.join(baseDir, 'build'),
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
      __KE_URL_REPO__: JSON.stringify('https://www.karaoke-eternal.com/repo'),
      __KE_URL_SPONSOR__: JSON.stringify('https://www.karaoke-eternal.com/sponsor'),
    })),
    new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
      filename: __DEV__ ? '[name].css' : '[name].[fullhash].css',
      chunkFilename: __DEV__ ? '[id].css' : '[id].[fullhash].css',
    }),
    __DEV__ && new webpack.HotModuleReplacementPlugin(),
    __DEV__ && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
  stats: 'minimal',
}

// HTML Template
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/index.html',
  base: '/',
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
      configFile: path.join(baseDir, 'config', 'babel.config.json'),
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
