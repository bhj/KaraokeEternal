const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const project = require('./project.config')

const __DEV__ = project.env === 'development'
const __TEST__ = project.env === 'test'
const __PROD__ = project.env === 'production'

const config = {
  mode: __PROD__ ? 'production' : 'development',
  entry: {
    main: [
      './src/main.js'
    ],
  },
  output: {
    path: path.join(project.basePath, 'dist'),
    publicPath: project.publicPath,
  },
  resolve: {
    modules: [
      path.join(project.basePath, 'src'),
      'node_modules',
    ],
    extensions: ['*', '.js', '.jsx', '.json'],
    alias: {
      'constants': path.join(project.basePath, 'constants'),
    }
  },
  module: { rules: [] },
  plugins: [
    new webpack.DefinePlugin(Object.assign({
      'process.env': { NODE_ENV: JSON.stringify(project.env) },
      __DEV__,
      __TEST__,
      __PROD__,
    }, project.globals)),
    new MiniCssExtractPlugin(),
  ],
}

// HTML Template
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/index.html',
  inject: true,
}))

// copy /public to /dist in production
if (__PROD__) {
  config.plugins.push(new CopyWebpackPlugin([{
    from: path.join(project.basePath, 'public'),
    to: path.join(project.basePath, 'dist'),
  }], { /* options */ }))
}

// Loaders
// ------------------------------------

// JavaScript
config.module.rules.push({
  test: /\.(js|jsx)$/,
  exclude: /node_modules/,
  use: [{
    loader: 'babel-loader',
    query: {
      cacheDirectory: true,
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        ['react-css-modules', {
          webpackHotModuleReloading: __DEV__,
          'generateScopedName' : '[name]__[local]___[hash:base64:5]',
        }]
      ],
      presets: [
        ['@babel/preset-env', {
          modules: false, // https://github.com/babel/babel-loader/issues/521
        }],
        '@babel/preset-react',
      ]
    },
  }],
})

// Global Style
config.module.rules.push({
  test : /(global)\.css$/,
  use  : [{
    loader : MiniCssExtractPlugin.loader,
  }, {
    loader  : 'css-loader',
    options : {
      modules   : false,
      sourceMap : false,
      minimize  : false
    }
  }],
})

// CSS Modules
config.module.rules.push({
  test : /\.css$/,
  exclude : /(global)\.css$/,
  use  : [{
    loader : MiniCssExtractPlugin.loader,
  }, {
    loader  : 'css-loader',
    options : {
      modules   : true,
      localIdentName: '[name]__[local]___[hash:base64:5]',
    }
  }],
})

// Files
/* eslint-disable */
config.module.rules.push(
  {
    test    : /\.woff(\?.*)?$/,
    loader  : 'url-loader',
    options : {
      prefix   : 'fonts/',
      name     : 'fonts/[name].[ext]',
      limit    : '10000',
      mimetype : 'application/font-woff'
    }
  },
  {
    test    : /\.woff2(\?.*)?$/,
    loader  : 'url-loader',
    options : {
      prefix   : 'fonts/',
      name     : 'fonts/[name].[ext]',
      limit    : '10000',
      mimetype : 'application/font-woff2'
    }
  },
  {
    test    : /\.svg(\?.*)?$/,
    loader  : 'url-loader',
    options : {
      prefix   : 'fonts/',
      name     : 'fonts/[name].[ext]',
      limit    : '10000',
      mimetype : 'image/svg+xml'
    }
  },
  {
    test    : /\.(png|jpg|gif)$/,
    loader  : 'url-loader',
    options : {
      limit : '8192'
    }
  }
)
/* eslint-enable */

module.exports = config
