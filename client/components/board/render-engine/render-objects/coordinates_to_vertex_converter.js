var CoordinatesToVertexConverter = function(vertices, side_length, bevel_size, scale) {
  this.coordinates_getter = new VertexIndicesToCoordinatesConverter(vertices, side_length, bevel_size);
  this.vertices = vertices;
  this.radius = 15 * scale;
};

CoordinatesToVertexConverter.prototype.convert = function(coordinates) {
  var row = this.calculateRow(coordinates);
  if(row === false) { return false; }
  var col = this.calculateColumn(row, coordinates);
  if(col === false) { return false; }
  return { row: row, col: col };
};

CoordinatesToVertexConverter.prototype.calculateRow = function(coordinates) {
	var low_row = 0, high_row = this.vertices.length - 1;
  while(high_row >= low_row) {
    var mid_row = Math.round((low_row + high_row) / 2);
    var z = this.coordinates_getter.convert({ row: mid_row, col: 0 }).z;
    var z_diff = z - coordinates.z;

    if(Math.abs(z_diff) < this.radius) { return mid_row; }
    if(coordinates.z < z) { low_row = mid_row + 1; }
    else { high_row = mid_row - 1; }
  }
  return false;
};

CoordinatesToVertexConverter.prototype.calculateColumn = function(row, coordinates) {
  var low_col = 0, high_col = this.vertices[row].length - 1;
  while(high_col >= low_col) {
    var mid_col = Math.round((low_col + high_col) / 2);
    var x = this.coordinates_getter.convert({ row: row, col: mid_col }).x;
    var x_diff = x - coordinates.x;

    if(Math.abs(x_diff) < this.radius) { return mid_col; }
    if(coordinates.x < x) { high_col = mid_col - 1; }
    else { low_col = mid_col + 1; }
  }
  return false;
};
