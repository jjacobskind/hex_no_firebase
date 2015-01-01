'use strict';

angular.module('hexIslandApp')
  .controller('BoardCtrl', function(boardFactory, engineFactory, authFactory, $scope, $state, $rootScope, $timeout, socket){
    if(engineFactory.getGame().currentPlayer===undefined){
      $state.go('main.login');
      return;
    }
    
    var self = this;
    self.setMode = boardFactory.set_someAction;
    self.textContent = "";
    $rootScope.currentTurn = engineFactory.getGame().turn;
    $scope.playerHasRolled = false;
    $rootScope.currentPlayer = engineFactory.getGame().currentPlayer;
    $rootScope.playerBoard = [];
    $scope.currentGameID = $rootScope.currentGameID;

    $scope.players = engineFactory.getPlayers();


    $scope.toggleDropdown = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.status.isopen = !$scope.status.isopen;
    };

    self.submitChat = function(){
      if(self.textContent!==null){
        var message = self.textContent.trim();
      }
      if(message.length>0 && self.textContent!==null) {
        console.log
        socket.emit('chat:messageToServer', {text: message});
        $('<div/>').text(message).prepend($('<em/>').text(authFactory.getPlayerName() +': ')).appendTo($('.textScreen'));
        $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
      }
      self.textContent=null;
      $('#typeBox').focus();
    };

    self.nextTurn = engineFactory.nextTurn();

    self.rollDice = function(){
      socket.emit('action:rollDice');
    };

     // SOCKET LISTENERS
    socket.on('updatePlayers', function(playerArr){
      engineFactory.updatePlayers(playerArr);
      $scope.players = playerArr;
    });

    socket.on('chat:messageToClient', function(message){
      if (message.name === "GAME"){
        $('<div style="color:#bb5e00; font-size:0.8em; font-weight: 900;padding:4px 0 3px 0"/>').text(message.text).prepend($('<b/>').text('')).appendTo($('.textScreen'));
      }
      else {
        $('<div/>').text(message.text).prepend($('<em/>').text(message.name+': ')).appendTo($('.textScreen'));
      }
      $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
    });

    socket.on('action:rollResults', function(data) {
      engineFactory.updatePlayers(data.players);
      $rootScope.currentRoll = data.roll;
      if(data.moveRobber && authFactory.getPlayerID()===$scope.currentPlayer) {
        boardFactory.set_someAction("robber");
      }
    });
  });