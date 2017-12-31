'use strict';

hexIslandApp
  .controller('GameCtrl', function($state, engineFactory, game){
    // Will contain all interactions between engineFactory and board directive
    var gameData = engineFactory.prepGameOnClient(game);
    var gameDataMethods = {};
    for(var key in engineFactory) {
      gameDataMethods[key] = engineFactory[key].bind(gameData);
    }

  });
