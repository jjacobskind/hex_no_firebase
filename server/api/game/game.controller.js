'use strict';

var _ = require('lodash');
var Game = require('./game.model');
var User = require('../user/user.model');
var GameObject = require('../../components/engines/game-engine').GameEngine;
var PlayerObject = require('../../components/engines/player-engine').Player;
var helpers = require('../../components/helpers');

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

    game = helpers.stripPlayerData(req.user._id, game);
    return res.json(game);
  });
};

// Creates a new game in the DB.
exports.create = function(req, res) {
  var small_num = req.body.small_num;
  var big_num = req.body.big_num;
  var new_game = new GameObject(small_num, big_num);
  new_game.gameBoard = {
    boardIsSetup: new_game.gameBoard.boardIsSetup,
    gameIsStarted: new_game.gameBoard.gameIsStarted,
    boardTiles: new_game.gameBoard.boardTiles,
    boardVertices: new_game.gameBoard.boardVertices
  };
  new_game.players.push(new PlayerObject(req.user, new_game.players.length));
  
  Game.create(new_game, function(err, game) {
    if(err) { return handleError(res, err); }
    
    User.findById(req.user._id, function(userErr, userObj){
      if(userErr) { return handleError(res, err); }
      userObj.games.push(game._id);
      userObj.save();
      return res.json(201, game);
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
        game = helpers.stripPlayerData(req.user._id, game.toObject());
        return res.json(game);
      }
    }

    // If user is not in this game, check whether there are available slots
    var num_tiles = 0;
    for(i=0, len=game.gameBoard.boardTiles.length; i<len; i++) {
      num_tiles+= game.gameBoard.boardTiles[i].length;
    }

    var max_players = Math.round(num_tiles/5);

    if(max_players>game.players.length && !game.areAllPlayersAdded){
      game.players.push(new PlayerObject(req.user, game.players.length));
      if(max_players===game.players.length){
        game.areAllPlayersAdded = true;
      }
      game.save();

      // Add game to game list on user document
      User.findById(userID, function(userErr, userObj){
        if(userErr) { return handleError(res, userErr); }
        userObj.games.push(game._id);
        userObj.save();
        socket.to(game._id).emit('updatePlayers', game.players);
        game = helpers.stripPlayerData(req.user._id, game.toObject());
        return res.json(game);
      });
    } else {
      return res.json({err: "This game has been closed off to new players."})
    }
  })

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