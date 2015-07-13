var BoardNavigator = function(vertices) {
  this.vertices = vertices;
};

BoardNavigator.prototype.goLeft = function(current_vertex) {
  var num_rows = this.vertices.length;

  //added this so that we can pass in a uniform location to all functions
  var row = current_vertex.row;
  var col = current_vertex.col;
  var vertex_in_top_half = row <= num_rows/2;
  var row_is_odd = row % 2 === 1;
  var new_vertex = {};

  var no_left_vertex = ((row_is_odd && vertex_in_top_half) || (!row_is_odd && !vertex_in_top_half)) && col === 0;
  if(no_left_vertex) { return null; }

  var new_row = row, new_col = col;
  if(row_is_odd) { new_row--; }
  else { new_row++; }
  if(row_is_odd && vertex_in_top_half) { new_col--; }
  else if(!row_is_odd && !vertex_in_top_half) { new_col--; }
  return { row: new_row, col: new_col };
};

BoardNavigator.prototype.goRight = function(current_vertex) {
  var num_rows = this.vertices.length;

  //added this so that we can pass in a uniform location to all functions
  var row = current_vertex.row;
  var col = current_vertex.col;
  var vertex_in_top_half = row <= num_rows/2;
  var row_is_odd = row % 2 === 1;
  var new_vertex = {};

  var last_col = this.vertices[row].length - 1;
  var no_right_vertex = ((row_is_odd && vertex_in_top_half) || (!row_is_odd && !vertex_in_top_half)) && col === last_col;
  if(no_right_vertex) { return null; }

  var new_row = row, new_col = col;
  if(row_is_odd) { new_row--; }
  else { new_row++; }
  if(!row_is_odd && vertex_in_top_half) { new_col++; }
  else if(row_is_odd && !vertex_in_top_half) { new_col++; }
  return { row: new_row, col: new_col };
};

BoardNavigator.prototype.goVertical = function(current_vertex) {
  var num_rows = this.vertices.length;

  //added this so that we can pass in a uniform location to all functions
  var row = current_vertex.row;
  var col = current_vertex.col;
  var vertex_in_top_half = row <= num_rows/2;
  var row_is_odd = row % 2 === 1;
  var new_vertex = {};

  if(row === 0 || row === num_rows - 1) { return null; }

  var new_row = row;
  if(row_is_odd) { new_row++; }
  else { new_row--; }
  return { row: new_row, col: col }
};

// returns vertex object that a given road goes to
BoardNavigator.prototype.getRoadDestination = function(current_location, direction) {
  var num_rows = this.vertices.length;

  //added this so that we can pass in a uniform location to all functions
  var row = current_location.row;
  var col = current_location.col;
  var new_vertex = {};

  // Row index of vertical adjacent vertex is one greater than the current vertex row if the current row is odd
  // If the current row is even, the adjacent vertical vertex is one less than the current row index
  // If water is vertically adjacent to current vertex, return null
  if(direction === 'vertical') {
    if(row===0 || (row+1 >= num_rows)){
      return null;
    }
    else if (row%2===0){
      new_vertex.row = row - 1;
      new_vertex.col = col;
      return new_vertex;
    }
    else {
      new_vertex.row = row + 1;
      new_vertex.col = col;
      return new_vertex;
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
    new_vertex.row = adjusted_row;
    new_vertex.col = col;
    return new_vertex;
  }
  else if(direction === 'right') {
    var last_col = this.vertices[row].length-1;

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
    new_vertex.row = adjusted_row;
    new_vertex.col = col;
    return new_vertex;
  }
};

module.exports = BoardNavigator;