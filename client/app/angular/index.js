import angular from 'angular';
import routerConfig from './routerConfig'
import authInterceptor from './authInterceptor'
import initializer from './initializer'
import gameConfig from '../game/game.js'

require('angular-ui-router')
require('angular-socket-io')

let angularApp = angular.module('hexIslandApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'btford.socket-io'
])
.config(routerConfig)
.factory('authInterceptor', authInterceptor)
.run(initializer)

angularApp.config(gameConfig)


export default angularApp
