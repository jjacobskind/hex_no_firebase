var RendererInitializer = function(canvas_width, canvas_height) {
  this.canvas_id = 'board-canvas';
  this.renderer = new THREE.WebGLRenderer({ antialias: true });
  this.canvas_width = canvas_width;
  this.canvas_height = canvas_height;
  this.setAttributes();
  this.initMouseEvents();
};

RendererInitializer.prototype.setAttributes = function() {

  this.renderer.setClearColor(0xA1CEED);
  this.renderer.setSize(this.canvas_width, this.canvas_height);
  this.renderer.domElement.id = this.canvas_id;
};

RendererInitializer.prototype.initMouseEvents = function() {
  // Click event handler calculates the  x & z coordinates on the y=0 plane that correspond to where user clicked on canvas
  this.renderer.domElement.addEventListener('click', function(event) {
    var coordinate_calculator = new ClickCoordinateCalculator($('#' + this.canvas_id), event, camera, { width: this.canvas_width, height: this.canvas_height });
    var click_coordinates = coordinate_calculator.calculate();

    if(!!someAction){
      var success = someAction(click_coordinates);
      unset_someAction(success);
    }
  });

  this.renderer.domElement.addEventListener('mousedown', function(event){
    var coordinate_calculator = new ClickCoordinateCalculator($('#board-canvas'), event, camera, { width: this.canvas_width, height: this.canvas_height });
    var click_coordinates = coordinate_calculator.calculate();

    selected_robber = game_board.getObject(camera, click_coordinates, 'robber');
    if(!selected_robber) { return; }
    controls.noRotate = true;
  });

  this.renderer.domElement.addEventListener('mousemove', function(event) {
    if(!selected_robber) { return; }
    var coordinate_calculator = new ClickCoordinateCalculator($('#board-canvas'), event, camera, { width: this.canvas_width, height: this.canvas_height });
    var coordinates = coordinate_calculator.calculate();
    selected_robber.object.position.set(coordinates.x, 0, coordinates.z);
  });

  this.renderer.domElement.addEventListener('mouseup', function(event) {
    controls.noRotate = false;
    var coordinate_calculator = new ClickCoordinateCalculator($('#board-canvas'), event, camera, { width: this.canvas_width, height: this.canvas_height });
    var mouse_coordinates = coordinate_calculator.calculate();
    var selected_tile = game_board.getObject(camera, mouse_coordinates, 'tile');
    selected_robber.object.position.set(selected_tile.object.position.x, 0, selected_tile.object.position.z);
    selected_robber = null;
  });
};
