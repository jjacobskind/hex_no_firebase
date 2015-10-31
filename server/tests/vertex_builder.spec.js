var BoardInitializer = require('../classes/board_initializer');
var BoardNavigator = require('../classes/board_navigator');
var RoadBuilder = require('../classes/road_builder');
var VertexBuilder = require('../classes/vertex_builder');
var Player = require('../api/game/player.model');
var TestHelper = require('./helpers');

describe('VertexBuilder class', function() {
  var board = new BoardInitializer(3, 5);
  var board_navigator = new BoardNavigator(board.vertices);
  var player1 = new Player(); player1.playerID = 0;
  var player2 = new Player(); player2.playerID = 1;

  describe('after the board setup phase has completed', function() {
    describe('player owns an adjacent road', function() {
      beforeEach(function() {
        vertex_coords = { row: 2, col: 2 };
        row = vertex_coords.row; col = vertex_coords.col;
        start_vertex = board.vertices[row][col];
        start_vertex.connections.vertical = player1.playerID;
        end_coords = board_navigator.getRoadDestination(vertex_coords, 'vertical');
        end_vertex = board.vertices[end_coords.row][end_coords.col];
        end_vertex.connections.vertical = player1.playerID;
      });

      describe('no adjacent vertex is owned', function() {
        beforeEach(function() {
          vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
          result = vertex_builder.build();
        });

        it('builds a settlement if vertex is not owned', function() {
          expect(board.vertices[row][col].property_type).toEqual('settlement');
        });

        it('returns an object with playerID, type, and location keys', function() {
          expected_keys = ['playerID', 'type', 'location'];
          expect(Object.keys(result).length).toEqual(expected_keys.length);
          expected_keys.forEach(function(key) {
            expect(result[key]).toBeDefined();
          });
        });
      });
    });
  });
});
