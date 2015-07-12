var BoardInitializer = require('../classes/board_initializer');

describe('BoardInitializer class', function() {
  var small_num               = Math.ceil(Math.random() * 100);
  var large_num               = Math.ceil(Math.random() * 100) + small_num;
  var board                   = new BoardInitializer(small_num, large_num);
  var num_tiles               = board.totalNumberOfTiles();
  var num_deserts             = board.numberOfDeserts(num_tiles);
  var number_chits_array      = board.createNumberChitsArray(num_tiles, num_deserts);
  var number_chits_array_test = number_chits_array.slice();
  var resources_array         = board.createResourcesArray(num_deserts, num_tiles);
  var resources_array_test    = resources_array.slice();
  var tiles_array             = board.createTilesArray(num_tiles, number_chits_array, resources_array);
  var board_tiles             = board.makeTilesArrayMultiDimensional(tiles_array);
  var border_vertices         = board.buildBorderVerticesArray();

  describe('boardVertices', function() {
    it('is a multidimensional array with top-level length = ((large_num - small_num) * 4) + 4', function() {
      var expected_length = ((large_num - small_num) * 4) + 4;
      expect(board.vertices.length).toEqual(expected_length);
    });

    it('has two shortest rows, the length of which is small_num', function() {
      var small_num_row_count = 0;
      var smaller_row_than_small_num_found = false;
      board.vertices.forEach(function(row) {
        if(row.length < small_num) { smaller_row_than_small_num_found = true; }
        else if(row.length === small_num) { small_num_row_count++; }
      });
      expect(small_num_row_count).toEqual(2);
      expect(smaller_row_than_small_num_found).toBe(false);
    });

    it('has two largest rows, the length of which is large_num + 1', function() {
      var large_num_row_count = 0;
      var larger_row_than_small_num_found = false;
      board.vertices.forEach(function(row) {
        if(row.length > large_num + 1) { larger_row_than_small_num_found = true; }
        else if(row.length === large_num + 1) { large_num_row_count++; }
      });
      expect(large_num_row_count).toEqual(2);
      expect(larger_row_than_small_num_found).toBe(false);
    });

    it('has rows of symmetrical length', function() {
      var halfway_point = (board.vertices.length / 2) - 1
      var vertices = board.vertices;
      for(var i=0, len=halfway_point; i < len; i++) {
        expect(vertices[i].length).toEqual(vertices[vertices.length - i - 1].length);
      }
    });

    it('has vertex keys for every element', function() {
      for(row=0, max_row=board.vertices.length; row < max_row; row++) {
        for(col=0, max_col=board.vertices[row].length; col < max_col; col++) {
          var vertex = board.vertices[row][col];
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
      var top_and_bottom = (board.vertices[0].length * 2) * 2;
      var left_and_right = (board.vertices.length - 3) * 2;
      var total_sides = top_and_bottom + left_and_right;
      expect(num_sides).toEqual(total_sides);
    });
  });

  describe('buildBorderVerticesArray method', function() {
    it('has length equal to output of calculateNumberOfSides method', function() {
      expect(border_vertices.length).toEqual(board.calculateNumberOfSides());
    });
  });

  describe('assignPorts method', function() {
    board.assignPorts(border_vertices);

    it('assigns a port to the first vertex in array', function() {
      var row = border_vertices[0].row, col = border_vertices[0].col;
      expect(!!board.vertices[row][col].port).toBe(true);
    });

    it('assigns ports to exactly two adjacent vertices at a time', function() {
      for(var i=0, len=border_vertices.length; i < len; i++) {
        var adjacent_ports = 0;
        var row = border_vertices[i].row, col = border_vertices[i].col;
        if(!!board.vertices[row][col].port) { adjacent_ports++; }
        else {
          var valid_result = adjacent_ports === 2 || adjacent_ports === 0;
          adjacent_ports = 0;
          expect(valid_result).toBe(true);
        }
      }
    });

    it('has gaps of two and three sides between ports', function() {
      var two_found = false, three_found = false;
      var adjacent_empty_sides = 0;
      for(var i=0, len=border_vertices.length; i < len; i++) {
        var row = border_vertices[i].row, col = border_vertices[i].col;
        if(!board.vertices[row][col].port) { adjacent_empty_sides++; }
        else {
          var valid_result = adjacent_empty_sides === 1 || adjacent_empty_sides === 2 || adjacent_empty_sides === 0;
          if(adjacent_empty_sides === 1) { two_found = true; }
          else if(adjacent_empty_sides === 2) { three_found = true; }
          adjacent_empty_sides = 0;
          expect(valid_result).toBe(true);
        }
      }
      expect(two_found && three_found).toBe(true);
    });

    it('leaves either two or three sides at the end of the loop empty', function() {
      var num_vertices = border_vertices.length;
      var row = border_vertices[num_vertices - 1].row, col = border_vertices[num_vertices - 1].col
      expect(!!board.vertices[row][col].port).toBe(false);

      // if the second-to-last vertex doesn't have have a port, the third-to-last should
      row = border_vertices[num_vertices - 2].row, col = border_vertices[num_vertices - 2].col
      if(!board.vertices[row][col].port) {
        row = border_vertices[num_vertices - 3].row, col = border_vertices[num_vertices - 3].col
        expect(!!board.vertices[row][col].port).toBe(true);
      }
    });
  });
});