const { EnvironmentPlugin } = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries')
const path = require('path')
const glob = require('glob')
// const { isProductionLike, isDevelopmentLike } = require('./config/server')
const isDevelopmentLike = true, isProductionLike = false;

const entries = {
  fonts: path.resolve('styles', 'fonts.css'),
  application: glob.sync('./pages/**/*.js'),
}

if (isDevelopmentLike) {
  entries['storybook'] = glob.sync('./stories/**/*.js')
}

module.exports = {
  // devtool: isDevelopmentLike ? 'cheap-module-inline-source-map' : 'hidden-source-map',
  entry: entries,
  output: {
    filename: '[name].bundle.js',
    path: path.resolve('build', 'static'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              plugins: [
                ['module-resolver', {
                  'root': ['./'],
                  'alias': {
                    'hex-island': path.resolve(),
                  },
                  'extensions': ['.js', '.svg'],
                }],
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: [
          path.resolve('components'),
          path.resolve('layouts'),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              localIdentName: '[local]',
              // minimize: isProductionLike,
              modules: true,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.css$/,
        exclude: [
          path.resolve('components'),
          path.resolve('layouts'),
        ], /* Vendor files */
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // minimize: isProductionLike,
              modules: false,
            },
          },
        ],
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader'
      }
    ],
  },
  plugins: [
    new FixStyleOnlyEntriesPlugin({ extensions:["css", "js"] }),
    new MiniCssExtractPlugin({
      filename: '[name].bundle.css',
    }),
    new EnvironmentPlugin(process.env),
  ],
}
