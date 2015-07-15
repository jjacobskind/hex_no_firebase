var BoardInitializer = require('../classes/board_initializer');
var BoardNavigator = require ('../classes/board_navigator');

describe('BoardNavigator class', function() {
  var small_num = Math.ceil(Math.random() * 100);
  var large_num = Math.ceil(Math.random() * 100) + small_num;
  var board = new BoardInitializer(small_num, large_num);
  var board_navigator = new BoardNavigator(board.vertices);

  describe('goLeft method', function() {
    it('returns null when the row is odd, in the top half of board, and col is 0', function() {
      for(var row=1, num_rows=board.vertices.length/2; row < num_rows; row += 2) {
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: 0 }, 'left');
        expect(new_vertex).toBe(null);
      }
    });

    it('returns null when the row is even, in the bottom half of board, and col is 0', function() {
      for(var row=(board.vertices.length/2) + 2, num_rows=board.vertices.length; row < num_rows; row += 2) {
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: 0 }, 'left');
        expect(new_vertex).toBe(null);
      }
    });

    it('returns a vertex when the row is even, in the top half of board, and col is 0', function() {
      for(var row=0, num_rows=board.vertices.length/2; row < num_rows; row += 2) {
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: 0 }, 'left');
        expect(new_vertex).toNotBe(null);
      }
    });

    it('returns a vertex when the row is odd, in the bottom half of board, and col is 0', function() {
     for(var row=(board.vertices.length/2) + 1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: 0 }, 'left');
        expect(new_vertex).toNotBe(null);
      }
    });

    it('goes up a row when the starting row number is odd', function() {
      for(var row=1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.row).toEqual(row - 1);
        }
      }
    });

    it('goes down a row when the starting row number is even', function() {
      for(var row=0, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.row).toEqual(row + 1);
        }
      }
    });

    it('subtracts one from the column when the starting row number is odd and in the top half of the board', function() {
      for(var row=1, num_rows=board.vertices.length/2; row <= num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.col).toEqual(col - 1);
        }
      }
    });

    it('subtracts one from the column when the starting row number is even and in the bottom half of the board', function() {
      for(var row=(board.vertices.length / 2) + 2, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.col).toEqual(col - 1);
        }
      }
    });

    it('has the same column number when the starting row is odd and in the bottom half of the board', function() {
      for(var row=(board.vertices.length / 2) + 1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.col).toEqual(col);
        }
      }
    });

    it('has the same column number when the starting row is even and in the top half of the board', function() {
      for(var row=0, num_rows=board.vertices.length/2; row <= num_rows; row += 2) {
        for(var col=1, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'left');
          expect(new_vertex.col).toEqual(col);
        }
      }
    });
  });

  describe('goRight method', function() {
    it('returns null when the row is odd, in the top half of board, and col is last in the row', function() {
      for(var row=1, num_rows=board.vertices.length/2; row < num_rows; row += 2) {
        var last_col = board.vertices[row].length - 1;
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: last_col }, 'right');
        expect(new_vertex).toBe(null);
      }
    });

    it('returns null when the row is even, in the bottom half of board, and col is last in the row', function() {
      for(var row=(board.vertices.length/2) + 2, num_rows=board.vertices.length; row < num_rows; row += 2) {
        var last_col = board.vertices[row].length - 1;
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: last_col }, 'right');
        expect(new_vertex).toBe(null);
      }
    });

    it('returns a vertex when the row is even, in the top half of board, and col is last in the row', function() {
      for(var row=0, num_rows=board.vertices.length/2; row < num_rows; row += 2) {
        var last_col = board.vertices[row].length - 1;
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: last_col }, 'right');
        expect(new_vertex).toNotBe(null);
      }
    });

    it('returns a vertex when the row is odd, in the bottom half of board, and col is last in the row', function() {
     for(var row=(board.vertices.length/2) + 1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        var last_col = board.vertices[row].length - 1;
        var new_vertex = board_navigator.getRoadDestination({ row: row, col: last_col }, 'right');
        expect(new_vertex).toNotBe(null);
      }
    });

    it('goes up a row when the starting row number is odd', function() {
      for(var row=1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.row).toEqual(row - 1);
        }
      }
    });

    it('goes down a row when the starting row number is even', function() {
      for(var row=0, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.row).toEqual(row + 1);
        }
      }
    });

    it('adds one to the column when the starting row number is odd and in the bottom half of the board', function() {
      for(var row=(board.vertices.length / 2) + 1, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.col).toEqual(col + 1);
        }
      }
    });

    it('adds one to the column when the starting row number is even and in the top half of the board', function() {
      for(var row=0, num_rows=board.vertices.length/2; row <= num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.col).toEqual(col + 1);
        }
      }
    });

    it('has the same column number when the starting row number is odd and in the top half of the board', function() {
      for(var row=1, num_rows=board.vertices.length/2; row <= num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.col).toEqual(col);
        }
      }
    });

    it('has the same column number when the starting row number is even and in the bottom half of the board', function() {
      for(var row=(board.vertices.length / 2) + 2, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length - 1; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'right');
          expect(new_vertex.col).toEqual(col);
        }
      }
    });
  });

  describe('goVertical method', function() {
    it('returns null when the vertex is in the first or last row', function() {
      for(var i=0, len = board.vertices[0].length; i < len; i++) {
        var new_vertex = board_navigator.getRoadDestination({ row: 0, col: i }, 'vertical');
        expect(new_vertex).toBe(null);

        new_vertex = board_navigator.getRoadDestination({ row: board.vertices.length - 1, col: i }, 'vertical');
        expect(new_vertex).toBe(null);
      }
    });

    it('goes down a row when the starting row number is odd', function() {
      for(var row=1, num_rows=board.vertices.length; row < num_rows - 1; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'vertical');
          expect(new_vertex.row).toEqual(row + 1);
        }
      }
    });

    it('goes up a row when the starting row number is even', function() {
      for(var row=2, num_rows=board.vertices.length; row < num_rows; row += 2) {
        for(var col=0, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'vertical');
          expect(new_vertex.row).toEqual(row - 1);
        }
      }
    });

    it('maintains the same column number', function() {
      for(var row=1, num_rows=board.vertices.length; row < num_rows - 1; row++) {
        for(var col=0, num_cols=board.vertices[row].length; col < num_cols; col++) {
          var new_vertex = board_navigator.getRoadDestination({ row: row, col: col }, 'vertical');
          expect(new_vertex.col).toEqual(col);
        }
      }
    });
  });
});