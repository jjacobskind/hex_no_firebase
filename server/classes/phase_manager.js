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
  if (playerID! == game.currentPlayer) { return 'It is not currently your turn!' }
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
  if (game.boardSetupPhase && round_number) === num_player_vertices) { return 'You may only build one settlement per turn during the board setup phase!'; }
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
  return Math.ceil(this.game.turn / this.game.players.length;
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
