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
  console.log(vertex, direction); return;
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

CoordinatesToRoadIndicesConverter.prototype.clickedHotZone = function(click_coordinates, vertex1, direction) {
  var vertex2 = this.board_navigator.getRoadDestination(vertex1, direction);
  var vertex1_coords = this.vertices_coordinates_getter.convert(vertex1);
  var vertex2_coords = this.vertices_coordinates_getter.convert(vertex2);
  // var min_z = Math.min(vertex1_coords.z, vertex2_coords.z);
  // var max_z = Math.max(vertex1_coords.z, vertex2_coords.z);
  // var min_x = Math.min(vertex1_coords.x, vertex2_coords.x);
  // var max_x = Math.max(vertex1_coords.x, vertex2_coords.x);
  if(direction === 'vertical') {
    var high_bound = Math.max(vertex1_coords.z, vertex2_coords.z) - this.road_margin;
    var low_bound = Math.min(vertex1_coords.z, vertex2_coords.z) + this.road_margin;
    var valid_vertical = click_coordinates.z <= high_bound && click_coordinates.z >= low_bound;
    var valid_horizontal = Math.abs(click_coordinates.x - vertex1_coords.x) < this.bevel_size;
    if(valid_vertical && valid_horizontal) { return true; }
    return false;
  }
};

// CoordinatesToRoadIndicesConverter.prototype.getVertex = function(click_coordinates) {
//   for(var row = 0, num_rows = this.vertices.length; row < num_rows; row++) {
//     for(var col = 0, num_cols = this.vertices[row].length; col < num_cols; col++) {
//       var vertex_coordinates = this.vertices_coordinates_getter.convert({ row: row, col: col });
//       var is_within_road_length_of_vertex = this.isWithinRoadLengthOfVertex(click_coordinates, vertex_coordinates);
//       if(is_within_road_length_of_vertex) { return { row: row, col: col }; }
//     }
//   }
// };
//
// CoordinatesToRoadIndicesConverter.prototype.isWithinRoadLengthOfVertex = function(click_coordinates, vertex_coordinates) {
//   var x_diff = vertex_coordinates.x - click_coordinates.x;
//   var z_diff = vertex_coordinates.z - click_coordinates.z;
//   var distance_from_vertex = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
//   return distance_from_vertex <= this.road_length;
// };
//
// CoordinatesToRoadIndicesConverter.prototype.getDirection = function(start_vertex, click_coords) {
//   var board_navigator = new BoardNavigator(this.vertices);
//   var directions = ['left', 'right', 'vertical'];
//   var start_coords = this.vertices_coordinates_getter.convert(start_vertex);
//   for(var i=0, len=directions.length; i < len; i++) {
//     var end_vertex = board_navigator.getRoadDestination(start_vertex, directions[i]);
//     if(!end_vertex) { continue; }
//     var end_coords = this.vertices_coordinates_getter.convert(end_vertex);
//     if(this.nearClickZone(click_coords, start_coords, end_coords)) { return directions[i]; }
//   }
// };
//
// CoordinatesToRoadIndicesConverter.prototype.nearClickZone = function(click_coords, start_coords, end_coords) {
//   if(start_coords.x === end_coords.x) {
//     var half_road_width = this.road_width / 2;
//     var x1 = start_coords.x - half_road_width;
//     var x2 = start_coords.x + half_road_width;
//   } else {
//     x1 = start_coords.x;
//     x2 = end_coords.x;
//   }
//   var in_x_range = this.inRange(click_coords.x, x1, x2);
//   var in_z_range = this.inRange(click_coords.z, start_coords.z, end_coords.z);
//   return in_x_range && in_z_range;
// };
//
// CoordinatesToRoadIndicesConverter.prototype.inClickZone = function(click_coords, vertex1, direction) {
//   if(direction === 'vertical') { return true; }
//   var board_navigator = new BoardNavigator(this.vertices);
//   var vertex2 = board_navigator.getRoadDestination(vertex1, direction);
//   var coord_sets = this.getSortedCoordinates(vertex1, vertex2);
//
//   var x_diff = click_coords.x - coord_sets.start.x;
//   var angle = this.getAngle(coord_sets)
//   var target_z_diff = x_diff * Math.tan(angle);
//
//   var absolute_target_z = target_z_diff + coord_sets.start.z;
//
//   return Math.abs(absolute_target_z - click_coords.z) <= this.road_width / 2;
// };
//
// CoordinatesToRoadIndicesConverter.prototype.inRange = function(click_coord, coord1, coord2) {
//   var bevel_width = this.road_width / 2;
//   var min_coord = Math.min(coord1, coord2) + bevel_width;
//   var max_coord = Math.max(coord1, coord2) - bevel_width;
//   return click_coord >= min_coord && click_coord <= max_coord;
// };
//
// CoordinatesToRoadIndicesConverter.prototype.getSortedCoordinates = function(vertex1, vertex2) {
//   var retObj = {};
//   var coords1 = this.vertices_coordinates_getter.convert(vertex1);
//   var coords2 = this.vertices_coordinates_getter.convert(vertex2);
//
//   var min_x = Math.min(coords1.x, coords2.x);
//   if(min_x === coords1.x) { retObj.start = coords1; retObj.end = coords2; }
//   else { retObj.start = coords2; retObj.end = coords1; }
//   return retObj;
// };
//
// CoordinatesToRoadIndicesConverter.prototype.getAngle = function(coord_sets) {
//   var angle = Math.PI / 6;
//   if(coord_sets.end.z < coord_sets.start.z) { angle *= -1; }
//   return angle;
// };
