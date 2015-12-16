var CoordinatesToRoadIndicesConverter = function(vertices, side_length, bevel_size) {
  this.road_width = bevel_size * 2;
  this.road_length = side_length + (bevel_size * 2);
  this.vertices = vertices;
  this.vertices_coordinates_getter = new VertexIndicesToCoordinatesConverter(vertices, side_length, bevel_size);
};

CoordinatesToRoadIndicesConverter.prototype.convert = function(coordinates) {
  var vertex = this.getVertex(coordinates);
  if(!vertex) { return null; }
  var direction = this.getDirection(vertex, coordinates);
  if(!direction) { return null; }
  if(!this.inClickZone(coordinates, vertex, direction)) { return null; }
  console.log('GOOD'); return;
  return { start_vertex: vertex, direction: direction };
};

CoordinatesToRoadIndicesConverter.prototype.getVertex = function(click_coordinates) {
  for(var row = 0, num_rows = this.vertices.length; row < num_rows; row++) {
    for(var col = 0, num_cols = this.vertices[row].length; col < num_cols; col++) {
      var vertex_coordinates = this.vertices_coordinates_getter.convert({ row: row, col: col });
      var is_within_road_length_of_vertex = this.isWithinRoadLengthOfVertex(click_coordinates, vertex_coordinates);
      if(is_within_road_length_of_vertex) { return { row: row, col: col }; }
    }
  }
};

CoordinatesToRoadIndicesConverter.prototype.isWithinRoadLengthOfVertex = function(click_coordinates, vertex_coordinates) {
  var x_diff = vertex_coordinates.x - click_coordinates.x;
  var z_diff = vertex_coordinates.z - click_coordinates.z;
  var distance_from_vertex = Math.sqrt(Math.pow(x_diff, 2) + Math.pow(z_diff, 2));
  return distance_from_vertex <= this.road_length;
};

CoordinatesToRoadIndicesConverter.prototype.getDirection = function(start_vertex, click_coords) {
  var board_navigator = new BoardNavigator(this.vertices);
  var directions = ['left', 'right', 'vertical'];
  var start_coords = this.vertices_coordinates_getter.convert(start_vertex);
  for(var i=0, len=directions.length; i < len; i++) {
    var end_vertex = board_navigator.getRoadDestination(start_vertex, directions[i]);
    if(!end_vertex) { continue; }
    var end_coords = this.vertices_coordinates_getter.convert(end_vertex);
    if(this.nearClickZone(click_coords, start_coords, end_coords)) { return directions[i]; }
  }
};

CoordinatesToRoadIndicesConverter.prototype.nearClickZone = function(click_coords, start_coords, end_coords) {
  if(start_coords.x === end_coords.x) {
    var half_road_width = this.road_width / 2;
    var x1 = start_coords.x - half_road_width;
    var x2 = start_coords.x + half_road_width;
  } else {
    x1 = start_coords.x;
    x2 = end_coords.x;
  }
  var in_x_range = this.inRange(click_coords.x, x1, x2);
  var in_z_range = this.inRange(click_coords.z, start_coords.z, end_coords.z);
  return in_x_range && in_z_range;
};

CoordinatesToRoadIndicesConverter.prototype.inClickZone = function(click_coords, vertex1, direction) {
  if(direction === 'vertical') { return true; }
  var board_navigator = new BoardNavigator(this.vertices);
  var vertex2 = board_navigator.getRoadDestination(vertex1, direction);
  var coord_sets = this.getSortedCoordinates(vertex1, vertex2);

  var x_diff = click_coords.x - coord_sets.start.x;
  var angle = this.getAngle(coord_sets)
  var target_z_diff = x_diff * Math.tan(angle);

  var absolute_target_z = target_z_diff + coord_sets.start.z;

  return Math.abs(absolute_target_z - click_coords.z) <= this.road_width / 2;
};

CoordinatesToRoadIndicesConverter.prototype.inRange = function(click_coord, coord1, coord2) {
  return click_coord >= Math.min(coord1, coord2) && click_coord <= Math.max(coord1, coord2);
};

CoordinatesToRoadIndicesConverter.prototype.getSortedCoordinates = function(vertex1, vertex2) {
  var retObj = {};
  var coords1 = this.vertices_coordinates_getter.convert(vertex1);
  var coords2 = this.vertices_coordinates_getter.convert(vertex2);

  var min_x = Math.min(coords1.x, coords2.x);
  if(min_x === coords1.x) { retObj.start = coords1; retObj.end = coords2; }
  else { retObj.start = coords2; retObj.end = coords1; }
  return retObj;
};

CoordinatesToRoadIndicesConverter.prototype.getAngle = function(coord_sets) {
  var angle = Math.PI / 6;
  if(coord_sets.end.z < coord_sets.start.z) { angle *= -1; }
  return angle;
};
