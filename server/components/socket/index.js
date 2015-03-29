// var redis = require('redis');
var helpers = require('../helpers');
var auth = require('./socket.auth');


var io;


// "pub" is a redis client that publishes (broadcasts) data to "sub" redis clients on other node instances
// var pub = redis.createClient();
// var sub = redis.createClient();

// subscribe "sub" to 'global' redis events
// sub.subscribe('global');

// Listen for messages being published to this server
// sub.on('message', function(channel, msg){
	// do something with msg
// });

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
		// Event listeners are set up automatically, based on the objects in the eventListeners array
		// To add an event, provide a descriptive name as the key, and the helper function as the value
		// If sending player should get a response, add the event name in function shouldSenderGetResponse

		var eventListeners = [
			{ chatMessage: helpers.processChatMessage },
			{ rollDice: helpers.rollDice },
			{ building: helpers.constructBuilding },
			{ road: helpers.constructRoad },
			{ nextTurn: helpers.advancePlayerTurn },
			{ moveRobber: helpers.moveRobber }
		];

		var shouldSenderGetResponse = function(event) {
			switch(event) {
				case 	'rollDice' || 
							'other true events should go here':
					return true;
				default:
					return false;
			}
		};

		// initializes event listeners
		eventListeners.forEach(function(item) {
			var key = Object.keys(item)[0];
			var helper = item[key];
			var senderGetsResponse = shouldSenderGetResponse(key);
			auth.socketListenerFactory(socket, key + 'ToServer', helper, function(processedData) {
				updateClients(socket, key + 'ToClient', senderGetsResponse, processedData);
			});
		});


	});
};

// Emit data to each client separately so that each only receives the data they're supposed to see
// Only needs to run when the players array is sent
var updateClients = function(socket, eventName, senderGetsResponse, data) {
	if(!data) { return null; }

	if(!!data.message) {
		sendActionMessage(socket, data.message);
		delete data.message;
	}

  if(!!data.game && data.game.hasOwnProperty("players")) {
		for (var socketId in io.nsps['/'].adapter.rooms[socket.roomName]) {
			var temp_data = JSON.parse(JSON.stringify(data));	//clone data object
	    var userID = io.sockets.connected[socketId].userID;
    	if((senderGetsResponse && userID===socket.userID) || (userID!==socket.userID)) { 
	    	temp_data.game = helpers.stripPlayerData(userID, temp_data.game);
    		io.sockets.connected[socketId].emit(eventName, temp_data);
    	}
		}
  }
  else {
  	if(senderGetsResponse) { 
  		io.sockets.in(socket.roomName).emit(eventName, data);
  	} else {
  		socket.broadcast.to(socket.roomName).emit(eventName, data);
  	}
  }
};

// sends chat messages to clients
var sendActionMessage = function(socket, message) {
	message.then(function(data){
		io.sockets.in(socket.roomName).emit('chatMessageToClient', data);
	});
};

module.exports = {
	setUpSocketEvents: setUpSocketEvents,
	socket: {}
};