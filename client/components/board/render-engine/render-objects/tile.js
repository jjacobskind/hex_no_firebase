var Tile = function(board, coordinates, resource, number) {
	this.board = board;

	if(!this.chitGeometry) { this.generateChitGeometry(); }
	if(!this.tileGeometry) { this.generateTileGeometry(); }

	this.tile = this.drawTile(coordinates, resource);
	if(resource !== 'desert'){
		this.chit = this.drawChit(coordinates, number);
	}
};


Tile.prototype.drawTile = function(coordinates, resource) {
	var white_material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false } );
	var texture = new THREE.ImageUtils.loadTexture('assets/images/tile_textures/' + resource + '.jpg');
	texture.repeat.x = 0.5/this.board.side_length;
	texture.repeat.y = 0.5/this.board.side_length;
	texture.offset.x = (this.board.side_length) * texture.repeat.x;
	texture.offset.y = (this.board.side_length) * texture.repeat.y;

	var textured_material = new THREE.MeshLambertMaterial( {map:texture});

	var materials = new THREE.MeshFaceMaterial([white_material, textured_material]);
	var tile = new THREE.Mesh( this.tileGeometry, materials );
	tile.position.set( coordinates.x, 0, coordinates.z );
	tile.rotation.set(Math.PI/2, 0, Math.PI/6);
	return tile;
};

Tile.prototype.generateTileGeometry = function() {

	// Create shape for hex tile geometry
	var pts = [], numPts = 6;
	for ( var i = 0; i < numPts * 2; i+=2 ) {
		var a = i / numPts * Math.PI;
		pts.push( new THREE.Vector2 ( Math.cos( a ) * this.board.side_length, Math.sin( a ) * this.board.side_length ) );
	}
	var hexShape = new THREE.Shape( pts );

	// Set extrude settings to be applied to hex tile shape
	var extrudeSettings = {
		amount			: 5,
		steps			: 1,
		material		: 1,
		extrudeMaterial : 0,
		bevelEnabled	: true,
		bevelThickness  : this.board.scale,
		bevelSize       : 4 * this.board.scale,
		bevelSegments   : 1,
	};

	Tile.prototype.tileGeometry = new THREE.ExtrudeGeometry( hexShape, extrudeSettings );
};

Tile.prototype.drawChit = function(coordinates, chit_number) {
	var white_material = new THREE.MeshLambertMaterial( { color: 0xffffff, wireframe: false} );

	// Sizes and centers number texture on face of number chit
	var texture = new THREE.ImageUtils.loadTexture( 'assets/images/' + chit_number + '.jpg' );
	texture.repeat.x = 3/this.board.side_length;
	texture.repeat.y = 3/this.board.side_length;
	texture.offset.x = (this.board.side_length/6) * texture.repeat.x;
	texture.offset.y = (this.board.side_length/6) * texture.repeat.y;

	var number_material = new THREE.MeshLambertMaterial({map: texture});
	var materials = [number_material, white_material];

	var num_chip = new THREE.Mesh(this.chitGeometry, new THREE.MeshFaceMaterial(materials));
	num_chip.position.set(coordinates.x, 0.5*this.board.scale, coordinates.z);
	num_chip.rotation.set(Math.PI/2, Math.PI, 0);
	return num_chip;
};

// Create geometry for number chits
Tile.prototype.generateChitGeometry = function() {
	var circlePts = [];
	var numCirclePts = 32;
	for(i=0;i<numCirclePts*2;i++){
		var a = i/numCirclePts * Math.PI;
		circlePts.push(new THREE.Vector2(Math.cos(a)* this.board.side_length / 4, Math.sin(a)* this.board.side_length /4));
	}

	var chitShape = new THREE.Shape(circlePts);

	var chit_geometry = new THREE.ExtrudeGeometry(chitShape, {amount:this.board.scale, bevelEnabled:false});

	// Applies white_material to all faces other than those facing upwards
	// Without this, pieces of the number texture will appear on those faces
	for(var i=0; i<252; i++){
		if(i===62){
			i=124;
		}
		chit_geometry.faces[i].materialIndex = 1;
	}

	Tile.prototype.chitGeometry = chit_geometry
};
