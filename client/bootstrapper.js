import lodash from 'lodash'
import angularApp from './app/angular'

if (process.env.BROWSER) {
  require('./app/app.scss');
}

window.hexIslandApp = angularApp;
