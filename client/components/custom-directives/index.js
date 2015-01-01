'use strict';

angular.module('hexIslandApp')
	.directive('board', function(boardFactory) {
	    return {
	      restrict: 'E',
	      templateUrl: 'components/board/board-template.html',
	      controller: 'BoardCtrl as board_ctrl',
	      link: function(){
	        boardFactory.insert();
	      }
	    };
	})
	.directive('ngEnter', function () {
	    return function (scope, element, attrs) {
	        element.bind("keydown keypress", function (event) {
	            if(event.which === 13) {
	                scope.$apply(function (){
	                    scope.$eval(attrs.ngEnter);
	                });

	                event.preventDefault();
	            }
	        });
	    };
	})
	.directive('myMaxlength', function() {
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attrs, ngModelCtrl) {
	      var maxlength = Number(attrs.myMaxlength);
	      function fromUser(text) {
	          if (text.length > maxlength) {
	            var transformedInput = text.substring(0, maxlength);
	            ngModelCtrl.$setViewValue(transformedInput);
	            ngModelCtrl.$render();
	            return transformedInput;
	          } 
	          return text;
	      }
	      ngModelCtrl.$parsers.push(fromUser);
	    }
	  }; 
	});