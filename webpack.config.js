const { EnvironmentPlugin } = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const path = require('path')
const glob = require('glob')
// const { isProductionLike, isDevelopmentLike } = require('./config/server')
const isDevelopmentLike = true, isProductionLike = false;

const entries = {
  // fonts: './styles/fonts.css',
  // application: glob.sync('./pages/**/*.js', { ignore: './pages/admin-new/**' }),
  // admin: glob.sync('./pages/admin-new/**/*.js'),
}

if (isDevelopmentLike) {
  entries['storybook'] = glob.sync('./stories/**/*.js')
}

module.exports = {
  devtool: isDevelopmentLike ? 'cheap-module-inline-source-map' : 'hidden-source-map',
  entry: entries,
  output: {
    filename: '[name].bundle.css',
    path: path.resolve('build/static'),
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
                  'extensions': ['.js', '.jsx', '.svg'],
                }],
              ],
              presets: [
                'env',
                'stage-2',
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: path.resolve('components'),
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
        exclude: path.resolve('components'), /* Vendor files */
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
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name].bundle.css', {
      ignoreOrder: true,
    }),
    new EnvironmentPlugin(process.env),
  ],
}
