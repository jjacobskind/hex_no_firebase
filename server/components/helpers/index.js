// Contains helper functions for socket events and routing functions

var Game = require('../../api/game/game.model');
var GameEngine = require('../engines/game-engine').GameEngine;

// Gets player index number of user in game. Returns -1 if user is not in game
var getPlayerIndex = function(game, userID) {
	for(var i=0, len=game.players.length; i<len; i++) {
		if(String(game.players[i].userRef)===userID) {
			return i;
		}
	}
	return -1;
};

var updateGame = function(userID, gameID, actionData) {
	var action = actionData.functionName;
	var functionParameters = actionData.functionParameters;

	return Game.findById(gameID).exec()
		.then(function(game) {
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);
			var gameObj = new GameEngine(game.toObject());

			functionParameters.unshift(playerIndex);
			var results = gameObj[action].apply(gameObj, functionParameters);

			if(results.hasOwnProperty('err')){
				return null;
			} else {
				var starterObj = { playerID: playerIndex, playerName: game.players[playerIndex].displayName, game: {} }
				var returnObj = prepareReturnData(starterObj, actionData.properties, gameObj, results);
				updateAndSaveGame(game, gameObj, actionData.properties[0].game);
				return returnObj;
			}
		});
};

// build data object to be broadcasted to clients
var prepareReturnData = function(returnObj, properties, gameObj, results) {
	properties.forEach(function(key) {
		if(key.hasOwnProperty('game')) {
			key.game.forEach(function(game_key) {
				returnObj.game[game_key] = gameObj[game_key];
				injectSpecialData(game_key, returnObj, gameObj);
			});
		} else {
			returnObj[key] = results[key] || gameObj[key];
		}
	});
	return returnObj;
};

// adds extra data to return object in special cases
var injectSpecialData = function(key, returnObj, gameObj) {
	switch(key) {
		case 'currentPlayer':
			returnObj.game.currentPlayerName = gameObj.players[gameObj.currentPlayer].displayName;
			break;
	}
};

// persists game changes
var updateAndSaveGame = function(game, gameObj, properties) {
	game.players = gameObj.players;
	game.gameBoard.boardVertices = gameObj.gameBoard.boardVertices;
	game.gameBoard.boardTiles = gameObj.gameBoard.boardTiles;

	properties.forEach(function(key) {
		game[key] = gameObj[key];
	});

	game.save();
};

exports.advancePlayerTurn = function(userID, gameID) {

		var actionData = {
			functionName: 'advancePlayerTurn',
			functionParameters: [],
			properties: [ 
				{ game: ['currentPlayer', 'turn', 'diceRolled', 'boardIsSetUp'] }
			]
		};

		return updateGame(userID, gameID, actionData)
			.then(function(returnData) {
				returnData.message = exports.processChatMessage("GAME", gameID, {text: returnData.playerName + " has ended their turn. It is now " + returnData.game.currentPlayerName + "'s turn"});

				delete returnData.playerName;
				delete returnData.game.currentPlayerName;	
				return returnData;
			});
	};

// Validates building construction
exports.constructBuilding = function(userID, gameID, data){

	var actionData = {
		functionName: 'buildSettlement',
		functionParameters: [data.location],
		properties: [ 
			{ game: ['players', 'longestRoad'] },
			'location',
			'type'
		]
	};

	return updateGame(userID, gameID, actionData)
		.then(function(returnData) {
			if(returnData.type==='settlement'){
				returnData.message = exports.processChatMessage("GAME", gameID, {text: returnData.playerName + " has built a settlement"});
			} else {
				returnData.message = exports.processChatMessage("GAME", gameID, {text: returnData.playerName + " has upgraded a settlement to a city"});
			}

			delete returnData.playerName;
			return returnData;
		});
};

// Validates road construction
exports.constructRoad = function(userID, gameID, data){

	var actionData = {
		functionName: 'buildRoad',
		functionParameters: [data.location, data.locationDirection],
		properties: [ 
			{ game: ['players', 'longestRoad'] },
			'location',
			'type',
			'location',
			'locationDirection',
			'destination',
			'destinationDirection'
		]
	};

	return updateGame(userID, gameID, actionData)
		.then(function(returnData) {
			returnData.message = exports.processChatMessage("GAME", gameID, { text: returnData.playerName + " has built a road" });
			delete returnData.playerName;
			return returnData;
		});
};

// Validates robber movements
exports.moveRobber = function(userID, gameID, data){

	var actionData = {
		functionName: 'moveRobber',
		functionParameters: [data.destination, data.origin],
		properties: [ 
			{ game: ['robberMoveLockdown'] },
			'destination',
			'origin'
		]
	};

	return updateGame(userID, gameID, actionData)
		.then(function(returnData) {
			if(!!data.origin) { var determiner = 'a'; }
			else { var determiner = 'the'; }
			returnData.message = exports.processChatMessage("GAME", gameID, {text: returnData.playerName + " has moved " + determiner + " robber"});
			delete returnData.playerName;
			return returnData;
		});
};

// Validate incoming chat message, save, and format it to be sent out to clients
exports.processChatMessage = function(userID, gameID, data){
	var messageObj = null;
	var message = data.text.trim();
	if(message.length>160){ 
		message = message.slice(0, 160); 
	} else if(!message || message.length===0){
		obj = null;
		return obj;
	}

	return Game.findById(gameID).exec()
		.then(function(game){
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);

			// Only save/send chat message if player is in the game or if it was sent by the game
			if(userID==="GAME" || playerIndex !== -1){
				if(userID==="GAME") { messageObj = { name: userID, text: message }; }
				else { messageObj = {name: game.players[playerIndex].displayName, text: message}; }
				
				game.chatMessages.push(messageObj);
				game.save();
			}

			return messageObj;
		});
};

exports.rollDice = function(userID, gameID) {

	var actionData = {
		functionName: 'rollDice',
		functionParameters: [],
		properties: [ 
			{ game: ['players', 'robberMoveLockdown', 'diceRolled', 'diceNumber'] }
		]
	};

	return updateGame(userID, gameID, actionData)
		.then(function(returnData) {
			var roll = returnData.game.diceNumber;
			var determiner = "a ";
			if(roll===8 || roll===11) { determiner = "an "; }
			returnData.message = exports.processChatMessage("GAME", gameID, {text: returnData.playerName + " has rolled " + determiner + roll });
			delete returnData.playerName;
			return returnData;
		});
};

// Remove private/nonessential data from other players' objects
exports.stripPlayerData = function(userID, game){
	for(var i=0, len=game.players.length; i<len; i++){
	  if(String(game.players[i].userRef) !== String(userID)) {
	    delete game.players[i].resources;
	    delete game.players[i].constructionPool;
	    delete game.players[i].devCards;
	    delete game.players[i].playerQualities;
	    delete game.players[i].tradingCosts;
	    delete game.players[i].ownedProperties;
	    delete game.players[i].rulesValidatedBuildableVertices;
	  }
	  delete game.players[i]._id;
      delete game.players[i].userRef;
	}
	return game;
};