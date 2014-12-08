'use strict';

angular.module('settlersApp')
	.factory('engineFactory', function($q, boardFactory, $rootScope){
		var game;

		var gameID;
		var dataLink = new Firebase("https://flickering-heat-2888.firebaseio.com/");
		var gameDatabase;
		var currentGameData;

		function parseJSON(data, callback) {
		    var tempData = JSON.parse(data);
		    var tempArr =  callback(tempData);
		    return tempArr;
		};

		function syncDatabase(game) {
		    currentGameData.child('players').set(JSON.stringify(game.players));
		    currentGameData.child('boardTiles').set(JSON.stringify(game.gameBoard.boardTiles));
		    currentGameData.child('boardVertices').set(JSON.stringify(game.gameBoard.boardVertices));
		};

		var _refreshDatabase = function(){
		    game = new GameEngine(3, 5);
		    syncDatabase(game);
		    console.log('the database and local board have been synched and refreshed')
		};

		function boardSync(currentGameData) {
			return $q(function(resolve, reject) {
				game = new GameEngine(3,5);
			    currentGameData.once("value", function(snapshot) {
			    	var persistedData = snapshot.val();
			    	parseJSON(persistedData.players, function(data){game.players = data});
			    	parseJSON(persistedData.boardTiles, function(data){game.gameBoard.boardTiles = data});
			    	parseJSON(persistedData.boardVertices, function(data){game.gameBoard.boardVertices = data});
			    	boardFactory.drawGame(game);
			    	console.log('data loaded');

			    	resolve('success');
			  }, function (errorObject) {
			    	console.log("The read failed: " + errorObject.code);
			    	reject('error');
			  });
			});
		};

		var updateFireBase = function(updates){
			for(var key in updates){
				currentGameData.child(key).set(updates[key]);
			}
		};

		var drawRoad = function(coords1, coords2){
			var game_view = boardFactory.getGame();
		  	var road = game_view.board.buildRoad(coords1, coords2);
		  	game_view.scene.add(road);
		};

		return {
			newGame: function(small_num, big_num){
				game = new GameEngine(small_num, big_num);
				boardFactory.drawGame(game);
				gameID = Date.now();
				gameDatabase = dataLink.child('games').child(gameID);
				currentGameData = gameDatabase.child('data');
				currentGameData.on("child_changed", function(childSnapshot) {
				  var dataToSanitize = childSnapshot.val();
				  var keyName = childSnapshot.key();
				  switch (keyName) {
				    case "players":
				      var callback = function(data) {game.players = data};
				      break;
				    case "boardTiles":
				      callback = function(data) {game.gameBoard.boardTiles = data};
				      break;
				    case "boardVertices":
				      callback = function(data) { return game.findObjectDifferences(game.gameBoard.boardVertices, data)};//function(data) {game.gameBoard.boardVertices = data};
				      break;
				    default:
				      callback = function(data) {throw new Error ('incident occurred with this data: ', data)};
				      break;
				  };
				  var change = parseJSON(dataToSanitize, callback);
				  if(!change){
				  	return null;
				  }
				  var coords1 = [change[0].row, change[0].col];
				  if(change.length===2){
				  	var coords2 = [change[1].row, change[1].col];
				  	drawRoad(coords1, coords2);
				  } else if(change.length===1){
				  	console.log(change[0]);
				  	if(change[0].keys.indexOf("owner")!==-1) {
				  		boardFactory.placeSettlement(change[0].owner, coords1);
				  	}
				  	else if(change[0].keys.indexOf("hasSettlementOrCity")!==-1) {
				  		console.log(change[0]);
				  		var owner = game.gameBoard.boardVertices[coords1[0]][coords1[1]].owner;
				  		boardFactory.upgradeSettlementToCity(owner, coords1);
				  	}
				  }
				});
				$rootScope.playerData = game.players[0];
				syncDatabase(game);
				return game;	
			},
			getGame: function(){
				return game;
			},
			_refreshDatabase: _refreshDatabase, 
			buildSettlement: function(player, location){
				var updates = game.buildSettlement(player, location);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
				}
				else {
					boardFactory.placeSettlement(player, location);
					updateFireBase(updates);
				}
			},
			upgradeSettlementToCity: function(player, location){
				var updates = game.upgradeSettlementToCity(player, location);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
				}
				else {
					boardFactory.upgradeSettlementToCity(player, location);
					updateFireBase(updates);
				}
			},
			buildRoad: function(player, location, direction){
				var updates = game.buildRoad(player, location, direction);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
				} else {
					var destination = game.gameBoard.getRoadDestination(location, direction);
					drawRoad(location, destination);
					updateFireBase(updates);
				}
			},
			addPlayer: function(){
				var updates = game.addPlayer();
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
				} else {
					updateFireBase(updates);
				}
			},
			restorePreviousSession: function(gameID) {
					gameDatabase = dataLink.child('games').child(gameID);
					currentGameData = gameDatabase.child('data');	
					currentGameData.on("child_changed", function(childSnapshot) {
					  var dataToSanitize = childSnapshot.val();
					  console.log('time to sync')
					  var keyName = childSnapshot.key();
					  switch (keyName) {
					    case "players":
					      var callback = function(data) {game.players = data};
					      break;
					    case "boardTiles":
					      callback = function(data) {game.gameBoard.boardTiles = data};
					      break;
					    case "boardVertices":
					      callback = function(data) { return game.findObjectDifferences(game.gameBoard.boardVertices, data)};//function(data) {game.gameBoard.boardVertices = data};
					      break;
					    default:
					      callback = function(data) {throw new Error ('incident occurred with this data: ', data)};
					      break;
					  }});
					return boardSync(currentGameData);
					//promise resolution once boardsync finishes
			},
			getGameID: function(){
				return gameID;
			},
			getDataLink: function(){
				return dataLink;
			},
			startGame: function () {
				game.areAllPlayersAdded = true;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				}
				updateFireBase(updates);
			},
			startPlay: function() {
				game.boardIsSetup = true;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				}
				updateFireBase(updates);
			},
			currentDiceRoll: function(){
				console.log(game)
				return game.diceNumber;
			},
			rollDice: function() {
				//tell player they can build and trade after this is done
				var diceRoll = game.roll();
				game.distributeResources(diceRoll);
				var onComplete = function() {
					game.players[$rootScope.playerData.playerID] = $rootScope.playerData;
					$rootScope.$digest();
				};
				currentGameData.child('players').set(JSON.stringify(game.players), onComplete);
				return diceRoll;
			},
			endTurn: function () {
				game.turn++;
				game.calculatePlayerTurn();
				game.diceRolled = false;
				game.diceNumber = null;
				var updates = {};
				for (var prop in game) {
					if (prop !== 'gameBoard' && prop !== 'players') {
						if (game.hasOwnProperty(prop)) {
							updates[prop] = game[prop];
						}
					}
				};
				updateFireBase(updates);
			}
		}
	});