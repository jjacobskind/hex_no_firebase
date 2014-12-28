// Module contains all backend logic for Hex Island

var Firebase = require('firebase');
var dataLink = new Firebase('https://hex-island.firebaseio.com/');

var rollDice = function(gameID){
	var gameLink = dataLink.child('games/' + gameID + '/data');
	
	var roll_num = Math.ceil(Math.random()*6) + Math.ceil(Math.random()*6);
	gameLink.child('lastRoll').set(roll_num);
};

module.exports = {
	rollDice: rollDice
};