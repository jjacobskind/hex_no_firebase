var BoardNavigator = require('../../classes/board_navigator');

exports.selfOrAnyNeighborsOwned = function(vertex_coords, vertices) {
  if(!!vertices[vertex_coords.row][vertex_coords.col].owner) { return true; }
  var navigator = new BoardNavigator(vertices);
  var directions_array = ['left', 'right', 'vertical'];
  for(var i=0, len = directions_array.length; i < len; i++) {
    var direction = directions_array[i];
    var neighboring_vertex_coords = navigator.getRoadDestination(vertex_coords, direction);
    if(!!neighboring_vertex_coords) {
      var neighboring_vertex = vertices[neighboring_vertex_coords.row][neighboring_vertex_coords.col];
    }
    if(!!neighboring_vertex && !!neighboring_vertex.owner) { return true; }
  }
  return false;
};

exports.randomRoadDirection = function(vertex_coords, vertices) {
  var navigator = new BoardNavigator(vertices), vertex_exists = null;
  var direction_choices = ['left', 'right', 'vertical'];
  var index = Math.floor(Math.random() * direction_choices.length);

  var vertex = vertices[vertex_coords.row][vertex_coords.col];

  // make sure road goes somewhere and road isn't already built
  while(!vertex_exists || !direction || !!vertex.connections[direction]) {
    var direction = direction_choices[index % direction_choices.length];
    vertex_exists = !!navigator.getRoadDestination(vertex_coords, direction);
    index++;
    if(index > 10) { throw 'Vertex has not unbuilt roads'; }
  }
  return direction;
};

exports.randomBuildableVertex = function(vertices) {
  while(typeof vertex_coords === 'undefined' || exports.selfOrAnyNeighborsOwned(vertex_coords, vertices)) {
    var row = Math.floor(vertices.length * Math.random());
    var col = Math.floor(vertices[row].length * Math.random());
    var vertex_coords = { row: row, col: col };
  }
  return vertex_coords;
};

exports.clearBoard = function(vertices) {
  for(var row=0, num_rows = vertices.length; row < num_rows; row++) {
    for(var col=0, num_cols = vertices[row].length; col < num_cols; col++) {
      var vertex = vertices[row][col];
      vertex.owner = null, vertex.property_type = null;
      for(var key in vertex.connections) { vertex.connections[key] = null; }
    }
  }
};
