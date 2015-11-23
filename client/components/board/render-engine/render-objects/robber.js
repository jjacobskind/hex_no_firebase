var Robber = function(board, location) {
	this.board = board;
	if(!this.geometry) { this.generateGeometry(); }

	var material = new THREE.MeshLambertMaterial( { color: 0x111111 } );
	var robber = new THREE.Mesh( this.geometry, material );

	robber.rotation.set(Math.PI/-2,0,0);

	var coords = this.board.indicesToCoordinates(location);
	robber.position.set(coords.x,0,coords.z);
	return robber;
};

Robber.prototype.generateGeometry = function() {
	var points = [];
	var prev_width;
	var scale = this.board.scale;
	var side_length = this.board.side_length;
	var points_length = 35;

	for ( var i = 0; i < points_length; i++ ) {
		var scaled_i = i* scale;
		if(i<3){
			points.push(new THREE.Vector3( side_length/5, 0, scaled_i ) );
		}
		else if (i>=3 && i<=4){
			points.push(new THREE.Vector3( side_length/5 - (scale*(i-2)), 0, scaled_i ) );
		}
		else if (i>=5 && i<=20){
			points.push(new THREE.Vector3( side_length/5 + (scale*Math.sin((i-5)/10*Math.PI)), 0, scaled_i*1.2 ) );
		}
		else if (i>=21 && i<30){
			points.push(new THREE.Vector3( side_length/5 + (scale*Math.cos((i-21)/10*Math.PI)), 0, scaled_i*1.2 ) );
			prev_width = side_length/5 + (scale*Math.cos((i-21)/10*Math.PI));
		}
		else if(i>=31 && i<points_length){
			var percent = (i-30)/(points_length-30);
			points.push(new THREE.Vector3(prev_width-(prev_width*Math.sin(percent*Math.PI/2)), 0, scaled_i));
		}
	}
	points.push(new THREE.Vector3(0, 0, scaled_i));

	Robber.prototype.geometry = new THREE.LatheGeometry( points);

};
