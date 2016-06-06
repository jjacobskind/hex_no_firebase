var SceneInitializer = function(renderer) {
  this.renderer = renderer;
  this.scene = new THREE.Scene();
  this.camera = this.initializeCamera();
  this.controls = this.initializeControls();
  this.light = this.initializeLight();
  this.scene.add(this.light);
  this.water = this.initializeWater();
  this.scene.add(this.water);
};

SceneInitializer.prototype.initializeCamera = function() {
  if(this.camera) { return this.camera; }
  var canvas_width = this.renderer.domElement.width, canvas_height = this.renderer.domElement.height;
  var camera = new THREE.PerspectiveCamera( 45, canvas_width / canvas_height, 1, 700 );
  camera.position.set( 0, 200, -300 );
  return camera;
};

SceneInitializer.prototype.initializeControls = function() {
  var controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
  controls.noPan = true;
  controls.maxPolarAngle = Math.PI/2.5;
  controls.minDistance = 5;
  controls.maxDistance = 500;
  return controls;
};

SceneInitializer.prototype.initializeLight = function() {
  var light = new THREE.PointLight( 0xffffff );
  light.position.copy( this.camera.position );
  return light;
};

SceneInitializer.prototype.initializeWater = function() {
  var waterNormals = new THREE.ImageUtils.loadTexture( 'assets/images/waternormals.jpg' );
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

  water = new THREE.Water( this.renderer, this.camera, this.scene, {
    waterNormals: waterNormals,
    alpha:  0.8,
    sunDirection: this.light.position.clone().normalize(),
    sunColor: 0xffffff,
    waterColor: 0x3D50E0,
    distortionScale: 50.0,
  });

  var mirrorMesh = new THREE.Mesh(
    new THREE.PlaneBufferGeometry( 2400, 2400 ),
    water.material
  );

  mirrorMesh.rotation.x = - Math.PI * 0.5;
  return mirrorMesh;
};

SceneInitializer.prototype.initializeChipRotation = function() {

  this.controls.addEventListener('change', function() {
    var chips = this.scene.children.filter(function(item) {
      ['number_chip', 'port_chip'].indexOf(item.object.name) !== -1;
    });
    var camera_position = this.camera.position;
    var angle = Math.atan(camera_position.x / camera_position.z);
    if(camera_position.z > 0) { angle += Math.PI; }
    for(var i=0, len = chips.length; i < len; i++) {
      chips[i].rotation.set(Math.PI/2, Math.PI, angle);
    }
  });
};
