import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
// import MainMenu from './reactTemplates/MainMenu'

export default function ($scope, $state, $http, $window, Auth, authFactory, boardFactory, engineFactory, socket, $q, $rootScope, $sce) {
    var self = this;
    self.player_name;
    var testcanvas = document.createElement('canvas');
    self.meets_reqs = !!(testcanvas.getContext("webgl") || testcanvas.getContext("experimental-webgl"));
    self.player_name = authFactory.getPlayerName() || 'J';

    self.previousGameIDs = [];

    self.createNewGame = function(board_size) {
        $state.go('game', { task: 'create', size: board_size });
    };

    self.joinGame = function(gameID){
        $state.go('game', { id: gameID, task: 'join' });
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
    };

    self.loginOauth = function(provider) {
        $window.location.href = '/auth/' + provider;
    };
  });