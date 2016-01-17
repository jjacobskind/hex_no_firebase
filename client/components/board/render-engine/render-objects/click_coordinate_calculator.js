var ClickCoordinateCalculator = function($canvas, event, camera, canvas_size) {
  this.vector = this.getClickVector(event, camera, $canvas.offset(), canvas_size)
  this.camera = camera;
};

ClickCoordinateCalculator.prototype.calculate = function() {
  var dir = this.vector.sub( this.camera.position );
  var distance = this.getScalarDistance(dir);
  var pos = this.camera.position.clone().add( dir.multiplyScalar( distance ) );
  return { x: pos.x, z: pos.z };
};

ClickCoordinateCalculator.prototype.getClickVector = function(event, camera, canvas_position, canvas_size) {
  var vector = new THREE.Vector3();
  var x = this.percentFromCanvasCenter(event.clientX, canvas_position.left, canvas_size.width);
  var y = -this.percentFromCanvasCenter(event.clientY, canvas_position.top, canvas_size.height);

  vector.set(x, y, 0.1);
  vector.unproject( camera );
  return vector;
};

ClickCoordinateCalculator.prototype.percentFromCanvasCenter = function(click_coord, canvas_offset, canvas_size) {
  var canvas_coord = click_coord - canvas_offset;
  var mid_canvas = canvas_size / 2;
  return (canvas_coord - mid_canvas) / mid_canvas;
};

ClickCoordinateCalculator.prototype.getScalarDistance = function(dir) {
  var y_plane = 1;
  var distance = (-this.camera.position.y + y_plane) / dir.y;
  return distance;
};
