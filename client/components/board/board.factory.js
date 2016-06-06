'use strict';

angular.module('hexIslandApp')
	.factory('boardFactory', function($state, $rootScope, authFactory) {
    var camera, scene, sceneProperties, renderer, controls, light, water, game_board, someAction, selected_robber;

    var canvas_width = $(window).width();
    var canvas_height = $(window).height();

    // Game view data that needs to be displayed, but not on WebGL canvas
    var players, buildMode = false;

    var init = function(game) {
			sceneProperties = new SceneInitializer(renderer, canvas_width, canvas_height);
			scene = sceneProperties.scene;

      game_board = new Board(scene, game);

      sceneProperties.controls.addEventListener( 'change', function() {
        var num_rows = game_board.tiles.length;
        var angle = Math.atan(sceneProperties.camera.position.x/sceneProperties.camera.position.z);
        if(sceneProperties.camera.position.z>0){
          angle+= Math.PI;
        }

        for(var row=0; row<num_rows; row++){
          var num_cols = game_board.tiles[row].length;
          for(var col=0; col<num_cols; col++){
            if(!!game_board.tiles[row][col].chit){
              game_board.tiles[row][col].chit.rotation.set(Math.PI/2, Math.PI, angle);
            }
          }
        }

        for(var i=0, len=game_board.ports.length; i<len;i++){
          game_board.ports[i].rotation.set(Math.PI/2, Math.PI, angle);
        }
      });
	  }

	  var animate = function() {
      sceneProperties.light.position.copy(sceneProperties.camera.position);
      sceneProperties.water.material.uniforms.time.value += 1.0 / 30.0;

      renderer.render( sceneProperties.scene, sceneProperties.camera );

	    setTimeout(function(){
	      requestAnimationFrame(animate);
	      sceneProperties.controls.update();

	    }, 60);
	  }

	  var createRenderer = function() {
			var renderInit = new RendererInitializer(canvas_width, canvas_height);
			return renderInit.renderer;
		}

	  $(window).on('resize', function(){
	    canvas_width = $(window).width();
	    canvas_height = $(window).height();
	    $("#board_container").height(canvas_height);
	    if(!!sceneProperties.camera){
	      sceneProperties.camera.aspect = (canvas_width/canvas_height);
	      sceneProperties.camera.updateProjectionMatrix();
	    }
	    if(!!renderer){
	      renderer.setSize(canvas_width, canvas_height);
	    }
	  });

	  function unset_someAction(success){
	    if(success === true){
    		$(".gameButtonActive").removeClass("gameButtonActive");
	      someAction = null;
	      buildMode = false;
	    }
	  };

	  return {
	    buildRoad: function(player, vertex1, vertex2) {
	      game_board.buildRoad(player, vertex1, vertex2);
	    },
	    drawGame: function(game) {
				renderer = renderer || createRenderer();
	      init(game);
	    },
	    insert: function() {
	      if(!!renderer){
	        $("#board_container").height(canvas_height);
	        $("#board_container").prepend( renderer.domElement );
	        $("#board-canvas").addClass( 'full' );
	        $("#board-canvas").focus();

	        $('#board-canvas').on('mousewheel', function(e) {
	            e.preventDefault();
	            e.stopPropagation();
	        });
	        animate();
	      }
	    },
	    set_someAction: function(action){
	      var engine_factory = angular.element(document.body).injector().get('engineFactory');
	      switch(action){
	        case "road":
	          if(!!buildMode){
		        unset_someAction(true);
	          } else if (!engine_factory.robberLockdownStatus()) {
	          	$("#buildButton").addClass("gameButtonActive");
	            buildMode = true;
	            someAction = function(coords) {
	            	var road = game_board.getRoad(coords);
		            if(!!road) { return engine_factory.buildRoad(road.start_vertex, road.direction); }
		            return false;
		          }
	          }
	          break;
	        case "building":
	          if(!!buildMode){
	            unset_someAction(true);
	          } else if (!engine_factory.robberLockdownStatus()) {
	            $("#buildButton").addClass("gameButtonActive");
	            buildMode = true;
	            someAction = function(coords) {
	            	var indices = game_board.getVertex(coords);
		            if(!!indices) { return engine_factory.buildVertex(indices); }
		            return false;
	            }
	          }
	          break;
	        case "robber":
	          var parentFunc = someAction = function(coords1) {
	          	var indices1 = game_board.getTile(coords1);
		        	if(game_board.robbers.length==1) {
		          	if (!!indices1) { return engine_factory.moveRobber(indices1); }
		          	return false;
		          } else if (!!indices1 && engine_factory.isRobberOnTile(indices1)) {
		          	someAction = function(coords2) {
		          		var indices2 = game_board.getTile(coords2);
		          		if (!!indices2) {
		          			var move_result = engine_factory.moveRobber(indices2, indices1);
		          			//reset two-click action so user can choose to select another robber instead
		          			if(!move_result) { someAction = parentFunc; }
		          			return move_result;
		          		}
			          	return false;
		          	}
		          }
	          	return false;
        		}
	          break;
	      }
	    },
	    moveRobber: function(destination, origin){
	      game_board.moveRobber(destination, origin);
	    },
	    newBoard: function(small_num, big_num){
	      renderer.delete;
	      scene.delete;
	      renderer = createRenderer();
	      init(small_num, big_num);
	      animate();
	    },
	    placeSettlement: function(player, location){
	      var row = location.row, col = location.col;
	      if(!game_board.vertices[row][col].building){
	        var settlement = new Building(game_board, 'settlement', player, location);
	        game_board.vertices[row][col].building = settlement;
	        scene.add(settlement.building);
	      }
	    },
	    upgradeSettlementToCity: function(player, location){
	      var row=location[0], col=location[1];
	      var vertex_building = game_board.boardVertices[row][col].building;
	      scene.remove(vertex_building.building);
	      vertex_building.upgradeToCity();
	      scene.add(vertex_building.building);
	    },
	    exitBuildMode: function(){
	    	var engine_factory = angular.element(document.body).injector().get('engineFactory');
	    	unset_someAction(!engine_factory.robberLockdownStatus());
	    },
	    getBuildMode: function(){
	    	return buildMode;
	    },
	    getGame: function(){
	      return game_board;
	    }
	  };
	})
