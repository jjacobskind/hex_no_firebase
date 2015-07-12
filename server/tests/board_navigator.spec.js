var BoardInitializer = require('../classes/board_initializer');
var BoardNavigator = require ('../classes/board_navigator');

describe('BoardNavigator class', function() {
  var small_num = Math.ceil(Math.random() * 100);
  var large_num = Math.ceil(Math.random() * 100) + small_num;
  var board = new BoardInitializer(small_num, large_num);
  var board_navigator = new BoardNavigator(board.vertices);

  describe('goLeft method', function() {
    it('returns null when there is no vertex to the left', function() {
      var new_vertex = board_navigator.goLeft({ row: 1, col: 0 });
      expect(new_vertex).toBe(null);
    });
  });
});