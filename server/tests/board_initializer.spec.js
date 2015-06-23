var BoardInitializer = require('../classes/board_initializer').BoardInitializer;

describe('BoardInitializer class', function() {
  beforeEach(function() {
    small_num = Math.ceil(Math.random() * 100);
    large_num = Math.ceil(Math.random() * 100) + small_num;
    board = new BoardInitializer(small_num, large_num);
  });

  describe('boardVertices', function() {
    it('is a multidimensional array with top-level length = ((large_num - small_num) * 4) + 4', function() {
      var expected_length = ((large_num - small_num) * 4) + 4;
      expect(board.boardVertices.length).toEqual(expected_length);
    });

    it('has two shortest rows, the length of which is small_num', function() {
      var small_num_row_count = 0;
      var smaller_row_than_small_num_found = false;
      board.boardVertices.forEach(function(row) {
        if(row.length < small_num) { smaller_row_than_small_num_found = true; }
        else if(row.length === small_num) { small_num_row_count++; }
      });
      expect(small_num_row_count).toEqual(2);
      expect(smaller_row_than_small_num_found).toBe(false);
    });

    it('has two largest rows, the length of which is large_num + 1', function() {
      var large_num_row_count = 0;
      var larger_row_than_small_num_found = false;
      board.boardVertices.forEach(function(row) {
        if(row.length > large_num + 1) { larger_row_than_small_num_found = true; }
        else if(row.length === large_num + 1) { large_num_row_count++; }
      });
      expect(large_num_row_count).toEqual(2);
      expect(larger_row_than_small_num_found).toBe(false);
    });

    it('has rows of symmetrical length', function() {
      var halfway_point = (board.boardVertices.length / 2) - 1
      var vertices = board.boardVertices;
      for(var i=0, len=halfway_point; i < len; i++) {
        expect(vertices[i].length).toEqual(vertices[vertices.length - i - 1].length);
      }
    });

    it('has vertex keys for every element', function() {
      for(row=0, max_row=board.boardVertices.length; row < max_row; row++) {
        for(col=0, max_col=board.boardVertices[row].length; col < max_col; col++) {
          var vertex = board.boardVertices[row][col];
          var has_all_keys = vertex.hasOwnProperty('connections');
          has_all_keys = has_all_keys && vertex.connections.hasOwnProperty('vertical');
          has_all_keys = has_all_keys && vertex.connections.hasOwnProperty('left');
          has_all_keys = has_all_keys && vertex.connections.hasOwnProperty('right');
          has_all_keys = has_all_keys && vertex.hasOwnProperty('adjacent_tiles');
          has_all_keys = has_all_keys && vertex.hasOwnProperty('owner');
          has_all_keys = has_all_keys && vertex.hasOwnProperty('hasSettlementOrCity');
          has_all_keys = has_all_keys && vertex.hasOwnProperty('land');
          has_all_keys = has_all_keys && vertex.hasOwnProperty('port');
        }
      }
      expect(has_all_keys).toBe(true);
    });
  });
});