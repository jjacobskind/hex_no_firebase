'use strict';

angular.module('settlersApp')
	.factory('socket', function ($rootScope) {
	  var socket = io.connect();
	  var socketID = null;
	  var socketRoom = null;

	  socket.on('send:socketID', function(data){
	  	socketID = data.id;
	  });
	    return {
	      on: function (eventName, callback) {
	        socket.on(eventName, function () {  
	          var args = arguments;
	          $rootScope.$apply(function () {
	            callback.apply(socket, args);
	          });
	        });
	      },
	      emit: function (eventName, data, callback) {
	        socket.emit(eventName, data, function () {
	          var args = arguments;
	          $rootScope.$apply(function () {
	            if (callback) {
	              callback.apply(socket, args);
	            }
	          });
	        })
	      },
	      getID: function(){
	        return socketID;
	      },
	      setRoom: function(roomNumber){
	      	socketRoom = roomNumber;
	      },
	      getRoom: function(){
	      	return socketRoom;
	      }
	    };
	});