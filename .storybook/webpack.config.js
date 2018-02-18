const ExtractTextPlugin = require('extract-text-webpack-plugin')
const fs = require('fs')
const mapCSSFileName = require('../build/helpers').mapCSSFileName
const path = require('path')
const trash = require('trash')

module.exports = {
  resolveLoader: {
    modules: [
      path.resolve('node_modules', 'next', 'dist', 'server', 'build', 'loaders'),
      path.resolve('node_modules'),
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: [
          path.resolve('components'),
        ],
        use: [
          {
            loader: 'emit-file-loader',
            options: {
              name: 'dist/[path][name].[ext]',
              emitFile: true
            },
          },
          {
            loader: 'skeleton-loader',
            options: {
              procedure() {
                const fileName = this._module.userRequest
                const cssFileMap = mapCSSFileName(fileName).fullPath
                const classNameMap = fs.readFileSync(cssFileMap, 'utf8')
                trash(cssFileMap)
                return `module.exports = ${ classNameMap }`
              },
            },
          },
          'postcss-loader',
        ]
      },
      {
        test: /\.css$/,
        exclude: [
          path.resolve('components'),
        ],
        loader: ['style-loader', 'css-loader'],
      }
    ],
  },
};
