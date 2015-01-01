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

var playerTurnCheck = function(game, userID) {
	var index = getPlayerIndex(game, userID);
	if(index !== game.currentPlayer){ return false; }
	return true;
};

// Validates building construction
exports.constructBuilding = function(userID, gameID, data){

	return Game.findById(gameID).exec()
		.then(function(game){
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);
			var gameObj = new GameEngine(game.toObject());
			var buildObj = gameObj.buildSettlement(playerIndex, data.location);

			if(buildObj.hasOwnProperty('err')){
				return {err: buildObj.err};
			} else {
				game.players = gameObj.players;
				game.gameBoard.boardVertices = gameObj.gameBoard.boardVertices;
				game.longestRoad = gameObj.longestRoad;
				game.save();
				var returnObj = {playerID: playerIndex, 
								location: data.location, 
								playerArr: game.players, 
								longestRoad: game.longestRoad,
								type: buildObj.type};
				if(returnObj.type==='settlement'){
					returnObj.message = exports.processMessage("GAME", gameID, {text:game.players[playerIndex].displayName + " has built a settlement"});
				} else {
					returnObj.message = exports.processMessage("GAME", gameID, {text:game.players[playerIndex].displayName + " has upgraded a settlement to a city"});
				}
				return returnObj;
			}
		});

};

// Validates road construction
exports.constructRoad = function(userID, gameID, data){

	return Game.findById(gameID).exec()
		.then(function(game){
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);
			var gameObj = new GameEngine(game.toObject());
			var roadObj = gameObj.buildRoad(playerIndex, data.location, data.locationDirection);

			if(roadObj.hasOwnProperty('err')){
				return {err: roadObj.err};
			} else {
				game.players = gameObj.players;
				game.gameBoard.boardVertices = gameObj.gameBoard.boardVertices;
				game.longestRoad = gameObj.longestRoad;
				game.save();
				roadObj.playerID = playerIndex; 
				roadObj.longestRoad = game.longestRoad;
				roadObj.message = exports.processMessage("GAME", gameID, {text:game.players[playerIndex].displayName + " has built a road"});
				return roadObj;
			}
		});

};

// Validate incoming chat message, save, and format it to be sent out to clients
exports.processMessage = function(userID, gameID, data){
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
			var index = getPlayerIndex(game, userID);

			// Only save/send chat message if player is in the game or if it was sent by the game
			if(userID==="GAME"){
				messageObj = {name: userID, text: message};
				game.chatMessages.push(messageObj);
				game.save();
			}
			else if(index!==-1){
				messageObj = {name: game.players[index].displayName, text: message};
				game.chatMessages.push(messageObj);
				game.save();
			}
			return messageObj;
		});
};

exports.rollDice = function(userID, gameID) {
	return Game.findById(gameID).exec()
		.then(function(game) {
			var returnObj = {};
			if(!game) { return null; }
			var isPlayerTurn = playerTurnCheck(game, userID);
			if(!isPlayerTurn) { 
				return null; 
			} else {
				var roll = Math.ceil(Math.random()*6) + Math.ceil(Math.random()*6);
				returnObj.roll = roll;
				game.diceRolled = true;

				if(roll===7){
					returnObj.moveRobber = true;
					// NEED TO ADD CARD DISCARDING CODE HERE!!!!	
				} else {
					gameEngine.distributeResources.call(game, roll);
					returnObj.moveRobber = false;
				};
				
				returnObj.players = game.players;
				game.save();

				var index = getPlayerIndex(game, userID);
				returnObj.message = exports.processMessage("GAME", gameID, {text:game.players[index].displayName + " has rolled a " + roll});
				return returnObj;
			}
		});
};

// Remove private/nonessential data from other players' objects
exports.stripPlayerData = function(userID, game){
	for(var i=0, len=game.players.length; i<len; i++){
	  if(String(game.players[i].userRef) !== String(userID)) {
	    delete game.players[i].userRef;
	    delete game.players[i].resources;
	    delete game.players[i].constructionPool;
	    delete game.players[i].devCards;
	    delete game.players[i].playerQualities;
	    delete game.players[i].tradingCosts;
	    delete game.players[i].ownedProperties;
	    delete game.players[i].rulesValidatedBuildableVertices;
	  }
	}
	return game;
};