const { EnvironmentPlugin } = require("webpack")
const uglifyJsPlugin = require("uglifyjs-webpack-plugin")
const rules = require('./shared_rules.webpack')
const path = require('path')

module.exports = {
  assetPrefix: process.env.ASSET_HOST || "",

  distDir: "dist",

  webpack: (config, { dev }) => {
    config.devtool = dev ? "cheap-module-inline-source-map" : "hidden-source-map"

    config.plugins.push(
      new EnvironmentPlugin(process.env),
    )

    if (process.env.ANALYZE_BUNDLE) {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: "server",
          analyzerHost: "127.0.0.1",
          analyzerPort: 8888,
          openAnalyzer: false,
        }),
      )
    }

    if (!dev) {
      // Remove uglifyjs-webpack-plugin "^0.4.4"
      config.plugins = config.plugins.filter(
        (plugin) => (plugin.constructor.name !== "UglifyJsPlugin"),
      )

      // Add uglifyjs-webpack-plugin "1.0.0.beta.1" for ES6 support
      config.plugins.push(
        new uglifyJsPlugin({ sourceMap: true })
      )
    }

    config.module.rules.push(rules[0])
    return config
  },
}
