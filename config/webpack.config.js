const path = require('path')
const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const applyLicenseConfig = require('./webpack.license.config')

const NODE_ENV = process.env.NODE_ENV || 'production'
const __DEV__ = NODE_ENV === 'development'
const __TEST__ = NODE_ENV === 'test'
const __PROD__ = NODE_ENV === 'production'
const baseDir = path.resolve(__dirname, '..')

const config = {
  mode: __PROD__ ? 'production' : 'development',
  entry: {
    main: [
      './src/main.js',
      __DEV__ && 'webpack-hot-middleware/client', // https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/213
    ].filter(Boolean),
  },
  output: {
    path: path.join(baseDir, 'build'),
    filename: __DEV__ ? '[name].js' : '[name].[fullhash].js',
  },
  resolve: {
    modules: [
      path.join(baseDir, 'src'),
      'node_modules',
    ],
    alias: {
      '<PROJECT_ROOT>': baseDir,
      assets: path.join(baseDir, 'assets'),
      fonts: path.join(baseDir, 'docs', 'assets', 'fonts'),
      shared: path.join(baseDir, 'shared'),
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
      __KE_URL_REPO__: JSON.stringify('https://github.com/bhj/KaraokeEternal/'),
      __KE_URL_SPONSOR__: JSON.stringify('https://github.com/sponsors/bhj/'),
      __KE_COPYRIGHT__: JSON.stringify(`2019-${new Date().getFullYear()} RadRoot LLC`),
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
  test: /\.(js|jsx)$/,
  exclude: /node_modules/,
  use: [{
    loader: 'babel-loader',
    options: {
      cacheDirectory: __DEV__,
      configFile: path.join(baseDir, 'config', 'babel.config.json'),
      plugins: [
        __DEV__ && require.resolve('react-refresh/babel'),
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
    }
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
          localIdentName: __DEV__ ? '[path][name]__[local]__' : '[hash:base64]',
        }
      }
    }
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
  }
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
    }
  ]
})

module.exports = __PROD__ ? applyLicenseConfig(config) : config
