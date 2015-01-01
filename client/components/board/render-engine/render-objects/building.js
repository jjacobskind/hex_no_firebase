var Building = function(board, building_type, owner, location){
	this.board = board;
	var coords = this.board.verticesToCoordinates(location);
	this.x = coords[0];
	this.z = coords[1];
	this.color = this.board.playerColor(owner);
	this.building = null;

	switch(building_type){
		case "settlement":
			this.settlementShape();
			break;
		case "city":	
			this.cityShape();
			break;
		default:
			throw ("Invalid building type!");
			break;
	}
};

Building.prototype.settlementShape = function() {
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
	var geometry = this.makeGeometry(shape);
	this.building = geometry;
};

Building.prototype.cityShape = function(){
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
	var geometry = this.makeGeometry(shape);
	this.building = geometry;
};

Building.prototype.makeGeometry = function(shape){
	var depth = this.board.building_depth;
	var building_geometry = new THREE.ExtrudeGeometry(shape, {amount:depth,
																bevelEnabled:false
																});

	var material = new THREE.MeshLambertMaterial( { color: this.color, wireframe: false } );

	var building = new THREE.Mesh(building_geometry, material);
	var rotation_angle = (Math.PI/6)*Math.floor(Math.random()*6);
	building.position.set( this.x, 0, this.z - (depth/2) );
	// building.rotation.set(0, rotation_angle, 0);
	return building;
};