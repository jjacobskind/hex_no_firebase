import angular from 'angular';
import routerConfig from './routerConfig'
import authInterceptor from './authInterceptor'
import initializer from './initializer'
import gameConfig from '../game/game.js'
import authFactory from './authFactory'
import menuController from '../main/main.controller'
import menuRouter from '../main/main'

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
angularApp.factory('authFactory', authFactory)
angularApp.controller('MainCtrl', menuController)
angularApp.config(menuRouter)


export default angularApp
