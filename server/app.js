/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var logic = require('./components/backend-logic/logic');
var redis = require('redis');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
require('./routes')(app);


// var Firebase = require('firebase');
// var dataLink = new Firebase('https://hex-island.firebaseio.com/');
// var pendingRequests = dataLink.child('pendingRequests');

// pendingRequests.on('child_added', function(data){
// 	var changed_obj = data.val();

// 	for(var key in changed_obj){
// 		// Do something with the request, then remove it from the pending path
// 		switch(key){
// 			case "rollRequest":
// 				logic.rollDice(data.key());
// 				break;
// 		}

// 		pendingRequests.child(data.key() + "/" + key).remove();
// 	}
// });

// "pub" is a redis client that publishes (broadcasts) data to "sub" redis clients on other node instances
var pub = redis.createClient();
var sub = redis.createClient();

// subscribe "sub" to 'global' redis events
sub.subscribe('global');

// Listen for messages being published to this server
sub.on('message', function(channel, msg){
	// do something with msg
});

// Socket IO set up
var io = require('socket.io').listen(server);

// Socket.io Communication
// var client = redis.createClient();
io.sockets.on('connection', function(socket){
	console.log("connected");
	socket.emit('send:socketID', {
		id: socket.id
	});
});

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;