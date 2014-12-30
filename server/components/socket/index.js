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

			// Only send chat if the token is authenticated AND the message is valid
			if(!!processedData && processedData.valid){
				socket.broadcast.to(socket.roomName).emit('chat:messageToClient', processedData.message);	// sends to all clients in room except sender
			}
		});

	});
};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};

