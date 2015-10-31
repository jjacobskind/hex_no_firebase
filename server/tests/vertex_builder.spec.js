var BoardInitializer = require('../classes/board_initializer');
var BoardNavigator = require('../classes/board_navigator');
var VertexBuilder = require('../classes/vertex_builder');
var Player = require('../api/game/player.model');
var TestHelper = require('./helpers');

describe('VertexBuilder class', function() {
  var player1 = new Player(); player1.playerID = 0;
  var player2 = new Player(); player2.playerID = 1;
  var vertex_coords = { row: 2, col: 2 };
  var row = vertex_coords.row, col = vertex_coords.col;

  beforeEach(function() {
    board = new BoardInitializer(3, 5);
    board_navigator = new BoardNavigator(board.vertices);
  });

  describe('during the board setup phase', function() {
    describe('player doesn\'t own an adjacent road', function() {
      it('builds a settlement', function() {
        vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords, true);
        result = vertex_builder.build();
        expect(board.vertices[row][col].owner).toEqual(player1.playerID);
        expect(board.vertices[row][col].property_type).toEqual('settlement');
      });
    });

    describe('same player owns the vertex', function() {
      it('doesn\'t build', function() {
        board.vertices[row][col].owner = player1.playerID;
        board.vertices[row][col].property_type = 'settlement';
        vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords, true);
        result = vertex_builder.build();
        expect(board.vertices[row][col].property_type).toEqual('settlement');
      });
    });

    describe('another player owns the vertex', function() {
      it('doesn\'t build', function() {
        board.vertices[row][col].owner = player2.playerID;
        board.vertices[row][col].property_type = 'settlement';
        vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords, true);
        result = vertex_builder.build();
        expect(board.vertices[row][col].property_type).toEqual('settlement');
        expect(board.vertices[row][col].owner).toEqual(player2.playerID);
      });
    });
  });

  describe('after the board setup phase has completed', function() {
    describe('player does not own an adjacent road', function() {
      it('doesn\'t build', function() {
        vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
        result = vertex_builder.build();
        expect(board.vertices[row][col].owner).toBeNull();
        expect(board.vertices[row][col].property_type).toBeNull();
      });
    });

    describe('player owns an adjacent road', function() {
      beforeEach(function() {
        vertex_coords = { row: 2, col: 2 };
        start_vertex = board.vertices[row][col];
        start_vertex.connections.vertical = player1.playerID;
        end_coords = board_navigator.getRoadDestination(vertex_coords, 'vertical');
        end_vertex = board.vertices[end_coords.row][end_coords.col];
        end_vertex.connections.vertical = player1.playerID;
      });

      describe('no adjacent vertex is owned', function() {
        describe('vertex is not owned', function() {
          beforeEach(function() {
            vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
            result = vertex_builder.build();
          });
          it('builds a settlement', function() {
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

        describe('same player has a settlement on vertex', function() {
          it('builds a city', function() {
            board.vertices[row][col].owner = player1.playerID;
            board.vertices[row][col].type = 'settlement'
            vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
            result = vertex_builder.build();
            expect(board.vertices[row][col].property_type).toEqual('city');
          });
        });

        describe('vertex is owned by a different player', function() {
          it('doesn\'t build', function() {
            board.vertices[row][col].owner = player2.playerID;
            board.vertices[row][col].property_type = 'settlement'
            vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
            result = vertex_builder.build();
            expect(board.vertices[row][col].property_type).toEqual('settlement');
          });
        });
      });

      describe('an adjacent vertex is owned', function() {
        it('doesn\'t build', function() {
          end_vertex.owner = 1;
          vertex_builder = new VertexBuilder(board.vertices, player1, vertex_coords);
          result = vertex_builder.build();
          expect(board.vertices[row][col].owner).toBeNull();
          expect(board.vertices[row][col].property_type).toBeNull();
        });
      });
    });
  });
});
