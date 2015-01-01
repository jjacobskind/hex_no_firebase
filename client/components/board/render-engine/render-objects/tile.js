var Tile = function(board, coordinates, resource, number) {
	this.board = board;
	this.tile = this.drawTile(coordinates, resource);
	if(resource!=="desert"){
		this.chit = this.drawChit(coordinates, number);
	}
};


Tile.prototype.drawTile = function(coordinates, resource) {
	var white_material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false } );
	var colored_material = new THREE.MeshLambertMaterial( { color: this.paintResource(resource), wireframe: false } );
	var texture = new THREE.ImageUtils.loadTexture('assets/images/tile_textures/' + resource + '.jpg');
	texture.repeat.x = 0.5/this.board.side_length;
	texture.repeat.y = 0.5/this.board.side_length;
	texture.offset.x = (this.board.side_length) * texture.repeat.x;
	texture.offset.y = (this.board.side_length) * texture.repeat.y;

	var textured_material = new THREE.MeshLambertMaterial( {map:texture});

	var materials = new THREE.MeshFaceMaterial([white_material, textured_material]);
	var tile = new THREE.Mesh( this.board.tile_geometry, materials );
	tile.position.set( coordinates[0], 0, coordinates[1] );
	tile.rotation.set(Math.PI/2, 0, Math.PI/6);
	return tile;
};

Tile.prototype.drawChit = function(coordinates, chit_number) {
	var white_material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false} );

	var texture = new THREE.ImageUtils.loadTexture( 'assets/images/' + chit_number + '.jpg' );
	texture.repeat.x = 3/this.board.side_length;
	texture.repeat.y = 3/this.board.side_length;
	texture.offset.x = (this.board.side_length/6) * texture.repeat.x;
	texture.offset.y = (this.board.side_length/6) * texture.repeat.y;

	var number_material = new THREE.MeshLambertMaterial({map: texture});
	var materials = [number_material, white_material];

	var chip_geometry = new THREE.ExtrudeGeometry(this.board.chip_shape, {amount:1, bevelEnabled:false});

	// Applies white_material to all faces other than those facing upwards
	for(var i=0; i<252; i++){
		if(i===62){
			i=124;
		}
		chip_geometry.faces[i].materialIndex = 1;
	}

	var num_chip = new THREE.Mesh(chip_geometry, new THREE.MeshFaceMaterial(materials));
	num_chip.position.set(coordinates[0], 0.5, coordinates[1]);
	num_chip.rotation.set(Math.PI/2, Math.PI, 0);
	return num_chip;
};

// Returns tile texture based on the resource passed into it
Tile.prototype.paintResource = function(resource){
	switch(resource){
		case "desert":
			return 'assets/images/tile_textures/desert.jpg';
		case "ore":
			return 'assets/images/tile_textures/ore.jpg';
		case "lumber":
			return 'assets/images/tile_textures/lumber.jpg';
		case "wool":
			return 'assets/images/tile_textures/lumber.jpg';
		case "brick":
			return 'assets/images/tile_textures/brick.jpg';
		case "grain":
			return 'assets/images/tile_textures/lumber.jpg';
	}
};