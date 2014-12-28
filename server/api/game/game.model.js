'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var GameSchema = new Schema({
  areAllPlayersAdded: {type: Boolean, require:true},
  boardIsSetup: {type: Boolean, require:true},
  turn: {type: Number, required: true},
  currentPlayer: {type: Number, require:true},
  diceRolled: {type: Boolean, required: true},
  diceNumber: Number,
  longestRoad: { 
  	owner: Number,
  	roadLength: Number
  },

  // BOARD
  gameBoard: {
	boardIsSetup: Boolean,
	gameIsStarted: Boolean,
  	boardTiles: [ Schema.Types.Mixed],
  	boardVertices: [ Schema.Types.Mixed]
  },

	// // PLAYERS
	players: [{
		userRef: {type: mongoose.Schema.ObjectId, ref: 'User', required:true},
		playerID: {type: Number, required:true},
		playerName: {type: String, required:true},
		displayName: {type:String, required:true},
		hasLongestRoad: {type: Boolean, required:true, default: false},
		hasLargestArmy: {type: Boolean, required:true, default: false},
		resources: {
			wool: Number,
			grain: Number,
			brick: Number,
			ore: Number,
			lumber: Number
		},
		constructionPool: {
			cities: {type: Number, required:true, default: 4},
			settlements: {type: Number, required:true, default: 5},
			roads: {type: Number, required:true, default: 15}
		},
		devCards: {
			knight: {type: Number, required:true, default: 0},
			point: {type: Number, required:true, default: 0},
			monopoly: {type: Number, required:true, default: 0},
			plenty: {type: Number, required:true, default: 0},
			roadBuilding: {type: Number, required:true, default: 0}
		},
		playerQualities: {
			settlements: {type: Number, required:true, default: 0},
			cities: {type: Number, required:true, default: 0},
			roadSegments: {type: Number, required:true, default: 0},
			continuousRoadSegments: {type: Number, required:true, default: 0},
			knightsPlayed: {type: Number, required:true, default: 0},
			privatePoints: {type: Number, required:true, default: 0}
		},
		tradingCosts: {
			wool: {type: Number, required:true, default: 4},
			grain: {type: Number, required:true, default: 4},
			brick: {type: Number, required:true, default: 4},
			ore: {type: Number, required:true, default: 4},
			lumber: {type: Number, required:true, default: 4}
		},
		ownedProperties: {
			settlements: [{settlementID: [Number]}],
			cities: [{settlementID: [Number]}],
			roads: [{
				origin: [Number],
				destination: [Number]
			}]
		},
		rulesValidatedBuildableVertices: [ Schema.Types.Mixed ],
		resourceTotal: {type: Number, required: true, default:0}
	}]
});

module.exports = mongoose.model('Game', GameSchema);