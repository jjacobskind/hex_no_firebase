var BoardNavigator = require('./board_navigator');

var RoadBuilder = function(vertices, player, board_setup_phase) {
  this.vertices = vertices;
  this.player = player;
  this.board_setup_phase = !!board_setup_phase;
  if(board_setup_phase) {
    this.most_recent_vertex_coords = this.findMostRecentSettlement();
  }
};

RoadBuilder.prototype.placeRoad = function(start_vertex_coords, direction) {
  var board_navigator = new BoardNavigator(this.vertices);
  var end_vertex_coords   = board_navigator.getRoadDestination(start_vertex_coords, direction);
  var start_vertex = this.vertices[start_vertex_coords.row][start_vertex_coords.col];
  var end_vertex = this.vertices[end_vertex_coords.row][end_vertex_coords.col];

  if(this.board_setup_phase && !this.isVertexMostRecent(start_vertex_coords, end_vertex_coords)) {
    return { err: 'Must place road adjacent to most recent settlement during board setup phase!' };
  }

  if(!end_vertex) { return { err: 'You cannot build a road in that direction!' }; }
  if(!!start_vertex.connections[direction]) { return { err: 'A road already exists in this location.' }; }

  if(!this.playerIsAdjacentToSpace(start_vertex, end_vertex)) {
    return { err: 'Road is not adjacent to player\'s current road, settlement, or city!' };
  }

  var inverse_direction = this.invertRoadDirection(direction);

  start_vertex.connections[direction] = this.player.playerID;
  end_vertex.connections[inverse_direction] = this.player.playerID;

  return {
    'location': start_vertex_coords,
    'locationDirection': direction,
    'destination': end_vertex_coords,
    'destinationDirection': inverse_direction
  };
};

RoadBuilder.prototype.findMostRecentSettlement = function() {
  var playerID = this.player.playerID;
  for(var row=0, num_rows=this.vertices.length; row < num_rows; row++) {
    for(var col=0, num_cols=this.vertices[row].length; col < num_cols; col++) {
      var vertex = this.vertices[row][col];
      if(this.playerOwnsVertex(vertex) && !this.playerOwnsAdjacentRoad(vertex)) {
        return { row: row, col: col };
      }
    }
  }
};

RoadBuilder.prototype.playerOwnsAdjacentRoad = function(vertex) {
  for(var key in vertex.connections) {
    if(vertex.connections[key] === this.player.playerID) { return true; }
  }
  return false;
};

RoadBuilder.prototype.playerOwnsVertex = function(vertex) {
  return this.player.playerID === vertex.owner;
};

RoadBuilder.prototype.vertexIsNotOwned = function(vertex) {
  return vertex.owner === null;
};

RoadBuilder.prototype.playerIsAdjacentToSpace = function(start_vertex, end_vertex) {
  if(this.playerOwnsVertex(start_vertex) || this.playerOwnsVertex(end_vertex))          { return true; }
  if(this.playerOwnsAdjacentRoad(start_vertex) && this.vertexIsNotOwned(start_vertex))  { return true; }
  if(this.playerOwnsAdjacentRoad(end_vertex) && this.vertexIsNotOwned(end_vertex))      { return true; }
  return false;
};

RoadBuilder.prototype.invertRoadDirection = function(original_direction) {
  switch (original_direction) {
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'vertical':
      return 'vertical';
  };
};

RoadBuilder.prototype.isVertexMostRecent = function() {
  if(!this.most_recent_vertex_coords) { return false; }
  for(var i=0, len=arguments.length; i < len; i++) {
    var vertex = arguments[i];
    var match = vertex.row === this.most_recent_vertex_coords.row && vertex.col === this.most_recent_vertex_coords.col;
    if(match) { return true; }
  }
}

module.exports = RoadBuilder;
