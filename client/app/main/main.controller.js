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

    if(Auth.isLoggedIn() && $state.current.name==='main.login' && self.meets_reqs){
        self.player_name = authFactory.getPlayerName();
        $state.go('main.menu');
    }

    self.previousGameIDs = [];

    self.createNewGame = engineFactory.newGame;

    self.loadUsersGameList = function(){
        $http.get('/api/users/' + Auth.getCurrentUser()._id + '/games')
            .success(function(data){
                self.previousGameIDs = data.gamesList;
                $state.go('main.load');
            });
    }

    self.loadPreviousGame = engineFactory.restorePreviousGame;
    self.joinGameID = engineFactory.joinGame;

    self.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };
  });