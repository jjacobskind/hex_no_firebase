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
			io.sockets.in(socket.roomName).emit('action:rollResults', processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive request to build a settlement or city
		auth.socketListenerFactory(socket, 'action:buildingToServer', helpers.constructBuilding, function(processedData) {
			var message = processedData.message;
			delete processedData.message;
			socket.broadcast.to(socket.roomName).emit('action:buildingToClient', processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive request to build a road
		auth.socketListenerFactory(socket, 'action:roadToServer', helpers.constructRoad, function(processedData) {
			var message = processedData.message;
			delete processedData.message;
			socket.broadcast.to(socket.roomName).emit('action:roadToClient', processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

		// Receive notification that turn is being advanced
		auth.socketListenerFactory(socket, 'action:nextTurnToServer', helpers.advancePlayerTurn, function(processedData) {
			var message = processedData.message;
			delete processedData.message;
			socket.broadcast.to(socket.roomName).emit('action:nextTurnToClient', processedData);
			message.then(function(data){
				io.sockets.in(socket.roomName).emit('chat:messageToClient', data);
			});
		});

	});
};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};

