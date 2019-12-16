const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { LicenseWebpackPlugin } = require('license-webpack-plugin')
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
    path: project.buildPath,
    filename: __DEV__ ? '[name].js' : '[name].[hash].js',
    publicPath: '/',
  },
  resolve: {
    modules: [
      path.join(project.basePath, 'src'),
      'node_modules',
    ],
    alias: {
      assets: path.join(project.basePath, 'assets'),
      fonts: path.join(project.basePath, 'docs', 'assets', 'fonts'),
      shared: path.join(project.basePath, 'shared'),
    }
  },
  module: { rules: [] },
  plugins: [
    new webpack.DefinePlugin(Object.assign({
      'process.env': { NODE_ENV: JSON.stringify(project.env) },
      __DEV__,
      __TEST__,
      __PROD__,
      __KF_VERSION__: JSON.stringify(process.env.npm_package_version),
      __KF_HOMEPAGE__: JSON.stringify('https://www.karaoke-forever.com'),
      __KF_COPYRIGHT__: JSON.stringify(`2017-${new Date().getFullYear()} RadRoot LLC`),
    }, project.globals)),
    new CaseSensitivePathsPlugin(),
    new MiniCssExtractPlugin({
      filename: __DEV__ ? '[name].css' : '[name].[hash].css',
      chunkFilename: __DEV__ ? '[id].css' : '[id].[hash].css',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
}

if (__PROD__) {
  config.plugins.push(new LicenseWebpackPlugin({
    addBanner: true,
    outputFilename: 'license_en.txt',
    perChunkOutput: false,
    renderLicenses: (modules) => {
      let txt = ''

      modules.forEach(m => {
        if (!m.licenseText) return

        txt += '\n' + '*'.repeat(71) + '\n\n'
        txt += m.packageJson.name + '\n'
        txt += m.licenseText.replace(/(\S)\n(\S)/gm, '$1 $2')
      })

      return 'Karaoke Forever\n' + fs.readFileSync('./LICENSE', 'utf8') + txt
    },
  }))
}

// HTML Template
config.plugins.push(new HtmlWebpackPlugin({
  template: './src/index.html',
  inject: true,
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
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        ['react-css-modules', {
          webpackHotModuleReloading: __DEV__,
          generateScopedName : '[name]__[local]___[hash:base64:5]',
        }]
      ],
      presets: [
        '@babel/preset-env',
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
    options: {
      hmr: __DEV__,
    },
  }, {
    loader  : 'css-loader',
    options : {
      modules   : false,
      sourceMap : false,
    }
  }],
})

// CSS Modules
config.module.rules.push({
  test: /\.css$/,
  exclude : /(global)\.css$/,
  use: [
    {
      loader : MiniCssExtractPlugin.loader,
      options: {
        hmr: __DEV__,
      }
    }, {
      loader: 'css-loader',
      options: {
        modules: {
          localIdentName: '[name]__[local]___[hash:base64:5]',
        }
      }
    }
  ],
})

// Files
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

module.exports = config
