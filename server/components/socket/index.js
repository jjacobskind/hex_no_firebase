var redis = require('redis');
var helpers = require('../helpers');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');


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

var forceLogout = function(socket){
	socket.emit('validation:forceLogout', null);
	socket.disconnect();
};

var validateToken = function(socket, clientToken, data, cb){
	var clientUserID;
	var serverUserID = socket.userID;
	var options = { secret: config.secrets.session };
	jwt.verify(clientToken, options.secret, options, function(err, decoded) {
		if (err) {
			forceLogout(socket);
		} else {
			clientUserID = decoded._id;
		}
	});

	// If this is not the socket intialization AND client token doesn't match server socket token
	if(!!socket.userID && (!clientUserID || clientUserID!==serverUserID)) {
		forceLogout(socket);
		return false;
	} else {
		return cb(clientUserID, socket.roomName, data);
	}
};

var setUpSocketEvents = function(server) {
	io = require('socket.io').listen(server);
	module.exports.socket = io;

	// Socket connection event
	io.on('connection', function(socket){
		var token = socket.handshake.query.token;

		validateToken(socket, token, null, function(clientUserID){
			socket.userID = clientUserID;
		});

		if(!socket.userID){ return; }

		var validationWrapper = function(clientToken, data, cb) {
			return validateToken(socket, clientToken, data, cb);
		}

		socket.roomName = String(socket.handshake.query.roomNumber);
		socket.join(socket.roomName);


		//*************SOCKET LISTENING EVENT HANDLERS ************/

		// Receive chat messages
		socket.on('chat:messageToServer', function(data){
			validationWrapper(data.token, data, helpers.processMessage)
				.then(function(processedData){

					// Only send chat if the token is authenticated AND the message is valid
					if(!!processedData && processedData.valid){
						socket.broadcast.to(socket.roomName).emit('chat:messageToClient', processedData.message);	// sends to all clients in room except sender
					}
				});
		});

	});
};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};

