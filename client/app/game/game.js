'use strict';

angular.module('hexIslandApp')
  .config(function ($stateProvider) {

    var testQueryParameters = [
      'task',
      'size',
      'players',
    ];

    $stateProvider
      .state('game', {
        url: '/game/:id?' + testQueryParameters.join('&'),
        templateUrl: 'app/game/game.html',
        controller: 'GameCtrl as game_ctrl',
        authenticate: true,
        resolve: {

          game: function($http, $stateParams) {
            var gameID = $stateParams.id;
            var task = $stateParams.task;

            var callback = function(game) {
              if($stateParams.id !== 'test') {
                for(var key in $stateParams) { $stateParams[key] = null; }
                $stateParams.id = game.data._id;
              }
              return game.data;
            }

            var err_callback = function(data) {
              console.log(data);
            }

            if(task === 'create') {
              return $http.post('/api/games', { size: $stateParams.size }).then(callback, err_callback);
            } else if (task === 'join') {
              return $http.post('/api/games/join', {gameID: gameID}).then(callback, err_callback);
            } else if (gameID === 'test') {
              return $http.put('/api/games/test', $stateParams).then(callback, err_callback);
            } else if (!!gameID) {
              return $http.get('/api/games/' + gameID).then(callback, err_callback);
            }
          }
        }
      });
  });