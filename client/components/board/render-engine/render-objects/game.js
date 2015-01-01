var Game = function(scene, game, scale) {
	this.scene = scene;

	this.board = new Board(this, game.gameBoard.getRoadDestination, game.gameBoard.boardVertices, game.gameBoard.boardTiles, scale);

};