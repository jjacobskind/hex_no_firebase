const fs = require('fs')
const mkdirp = require('mkdirp')
const mapCSSFileName = require('./build/helpers').mapCSSFileName

module.exports = () => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-cssnext')(),
    require('postcss-modules')({
      generateScopedName: '[name]---[local]---[hash:base64:5]',
      getJSON: function(cssFileName, json, outputFileName) {
        const pathData = mapCSSFileName(cssFileName)
        mkdirp.sync(pathData.buildPath)
        fs.writeFileSync(pathData.fullPath, JSON.stringify(json))
      },
    }),
    require('postcss-assets')({
      loadPaths: [
        'build/static/',
      ],
    }),
    require('postcss-simple-vars')(),
    require('postcss-mixins')(),
    require('postcss-nested')(),
    require('postcss-normalize')(),
  ],
})
