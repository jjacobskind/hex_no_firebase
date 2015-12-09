var CoordinatesToVertexIndicesConverter = function(vertices, side_length, bevel_size, scale) {
  this.coordinates_getter = new VertexIndicesToCoordinatesConverter(vertices, side_length, bevel_size);
  this.vertices = vertices;
  this.radius = 5 * scale;
};

CoordinatesToVertexIndicesConverter.prototype.convert = function(coordinates) {
  var row = this.calculateRow(coordinates);
  if(row === false) { return false; }
  var col = this.calculateColumn(row, coordinates);
  if(col === false) { return false; }
  return { row: row, col: col };
};

CoordinatesToVertexIndicesConverter.prototype.calculateRow = function(coordinates) {
  var self = this;
  var get_coordinate = function(row) {
    return self.coordinates_getter.convert({ row: row, col: 0 }).z;
  };
  return this.binarySearch(this.vertices, coordinates.z, get_coordinate);
};

CoordinatesToVertexIndicesConverter.prototype.calculateColumn = function(row, coordinates) {
  var self = this;
  var get_coordinate = function(col) {
    return self.coordinates_getter.convert({ row: row, col: col }).x;
  };
  return this.binarySearch(this.vertices[row], coordinates.x, get_coordinate);
};

CoordinatesToVertexIndicesConverter.prototype.binarySearch = function(arr, click_coordinate, get_coordinate) {
  var low = 0, high = arr.length - 1;
  while(high >= low) {
    var mid = Math.round((low + high) / 2);
    var calculated_coordinate = get_coordinate(mid);
    var diff = calculated_coordinate - click_coordinate;

    if(Math.abs(diff) < this.radius) { return mid; }
    if(click_coordinate < calculated_coordinate) { low = mid + 1; }
    else { high = mid - 1; }
  }
  return false;
};
