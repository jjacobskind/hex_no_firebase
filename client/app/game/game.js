'use strict';

angular.module('hexIslandApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('game', {
        url: '/game/:id?task',
        templateUrl: 'app/game/game.html',
        controller: 'GameCtrl as game_ctrl',
        authenticate: true,
        params: { task: null, game_size: null },
        resolve: {

          game: function($http, $stateParams) {
            var gameID = $stateParams.id;
            var task = $stateParams.task;

            var callback = function(game) {
              $stateParams.id = game.data._id;
              $stateParams.task = null;
              return game.data;
            }

            var err_callback = function(data) {
              console.log(data);
            }

            if(task === 'create' ) {
              return $http.post('/api/games', { game_size: $stateParams.game_size }).then(callback, err_callback);
            } else if (task === 'join') {
              return $http.post('/api/games/join', {gameID: gameID}).then(callback, err_callback);
            } else if (!!gameID) {
              return $http.get('/api/games/' + gameID).then(callback, err_callback);
            }
          }
        }
      });
  });