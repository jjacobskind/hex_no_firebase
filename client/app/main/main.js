'use strict';

angular.module('hexIslandApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        abstract:true,
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl as main_ctrl',
        authenticate: true
      })
      .state('main.login', {
        url: '/login',
        templateUrl: 'app/main/menu_templates/main_login.html',
        scope:false
      })
      .state('main.menu', {
      	url: '/',
      	templateUrl: 'app/main/menu_templates/main_menu.html',
      	scope:false,
        authenticate: true
      })
      .state('main.newGameOptions', {
        url: '/options',
        templateUrl: 'app/main/menu_templates/main_new_game_options.html',
        scope:false,
        authenticate: true
      })
      .state('main.load', {
      	url: '/load_game', 
      	templateUrl: 'app/main/menu_templates/main_load.html',
      	scope:false,
        authenticate: true
      })
      .state('main.join', {
      	url: '/join_game',
      	templateUrl: 'app/main/menu_templates/main_join.html',
      	scope: false,
        authenticate: true
      });
  });
