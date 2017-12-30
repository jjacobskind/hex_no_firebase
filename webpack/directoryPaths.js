import path from 'path';

const rootDir = path.resolve(__dirname, '..');
const serverBuildDir = path.resolve(rootDir, 'serverBuild');
const publicDir = path.resolve(rootDir, 'public/build');
const clientDir = path.resolve(rootDir, 'client');

export default {
  rootDir,
  serverBuildDir,
  publicDir,
  clientDir
};
