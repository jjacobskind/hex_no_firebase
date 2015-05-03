'use strict';

angular.module('hexIslandApp')
    .factory('authFactory', function(Auth){
        var playerData, playerID, playerDisplayName;
        return {
            setPlayerID: function(id){
                playerID = id;
            },
            getPlayerID: function(){
                return playerID;
            },
            setPlayerName: function(name) {
                playerDisplayName = name;
            },
            getPlayerName: function(){
                return playerDisplayName;
            }
        };
    })
  .controller('MainCtrl', function ($scope, $state, $http, $window, Auth, authFactory, boardFactory, engineFactory, socket, $q, $rootScope) {
    var self = this;
    self.player_name;
    var testcanvas = document.createElement('canvas');
    self.meets_reqs = !!(testcanvas.getContext("webgl") || testcanvas.getContext("experimental-webgl"));
    self.player_name = authFactory.getPlayerName();

    self.previousGameIDs = [];

    self.createNewGame = function(game_size) {
        $state.go('game', { task: 'create', game_size: game_size });
        // $http.post('/api/games', {small_num:small_num, big_num:big_num})
        //     .success(engineFactory.prepGameOnClient);
    };

    self.joinGame = function(gameID){
        $state.go('game', { id: gameID, task: 'join' });
        // $http.post('/api/games/join', {gameID: gameID})
        //     .success(function(data){
        //         if(data.hasOwnProperty('err')) { console.log(data.err); }
        //         else { engineFactory.prepGameOnClient(data); }
        //     });
    };

    self.loadUsersGameList = function(){
        $http.get('/api/users/' + Auth.getCurrentUser()._id + '/games')
            .success(function(data){
                self.previousGameIDs = data.gamesList;
                $state.go('main.load');
            });
    }

    self.loadPreviousGame = function(gameID) {
        $state.go('game', { id: gameID, task: 'load' });
        // $http.get('/api/games/' + gameID)
        //     .success(engineFactory.prepGameOnClient);
    };

    self.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };
  });