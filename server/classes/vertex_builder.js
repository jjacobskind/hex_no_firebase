var BoardNavigator = require('./board_navigator');

var VertexBuilder = function(vertices, player, vertex_coords, board_setup_phase) {
  this.vertices = vertices;
  this.player = player;
  this.vertex_coords = vertex_coords;
  this.board_setup_phase = !!board_setup_phase;
  this.vertex_is_buildable = this.isVertexBuildable();
  this.property_type_to_build = this.determinePropertyTypeToBuild();
};

VertexBuilder.prototype.build = function() {
  if(!!this.error) { return this.error; }
  var vertex = this.vertices[this.vertex_coords.row][this.vertex_coords.col];
  vertex.property_type = this.property_type_to_build;
  vertex.owner = this.player.playerID;
  return { playerID: this.player.playerID, type: this.property_type_to_build, location: this.vertex_coords };
};

VertexBuilder.prototype.isAdjacentVertexOwned = function() {
  var vertex_coords = this.vertex_coords;
  var directions = ['left', 'right', 'vertical'];
  var navigator = new BoardNavigator(this.vertices);
  for(var i = 0, len = directions.length; i < len; i++) {
    var adjacent_vertex_coords = navigator.getRoadDestination(vertex_coords, directions[i]);
    var adjacent_vertex = this.vertices[adjacent_vertex_coords.row][adjacent_vertex_coords.col];
    if(!!adjacent_vertex && adjacent_vertex.owner !== null) { return true; }
  }
  return false;
};

VertexBuilder.prototype.playerOwnsAdjacentRoad = function() {
  var vertex = this.vertices[this.vertex_coords.row][this.vertex_coords.col];
  for(var direction in vertex.connections) {
    if(vertex.connections[direction] === this.player.playerID) { return true; }
  }
  return false;
};

VertexBuilder.prototype.isVertexBuildable = function() {
  var vertex_coords = this.vertex_coords;
  var vertex = this.vertices[vertex_coords.row][vertex_coords.col];
  var current_property_type = vertex.property_type, owner = vertex.owner;

  if(!vertex) { this.error =  'This vertex does not exist!'; return false; }
  if (owner !== null && owner !== this.player.playerID) { this.error = 'Another player owns a ' + vertex.property_type + ' at this location!'; return false; }
  if(this.isAdjacentVertexOwned()) { this.error = 'Cannot build next to another settlement or city!'; return false; }
  if(!this.board_setup_phase && !this.playerOwnsAdjacentRoad()) { this.error = 'You must build a road to this location before you can build on it.'; return false; }
  if(owner === this.player.playerID) {
      switch(current_property_type) {
        case 'city':
           this.error = 'You already own a city at this location!';
           return false;
        case 'settlement':
          if(this.board_setup_phase) { this.error = 'Must build on an unoccupied location during the board setup phase!'; return false; }
      }
  }
  return true;
};

VertexBuilder.prototype.determinePropertyTypeToBuild = function() {
  if(!!this.error) { return null; }
  var vertex_owner = this.vertices[this.vertex_coords.row][this.vertex_coords.col].owner;
  if(vertex_owner === this.player.playerID) { return 'city'; }
  return 'settlement';
}

module.exports = VertexBuilder;
