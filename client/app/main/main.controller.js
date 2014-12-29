'use strict';

angular.module('settlersApp')
    .factory('authFactory', function(Auth){
        var authID, playerData, playerID, playerName, playerFirstName;
        if(Auth.isLoggedIn()){
            playerName = Auth.getCurrentUser().name;
            playerFirstName = playerName.split(" ")[0];
            authID = Auth.getCurrentUser()._id;
        }
        return {
            getAuthID: function() {
                return authID;
            },
            setPlayerID: function(id){
                playerID = id;
            },
            getPlayerID: function(){
                return playerID;
            },
            getPlayerName: function(full){
                if(full){
                    return playerName;
                } else {
                    return playerFirstName;
                }
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