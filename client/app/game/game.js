import {create, join, fetch} from '../../api/game'

export default ($stateProvider) => {

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
            var gameId = $stateParams.id;
            var task = $stateParams.task;
            let request;

            if(task === 'create') {
              request = create($stateParams.size)
            } else if (task === 'join') {
              request = join(gameId)
            // } else if (gameID === 'test') {
            //   return $http.put('/api/games/test', $stateParams).then(callback, err_callback);
            } else if (!!gameId) {
              request = fetch(gameId)
            }

            return request
              .then(game => {
                if($stateParams.id !== 'test') {
                  for(var key in $stateParams) { $stateParams[key] = null; }
                  $stateParams.id = game._id;
                }
                return game;
              })
              .catch(console.error)
          }
        }
      });
  }
