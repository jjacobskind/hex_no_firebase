const { EnvironmentPlugin } = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const glob = require('glob')
// const { isProductionLike, isDevelopmentLike } = require('./config/server')
const isDevelopmentLike = true, isProductionLike = false;

const entries = {
  // fonts: './styles/fonts.css',
  application: glob.sync('./pages/**/*.js'),
}

if (isDevelopmentLike) {
  entries['storybook'] = glob.sync('./stories/**/*.js')
}

module.exports = {
  devtool: isDevelopmentLike ? 'cheap-module-inline-source-map' : 'hidden-source-map',
  entry: entries,
  output: {
    filename: '[name].bundle.css',
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
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                localIdentName: '[local]',
                minimize: isProductionLike,
                modules: true,
              },
            },
            'postcss-loader',
          ],
        }),
      },
      {
        test: /\.css$/,
        exclude: [
          path.resolve('components'),
          path.resolve('layouts'),
        ], /* Vendor files */
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                minimize: isProductionLike,
                modules: false,
              },
            },
          ],
        }),
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader'
      }
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name].bundle.css', {
      ignoreOrder: true,
    }),
    new EnvironmentPlugin(process.env),
  ],
}
