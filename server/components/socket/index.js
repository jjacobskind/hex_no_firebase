var redis = require('redis');
var helpers = require('../helpers');
var auth = require('./socket.auth');


var io;


// "pub" is a redis client that publishes (broadcasts) data to "sub" redis clients on other node instances
var pub = redis.createClient();
var sub = redis.createClient();

// subscribe "sub" to 'global' redis events
sub.subscribe('global');

// Listen for messages being published to this server
sub.on('message', function(channel, msg){
	// do something with msg
});

var setUpSocketEvents = function(server) {
	io = require('socket.io').listen(server);
	module.exports.socket = io;

	// Socket connection event
	io.on('connection', function(socket){
		var token = socket.handshake.query.token;

		auth.validateToken(socket, token, null, function(clientUserID){
			socket.userID = clientUserID;
		});

		if(!socket.userID){ return; }

		socket.roomName = String(socket.handshake.query.roomNumber);
		socket.join(socket.roomName);


		//*************SOCKET LISTENING EVENT HANDLERS ************/

		// Receive chat messages
		auth.socketListenerFactory(socket, 'chat:messageToServer', helpers.processMessage, function(processedData) {
			socket.broadcast.to(socket.roomName).emit('chat:messageToClient', processedData);	// sends to all clients in room except sender
		});

		// Receive dice roll requests
		auth.socketListenerFactory(socket, 'action:rollDice', helpers.rollDice, function(processedData) {
			if(!processedData) { return null; }
			var message = processedData.message;
			delete processedData.message;

			customizeBroadcast(socket, 'action:rollResults', true, processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive request to build a settlement or city
		auth.socketListenerFactory(socket, 'action:buildingToServer', helpers.constructBuilding, function(processedData) {
			var message = processedData.message;
			delete processedData.message;

			customizeBroadcast(socket, 'action:buildingToClient', false, processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive request to build a road
		auth.socketListenerFactory(socket, 'action:roadToServer', helpers.constructRoad, function(processedData) {
			var message = processedData.message;
			delete processedData.message;

			customizeBroadcast(socket, 'action:roadToClient', false, processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive notification that turn is being advanced
		auth.socketListenerFactory(socket, 'action:nextTurnToServer', helpers.advancePlayerTurn, function(processedData) {
			var message = processedData.message;
			delete processedData.message;

			customizeBroadcast(socket, 'action:nextTurnToClient', false, processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

	});
};

// Emit data to each client separately so that each only receives the data they're supposed to see
// Only needs to run when they players array is sent
var customizeBroadcast = function(socket, eventName, senderGets, data) {
    if(data.game.hasOwnProperty("players")) {
		for (var socketId in io.nsps['/'].adapter.rooms[socket.roomName]) {
			var temp_data = JSON.parse(JSON.stringify(data));	//clone data object
		    var userID = io.sockets.connected[socketId].userID;
	    	if(senderGets && userID===socket.userID) { 
		    	temp_data.game = helpers.stripPlayerData(userID, temp_data.game);
	    		io.sockets.connected[socketId].emit(eventName, temp_data);
	    	} else if (userID!==socket.userID) {
	    		temp_data.game = helpers.stripPlayerData(userID, temp_data.game);
	    		io.sockets.connected[socketId].emit(eventName, temp_data);
	    	}
		}
    }
    else {
    	if(senderGets) { 
    		io.sockets.in(socket.roomName).emit(eventName, data);
    	} else {
    		socket.broadcast.to(socket.roomName).emit(eventName, data);
    	}
    }
};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};

