// Contains helper functions for socket events and routing functions

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

module.exports = {
	stripPlayerData: stripPlayerData
};