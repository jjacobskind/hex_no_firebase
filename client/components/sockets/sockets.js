'use strict';

hexIslandApp
	.factory('socket', function ($rootScope, $state, Auth) {
		var socket;

	    return {
	    	connect: function(gameID){
				socket = io({query: {roomNumber: gameID, token: Auth.getToken()} });

				// Automatically logs out user and brings them to login screen if their token is invalid
				socket.on('validation:forceLogout', function(){
					Auth.logout();
					$state.go('main.login');
				})
			},
			emit: function (eventName, data) {
				if(!data) { data = {}; }
				data.token = Auth.getToken();
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
