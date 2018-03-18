const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const stringHash = require('string-hash')
const mapCSSFileName = require('./build/helpers').mapCSSFileName

module.exports = () => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-cssnext')(),
    require('postcss-modules')({
      generateScopedName: (name, filename, css) => {
          const splitFilename = filename.split('/')
          const componentName = splitFilename[splitFilename.length - 2]
          const baseClassName = `${ componentName }---${ name }---`
          const hash = stringHash(css + baseClassName).toString(36).substr(0, 5)
          return [baseClassName, hash].join('')
      },
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
