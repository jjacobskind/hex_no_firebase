var BoardNavigator = function(board_vertices) {
  this.board_vertices = board_vertices;
};

// returns vertex object that a given road goes to
BoardNavigator.prototype.getRoadDestination = function(current_location, direction) {
  var num_rows = this.board_vertices.length;

  //added this so that we can pass in a uniform location to all functions
  var row = current_location[0];
  var col = current_location[1];

  // Row index of vertical adjacent vertex is one greater than the current vertex row if the current row is odd
  // If the current row is even, the adjacent vertical vertex is one less than the current row index
  // If water is vertically adjacent to current vertex, return null
  if(direction === 'vertical') {
    if(row===0 || (row+1 >= num_rows)){
      return null;
    }
    else if (row%2===0){
      return [row-1, col];
    }
    else {
      return [row+1, col];
    }
  }

  if(row%2===0){
    var adjusted_row = row+1;
  } else {
    adjusted_row = row-1;
  }

  if(direction === 'left'){
    // If water is to left of vertex, return null
    if(col===0){
      if(row<num_rows/2 && row%2===1){
        return null;
      }
      else if (row>=num_rows/2 && row%2===0){
        return null;
      }
    }

    // Column number of left adjacent vertex is the same as current vertex
    // UNLESS the current vertex is in an odd-indexed row in top half of board
    // OR the current vertex is in an even-indexed row in bottom half of board
    if(row<num_rows/2){
      if(row % 2===1) {
        col--;
      }
    } else if(row % 2===0) {
      col--;
    }
    return [adjusted_row, col];
  }
  else if(direction === 'right') {
    var last_col = this.board_vertices[row].length-1;

    // If water is to right of vertex, return null
    if(col===last_col){
      if(row<num_rows/2 && row%2===1){
        return null;
      }
      else if (row>=num_rows/2 && row%2===0){
        return null;
      }
    }

    // Column number of right adjacent vertex is the same as current vertex
    // UNLESS the current vertex is in an even-indexed row in top half of board
    // OR the current vertex is in an odd-indexed row in bottom half of board
    if(row<num_rows/2){
      if(row % 2===0) {
        col++;
      }
    } else if(row % 2===1) {
      col++;
    }
    return [adjusted_row, col];
  }
};

module.exports = BoardNavigator;