var BoardInitializer = require('../classes/board_initializer');

describe('BoardInitializer class', function() {
  small_num               = Math.ceil(Math.random() * 100);
  large_num               = Math.ceil(Math.random() * 100) + small_num;
  board                   = new BoardInitializer(small_num, large_num);
  num_tiles               = board.totalNumberOfTiles();
  num_deserts             = board.numberOfDeserts(num_tiles);
  number_chits_array      = board.createNumberChitsArray(num_tiles, num_deserts);
  number_chits_array_test = number_chits_array.slice();
  resources_array         = board.createResourcesArray(num_deserts, num_tiles);
  resources_array_test    = resources_array.slice();
  tiles_array             = board.createTilesArray(num_tiles, number_chits_array, resources_array);
  board_tiles             = board.makeTilesArrayMultiDimensional(tiles_array);

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

  describe('createNumberChitsArray method', function() {
    it('should have a length equal to the number of non-desert tiles', function() {
      expect(number_chits_array_test.length).toEqual(num_tiles - num_deserts);
    });

    it('should only contain values from 2-6 and 8-12', function() {
      var invalid_value_found = number_chits_array.reduce(function(bool, chit_number) {
        if([2, 3, 4, 5, 6, 8, 9, 10, 11, 12].indexOf(chit_number) === -1) { console.log(chit_number); }
        return bool || [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].indexOf(chit_number) === -1;
      }, false);
      expect(invalid_value_found).toBe(false);
    });
  });

  describe('createResourcesArray method', function() {
    it('should have a length equal to the number of tiles', function() {
      expect(resources_array_test.length).toEqual(num_tiles);
    });

    it('should have the correct number of deserts', function() {
      var desert_count = resources_array_test.reduce(function(sum, current) {
        if(current==='desert') { return sum + 1; }
        else { return sum; }
      }, 0);
      expect(desert_count).toEqual(num_deserts);
    });

    it('should have a desert as the first array element', function() {
      expect(resources_array_test[0] === 'desert');
    });

    it('should be shuffled', function() {
      var second_resources_array = board.createResourcesArray(num_deserts, num_tiles);
      expect(resources_array_test.join()).toNotEqual(second_resources_array.join());
    });
  });

  describe('createTilesArray', function() {
    it('returns an array with length equal to num_tiles', function() {
      expect(tiles_array.length).toEqual(num_tiles);
    });

    it('assigns \'resource\', \'robber\', and \'chit\' keys for each tile', function() {
      tiles_array.forEach(function(tile) {
        var has_all_keys =  tile.hasOwnProperty('resource') &&
                            tile.hasOwnProperty('robber') &&
                            tile.hasOwnProperty('chit');
        expect(has_all_keys).toBe(true);
      });
    });

    it('assigns \'robber\' to true when \'resource\' is \'desert\'', function() {
      tiles_array.forEach(function(tile) {
        if(tile.resource === 'desert') { expect(tile.robber).toBe(true); }
      });
    });

    it('assigns \'robber\' to false when \'resource\' is not \'desert\'', function() {
      tiles_array.forEach(function(tile) {
        if(tile.resource !== 'desert') { expect(tile.robber).toBe(false); }
      });
    });

    it('assigns \'chit\' to 7 when \'resourc\' is \'desert\'', function() {
      tiles_array.forEach(function(tile) {
        if(tile.resource === 'desert') { expect(tile.chit).toEqual(7); }
      });
    });

    it('assigns \'chit\' to integer between 2-6 or 8-12 when \'resource\' is not \'desert\'', function() {
      tiles_array.forEach(function(tile) {
        var valid_chit = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].indexOf(tile.chit) !== -1;
        if(tile.resource !== 'desert') { expect(valid_chit).toBe(true); }
      });
    });
  });

  describe('makeTilesArrayMultiDimensional method', function() {
    it('returns a multi-dimensional array with ((large_num - small_num) * 2) + 1 rows', function() {
      var expected_length = ((board.large_num - board.small_num) * 2) + 1;
      expect(board_tiles.length).toEqual(expected_length);
    });

    it('contains rows that progress in length (small_num -> large_num -> small_num', function() {
      for(var row=0, len = board_tiles.length; row < len; row++) {
        if(row < Math.ceil(board_tiles.length / 2)) {
          expect(board_tiles[row].length).toEqual(board.small_num + row);
        } else {
          expect(board_tiles[row].length).toEqual((2 * board.large_num) - (row + board.small_num));
        }
      }
    });
  });

  describe('calculateNumberOfSides method', function() {
    it('returns the number of tile edges along the rim of the board', function() {
      var num_sides = board.calculateNumberOfSides();
      var top_and_bottom = (board.boardVertices[0].length * 2) * 2;
      var left_and_right = (board.boardVertices.length - 3) * 2;
      var total_sides = top_and_bottom + left_and_right;
      expect(num_sides).toEqual(total_sides);
    });
  });

  describe('buildBorderVerticesArray method', function() {
    beforeEach(function() {
      border_vertices = board.buildBorderVerticesArray();
    });

    it('has length equal to output of calculateNumberOfSides method', function() {
      expect(border_vertices.length).toEqual(board.calculateNumberOfSides());
    });
  });
});