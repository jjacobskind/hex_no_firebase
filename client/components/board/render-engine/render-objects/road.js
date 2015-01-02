var Road = function(board, playerID, location1, location2){
	this.board = board;
	
	// Get coordinates of the two vertices adjacent to the road
	var coords1 = this.board.verticesToCoordinates(location1);
	var coords2 = this.board.verticesToCoordinates(location2);
	
	this.edge = 5 * this.board.scale;
	this.depth = this.board.side_length*0.7;

	if(!this.geometry) { this.makeGeometry(); }
	this.mesh = new THREE.Mesh(this.geometry, new THREE.MeshLambertMaterial({color: this.board.playerColor(playerID), wireframe:false}));
	var angle = this.setRoadAngle(location1, location2, coords1, coords2);
	this.setRoadPosition(coords1, coords2, angle);
	return this.mesh;
};


// Generates the shape that will be used for all roads and places it on the prototype object
// This way it only needs to be generated once
Road.prototype.makeGeometry = function(){

	var pts = [new THREE.Vector2(0, 0)];
	pts.push(new THREE.Vector2(this.edge/2, 0));
	pts.push(new THREE.Vector2(this.edge/2, this.edge));
	pts.push(new THREE.Vector2(this.edge/-2, this.edge));
	pts.push(new THREE.Vector2(this.edge/-2, 0));
	pts.push(new THREE.Vector2(0, 0));

	var shape = new THREE.Shape(pts);
	Road.prototype.geometry = new THREE.ExtrudeGeometry(shape,{amount:this.depth, bevelEnabled:false});
	
};

Road.prototype.setRoadAngle = function(location1, location2, coords1, coords2) {
	if(coords1[0]<coords2[0]) {		//If road is going left
		if(location1[0] % 2 === 0){		//If row # is even
			var angle = Math.PI * 2 /3;
		} else {
			angle = Math.PI /3;
		}
	}
	else if(coords1[0]>coords2[0]) {	//If road is going right
		if(location1[0] % 2 === 0){
			angle = Math.PI /3;
		} else {
			angle = Math.PI * 2 /3;
		}
	} else {							//If road is vertical
		angle = 0;
	}
	this.mesh.rotation.set(0, angle, 0);
	return angle;
};

Road.prototype.setRoadPosition = function(coords1, coords2, angle){
	var x_avg = (coords1[0] + coords2[0])/2;
	var x_offset = (Math.sin(angle) * this.depth)/2;
	var z_avg = (coords1[1] + coords2[1])/2;
	var z_offset = Math.cos(angle) * this.depth/2;
	this.mesh.position.set(x_avg - x_offset,0,z_avg - z_offset);
};