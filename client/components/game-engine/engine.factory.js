'use strict';

angular.module('hexIslandApp')
	.factory('engineFactory', function($rootScope, $timeout, $http, $state, boardFactory, Auth, authFactory, socket){
		var game = new GameEngine(3, 5);
		var gameID;

		var engineUpdateListeners = function() {

			// Receives notification that a building has been constructed
			socket.on('action:buildingToClient', function(data){
				var row = data.location[0], col = data.location[1];
				game.players = data.playerArr;
				game.gameBoard.boardVertices[row][col].owner = data.PlayerID;
				game.gameBoard.boardVertices[row][col].hasSettlementOrCity = data.type;
				game.longestRoad = data.longestRoad;
				if(data.type==='settlement'){
					boardFactory.placeSettlement(data.playerID, data.location);
				} else {
					boardFactory.upgradeSettlementToCity(data.location);
				}
			});

			// Receives notification that a road has been constructed
			socket.on('action:roadToClient', function(data){
				game.players = data.playerArr;

				// Set player as owner of appropriate road from original location
				var row = data.location[0], col = data.location[1];
				game.gameBoard.boardVertices[row][col].connections[data.locationDirection] = data.PlayerID;

				// Set player as owner of appropriate road from destination
				row = data.destination[0], col = data.destination[1];
				game.gameBoard.boardVertices[row][col].connections[data.destinationDirection] = data.PlayerID;

				game.longestRoad = data.longestRoad;
				boardFactory.buildRoad(data.playerID, data.location, data.destination);
			});

			// Receives notification that the turn has advanced to the next player
			socket.on('nextTurnToClient', function(data){
				$rootScope.currentPlayer = data.currentPlayer;
				$rootScope.currentTurn = data.currentTurn;
				game.diceRolled = false;
			});
		};
		
		var prepGameOnClient = function(data){

			// Need to load in game data without losing references to functions on the prototype chain
			for(var key in data){
				if(key==='gameBoard'){
					for(var key2 in data.gameBoard){
						game[key][key2] = data[key][key2];
					}
				} else {
					game[key] = data[key];
				}
			}

			gameID = game._id;
			$rootScope.currentGameID = gameID;
			var currentUserID = Auth.getCurrentUser()._id
			for(var i=0, len=game.players.length; i<len; i++){
				if(game.players[i].userRef === currentUserID){
					$rootScope.playerData = game.players[i];
					authFactory.setPlayerID(i);
					authFactory.setPlayerName(game.players[i].displayName);
				}
			}
			$rootScope.players = game.players;
			boardFactory.drawGame(game);
			socket.connect(gameID);
			engineUpdateListeners();
			var a = new GameEngine(3, 5);
			$state.go('game');
		};

		return {
			newGame: function(small_num, big_num){
				$http.post('/api/games', {small_num:small_num, big_num:big_num})
					.success(prepGameOnClient);
			},
			joinGame: function(gameID){
				$http.post('/api/games/join', {gameID: gameID})
					.success(function(data){
						if(data.hasOwnProperty('err')){
							console.log(data.err);
						} else {
							prepGameOnClient(data);
						}
					});
			},
			getGame: function(){
				return game;
			}, 
			buildSettlement: function(location){
				var settlement_exists = (game.gameBoard.boardVertices[location[0]][location[1]].hasSettlementOrCity === "settlement")
				var construction = game.buildSettlement(authFactory.getPlayerID(), location);
				if(construction.hasOwnProperty("err")){
					console.log(construction.err);
					return false;
				}
				else {
					if(!settlement_exists){
						boardFactory.placeSettlement(authFactory.getPlayerID(), location);		
					} else {
						boardFactory.upgradeSettlementToCity(authFactory.getPlayerID(), location);
					}
					socket.emit('action:buildingToServer', construction);
					return true;
				}
			},
			// upgradeSettlementToCity: function(location){
			// 	var updates = game.upgradeSettlementToCity(authFactory.getPlayerID(), location);
			// 	if(updates.hasOwnProperty("err")){
			// 		console.log(updates.err);
			// 	}
			// 	else {
			// 		boardFactory.upgradeSettlementToCity(authFactory.getPlayerID(), location);
			// 		updateFireBase(updates);
			// 		dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has built a city", systemMessage:true});
			// 	}
			// },
			buildRoad: function(location, direction){
				var road = game.buildRoad(authFactory.getPlayerID(), location, direction);
				if(road.hasOwnProperty("err")){
					console.log(road.err);
					return false;
				} else {
					boardFactory.buildRoad(authFactory.getPlayerID(), road.location, road.destination);
					socket.emit('action:roadToServer', road);
					return true;
				}
			},
			moveRobber: function(destination){
				var updates = game.gameBoard.moveRobber.call(game.gameBoard, destination);
				if(updates.hasOwnProperty("err")){
					console.log(updates.err);
					return false;
				} else {
					boardFactory.moveRobber(destination);
					// updateFireBase(updates);
					// dataLink.child('games').child($rootScope.currentGameID).child('chats').push({text:authFactory.getPlayerName() + " has moved the robber", systemMessage:true});
					return true;
				}
			},
			updatePlayers: function(playerArray){
				game.players = playerArray;
			},
			getPlayers: function(){
				return game.players;
			},
			restorePreviousGame: function(gameID) {
				$http.get('/api/games/' + gameID)
					.success(prepGameOnClient);
			},
			getGameID: function(){
				return gameID;
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
			nextTurn: function () {
				if(game.lockedPhase === false) {
					var newTurn = game.advancePlayerTurn(authFactory.getPlayerID());
					if(newTurn!==null){
						socket.emit('nextTurnToServer');
						$rootScope.currentPlayer = newTurn;
					}
				}
			}
		}
	});