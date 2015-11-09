var Game = require('../engines/game-engine');

describe("Board class", function() {
	beforeEach(function(){
		small_num= 3;
		large_num= 5;
		game = new Game(small_num, large_num);
	});

	it("should create a board that corresponds to input dimensions", function(){
		var dimensions=[];
		var k=0;
		for(var i=0, len=game.board.tiles.length;i<len; i++){
			if(i<len/2){
				expect(game.board.tiles[i].length).toEqual(i+small_num);
			}
			else {
				k+=2;	//Needed since row lengths shrink after halfway point
				expect(game.board.tiles[i].length).toEqual(i+small_num-k);
			}
		}
		expect(game.board.tiles.length).toEqual((large_num-small_num)*2+1);
	});


	it("should list each tile first in the adjacent_tiles array on its top vertex", function(){
		for(var row=0, num_rows=game.board.tiles.length; row<num_rows;row++){
			for(var col=0, num_cols=game.board.tiles[row].length; col<num_cols; col++){
				if(row<num_rows/2){
					expect(game.board.vertices[row*2][col].adjacent_tiles[0]).toEqual(game.board.tiles[row][col]);
				}
				else {
					expect(game.board.vertices[row*2][col+1].adjacent_tiles[0]).toEqual(game.board.tiles[row][col]);
				}
			}
		}
	});

	it("should attribute resource tiles to adjacent vertices", function() {

		for(var count=0;count<=200;count++){

			var vertices = getTestVertices();
			var control_row = vertices[0];
			var control_col = vertices[1];
			var test_row = vertices[2];
			var test_col = vertices[3];
			expect(game.board.vertices[test_row][test_col].adjacent_tiles.indexOf(game.board.vertices[control_row][control_col].adjacent_tiles[0])).toNotEqual(-1);
		}
	});

	it("no vertex should have more than 3 or fewer than 1 adjacent tiles", function(){
		var all_good=true;
		for(var i=0; i<game.board.vertices.length && all_good;i++){
			for(var k=0; k<game.board.vertices[i].length && all_good; k++){
				var len = game.board.vertices[i][k].adjacent_tiles.length;
				if(len <1 || len>3){
					all_good=false;
				}
			}
		}
		expect(all_good).toBe(true);
	});

	it("getRoadDestination should provide a null value if there is water in the direction indicated", function(){
		var num_rows = game.board.vertices.length;
		var num_end_cols = game.board.vertices[0].length;
		for(var row=0; row<num_rows;row++){
			var col=game.board.vertices[row].length-1;
			if(row<num_rows/2 && row%2===1){
				expect(game.board.getRoadDestination([row,0], "left")).toBe(null);
			}
			else if(row>=num_rows/2 && row%2===0){
				expect(game.board.getRoadDestination([row,0], "left")).toBe(null);
			}
			if(row<num_rows/2 && row%2===1){
				expect(game.board.getRoadDestination([row,col], "right")).toBe(null);
			}
			else if(row>=num_rows/2 && row%2===0){
				expect(game.board.getRoadDestination([row,col], "right")).toBe(null);
			}
		}

		for(col=0;col<num_end_cols; col++){
			expect(game.board.getRoadDestination([0,col], "vertical")).toBe(null);
			expect(game.board.getRoadDestination([num_rows-1,col], "vertical")).toBe(null);
		}
	});

	it("getRoadDestination should return the adjacent vertex in the direction specified (standard sized board)", function(){
		game.addPlayer();

		// Test moving left/right/vertical from an even numbered column in top half of board
		game.board.placeSettlement(game.players[0], [3,1]);
		expect(game.board.getRoadDestination([2,1], "left").owner).toNotBe(null);
		removeSettlementOrCity(3,1);
		game.board.placeSettlement(game.players[0], [3,2]);
		expect(game.board.getRoadDestination([2,1], "right").owner).toNotBe(null);
		removeSettlementOrCity(3,2);
		game.board.placeSettlement(game.players[0], [1,1]);
		expect(game.board.getRoadDestination([2,1], "vertical").owner).toNotBe(null);
		removeSettlementOrCity(1,1);

		// Test moving left/right/vertical from an odd numbered column in top half of board
		game.board.placeSettlement(game.players[0], [2,0]);
		expect(game.board.getRoadDestination([3,1], "left").owner).toNotBe(null);
		removeSettlementOrCity(2,0);
		game.board.placeSettlement(game.players[0], [2,1]);
		expect(game.board.getRoadDestination([3,1], "right").owner).toNotBe(null);
		removeSettlementOrCity(2,1);
		game.board.placeSettlement(game.players[0], [4,1]);
		expect(game.board.getRoadDestination([3,1], "vertical").owner).toNotBe(null);
		removeSettlementOrCity(4,1);

		// Test moving left/right/vertical from an even numbered column in bottom half of board
		game.board.placeSettlement(game.players[0], [9,1]);
		expect(game.board.getRoadDestination([8, 2], "left").owner).toNotBe(null);
		removeSettlementOrCity(9,1);
		game.board.placeSettlement(game.players[0], [9,2]);
		expect(game.board.getRoadDestination([8, 2], "right").owner).toNotBe(null);
		removeSettlementOrCity(9,2);
		game.board.placeSettlement(game.players[0], [7,2]);
		expect(game.board.getRoadDestination([8, 2], "vertical").owner).toNotBe(null);
		removeSettlementOrCity(7,2);

		// Test moving left/right/vertical from an odd numbered column in bottom half of board
		game.board.placeSettlement(game.players[0], [8,2]);
		expect(game.board.getRoadDestination([9, 2], "left").owner).toNotBe(null);
		removeSettlementOrCity(8,2);
		game.board.placeSettlement(game.players[0], [8,3]);
		expect(game.board.getRoadDestination([9, 2], "right").owner).toNotBe(null);
		removeSettlementOrCity(8,3);
		game.board.placeSettlement(game.players[0], [10,2]);
		expect(game.board.getRoadDestination([9, 2], "vertical").owner).toNotBe(null);
		removeSettlementOrCity(10,2);



	});

	function removeSettlementOrCity(row, col) {
		game.board.vertices[row][col].owner=null;
	};

	function getTestVertices(){
		var num_rows= game.board.tiles.length;

		// Get a row from vertices array that contains the top vertices of tiles
			// (all even-numbered rows except the last two)
		var control_row = Math.floor(Math.random()*num_rows)*2;
		var num_vertex_rows = game.board.vertices.length;

		// Pick a random vertex in that row, as long as that vertex is the top of a resource tile
		if(control_row<num_vertex_rows/2){
			var control_col = Math.floor(Math.random()*game.board.vertices[control_row].length);
		} else {
			control_col = Math.ceil(Math.random()*(game.board.vertices[control_row].length-2));
		}

		// This tile spans three additional rows. Pick one of those rows
		var test_row = Math.ceil(Math.random()*3) + control_row;

		// If one of the two middle rows is picked, select one of the two vertices at random
		if(test_row-control_row<3){
			if(control_row<num_vertex_rows/2){
				var test_col = control_col + Math.round(Math.random());
			} else {
				test_col = control_col - Math.round(Math.random());
			}
		}
		else {
			if(control_row===(num_vertex_rows/2)-2){
				test_col = control_col;
			}
			else if(control_row<num_vertex_rows/2){
				test_col = control_col+1;
			} else {
				test_col = control_col-1;
			}
		}

		return [control_row, control_col, test_row, test_col];
	}
});
