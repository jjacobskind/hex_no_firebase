var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var self = exports;

exports.forceLogout = function(socket){
	socket.emit('validation:forceLogout', null);
	socket.disconnect();
};

exports.validateToken = function(socket, clientToken, data, cb){
	var clientUserID;
	var serverUserID = socket.userID;
	var options = { secret: config.secrets.session };
	jwt.verify(clientToken, options.secret, options, function(err, decoded) {
		if (err) {
			self.forceLogout(socket);
		} else {
			clientUserID = decoded._id;
		}
	});

	// If this is not the socket intialization AND client token doesn't match server socket token
	if(!!socket.userID && (!clientUserID || clientUserID!==serverUserID)) {
		self.forceLogout(socket);
		return false;
	} else {
		return cb(clientUserID, socket.roomName, data);
	}
};

exports.socketListenerFactory = function(socket, eventName, helperFn, cb){
	socket.on(eventName, function(data){
		self.validateToken(socket, data.token, data, helperFn)
			.then(cb);
	});
};