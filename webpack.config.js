const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
    path: path.resolve(__dirname, 'dist'),
    publicPath: project.publicPath,
  },
  resolve: {
    modules: [
      './src',
      'node_modules',
    ],
    extensions: ['*', '.js', '.jsx', '.json'],
    alias: {
      'constants': path.resolve(__dirname, 'constants'),
    }
  },
  module: {
    rules: [],
  },
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

// ------------------------------------
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
        'babel-plugin-transform-class-properties',
        'babel-plugin-transform-object-rest-spread',
        'babel-plugin-transform-runtime',
        ['react-css-modules', {
          webpackHotModuleReloading: true,
          'generateScopedName' : '[name]__[local]___[hash:base64:5]',
        }]
      ],
      presets: [
        'babel-preset-react',
        ['babel-preset-env', {
          targets: {
            browsers: 'last 1 versions',
            uglify: true,
            modules: false,
          },
        }],
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

// HTML Template
// ------------------------------------
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/index.html',
  inject: true,
}))

// Production Optimizations
// ------------------------------------
if (__PROD__) {
  config.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: !!config.devtool,
      comments: false,
      compress: {
        warnings: false,
        screw_ie8: true,
        conditionals: true,
        unused: true,
        comparisons: true,
        sequences: true,
        dead_code: true,
        evaluate: true,
        if_return: true,
        join_vars: true,
      },
    })
  )
}

module.exports = config
