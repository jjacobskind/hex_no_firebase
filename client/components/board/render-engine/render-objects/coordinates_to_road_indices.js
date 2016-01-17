var CoordinatesToRoadIndicesConverter = function(vertices, side_length, bevel_size) {
  this.bevel_size = bevel_size;
  this.road_length = side_length + (bevel_size * 2);
  this.road_margin = this.road_length / 20; // 5% margin from vertices
  this.vertices = vertices;
  this.vertices_coordinates_getter = new VertexIndicesToCoordinatesConverter(vertices, side_length, bevel_size);
  this.board_navigator = new BoardNavigator(vertices);
};

CoordinatesToRoadIndicesConverter.prototype.convert = function(coordinates) {
  var vertex = this.getVertex(coordinates);
  var direction = this.getDirection(vertex, coordinates);
  var valid = this.clickedHotZone(coordinates, vertex, direction);
  if(!valid) { return null; }
  return { start_vertex: vertex, direction: direction };
};

CoordinatesToRoadIndicesConverter.prototype.getVertex = function(click_coordinates) {
  var row = this.getVertexRow(click_coordinates);
  var col = this.getVertexColumn(click_coordinates, row);
  return { row: row, col: col };
};

CoordinatesToRoadIndicesConverter.prototype.getVertexRow = function(click_coordinates) {
  for(var row = 0, num_rows = this.vertices.length; row < num_rows; row++) {
    var row_z = this.vertices_coordinates_getter.convert({ row: row, col: 0 }).z;
    if(row_z < click_coordinates.z) { break; }
  }
  return row - 1;
};

CoordinatesToRoadIndicesConverter.prototype.getVertexColumn = function(click_coordinates, row) {
  var min_diff = null;
  for(var col = 0, num_cols = this.vertices[row].length; col < num_cols; col++) {
    var col_x = this.vertices_coordinates_getter.convert({ row: row, col: col }).x;
    var diff = Math.abs(col_x - click_coordinates.x);
    if(!min_diff) { min_diff = diff; continue; }
    if(diff < min_diff) { min_diff = diff; }
    if(diff > min_diff) { col--; break; }
  }
  return col;
};

CoordinatesToRoadIndicesConverter.prototype.getDirection = function(start_vertex, click_coords) {
  var directions = ['left', 'right', 'vertical'];
  for(var i=0, len=directions.length; i < len; i++) {
    var end_vertex = this.board_navigator.getRoadDestination(start_vertex, directions[i]);
    if(!end_vertex) { continue; }
    var end_coords = this.vertices_coordinates_getter.convert(end_vertex);
    var x_diff = Math.abs(click_coords.x - end_coords.x);
    var z_diff = Math.abs(click_coords.z - end_coords.z);
    var distance = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
    if(distance < this.road_length) { return directions[i]; }
  }
};

CoordinatesToRoadIndicesConverter.prototype.clickedHotZone = function(click_coords, vertex1, direction) {
  var vertex2 = this.board_navigator.getRoadDestination(vertex1, direction);
  var vertex1_coords = this.vertices_coordinates_getter.convert(vertex1);
  var vertex2_coords = this.vertices_coordinates_getter.convert(vertex2);
  if(direction === 'vertical') { return this.verticalHotZone(vertex1_coords, vertex2_coords, click_coords); }
  return this.lateralHotZone(vertex1_coords, vertex2_coords, click_coords);
};

CoordinatesToRoadIndicesConverter.prototype.verticalHotZone = function(vertex1_coords, vertex2_coords, click_coords) {
  var high_bound = Math.max(vertex1_coords.z, vertex2_coords.z) - this.road_margin;
  var low_bound = Math.min(vertex1_coords.z, vertex2_coords.z) + this.road_margin;
  var valid_vertical = click_coords.z <= high_bound && click_coords.z >= low_bound;
  var valid_horizontal = Math.abs(click_coords.x - vertex1_coords.x) < this.bevel_size;
  if(valid_vertical && valid_horizontal) { return true; }
  return false;
};

CoordinatesToRoadIndicesConverter.prototype.lateralHotZone = function(vertex1_coords, vertex2_coords, click_coords) {
  var z_diff = vertex1_coords.z - vertex2_coords.z;
  var x_diff = vertex1_coords.x - vertex2_coords.x;
  var angle = -Math.atan(z_diff / x_diff);

  var x_click_diff = vertex1_coords.x - click_coords.x;
  var target_z_coord = (Math.tan(angle) * x_click_diff) + vertex1_coords.z;
  return Math.abs(target_z_coord - click_coords.z) <= this.bevel_size;
};
