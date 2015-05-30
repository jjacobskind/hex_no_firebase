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
  Game.findByIdAndPopulate(req.params.id)
    .then(function(game) {
      if(!game) { return res.send(404); }

      var playerIndex = game.getPlayerIndex(req.user);

      var returnObj = helpers.stripPlayerData(req.user._id, game.toObject());
      returnObj.playerID = playerIndex;
      return res.json(200, returnObj);
    },
    function(err) { return handleError(res, err); });
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

  Game.create(new_game, function(err, game) {
    if(err) { return handleError(res, err); }
    game.addPlayer(req.user)
      .then(function(updated_game) {
        updated_game.populatePlayers()
          .then(function(populated_game) {
            populated_game = populated_game.toObject();
            populated_game.playerID = 0;
            return res.json(200, populated_game);
          });
      });
  });
};

// Adds a user to an existing game, if there are available slots
// If user is already in the game, just returns the game
exports.join = function(req, res) {
  var gameID = req.body.gameID;
  var socket = require('../../components/socket').socket;
  Game.findByIdAndAddPlayer(gameID, req.user, function(err, game) {
    if(err) { return handleError(res, err); }
    if(!game) { return res.json({ err: 'Game not found!' })}

    var returnObj = helpers.stripPlayerData(req.user._id, game.toObject());

    // If necessary, fix this to strip player data, but prob doesn't matter since players only join before anyone has private details
    socket.to(game._id).emit('updatePlayers', { game: { players: game.players } });
    returnObj.playerID = returnObj.players.length-1;
    return res.json(200, returnObj);
  });
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