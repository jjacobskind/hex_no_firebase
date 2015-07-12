var BoardInitializer = require('../classes/board_initializer');
var BoardNavigator = require ('../classes/board_navigator');

describe('BoardNavigator class', function() {
  var small_num = Math.ceil(Math.random() * 100);
  var large_num = Math.ceil(Math.random() * 100) + small_num;
  var board = new BoardInitializer(small_num, large_num);
  var board_navigator = new BoardNavigator(board);

  describe('goLeft method', function() {
    it('returns null when there is not vertex to the left', function() {
      var new_vertex = board_navigator.getRoadDestination({ row: 1, col: 0 }, 'left');
      expect(new_vertex).toBe(null);
    });
  });
});