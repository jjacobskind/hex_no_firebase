var GameHelpers = require('../modules/game_helpers');
var BoardNavigator = require('./board_navigator.js');

var BoardInitializer = function(small_num, large_num) {
  this.small_num = small_num;
  this.large_num = large_num;
  this.vertices = this.createVertices();
  this.tiles = this.createTiles();
  this.addPorts();
};

BoardInitializer.prototype.createVertices = function() {
  var small_num = this.small_num, large_num = this.large_num;
  if(small_num >= large_num) { throw 'Cannot create vertices when large_num (' + large_num + ') is <= small_num (' + small_num + ')'; }
  var iterator = 1, current_row_size = small_num, board = [];

  while(current_row_size >= small_num) {
    board.push(this.createRow(current_row_size));
    if(current_row_size !== small_num) { board.push(this.createRow(current_row_size)); }
    if(current_row_size > large_num) { iterator = -1; }
    current_row_size += iterator;
  }
  return board;
};

BoardInitializer.prototype.createRow = function(num_elements) {
  var row = [];
  for(var i=0; i<num_elements;i++) {
    row.push({
      connections: {
        vertical: null,
        left: null,
        right: null
      },
      adjacent_tiles: [],
      owner: null,
      property_type: null,
      port: null
    });
  }
  return row;
};

BoardInitializer.prototype.totalNumberOfTiles = function() {
  var small_num = this.small_num, large_num = this.large_num;
  var num_tiles = large_num;
  for(var i=small_num; i < large_num; i++) { num_tiles += (i*2); }
  return num_tiles;
};

BoardInitializer.prototype.numberOfDeserts = function(number_of_tiles) {
  var number_of_deserts= Math.round(number_of_tiles/15);
  return Math.max(number_of_deserts, 1);
};

BoardInitializer.prototype.createNumberChitsArray = function(number_of_tiles, number_of_deserts) {
  var number_chit_bank = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];
  var number_chits_array = [];
  var i=0;
  while(number_chits_array.length + number_of_deserts < number_of_tiles){
    number_chits_array.push(number_chit_bank[i % 18]);
    i++;
  }
  return number_chits_array;
};

BoardInitializer.prototype.createResourcesArray = function(number_of_deserts, number_of_tiles) {
  var resources = ['grain', 'lumber', 'wool']; // these get added first to ensure they are prioritized over ore and brick
  while(--number_of_deserts) { resources.push('desert'); }
  var resource_bank = ['grain', 'lumber', 'wool', 'brick', 'ore'];
  var i=0;
  while(resources.length < number_of_tiles - 1){
    resources.push(resource_bank[i % 5]);
    i++;
  }
  resources = GameHelpers.shuffle(resources);
  resources.unshift('desert');
  return resources;
};

BoardInitializer.prototype.createTilesArray = function(number_of_tiles, number_chits_array, resources_array) {
  var tiles_array = [];
  var start_index = Math.ceil((Math.random() * number_of_tiles));

  for (var i = start_index; i < (start_index + number_of_tiles); i++) {
    var this_resource = resources_array.pop();
    var current_index = i % number_of_tiles;
    if(this_resource === 'desert') {
      var this_chit = 7;
      var robber = true;
    }
    else {
      this_chit = number_chits_array.shift();
      robber = false;
    }
    tiles_array[current_index] = {
      resource: this_resource,
      chit: this_chit,
      robber: robber
    };
  }
  return tiles_array;
};

BoardInitializer.prototype.makeTilesArrayMultiDimensional = function(tiles_array) {
  var small_num = this.small_num, large_num = this.large_num;
  var increment = 1;
  var used_tiles = 0;
  var board_tiles = [];
  for(var i=small_num; i >= small_num; i += increment) {
    board_tiles.push(tiles_array.slice(used_tiles, used_tiles + i));
    used_tiles += i;
    if(i === large_num) { increment= -1; }
  }
  return board_tiles;
};

BoardInitializer.prototype.createTiles = function() {
  var number_of_tiles     = this.totalNumberOfTiles();
  var number_of_deserts   = this.numberOfDeserts(number_of_tiles);
  var number_chits_array  = this.createNumberChitsArray(number_of_tiles, number_of_deserts);
  var resources_array     = this.createResourcesArray(number_of_deserts, number_of_tiles);
  var tiles_array         = this.createTilesArray(number_of_tiles, number_chits_array, resources_array);
  var board_tiles         = this.makeTilesArrayMultiDimensional(tiles_array);
  return board_tiles;
};

BoardInitializer.prototype.setVerticesOnTile = function(){
  var num_rows = this.tiles.length;
  var num_vertex_rows = this.vertices.length;

  for(var row=0; row<num_rows; row++){
    for(var col=0, num_cols=this.tiles[row].length; col<num_cols; col++){
      var vertex_row = row*2;
      var current_tile = this.tiles[row][col];

      // Add resource tile to vertices on the second and third rows of the tile
      for(var i=1;i<=2;i++){
        this.vertices[vertex_row+i][col].adjacent_tiles.push(current_tile);
        this.vertices[vertex_row+i][col+1].adjacent_tiles.push(current_tile);
      }

      // Adjust column of top vertex of tile depending on whether the vertex is in the top or bottom half of board
      if(vertex_row<(num_vertex_rows/2)){
        var top_col_adjusted = col;
      } else {
        top_col_adjusted = col + 1;
      }

      // Adjust column of bottom vertex of tile depending on whether the vertex is in the top or bottom half of board
      if(vertex_row+3<(num_vertex_rows/2)){
        var bottom_col_adjusted = col + 1;
      } else {
        bottom_col_adjusted = col;
      }

      // Add resource tile to top and bottom vertices of the tile
      this.vertices[vertex_row][top_col_adjusted].adjacent_tiles.unshift(current_tile);
      this.vertices[vertex_row+3][bottom_col_adjusted].adjacent_tiles.push(current_tile);
    }
  }
};

BoardInitializer.prototype.calculateNumberOfSides = function() {
  var number_of_sides_along_left_edge = this.vertices.length - 3;
  var number_of_sides_along_top_edge = this.vertices[0].length * 2; // left and rightmost spaces already included in sides
  return (number_of_sides_along_left_edge + number_of_sides_along_top_edge) * 2;
};

BoardInitializer.prototype.buildBorderVerticesArray = function() {
  var border_vertices = [];
  var board_navigator = new BoardNavigator(this.vertices);

  // push vertices along top of board
  var vertex = { row: 1, col: 0 };
  while(vertex !== null) {
    border_vertices.push(vertex);
    vertex = board_navigator.getRoadDestination(vertex, 'right');
  }

  // push vertices along right edge of board and compile separate array of vertices along left edge
  var left_side = [];
  for(var row=2, num_side_vertices=this.vertices.length-2; row < num_side_vertices; row++){
    border_vertices.push({ row: row, col: this.vertices[row].length - 1 });
    left_side.push({ row: row, col: 0 });
  }
  left_side = left_side.reverse();

  // push vertices along bottom of board
  vertex = { row: num_side_vertices, col: this.vertices[num_side_vertices].length - 1 }
  while(vertex !== null){
    border_vertices.push(vertex);
    vertex = board_navigator.getRoadDestination(vertex, 'left');
  }

  border_vertices = border_vertices.concat(left_side);  // concatenate left side vertices onto array
  return border_vertices;
};

// TODO: Refactor this out. Instead of creating a ports array, just use same conditionals to set port string
BoardInitializer.prototype.getPortType = function(port_number) {
  var resource_ports = ['lumber', 'grain', 'wool', 'brick', 'ore'];
  var resource_index = (port_number/2) % resource_ports.length;
  if(port_number % 2 === 0) { return resource_ports[resource_index]; }
  return 'general';
};

BoardInitializer.prototype.assignPorts = function(border_vertices_array, intervals_array) {
  var port_count = 0, row, col, self = this;
  var num_sides = this.calculateNumberOfSides();
  var spacing = [2, 2, 3];
  var remainder = num_sides % 10; //how many sides are left after a full [2, 2, 3] cycle
  var further_remainder = remainder % 3;  // how many sides will remain after the last port and 2 spacers are accounted for?

  var assignPortToBothVertices = function(index, second_time) {
    row = border_vertices_array[index].row;
    col = border_vertices_array[index].col;
    self.vertices[row][col].port = self.getPortType(port_count);
    if(!second_time) {
      assignPortToBothVertices(++index, true);
      port_count++;
      return index;
    }
  };

  var vertex_index = 0, len = border_vertices_array.length, loop_count = 0;
  var adjusted = false;
  while(vertex_index < len - 1) {
    vertex_index = assignPortToBothVertices(vertex_index);
    if(further_remainder === 2 && loop_count === 2) {
      vertex_index += 2;
    } else if(further_remainder === 3 && loop_count === 1) {
      vertex_index += 3;
    } else {
      vertex_index += spacing[loop_count % spacing.length];
    }
    loop_count++;
  }
};

BoardInitializer.prototype.addPorts = function() {
  var border_vertices_array = this.buildBorderVerticesArray();
  this.assignPorts(border_vertices_array);
};

module.exports = BoardInitializer;
