// Contains helper functions for socket events and routing functions

var Game = require('../../api/game/game.model');

// Remove private/nonessential data from other players' objects
var stripPlayerData = function(userID, game){
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

var processMessage = function(userID, gameID, data){
	var obj = {valid:true};
	var messageObj = null;
	var message = data.text.trim();
	if(message.length>160){ 
		message = message.slice(0, 160); 
	} else if(message.length===0){
		valid = false;
		return obj;
	}

	return Game.findById(gameID).exec()
		.then(function(game){
			var index;
			var userInGame = false;
			for(var i=0, len=game.players.length; i<len  && !userInGame; i++) {
				if(String(game.players[i].userRef) === userID) {
					userInGame = true;
					index=i;
				}
			}

			// Only save/send chat message if player is in the game or if it was sent by the game
			if(userID==="GAME"){
				messageObj = {name: userID, text: message};
				game.chatMessages.push(messageObj);
				game.save();
			}
			else if(userInGame){
				messageObj = {name: game.players[index].displayName, text: message};
				game.chatMessages.push(messageObj);
				game.save();
			} else {
				messageObj = null;
				valid = false;
			}
			obj.message = messageObj;
			return obj;
		});
};

module.exports = {
	stripPlayerData: stripPlayerData,
	processMessage: processMessage
};