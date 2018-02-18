const path = require('path')
const rootDir = path.resolve()
const buildDir = path.resolve('build')


exports.mapCSSFileName = function (cssFileName) {
  const filePath = path.dirname(cssFileName)
  const buildPath = filePath.replace(rootDir, path.resolve(buildDir))
  const baseFileName = path.basename(cssFileName)
  const buildFileName = `${ baseFileName }.json`
  const fullPath = path.resolve(buildPath, buildFileName)

  return {
    buildPath,
    buildFileName,
    fullPath,
  }
}
