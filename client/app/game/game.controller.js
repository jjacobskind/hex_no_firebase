'use strict';

angular.module('hexIslandApp')
	.controller('GameCtrl', function($state, engineFactory, game){
		// Will contain all interactions between engineFactory and board directive
		engineFactory.prepGameOnClient(game);
	});