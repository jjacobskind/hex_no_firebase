var BoardNavigator = function(vertices) {
  this.vertices = vertices;
};

BoardNavigator.prototype.getRoadDestination = function(current_vertex, direction) {

  if(!current_vertex || !direction) { return null; }

  var num_rows = this.vertices.length;
  var vertex_in_top_half = current_vertex.row < num_rows/2;
  var row_is_odd = current_vertex.row % 2 === 1;

  switch(direction) {
    case 'left':
      return this.goLeft(current_vertex, num_rows, vertex_in_top_half, row_is_odd);
    case 'right':
      return this.goRight(current_vertex, num_rows, vertex_in_top_half, row_is_odd);
    case 'vertical':
      return this.goVertical(current_vertex, num_rows, row_is_odd);
  };
  return null;
};

BoardNavigator.prototype.goLeft = function(current_vertex, num_rows, vertex_in_top_half, row_is_odd) {
  var new_vertex = {};

  var is_first_col = current_vertex.col === 0;
  var no_left_vertex = ((row_is_odd && vertex_in_top_half) || (!row_is_odd && !vertex_in_top_half)) && is_first_col;
  if(no_left_vertex) { return null; }

  var new_row = current_vertex.row, new_col = current_vertex.col;
  if(row_is_odd) { new_row--; }
  else { new_row++; }
  if(row_is_odd && vertex_in_top_half) { new_col--; }
  else if(!row_is_odd && !vertex_in_top_half) { new_col--; }
  return { row: new_row, col: new_col };
};

BoardNavigator.prototype.goRight = function(current_vertex, num_rows, vertex_in_top_half, row_is_odd) {
  var new_vertex = {};
  var is_last_col = current_vertex.col === (this.vertices[current_vertex.row].length - 1);
  var no_right_vertex = ((row_is_odd && vertex_in_top_half) || (!row_is_odd && !vertex_in_top_half)) && is_last_col;
  if(no_right_vertex) { return null; }

  var new_row = current_vertex.row, new_col = current_vertex.col;
  if(row_is_odd) { new_row--; }
  else { new_row++; }
  if(!row_is_odd && vertex_in_top_half) { new_col++; }
  else if(row_is_odd && !vertex_in_top_half) { new_col++; }
  return { row: new_row, col: new_col };
};

BoardNavigator.prototype.goVertical = function(current_vertex, num_rows, row_is_odd) {
  var new_vertex = {}, row = current_vertex.row;

  if(row === 0 || row === num_rows - 1) { return null; }

  var new_row = row;
  if(row_is_odd) { new_row++; }
  else { new_row--; }
  return { row: new_row, col: current_vertex.col }
};

module.exports = BoardNavigator;
