var Game = require('../../api/game/game.model');
var User = require('../../api/user/user.model');
var GameObject = require('../engines/game-engine').GameEngine;
var BoardObject = require('../engines/game-engine').BoardEngine;
var PlayerObject = require('../engines/player-engine').Player;
var helpers = require('../helpers')

var testGameIds = {
  jeremy: '555021a12dd164ddca9c7dfb',
  steve: null,
  ahn: null
};

var playerArrays = {
  jeremy: ['jeremy.jacobskind@gmail.com', 'jacob.jeremyskind@gmail.com'],
  steve: [],
  ahn: []
}

var buildGame = function(req) {
  var gameMongoose;
  for(var key in playerArrays) {
    if(playerArrays[key].indexOf(req.user.email) !== -1) {
      var tester = key;
    }
  }

  return instantiateGame(tester, req.body)
    .then(function(new_game) {
      return Game.findByIdAndUpdate(testGameIds[tester], new_game, { update: true }, function(err, game) {
          return game;
        })
        .then(function(gameArr) {
          // extra method needed to break game out of 1 element array
          var returnObj = JSON.parse(JSON.stringify(gameArr[0]));
          var userID = String(req.user._id);
          returnObj = helpers.stripPlayerData(userID, returnObj);
          var i=0;
          while(!returnObj.players[i].playerQualities) { i++; }
          returnObj.playerID = i;
          return returnObj;
        });
    });

};

var instantiateGame = function(tester, params) {
  switch(params.size) {
    case 'regular':
      var new_game = new GameObject(null, 3, 5);
      break;
    case 'expanded':
      var new_game =  new GameObject(null, 3, 6);
      break;
    case 'party':
      var new_game =  new GameObject(null, 8, 10);
      break;
  }

  new_game.gameBoard = {
    boardTiles: new_game.gameBoard.boardTiles,
    boardVertices: new_game.gameBoard.boardVertices
  };
  new_game.chatMessages = [];
  return configureGame(new_game, tester, params);
};

var configureGame = function(game_no_players, tester, params) {
  return addPlayers(game_no_players, tester, params.players)
    .then(function(game){
      return game;
    });
};

var addPlayers = function(game, tester, num_players) {
  game.players = [];
  var playersToAdd = playerArrays[tester].slice(0, num_players).map(function(email) {
    return { 'email': email };
  });

  if(!!playersToAdd) {
    return User.find({ $or: playersToAdd}).exec()
      .then(function(playersArr) {
        playersArr.forEach(function(player) {
          var index = player.games.indexOf(testGameIds[tester]);
          if(index !== -1) {
            player.games.splice(index, 1);
          }
          player.games.unshift(testGameIds[tester]);
          player.save();
          game.players.push(new PlayerObject(null, player, game.players.length));
        });
        return game;
      });
  }
};


module.exports = buildGame;