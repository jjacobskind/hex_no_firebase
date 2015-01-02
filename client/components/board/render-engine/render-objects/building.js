var Building = function(board, building_type, owner, location){
	this.board = board;
	this.building_depth = 15 * this.board.scale;
	var coords = this.board.verticesToCoordinates(location);
	this.x = coords[0];
	this.z = coords[1];
	this.color = this.board.playerColor(owner);
	this.building = null;

	switch(building_type){
		case "settlement":
			if(!this.settlementGeometry) { this.generateSettlementGeometry(); }
			this.building = this.settlementGeometry;
			break;
		case "city":	
			if(!this.cityGeometry) { this.generateCityGeometry(); }
			this.building = this.cityGeometry;
			break;
		default:
			throw ("Invalid building type!");
			break;
	}
};

Building.prototype.generateSettlementGeometry = function() {
	var scale = this.board.scale;
	var pts = [];
	pts.push(new THREE.Vector2(-5 * scale, 0));
	pts.push(new THREE.Vector2(5 * scale, 0));
	pts.push(new THREE.Vector2(5 * scale, 7 * scale));
	pts.push(new THREE.Vector2(8 * scale, 7 * scale));
	pts.push(new THREE.Vector2(0, 13 * scale));
	pts.push(new THREE.Vector2(-8 * scale, 7 * scale));
	pts.push(new THREE.Vector2(-5 * scale, 7 * scale));
	pts.push(new THREE.Vector2(-5 * scale, 0));

	var shape = new THREE.Shape(pts);

	Building.prototype.settlementGeometry = this.makeMesh(shape);
};

Building.prototype.cityGeometry = function(){
	var scale = this.board.scale;
	var pts = [];
	pts.push(new THREE.Vector2(-10 * scale, 0));
	pts.push(new THREE.Vector2(7 * scale, 0));
	pts.push(new THREE.Vector2(7 * scale, 9 * scale));
	pts.push(new THREE.Vector2(0, 9 * scale));
	pts.push(new THREE.Vector2(0, 15 * scale));
	pts.push(new THREE.Vector2(-5 * scale, 20 * scale));
	pts.push(new THREE.Vector2(-10 * scale, 15 * scale));
	pts.push(new THREE.Vector2(-10 * scale, 0));

	var shape = new THREE.Shape(pts);
	Building.prototype.cityGeometry = this.makeMesh(shape);
};

Building.prototype.makeMesh = function(shape){
	var depth = this.building_depth;
	var building_geometry = new THREE.ExtrudeGeometry(shape, {amount:depth,
																bevelEnabled:false
																});

	var material = new THREE.MeshLambertMaterial( { color: this.color, wireframe: false } );

	var mesh = new THREE.Mesh(building_geometry, material);
	// var rotation_angle = (Math.PI/6)*Math.floor(Math.random()*6);
	mesh.position.set( this.x, 0, this.z - (depth/2) );
	// mesh.rotation.set(0, rotation_angle, 0);
	return mesh;
};