'use strict';

var _ = require('lodash');
var Game = require('./game.model');
var User = require('../user/user.model');
var GameObject = require('../../components/engines/game-engine').GameEngine;
var BoardObject = require('../../components/engines/game-engine').BoardEngine;
var PlayerObject = require('../../components/engines/player-engine').Player;
var helpers = require('../../components/helpers');
var GameFabricator = require('../../components/game-fabricator');

// Get list of games
exports.index = function(req, res) {
  Game.find(function (err, games) {
    if(err) { return handleError(res, err); }
    return res.json(200, games);
  });
};

// Get a single game
exports.show = function(req, res) {
  Game.findById(req.params.id).lean().exec(function (err, game) {
    if(err) { return handleError(res, err); }
    if(!game) { return res.send(404); }

    var playerIndex= -1;
    var i = game.players.length;
    var userID = String(req.user._id);

    while(i--) {
      if(userID===String(game.players[i].userRef)) { playerIndex = i; }
    }

    var returnObj = JSON.parse(JSON.stringify(game));
    returnObj = helpers.stripPlayerData(userID, returnObj);
    returnObj.playerID = playerIndex;
    return res.json(returnObj);
  });
};

// Creates a new game in the DB.
exports.create = function(req, res) {
  switch(req.body.size) {
    case 'regular':
      var new_game = new GameObject(null, 3, 5);
      break;
    case 'expanded':
      var new_game = new GameObject(null, 3, 6);
      break;
    case 'party':
      var new_game = new GameObject(null, 8, 10);
      break;
  }

  new_game.gameBoard = {
    boardTiles: new_game.gameBoard.boardTiles,
    boardVertices: new_game.gameBoard.boardVertices
  };
  new_game.players.push(new PlayerObject(null, req.user, new_game.players.length));

  Game.create(new_game, function(err, game) {
    if(err) { return handleError(res, err); }

    User.findById(req.user._id, function(userErr, userObj){
      if(userErr) { return handleError(res, err); }
      userObj.games.push(game._id);
      userObj.save();

      var returnObj = JSON.parse(JSON.stringify(game));
      returnObj.playerID = 0;
      return res.json(201, returnObj);
    });

  });
};

// Adds a user to an existing game, if there are available slots
// If user is already in the game, just returns the game
exports.join = function(req, res) {
  var userID = req.user._id;
  var gameID = req.body.gameID;
  var socket = require('../../components/socket').socket;
  Game.findById(gameID, function(err, game){
    if(err) { return handleError(res, err); }
    if(!game) { return res.json({err:"Game not found!"})}

    // Check if user is already in this game. If so, return game
    for(var i =0, len=game.players.length; i<len; i++) {
      if(String(game.players[i].userRef) === String(userID)) {
        var returnObj = JSON.parse(JSON.stringify(game));
        returnObj = helpers.stripPlayerData(req.user._id, returnObj);
        returnObj.playerID = i;
        return res.json(returnObj);
      }
    }

    // If user is not in this game, check whether there are available slots
    var num_tiles = 0;
    for(i=0, len=game.gameBoard.boardTiles.length; i<len; i++) {
      num_tiles+= game.gameBoard.boardTiles[i].length;
    }

    var max_players = Math.round(num_tiles/5);

    if(max_players>game.players.length && !game.areAllPlayersAdded){
      game.players.push(new PlayerObject(null, req.user, game.players.length));
      if(max_players===game.players.length){
        game.areAllPlayersAdded = true;
      }
      game.save();

      // Add game to game list on user document
      User.findById(userID, function(userErr, userObj){
        if(userErr) { return handleError(res, userErr); }
        userObj.games.push(game._id);
        userObj.save();

        var returnObj = JSON.parse(JSON.stringify(game));
        returnObj = helpers.stripPlayerData(req.user._id, returnObj);

        // If necessary, fix this to strip player data, but prob doesn't matter since players only join before anyone has private details
        socket.to(game._id).emit('updatePlayers', {'game': { players: game.players } });
        returnObj.playerID = returnObj.players.length-1;
        return res.json(returnObj);
      });
    } else {
      return res.json({err: "This game has been closed off to new players."})
    }
  })

};

exports.test = function(req, res) {
  if(process.env.HEX_ENV === 'development') {
    GameFabricator(req)
      .then(function(returnObj) {
        return res.json(200, returnObj);
      });
  } else {
    return res.send(403, 'Test route not available in production');
  }
};

// Updates an existing game in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Game.findById(req.params.id, function (err, game) {
    if (err) { return handleError(res, err); }
    if(!game) { return res.send(404); }
    var updated = _.merge(game, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, game);
    });
  });
};

// Deletes a game from the DB.
exports.destroy = function(req, res) {
  Game.findById(req.params.id, function (err, game) {
    if(err) { return handleError(res, err); }
    if(!game) { return res.send(404); }
    game.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}