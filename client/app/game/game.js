'use strict';

angular.module('hexIslandApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('game', {
        url: '/game',
        templateUrl: 'app/game/game.html',
        controller: 'GameCtrl as game_ctrl',
        authenticate: true
      });
  });