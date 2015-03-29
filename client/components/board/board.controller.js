'use strict';

angular.module('hexIslandApp')
  .controller('BoardCtrl', function(boardFactory, engineFactory, authFactory, $scope, $state, $rootScope, $timeout, socket){
    if(!engineFactory.getGame().gameBoard.game.players){
      $state.go('main.menu');
      return;
    }
    var self = this;
    self.textContent = "";
    $rootScope.currentTurn = engineFactory.getGame().turn;
    $scope.playerHasRolled = false;
    $rootScope.currentPlayer = engineFactory.getGame().currentPlayer;
    $rootScope.playerBoard = [];
    $scope.currentGameID = $rootScope.currentGameID;

    $scope.players = engineFactory.getPlayers();
    $scope.buildMode = false;
    self.isopen= false;

    self.toggleBuildMenu = function($event){
      // Won't do anything if robber needs to be moved or 2-road development card is in play (needs to be adjusted before it will work)
      //   if($rootScope.lockDown) { return null; }

      $event.preventDefault();
      $event.stopPropagation();

      if(boardFactory.getBuildMode()){
        boardFactory.exitBuildMode();
        self.isopen = false;
      } else {
        $event.preventDefault();
        $event.stopPropagation();
        self.isopen = !self.isopen;
      }
    };

    self.setMode = boardFactory.set_someAction;

    self.submitChat = function(){
      if(self.textContent!==null){
        var message = self.textContent.trim();
      }
      if(message.length>0 && self.textContent!==null) {
        socket.emit('chatMessageToServer', {text: message});
        $('<div/>').text(message).prepend($('<em/>').text(authFactory.getPlayerName() +': ')).appendTo($('.textScreen'));
        $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
      }
      self.textContent=null;
      $('#typeBox').focus();
    };

    self.nextTurn = engineFactory.nextTurn;

    self.rollDice = function(){
      var validation = engineFactory.getGame().validatePlayerTurn(authFactory.getPlayerID(), "roll");
      if(validation.hasOwnProperty('err')) {
        console.log(validation.err);
        return;
      }
      socket.emit('rollDiceToServer');
    };

    var displayChatMessages = function(message){
      if (message.name === "GAME"){
        $('<div style="color:#bb5e00; font-size:0.8em; font-weight: 900;padding:4px 0 3px 0"/>').text(message.text).prepend($('<b/>').text('')).appendTo($('.textScreen'));
      }
      else {
        $('<div/>').text(message.text).prepend($('<em/>').text(message.name+': ')).appendTo($('.textScreen'));
      }
      $('.textScreen')[0].scrollTop = $('.textScreen')[0].scrollHeight;
    };

    // display chat messages
    var chatMessages = engineFactory.getChatMessages();
    for(var i=0, len=chatMessages.length; i<len; i++){
      displayChatMessages(chatMessages[i]);
    };

     // SOCKET LISTENERS
    socket.on('nextTurnToClient', function(data){
      engineFactory.updateGameProperties(data);
    });

    socket.on('rollDiceToClient', function(data) {
      engineFactory.updateGameProperties(data);
      $rootScope.currentRoll = data.game.diceNumber;
      if(data.game.robberMoveLockdown && authFactory.getPlayerID()===$scope.currentPlayer) {
        $rootScope.lockDown = true;
        boardFactory.set_someAction("robber");
      }
    });


    socket.on('chatMessageToClient', displayChatMessages);

    // adds new players to game
    socket.on('updatePlayers', function(data){
      engineFactory.updateGameProperties(data);
      $scope.players = data.game.players;
    });
  });