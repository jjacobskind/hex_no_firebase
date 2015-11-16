(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"../modules/game_helpers":11,"./board_navigator.js":2}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
GameEngine = require('../components/engines/game-engine');
Board = require('../components/engines/board-engine');
Player = require('../components/engines/player-engine');
PhaseManager = require('./phase_manager');
RoadBuilder = require('./road_builder');
VertexBuilder = require('./vertex_builder');
ResourceManager = require('./resource_manager');

},{"../components/engines/board-engine":8,"../components/engines/game-engine":9,"../components/engines/player-engine":10,"./phase_manager":4,"./resource_manager":5,"./road_builder":6,"./vertex_builder":7}],4:[function(require,module,exports){
var PhaseManager = function(game, player) {
  this.game = game;
  this.player = player;
};

PhaseManager.prototype.playerActionValid = function(action) {
  var error = this.errorFromFailingUniversalConditions(action);
  if(!!error) { return { err: error }; }
  var method_name = action + 'Error';
  error = this[method_name]();
  if(!!error) { return { err: error }; }
  return true;
};

PhaseManager.prototype.errorFromFailingUniversalConditions = function(action) {
  var game = this.game;
  var playerID = this.player.playerID;
  if (playerID !== game.currentPlayer) { return 'It is not currently your turn!'; }
  if(game.robberMoveLockdown && action !== 'moveRobber') { return 'You must move the robber before taking any other action!'; }
  if(game.roadCardLockdown && action !== 'buildRoad') { return 'You must finish building both roads before taking any further action!'; }
};

PhaseManager.prototype.rollCheck = function() {
  var game = this.game;
  if(game.boardSetupPhase) { return 'You may not roll during the board setup phase!'; }
  else if(game.diceRolled) { return 'You may only roll once per turn!'; }
};

PhaseManager.prototype.buildRoadCheck = function() {
  var game = this.game;
  if(!game.diceRolled && !game.boardSetupPhase) { return 'You must roll the dice before you can build!'; }
  var num_player_roads = this.countPlayerRoads();
  var round_number = this.calculateRoundNumber();
  if (game.boardSetupPhase && round_number === num_player_roads) { return 'You may only build one road per turn during the board setup phase!'; }
}

PhaseManager.prototype.buildVertexCheck = function() {
  var game = this.game;
  if(!game.diceRolled && !game.boardSetupPhase) { return 'You must roll the dice before you can build!'; }
  var num_player_vertices = this.countPlayerVertices();
  var round_number = this.calculateRoundNumber();
  if (game.boardSetupPhase && round_number === num_player_vertices) { return 'You may only build one settlement per turn during the board setup phase!'; }
};

PhaseManager.prototype.tradeCheck = function() {
  var game = this.game;
  if(game.boardSetupPhase) { return 'Trading is not allowed during the board setup phase!'; }
  if(!game.diceRolled) { return 'Trading is not allowed until the dice have been rolled!'; }
};

PhaseManager.prototype.moveRobberCheck = function() {
  var game = this.game;
  if(!this.robberMoveLockdown) { return 'The robber can only be moved if a 7 has been rolled or if a knight card has been played.'; }
};

PhaseManager.prototype.advanceTurnCheck = function() {
  var game = this.game;
  var num_player_vertices = this.countPlayerVertices();
  var num_player_roads = this.countPlayerRoads();
  var round_number = this.calculateRoundNumber();

  if(game.boardSetupPhase) {
    if(num_player_vertices < round_number) { return 'You need to build a settlement and a road before you can end your turn!'; }
    if(num_player_roads < round_number) { return 'You need to build a road next to your most recent settlement before you can end your turn!'; }
  } else if(!game.diceRolled) { return 'You need to roll the dice before ending your turn!'; }
};

PhaseManager.prototype.calculateRoundNumber = function() {
  return Math.ceil(this.game.turn / this.game.players.length);
}

PhaseManager.prototype.countPlayerVertices = function() {
  var vertices = this.game.board.vertices;
  var sum = 0;
  for(var row = 0, num_rows = vertices.length; row < num_rows; row++) {
    for(var col = 0, num_cols = vertices[row].length; col < num_cols; col++) {
      if(vertices[row][col].owner === this.player.playerID) { sum ++; }
    }
  }
  return sum;
};

PhaseManager.prototype.countPlayerRoads = function() {
  var vertices = this.game.board.vertices;
  var sum = 0;
  for(var row = 0, num_rows = vertices.length; row < num_rows; row++) {
    for(var col = 0, num_cols = vertices[row].length; col < num_cols; col++) {
      var connections = vertices[row][col].connections;
      for(var direction in connections) {
        if(connections[direction] === this.player.playerID) { sum ++; }
      }
    }
  }
  return sum / 2;
};

module.exports = PhaseManager;

},{}],5:[function(require,module,exports){
var ResourceManager = function(game) {
  this.game = game;
};

ResourceManager.prototype.areResourcesAvailable = function(playerID, purchase_type) {
  var resources_available = this.playerHasEnoughResourceCards(playerID, purchase_type);
  if(resources_available !== true) { return resources_available; }
  if(purchase_type === 'development_card') { return this.developmentCardsAvailable(); }
  return this.playerHasEnoughTokens(playerID, purchase_type);
};

ResourceManager.prototype.playerHasEnoughResourceCards = function(playerID, purchase_type) {
  if(this.game.boardSetupPhase) { return true; }
  var player = this.game.players[playerID];

  var purchase_price = this.costMap[purchase_type];
  var error_prefix = 'Not enough resources to build a ';
  if(purchase_type === 'development_card') { error_prefix = 'Not enough resources to buy a '; }

  for(var key in purchase_price) {
    if(player.resources[key] < purchase_price[key]) { return { err: error_prefix + purchase_type + '!' } }
  }
  return true;
};

ResourceManager.prototype.costMap = {
  settlement: { lumber: 1, brick: 1, wool: 1, grain: 1 },
  city: { ore: 3, grain: 2 },
  road: { brick: 1, lumber: 1 },
  development_card: { grain: 1, ore: 1, wool: 1 }
};

ResourceManager.prototype.playerHasEnoughTokens = function(playerID, purchase_type) {
  var player = this.game.players[playerID];
  return player.constructionPool[purchase_type] > 0;
};

ResourceManager.prototype.developmentCardsAvailable = function() {
  cards_available = this.game.development_card_deck.length > 0;
  return cards_available || { err: 'All development cards have been purchased!' }
};

ResourceManager.prototype.chargeForPurchase = function(playerId, purchase_type) {
  if(this.game.boardSetupPhase) { return null; }
  var cost = this.costMap[purchase_type];
  for(var resource in cost) {
    this.game.players[playerID].resources[resource] -= cost[resources];
  }
};

module.exports = ResourceManager;

},{}],6:[function(require,module,exports){
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

},{"./board_navigator":2}],7:[function(require,module,exports){
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

  if(!vertex) { this.setError('This vertex does not exist!'); return false; }
  if (owner !== null && owner !== this.player.playerID) { this.setError('Another player owns a ' + vertex.property_type + ' at this location!'); return false; }
  if(this.isAdjacentVertexOwned()) { this.setError('Cannot build next to another settlement or city!'); return false; }
  if(!this.board_setup_phase && !this.playerOwnsAdjacentRoad()) { this.setError('You must build a road to this location before you can build on it.'); return false; }
  if(owner === this.player.playerID) {
      switch(current_property_type) {
        case 'city':
           this.setError('You already own a city at this location!');
           return false;
        case 'settlement':
          if(this.board_setup_phase) { this.setError('Must build on an unoccupied location during the board setup phase!'); return false; }
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

VertexBuilder.prototype.setError = function(error_string) {
  this.error = { err: error_string };
};

module.exports = VertexBuilder;

},{"./board_navigator":2}],8:[function(require,module,exports){
var BoardInitializer = require('../../classes/board_initializer');

var Board = function(game, board, small_num, large_num) {
  this.game = game;
  if(!board) {
    var new_board = new BoardInitializer(small_num, large_num);
    this.tiles = new_board.tiles;
    this.vertices = new_board.vertices;
  } else {
    this.tiles = board.tiles;
    this.vertices = board.vertices;
    for(var key in board){
      if(key !== 'tiles' && board !== 'vertices'){
        this[key] = board[key];
      }
    }
  }
};

Board.prototype.getDevelopmentCard = function(player) {
  var deck = {
    size: 25,
    choiceCeiling: [14,19,21,23,25]
  };
  if (this.game.players.length > 4) {
    deck.choiceCeiling = [19,24,26,28,30];
    deck.size = 30;
  }
  var cardChoice = Math.floor((Math.random() * deck.size)) + 1;
  switch (true){
    case (cardChoice <= deck.choiceCeiling[0]):
      player.devCards.knight++;
      break;
    case (cardChoice > deck.choiceCeiling[0] && cardChoice <= deck.choiceCeiling[1]):
      player.devCards.point++;
      break;
    case (cardChoice > deck.choiceCeiling[1] && cardChoice <= deck.choiceCeiling[2]):
      player.devCards.monopoly++;
      break;
    case (cardChoice > deck.choiceCeiling[2] && cardChoice <= deck.choiceCeiling[3]):
      player.devCards.plenty++;
      break;
    case (cardChoice > deck.choiceCeiling[3] && cardChoice <= deck.choiceCeiling[4]):
      player.devCards.roadBuilding++;
      break;
    default:
      throw new Error ('Something weird happened in the deck: Error on this draw - ' + cardChoice);
  }
  currentGameData.child('players').set(JSON.stringify(game.players));
};

Board.prototype.moveRobber = function(destination, origin) {
  if(!origin) {
    for(var row=0, num_rows=this.tiles.length; row<num_rows; row++){
      for(var col=0, num_cols=this.tiles[row].length; col<num_cols; col++){
        if(this.tiles[row][col].robber===true){
          origin = [row, col];
        }
      }
    }
  }

  var old_row = origin[0], old_col=origin[1];
  var new_row = destination[0], new_col=destination[1];
  if(old_row===new_row && old_col===new_col){
    return { err: "You must move the Robber to another tile!" };
  }
  else if(this.tiles[new_row][new_col].robber === true) {
    return { err: "Another robber already occupies that tile!" };
  } else {
    this.tiles[old_row][old_col].robber=false;
    this.tiles[new_row][new_col].robber=true;
    this.game.robberMoveLockdown = false;
    return { destination: destination, origin: origin };
  }
};

module.exports = Board;

},{"../../classes/board_initializer":1}],9:[function(require,module,exports){
var Board = require('./board-engine');
var Player = require('./player-engine');
var BoardInitializer = require('../../classes/board_initializer');
var PhaseManager = require('../../classes/phase_manager');
var RoadBuilder = require('../../classes/road_builder');
var VertexBuilder = require('../../classes/vertex_builder');
var ResourceManager = require('../../classes/resource_manager');

var GameEngine = function(game, small_num, large_num) {
  this.players = [];

  // If a game object is not passed in, create a new game (Mongo schema will add properties with default values)
  if(!game){
    this.board = new BoardInitializer(small_num, large_num);

  // Otherwise, populate this GameEngine object with the properties of game
  } else {
    for(var key in game){
      if(key !== 'board' && key !== 'players') {
        this[key] = game[key];
      }
    }
    this.board = new Board(this, game.board);
    for(var i=0, len=game.players.length; i<len; i++){
      this.players.push(new Player(game.players[i]));
    }
  }
};

/*************************************************
FUNCTIONS THAT ARE ONLY NEEDED ON THE BACKEND ENGINE
*************************************************/

GameEngine.prototype.rollDice = function(playerID) {
  var phase_manager = new PhaseManager(this, this.players[playerID]);
  var isPlayerTurn = phase_manager.playerActionValid('roll');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  var sumDice = Math.ceil(Math.random() * 6) + Math.ceil(Math.random() * 6);
  this.diceNumber = sumDice;
  this.diceRolled = true;

  if(sumDice!==7) {
    this.distributeResources(sumDice);
  } else {
    // Any players with more than 7 cards must discard half of their hand, player must move the robber and pick a card from an adjacent player
    // No other actions can take place until all three of these actions have occurred
    this.robberMoveLockdown = true;
    this.robResourceCards();
  }
  return sumDice;
};

// Discards half the hand of any player with more than 7 cards
GameEngine.prototype.robResourceCards = function() {
  for(var i=0, len=this.players.length; i<len; i++) {
    if(this.players[i].resourceTotal>7) {
      var numTotalResources = this.players[i].resourceTotal;
      var numToRob = Math.floor(numTotalResources/2);
      this.players[i].resourceTotal-= numToRob;

      // Randomly select resource cards and remove them from player's hand
      while(numToRob--){
        var robIndex = Math.ceil(Math.random() * numTotalResources);
        var sum=0;
        for(var resource in this.players[i].resources) {
          sum+=this.players[i].resources[resource];
          if(sum>=robIndex) {
            this.players[i].resources[resource]--;
            numTotalResources--;
            break;
          }
        }
      }

    }
  }
};

GameEngine.prototype.distributeResources = function(sumDice) {
  var vertices = this.board.vertices;
  var players = this.players;

  var resourceArray = [];
  var boardSnapShot = {};

  // loop through the board vertices
  for (var row = 0, num_rows = vertices.length; row < num_rows; row++) {
    for (var col = 0, num_cols = vertices[row].length; col<num_cols; col++) {
      if (vertices[row][col].owner !== null) {
        var resourcesToDistribute = 1;
        // check adjacent tiles if they contain a settlement or a city
        if (vertices[row][col].settlementOrCity === 'city'){
          resourcesToDistribute++;
        }

        // build an array of resources that need to be distributed
        vertices[row][col].adjacent_tiles.forEach(function (item) {
          if (item.chit === sumDice) {
            resourceArray.push({resourceCount: resourcesToDistribute, resource: item.resource, player: vertices[row][col].owner});
          }
        });
      }
    }
  }

  resourceArray.forEach(function(item){
    var resources = players[+item.player].resources;
    resources[item.resource] = resources[item.resource] + resourcesToDistribute;
  })
};

GameEngine.prototype.tradeResources = function(firstPlayer, firstResource, secondPlayer, secondResource) {
  console.log("Need to refactor code in GameEngine.prototype.tradeResources!");
  // var playerOne = game.players[firstPlayer];
  // var playerTwo = game.players[secondPlayer];
  // for (var resource in firstResource) {
  //   playerOne.resources[resource] = playerOne.resources[resource] - firstResource[resource];
  //   playerTwo.resources[resource] = playerTwo.resources[resource] + firstResource[resource];
  // }
  // for (var resource in secondResource) {
  //   playerOne.resources[resource] = playerOne.resources[resource] + secondResource[resource];
  //   playerTwo.resources[resource] = playerTwo.resources[resource] - secondResource[resource];
  // }
  // currentGameData.child('players').set(JSON.stringify(game.players));
};

GameEngine.prototype.addPlayer = function() {
  if (this.areAllPlayersAdded === false) {
    var id = this.players.length;
    if (id > 5) {
        return {err: "Sorry, no more than 6 players!"};
    }
    this.players.push(new Player(id));
    return {'players': JSON.stringify(this.players)};
  }
  else if (this.areAllPlayersAdded === true) {
      return {err: "Game is already started!"};
  }
};

GameEngine.prototype.validatePlayerCount = function() {
  this.areAllPlayersAdded = true;
  return "All players have been added!"
};

GameEngine.prototype.shuffle = function(array){
  for (var i = array.length - 1; i > 0; i--) {
     var j = Math.floor(Math.random() * (i + 1));
     var temp = array[i];
     array[i] = array[j];
     array[j] = temp;
  }
  return array;
};

GameEngine.prototype.buyDevelopmentCard = function(player) {
  if (player.resources.wool < 1 || player.resources.grain < 1 || player.resources.ore < 1) {
    throw new Error ('Not enough resources to purchase a development card!')
  }
  else {
    player.resources.wool--;
    player.resources.grain--;
    player.resources.ore--;
    this.board.getDevelopmentCard(player);
  }
};

/*************************************************
FUNCTIONS THAT SHOULD BE INCLUDED ON THE FRONT END ENGINE
*************************************************/

// Runs when player tries to pass the turn to the next player
GameEngine.prototype.advancePlayerTurn = function(playerID) {
  var phase_manager = new PhaseManager(this, this.players[playerID]);
  var isPlayerTurn = phase_manager.playerActionValid('advanceTurn');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  this.turn++;
  if(this.turn >= this.players.length * 2) { this.boardSetupPhase = false; }
  this.diceRolled = false;
  this.calculatePlayerTurn();
  return this.currentPlayer;
}

GameEngine.prototype.calculatePlayerTurn = function() {
 var currentTurn = this.turn, playerLength = this.players.length;

 if (this.turn <= playerLength - 1) {
   //go in order eg, 0, 1, 2
   // turn 0, 1, 2
   this.currentPlayer = this.turn;

 }

 else if (this.turn >= playerLength && this.turn <= (playerLength * 2) - 1) {
   if (this.turn === playerLength) {
     // turn 3, 4, 5
     // start at the last player eg, 2
     this.currentPlayer = this.turn - 1;
   }
   else {
     // then go backwards, eg 1, 0
     this.currentPlayer--;
   }
 }

 else if (this.turn >= (playerLength * 2)) {
   this.boardIsSetUp = true;
   this.currentPlayer = currentTurn % playerLength;
 }
};

GameEngine.prototype.buildVertex = function(playerID, location) {
  var phase_manager = new PhaseManager(this, this.players[playerID]);
  var isPlayerTurn = phase_manager.playerActionValid('buildVertex');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  var vertex_builder = new VertexBuilder(this.vertices, this.players[playerID], location, this.boardSetupPhase);
  if(!!vertex_builder.error) { return vertex_builder.error; }
  var resource_manager = new ResourceManager(this);
  var resources_available = resource_manager.areResourcesAvailable(playerID, vertex_builder.property_type_to_build);
  if(resources_available !== true) { return resources_available; }
  var build_data = vertex_builder.build();
  if(build_data.hasOwnProperty('err')) { return return_data; }
  resource_manager.chargeForPurchase(vertex_builder.property_type_to_build);
  return build_data;
};

GameEngine.prototype.buildRoad = function(playerID, location, direction) {
  var phase_manager = new PhaseManager(this, this.players[playerID]);
  var isPlayerTurn = phase_manager.playerActionValid('buildRoad');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  var resource_manager = new ResourceManager(this);
  var resources_available = resource_manager.areResourcesAvailable(playerID, 'road');
  if(resources_available !== true) { return resources_available; }

  var road_builder = new RoadBuilder(this.vertices, this.players[playerID], this.boardSetupPhase);
  return road_builder(location, direction);
};

GameEngine.prototype.moveRobber = function(playerID, destination, origin) {
  var phase_manager = new PhaseManager(this, this.players[playerID]);
  var isPlayerTurn = phase_manager.playerActionValid('moveRobber');
  if(isPlayerTurn !== true) { return isPlayerTurn; }

  return this.board.moveRobber(destination, origin);
};

module.exports = GameEngine;

},{"../../classes/board_initializer":1,"../../classes/phase_manager":4,"../../classes/resource_manager":5,"../../classes/road_builder":6,"../../classes/vertex_builder":7,"./board-engine":8,"./player-engine":10}],10:[function(require,module,exports){
function Player(player, userInfo, id) {
    if(!!player){
        for(var key in player){
            this[key] = player[key];
        }
    } else {
        this.userRef = userInfo._id;
        this.playerID = id;
        this.playerName = userInfo.name;
        this.displayName = this.playerName.split(" ")[0];
    //     this.resources = {
    //         wool: 0,
    //         grain: 0,
    //         brick: 0,
    //         ore: 0,
    //         lumber: 0,
    //     };
    //     this.constructionPool = {
    //         cities: 4,
    //         settlements: 5,
    //         roads: 15
    //     };
    //     this.devCards = {
    //         knight: 0,
    //         point: 0,
    //         monopoly: 0,
    //         plenty: 0,
    //         roadBuilding: 0
    //     };
    //     this.playerQualities = {
    //         settlements: 0,
    //         cities: 0,
    //         roadSegments: 0,
    //         continuousRoadSegments: 0,
    //         knightsPlayed: 0,
    //         privatePoints: 0
    //     };
    //     this.tradingCosts = {
    //         wool: 4,
    //         grain: 4,
    //         brick: 4,
    //         ore: 4,
    //         lumber: 4
    //     };
    //     this.ownedProperties = {
    //         settlements: [],
    //         cities: [],
    //         roads: [],
    //     };
    //     this.rulesValidatedBuildableVertices = [];
    //     this.hasLongestRoad = false;
    //     this.hasLargestArmy = false;
    }
};

Player.prototype.gatherResources = function() {
    var numberOfResourceCards = 0;

    for (var resource in this.player.resources) {
        if (this.player.resources.hasOwnProperty(resource)){
           numberOfResourceCards += resource;
        }
    }

    return numberOfResourceCards;
};

module.exports = Player;

},{}],11:[function(require,module,exports){
exports.shuffle = function(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
},{}]},{},[3]);
