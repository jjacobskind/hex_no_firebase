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

module.exports = {
  Board: Board
};
