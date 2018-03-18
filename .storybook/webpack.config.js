const path = require('path')
const rules = require('../shared_rules.webpack')

module.exports = {
  resolveLoader: {
    modules: [
      path.resolve('node_modules', 'next', 'dist', 'server', 'build', 'loaders'),
      path.resolve('node_modules'),
    ]
  },
  module: {
    rules,
  },
};
