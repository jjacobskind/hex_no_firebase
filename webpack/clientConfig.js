import path from 'path';
import loaders from './loaders';
import {clientPlugins} from './queuePlugins';
import merge from 'lodash/merge';
import {publicDir, clientDir, reactDir} from './directoryPaths';

const STATIC_PROPERTIES = {
  devtool: 'sourcemap',
  context: clientDir,
  entry: {
    app: './bootstrapper.js',
    vendors: [
      'angular',
      'angular-cookies',
      'angular-mocks',
      'angular-resource',
      'angular-sanitize',
      'angular-scenario',
      'angular-socket-io',
      'angular-ui-bootstrap',
      'angular-ui-router'
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.resolve('./node_modules')],
    alias: {
      reactDir,
    }
  },
  target: 'web',
  module: { rules: loaders }
}

export default (options) => {
  const {isDevelopmentBuild} = options;
  const plugins = clientPlugins(isDevelopmentBuild);


  const config = merge(STATIC_PROPERTIES, {
    plugins,
    output: {
      path: publicDir,
      filename: '[name].js',
      publicPath: '/'
    }
  });

  return config;
};
