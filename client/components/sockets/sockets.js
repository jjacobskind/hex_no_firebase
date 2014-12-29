'use strict';

angular.module('settlersApp')
	.factory('socket', function ($rootScope, engineFactory) {
		var socket;
		$rootScope.$on('socketConnect', function(event, gameID){
			socket = io({query: {roomNumber: gameID} });
		});

	    return {
			emit: function (eventName, data, callback) {
				data.gameID = engineFactory.getGameID();
				data = "test";
				socket.emit(eventName, data, function () {
					var args = arguments;
					$rootScope.$apply(function () {
						if (callback) {
							callback.apply(socket, args);
						}
					});
				});
			},
			on: function (eventName, callback) {
				socket.on(eventName, function () {  
					var args = arguments;
					$rootScope.$apply(function () {
						callback.apply(socket, args);
					});
				});
			}
	    };
	});