var Board = function(scene, game, scale) {
	this.scene = scene;

	// Board values
	this.vertices = game.board.vertices; 	//will be overwritten with with game rendering board vertices
	this.tiles = game.board.tiles;
	this.board_navigator = new BoardNavigator(this.vertices);
	this.robbers = [];
	this.small_num = game.board.tiles[0].length;
	this.big_num = game.board.tiles[Math.floor(game.board.tiles.length/2)].length;
	this.ports = [];	//Stored in array so that faces are always camera-facing

	// the size at which the board is rendered can be adjusted by changing this.scale
	// default value of this.scale is 1 (ex: setting this.scale to 2 will draw the board twice as large)
	if(!!scale && scale>10) {
		this.scale=10;
	}
	else if(!!scale && scale<0){
		this.scale = scale;
	} else {
		this.scale = 1;
	}

	// Values used by multiple objects
	this.side_length = 30 * this.scale;
	this.bevelSize = 4 * this.scale;

	// These functions draw the board and place objects on the board
	this.tiles = this.drawBoard(game.board.tiles);
	this.populateBoard(game.board.tiles);
};

Board.prototype.drawBoard = function(tiles) {
	var outer_middle_distance = Math.sqrt(Math.pow(this.side_length*4,2) - Math.pow(0.5*this.side_length*4, 2));
	var count =0;
	var board_tiles = [];
	for(var row=0, num_rows=tiles.length; row<num_rows;row++){
		var board_tile_row = [];

		for(var col=0, num_cols=tiles[row].length;col<num_cols; col++){
			var coordinates = this.indicesToCoordinates({ row: row, col: col });
			var obj=new Tile(this, coordinates, tiles[row][col].resource, tiles[row][col].chit);
			this.scene.add(obj.tile);
			if(!!obj.chit){
				this.scene.add(obj.chit);
			}
			board_tile_row.push(obj);
		}
		board_tiles.push(board_tile_row);
	}

	// DRAW PORTS

	// compile array of all outer vertices
	var outer_vertices = [];
	var cur_vertex = { row: 0, col: 0 };
	while(!!cur_vertex){
		outer_vertices.push(cur_vertex);
		cur_vertex = this.board_navigator.getRoadDestination(cur_vertex, 'right');
	}
	var left_vertices =[];
	num_rows = this.vertices.length;
	for(row=2;row<num_rows;row++){
		col = this.vertices[row].length-1;
		outer_vertices.push({ row: row, col: col });
		left_vertices.push({ row: row, col: 0 });
	}
	left_vertices.pop();
	left_vertices = left_vertices.reverse();
	cur_vertex = { row: --row, col: col };
	outer_vertices.pop();

	while(!!cur_vertex){
		outer_vertices.push(cur_vertex);
		cur_vertex = this.board_navigator.getRoadDestination(cur_vertex, 'left');
	}
	outer_vertices.pop();
	outer_vertices = outer_vertices.concat(left_vertices);
	outer_vertices.push( {row: 1, col: 0 });

	for(var i=0, len=outer_vertices.length; i<len; i++) {
		var row = outer_vertices[i].row, col = outer_vertices[i].col;
		if(i<len-1){
			var row_next = outer_vertices[i+1].row, col_next = outer_vertices[i+1].col;
		}
		if(!!this.vertices[row][col].port && (i===0 || i===len-1 || !!this.vertices[row_next][col_next].port)) {
			if(!this.vertices[row_next][col_next].port){
				this.drawPort(outer_vertices[i], undefined, this.vertices[row][col].port);
			} else {
				this.drawPort(outer_vertices[i], outer_vertices[++i], this.vertices[row][col].port);
			}
		}
	}
	return board_tiles;
};

Board.prototype.drawPort = function(location1, location2, resource){
	var side_length=this.side_length;
	if(!!location1 && !!location2){
		var coords1 = this.verticesToCoordinates(location1);
		var coords2 = this.verticesToCoordinates(location2);
	} else if(location1 !== { row: 1, col: 0 }) {
		coords1 = this.verticesToCoordinates({ row: 1, col: 0 });
		coords2 = this.verticesToCoordinates({ row: 0, col: 0 });
	}
	var x_avg = (coords1.x + coords2.x) / 2;
	var z_avg = (coords1.z + coords2.z) / 2;

	// add textures to ports
	var texture = new THREE.ImageUtils.loadTexture( 'assets/images/tile_textures/' + resource + '.jpg' );
	texture.flipY = true;
	texture.repeat.x = 2/this.side_length;
	texture.repeat.y = 2/this.side_length;
	texture.offset.x = (this.side_length/4) * texture.repeat.x;
	texture.offset.y = (this.side_length/4) * texture.repeat.y;
	var textured_material = new THREE.MeshLambertMaterial( { map:texture} );
	var white_material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false} );
	var materials = [textured_material, white_material];

	// Create chip shape for temporary port token
	var circlePts = [];
	var numCirclePts = 32
	for(i=0; i<numCirclePts*2; i++){
		var a = i/numCirclePts * Math.PI;
		circlePts.push(new THREE.Vector2(Math.cos(a)* this.side_length / 4, Math.sin(a)* this.side_length /4));
	}

	var chitShape = new THREE.Shape(circlePts);

	var port_geometry = new THREE.ExtrudeGeometry(chitShape, {amount:5, bevelEnabled:false});

	// Applies white_material to all faces other than those facing upwards
	if(resource === 'general') {
		for(var i=0; i<252; i++){
			if(i===62){
				i=124;
			}
			port_geometry.faces[i].materialIndex = 1;
		}
	}

	var port = new THREE.Mesh(port_geometry, new THREE.MeshFaceMaterial(materials));
	// if(coords1[0]===coords2[0]){
	// 	if(location1[1]===0){
	// 		x_avg+=side_length/2;
	// 	} else {
	// 		x_avg-=side_length/2;
	// 	}
	// } else {
	// 	var abs_max_x = Math.max(Math.abs(coords1[0]), Math.abs(coords2[0]));
	// 	var abs_min_x = Math.min(Math.abs(coords1[0]), Math.abs(coords2[0]));
	// 	if(coords1[0]<0){
	// 		abs_max_x*=-1;
	// 		abs_min_x*=-1;
	// 	}
	// 	x_avg = (abs_max_x + (abs_min_x*2))/3;

	// 	var abs_max_z = Math.max(Math.abs(coords1[1]), Math.abs(coords2[1]));
	// 	var abs_min_z = Math.min(Math.abs(coords1[1]), Math.abs(coords2[1]));
	// 	if(coords1[1]<0){
	// 		abs_max_z*=-1;
	// 		abs_min_z*=-1;
	// 	}
	// 	z_avg = ((abs_max_z*3) + abs_min_z)/4;
	// 	z_avg*=1.05
	// }
	port.position.set(x_avg, 1, z_avg);
	port.rotation.set(Math.PI/2, 0, 0);
	this.ports.push(port);
	this.scene.add(port);
};

Board.prototype.indicesToCoordinates = function(indices){
	var converter = new TileIndicesToCoordinatesConverter(this.tiles, this.side_length, this.bevelSize);
	return converter.convert(indices);
};

Board.prototype.verticesToCoordinates = function(indices) {
	converter = new VertexIndicesToCoordinatesConverter(this.vertices, this.side_length, this.bevelSize);
	return converter.convert(indices);
};

Board.prototype.buildRoad = function(playerID, location1, location2){
	var road = new Road(this, playerID, location1, location2);
	this.scene.add(road);
	return road;
};

//Draws roads and buildings on board for game in progress
Board.prototype.populateBoard = function(tiles) {
	var vertices=[];
	for(var row=0, num_rows=this.vertices.length; row < num_rows; row++) {
		var vertices_row=[];
		for(var col=0, num_cols=this.vertices[row].length; col < num_cols; col++){
			var obj = {};
			var property_type = this.vertices[row][col].property_type;
			var owner = this.vertices[row][col].owner
			if(!!property_type){
				obj.building = new Building(this, property_type, owner, { row: row, col: col });
				this.scene.add(obj.building.building);
			}
			for(var key in this.vertices[row][col].connections){
				if(this.vertices[row][col].connections[key] !== null){
					obj[key] = this.vertices[row][col].connections[key];
					var destination = this.board_navigator.getRoadDestination({ row: row, col: col }, key);
					if(!!destination && (row < destination.row || col < destination.col)){
						obj.connections = {};
						owner = this.vertices[row][col].connections[key];
						obj.connections[key] = this.buildRoad(owner, { row: row, col: col }, destination);
						this.scene.add(obj.connections[key]);
					}
				}
			}
			vertices_row.push(obj);
		}
		vertices.push(vertices_row);
	}
	this.vertices = vertices;
	for(row=0, num_rows=tiles.length;row<num_rows; row++){
		for(col=0, num_cols=tiles[row].length;col<num_cols;col++){
			if(!!tiles[row] && !!tiles[row][col] && tiles[row][col].robber === true){
				this.drawRobber({ row: row, col: col });
			}
		}
	}
};

// Returns color associated with this player
Board.prototype.playerColor = function(playerID){
	switch(playerID) {
		case 0:
			return 0xff0000;
		case 1:
			return 0x0000ff;
		case 2:
			return 0xffffff;
		case 3:
			return 0xf28100;
	}
};

Board.prototype.drawRobber = function(location){
	var robber = new Robber(this, location);
	this.scene.add(robber);

	// For expanded version where there are multiple robbers
	this.robbers.push(robber);

};

Board.prototype.getTile = function(coords, cb, indices1){
	var x=-coords[0], z=coords[1];
	var side_length = this.side_length + this.bevelSize;
	for(var row=0, num_rows=this.tiles.length; row<num_rows; row++){
		for(var col=0, num_cols=this.tiles[row].length; col<num_cols; col++){
			var tile_center = this.indicesToCoordinates({ row: row, col: col });
			var dist_from_tip = side_length - Math.abs(tile_center.z - z);
			if(dist_from_tip<side_length){		//Checking if z coordinate is within the highest/lowest tip of tile
				var dist_from_center = Math.abs(tile_center.x - x);

				// Set meximum x offset portion of tile can have from its center for a given vertical coordinate
				var horizontal_range = Math.tan(Math.PI/6) * dist_from_tip;

				// Limit horizontal range for the center "rectangle" portion of tile
				if(horizontal_range> side_length*Math.sin(Math.PI/6)) {
					horizontal_range = side_length*Math.sin(Math.PI/6);
				}

				if(dist_from_center < horizontal_range*2){
					return { row: row, col: col };
				}
			}
		}
	}
	return false;
};

Board.prototype.getVertex = function(coordinates) {
	var vertex_getter = new CoordinatesToVertexIndicesConverter(this.vertices, this.side_length, this.bevelSize, this.scale);
	return vertex_getter.convert(coordinates);
};

Board.prototype.getRoad = function(coordinates) {
	var road_getter = new CoordinatesToRoadIndicesConverter(this.vertices, this.side_length, this.bevelSize);
	return road_getter.convert(coordinates);
};

// Function to move the robber
// Refactor this later on to provide for multiple robbers,using a two-click process to select the correct robber and select the destination
Board.prototype.moveRobber = function(destination, origin){
	var destination_tile_center = this.indicesToCoordinates(destination);
	if(this.robbers.length===1){
		this.robbers[0].position.set(destination_tile_center.x, 0, destination_tile_center.z);
	} else {
		var origin_tile_center = this.indicesToCoordinates(origin);
		for(var i=0, len=this.robbers.length; i<len; i++) {
			if(this.robbers[i].position.x=== origin_tile_center.x && this.robbers[i].position.z=== origin_tile_center.z) {
				this.robbers[i].position.set(destination_tile_center.x, 0, destination_tile_center.z);
				return null;
			}
		}
	}
	return null;
};
