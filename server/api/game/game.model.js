'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Player = require('./player.model');
var User = require('../user/user.model');

var GameSchema = new Schema({
  areAllPlayersAdded: { type: Boolean, require: true, default: false },
  boardSetupPhase: { type: Boolean, require: true, default: true },
  chatMessages: [{ name: String, text: String }],
  currentPlayer: { type: Number, require: true, default: 0 },
  diceNumber: Number,
  diceRolled: { type: Boolean, required: true, default: false },
  roadCardLockdown: { type: Boolean, required: true, default: false },
  robberMoveLockdown: { type: Boolean, required: true, default: false },
  longestRoad: { type: {
      owner: Number,
      roadLength: Number
    },
    required: true,
    default: {
      owner: null,
      roadLength: null
    }
  },
  turn: { type: Number, required: true, default: 0 },

  // BOARD
  board: {
    boardIsSetup: { type: Boolean, require: true, default: false },
    tiles: { type: [Schema.Types.Mixed], required: true },
    vertices: { type: [Schema.Types.Mixed], required: true }
  },

  // PLAYERS
  players: [{ type: mongoose.Schema.ObjectId, ref: 'Player' }]
});

// Instance methods
GameSchema.methods.addPlayer = function(user) {
  var self = this;

  if(allSlotsFilled(self)) { var err = 'This game has been closed off to new players!'; }
  if(user.games.indexOf(this._id) !== -1) { var game = self; }
  if(!!game || !!err) { return callbackOrFauxPromise(err, game); }

  var player_info = {   displayName: user.name.split(' ')[0],
                        playerID: this.players.length,
                        playerName: user.name,
                        userRef: user._id
                    };

  return Player.create(player_info)
    .then(function(player) {
      self.players.push(player._id);
      if(allSlotsFilled(self)) { self.areAllPlayersAdded = true; }
      self.save();
      return User.findById(user._id)
        .then(function(user) {
          user.games.push(self._id);
          user.save();
          return self;
        });
    });
};

GameSchema.methods.getPlayerIndex = function(user) {
  var i = this.players.length;
  while(i--) {
    if(String(user._id) === String(this.players[i].userRef)) { return i; }
  }
  return null;
};

GameSchema.methods.populatePlayers = function() {
  return module.exports.populate(this, { path: 'players' })
    .then(function(game) {
      return game;
    });
};

// Static methods

GameSchema.statics.findByIdAndAddPlayer = function(id, user, cb) {
  this.findById(id)
    .exec(function(err, game) {
      if(!!err) { cb(err); return null; }
      else if(!!game.getPlayerIndex(user)) {
        game.populatePlayers()
          .then(function(populated_game) {
            cb(null, populated_game);
          });
      }
      else {
        game.addPlayer(user)
          .then(function(updated_game) {
            updated_game.populatePlayers()
              .then(function(populated_game) {
                cb(null, populated_game);
              });
          });
      }
    });
};

GameSchema.statics.findByIdAndPopulate = function(id, cb) {
  return this.findById(id).exec()
    .then(function(game) {
      return game.populatePlayers()
        .then(function(populated_game) {
          return callbackOrFauxPromise(null, populated_game, cb);
        },
        function(err) { return callbackOrFauxPromise(err, null, cb); });
    });
};

// Private methods

var allSlotsFilled = function(game) {
  if(game.areAllPlayersAdded) { return true; }

  var num_tiles = 0;
  for(var i=0, len=game.board.tiles.length; i<len; i++) {
    num_tiles+= game.board.tiles[i].length;
  }

  var max_players = Math.round(num_tiles/5);
  return game.players.length >= max_players;
};

var callbackOrFauxPromise = function(err, game, cb) {
  if(!!cb) { cb(err, game); }
  else {
    return {
      then: function(cb2) { cb2(game); },
      fail: function(cb2) { cb2(err); }
    };
  }
};

module.exports = mongoose.model('Game', GameSchema);
