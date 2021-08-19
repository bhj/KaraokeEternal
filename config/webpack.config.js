const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { LicenseWebpackPlugin } = require('license-webpack-plugin')

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
      __KF_VERSION__: JSON.stringify(process.env.npm_package_version),
      __KF_URL_HOME__: JSON.stringify('https://www.karaoke-forever.com'),
      __KF_URL_LICENSE__: JSON.stringify('/licenses.txt'),
      __KF_URL_REPO__: JSON.stringify('https://github.com/bhj/karaoke-forever/'),
      __KF_URL_SPONSOR__: JSON.stringify('https://github.com/sponsors/bhj/'),
      __KF_COPYRIGHT__: JSON.stringify(`2019-${new Date().getFullYear()} RadRoot LLC`),
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

if (__PROD__) {
  config.plugins.push(new LicenseWebpackPlugin({
    addBanner: true,
    outputFilename: 'licenses.txt',
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
  test : /(global)\.css$/,
  use  : [{
    loader : MiniCssExtractPlugin.loader,
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
    test    : /\.woff2(\?.*)?$/,
    loader  : 'url-loader',
    options : {
      limit    : '10000',
      mimetype : 'application/font-woff2'
    }
  },
  {
    test    : /\.svg(\?.*)?$/,
    loader  : 'url-loader',
    options : {
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

// Markdown
config.module.rules.push(
  {
    test: /\.md$/,
    use: [
      {
        loader: 'html-loader'
      },
      {
        loader: 'markdown-loader',
      }
    ]
  },
)

module.exports = config
