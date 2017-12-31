import lodash from 'lodash'
import angularApp from './app/app.js'

if (process.env.BROWSER) {
  require('./app/app.scss');
}

window.angular = angularApp;
