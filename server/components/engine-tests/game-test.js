var Engine = require('../engines/game-engine')
var game = new Engine(3, 6);

module.exports = game;


// for(var row=0, num_rows=game.board.vertices.length; row<num_rows; row++){
// 	for(var col=0, num_cols=game.board.vertices[row].length; col<num_cols; col++){
// 		console.log(row, col, game.board.vertices[row][col].adjacent_tiles.length);
// 	}
// }

// for(var row=0, num_rows=game.board.tiles.length; row<num_rows; row++){
	for(var col=0, num_cols=game.board.tiles[0].length; col<num_cols; col++){
		// console.log(col, game.board.vertices[0][col].port);

		// console.log(game.board.tiles[row][col]);
	}
	// console.log("------------");
	// console.log(game.board.vertices[row].length);
// }
		// console.log("----------------------------------");

for(var col=0, num_cols=game.board.tiles[1].length; col<num_cols; col++){
		// console.log(col, game.board.vertices[1][col].port);
		// console.log(game.board.tiles[row][col]);
	}
game.addPlayer();
game.addPlayer();
game.board.constructRoad(game.players[0],[0,1], 'left');
