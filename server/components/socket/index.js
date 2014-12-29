var redis = require('redis');
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
		var roomNumber = socket.handshake.query.roomNumber;
		socket.join(String(roomNumber));
	});

	// Receive chat messages
	io.on('messageToServer', function(message){
		console.log("HEY");
		console.log(message);
	});

};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};