const fs = require('fs')
const path = require('path')
const trash = require('trash')
const mapCSSFileName = require('./build/helpers').mapCSSFileName

const rules = [
  {
    test: /\.css$/,
    include: [
      path.resolve('components'),
      path.resolve('layouts'),
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
      path.resolve('layouts'),
    ],
    loader: ['style-loader', 'css-loader'],
  }
]

module.exports = rules
