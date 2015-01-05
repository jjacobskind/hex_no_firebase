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

exports.advancePlayerTurn = function(userID, gameID) {
	return Game.findById(gameID).exec()
		.then(function(game) {
			var returnObj = { game: {} };
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);
			var gameObj = new GameEngine(game.toObject());
			var currentPlayer = gameObj.advancePlayerTurn(playerIndex);
			if(currentPlayer.hasOwnProperty('err')){
				return null;
			} else {
				game.currentPlayer = returnObj.game.currentPlayer = currentPlayer;
				game.turn = returnObj.game.turn = gameObj.turn;
				game.diceRolled = returnObj.game.diceRolled = gameObj.diceRolled;
				game.boardIsSetUp = returnObj.game.boardIsSetUp = gameObj.boardIsSetUp;
				game.save();

				returnObj.message = exports.processMessage("GAME", gameID, {text:game.players[playerIndex].displayName + " has ended their turn. It is now " + game.players[game.currentPlayer].displayName + "'s turn"});
				return returnObj;
			}

		});
	}

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
								game: { players: game.players, 
										longestRoad: game.longestRoad },
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
				return null;
			} else {
				roadObj.game = {};
				game.gameBoard.boardVertices = gameObj.gameBoard.boardVertices;
				game.longestRoad = roadObj.game.longestRoad = gameObj.longestRoad;
				game.players = roadObj.game.players = gameObj.players;
				game.save();

				roadObj.playerID = playerIndex; 
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
			var returnObj = { 'game': {} };
			if(!game) { return null; }
			var playerIndex = getPlayerIndex(game, userID);
			var gameObj = new GameEngine(game.toObject());
			returnObj.game.diceNumber = gameObj.rollDice(playerIndex);

			if(returnObj.game.diceNumber.hasOwnProperty('err')) { 
				console.log(returnObj.game);
				return null; 
			} else {
				game.players = gameObj.players;
				game.robberMoveLockdown = gameObj.robberMoveLockdown;
				game.diceRolled = gameObj.diceRolled;
				game.diceNumber = gameObj.diceNumber;

				game.save();

				returnObj.game.players = game.players;
				returnObj.game.robberMoveLockdown = game.robberMoveLockdown;
				returnObj.game.diceRolled = game.diceRolled;
				returnObj.game.boardIsSetUp = game.boardIsSetUp;


				// Generate and save chat messsage for dice roll
				// 'insert' variable changes the word 'a to 'an' when an 8 or 11 is rolled
				var article = "a ";
				if(game.diceNumber===8 || game.diceNumber===11) { article = "an "; }
				returnObj.message = exports.processMessage("GAME", gameID, {text:game.players[playerIndex].displayName + " has rolled " + article + game.diceNumber});
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