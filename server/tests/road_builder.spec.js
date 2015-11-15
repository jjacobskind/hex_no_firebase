var BoardInitializer = require('../../game_classes/board_initializer');
var BoardNavigator = require('../../game_classes/board_navigator');
var RoadBuilder = require ('../../game_classes/road_builder');
var Player = require('../api/game/player.model');
var TestHelper = require('./helpers');

describe('RoadBuilder class', function() {
  var player = new Player();
  player.playerID = Math.ceil((Math.random() * 9));
  var board = new BoardInitializer(3, 5);
  var board_navigator = new BoardNavigator(board.vertices);

  describe('board setup phase', function() {

    beforeEach(function() {
      TestHelper.clearBoard(board.vertices);
      vertex1_coords = TestHelper.randomBuildableVertex(board.vertices);
      var row = vertex1_coords.row, col = vertex1_coords.col
      board.vertices[row][col].owner = player.playerID, board.vertices[row][col].property_type = 'settlement';
      vertex2_coords = TestHelper.randomBuildableVertex(board.vertices);
      row = vertex2_coords.row, col = vertex2_coords.col
      board.vertices[row][col].owner = player.playerID, board.vertices[row][col].property_type = 'settlement'
      var direction = TestHelper.randomRoadDirection(vertex1_coords, board.vertices);
      var inverse_direction = RoadBuilder.prototype.invertRoadDirection(direction);
      var end_vertex_coords = board_navigator.getRoadDestination(vertex1_coords, direction);
      board.vertices[vertex1_coords.row][vertex1_coords.col].connections[direction] = player.playerID;
      board.vertices[end_vertex_coords.row][end_vertex_coords.col].connections[inverse_direction] = player.playerID;
      road_builder = new RoadBuilder(board.vertices, player, true);
    });

    describe('building a road adjacent to the settlement that doesn\'t have a road next to it', function() {
      beforeEach(function() {
        road_direction = TestHelper.randomRoadDirection(vertex2_coords, board.vertices);
      });

      it('places the road', function() {
        ret_obj = road_builder.placeRoad(vertex2_coords, road_direction);
        expect(board.vertices[vertex2_coords.row][vertex2_coords.col].connections[road_direction]).toEqual(player.playerID);
      });

      it('returns an object with the road data', function() {
        ret_obj = road_builder.placeRoad(vertex2_coords, TestHelper.randomRoadDirection(vertex2_coords, board.vertices));
        var keys_array = ['location', 'locationDirection', 'destination', 'destinationDirection'];

        keys_array.forEach(function(key) {
          expect(ret_obj.hasOwnProperty(key)).toBe(true);
        });
        expect(Object.keys(ret_obj).length).toEqual(keys_array.length);
      });
    });

    describe('building a road adjacent to the settlement that has a road next to it', function() {
      beforeEach(function() {
        road_direction = TestHelper.randomRoadDirection(vertex1_coords, board.vertices);
        ret_obj = road_builder.placeRoad(vertex1_coords, road_direction);
      });

      it('doesn\'t place the road', function() {
        expect(board.vertices[vertex1_coords.row][vertex1_coords.col].connections[road_direction]).toBe(null);
      });

      it('returns an object with only an error message', function() {
        expect(ret_obj.hasOwnProperty('err')).toBe(true);
        expect(Object.keys(ret_obj).length).toEqual(1);
      });
    });
  });

  describe('after the board setup phase', function() {
    beforeEach(function() {
      TestHelper.clearBoard(board.vertices);
      vertex_coords = TestHelper.randomBuildableVertex(board.vertices, player);
      row = vertex_coords.row, col = vertex_coords.col;
      board.vertices[row][col].owner = player.playerID, board.vertices[row][col].property = 'settlement'
      road_builder = new RoadBuilder(board.vertices, player);
    });

    it('places a road next to a vertex owned by player', function() {
      var direction = TestHelper.randomRoadDirection(vertex_coords, board.vertices);
      road_builder.placeRoad(vertex_coords, direction);
      expect(board.vertices[vertex_coords.row][vertex_coords.col].connections[direction]).toEqual(player.playerID);
    });

    describe('player owns adjacent road segment', function() {
      beforeEach(function() {
        var direction = TestHelper.randomRoadDirection(vertex_coords, board.vertices);
        var inverse_direction = RoadBuilder.prototype.invertRoadDirection(direction);
        end_vertex_coords = board_navigator.getRoadDestination(vertex_coords, direction);
        board.vertices[vertex_coords.row][vertex_coords.col].connections[direction] = player.playerID;
        board.vertices[end_vertex_coords.row][end_vertex_coords.col].connections[inverse_direction] = player.playerID;
        new_road_direction = TestHelper.randomRoadDirection(end_vertex_coords, board.vertices);
      });

      describe('vertex between roads is unowned', function() {
        beforeEach(function() {
          ret_obj = road_builder.placeRoad(end_vertex_coords, new_road_direction);
          row = end_vertex_coords.row, col = end_vertex_coords.col;
        });

        it('places a road', function() {
          expect(board.vertices[row][col].connections[new_road_direction]).toEqual(player.playerID);
        });

        it('returns an object with the road data', function() {
          var keys_array = ['location', 'locationDirection', 'destination', 'destinationDirection'];

          keys_array.forEach(function(key) {
            expect(ret_obj.hasOwnProperty(key)).toBe(true);
          });
          expect(Object.keys(ret_obj).length).toEqual(keys_array.length);
        });
      });

      describe('vertex between roads is owned by same player', function() {
        beforeEach(function() {
          row = end_vertex_coords.row, col = end_vertex_coords.col;
          board.vertices[row][col].owner = player.playerID;
          ret_obj = road_builder.placeRoad(end_vertex_coords, new_road_direction);
        });

        it('places a road', function() {
          expect(board.vertices[row][col].connections[new_road_direction]).toEqual(player.playerID);
        });

        it('returns an object with the road data', function() {
          var keys_array = ['location', 'locationDirection', 'destination', 'destinationDirection'];

          keys_array.forEach(function(key) {
            expect(ret_obj.hasOwnProperty(key)).toBe(true);
          });
          expect(Object.keys(ret_obj).length).toEqual(keys_array.length);
        });
      });

      describe('vertex between roads is owned by different player', function() {
        beforeEach(function() {
          row = end_vertex_coords.row, col = end_vertex_coords.col;
          board.vertices[row][col].owner = player.playerID - 1;
          ret_obj = road_builder.placeRoad(end_vertex_coords, new_road_direction);
        });

        it('does not place road', function() {
          expect(board.vertices[row][col].connections[new_road_direction]).toBe(null);
        });

        it('returns an object with only an error', function() {
          expect(ret_obj.hasOwnProperty('err')).toBe(true);
          expect(Object.keys(ret_obj).length).toEqual(1);
        });
      });
    });
  });
});
