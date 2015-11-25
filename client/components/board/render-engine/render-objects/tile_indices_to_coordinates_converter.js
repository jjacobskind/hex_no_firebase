var TileIndicesToCoordinatesConverter = function(tiles, side_length, bevel_size) {
  this.tiles = tiles;
  this.true_side_length = this.distanceToBevelledCorner(side_length, bevel_size);
};

TileIndicesToCoordinatesConverter.prototype.convert = function(indices){
  var x_index = this.calculateX(indices);
  var z_index = this.calculateZ(indices);
	return { x: x_index, z: z_index };
};

TileIndicesToCoordinatesConverter.prototype.calculateX = function (indices) {
  var row_length = this.tiles[indices.row].length;
  var center_index = row_length / 2;
  var x_index_offset = center_index - indices.col - 0.5;
  return x_index_offset * this.tileWidth();
};

TileIndicesToCoordinatesConverter.prototype.calculateZ = function (indices) {
  var num_rows = this.tiles.length;
  var center_index = num_rows / 2;
  var z_index_offset = center_index - indices.row - 0.5; //Initial board render has -z axis closer to camera
  var z_spacing = this.true_side_length * 1.5;
  return z_index_offset * z_spacing;
};

TileIndicesToCoordinatesConverter.prototype.distanceToBevelledCorner = function(side_length, bevel_size) {
  var bevel_corner_thickness = Math.sqrt(Math.pow(bevel_size, 2) + Math.pow(bevel_size / 2, 2));
  return bevel_corner_thickness + side_length;
};

TileIndicesToCoordinatesConverter.prototype.tileWidth = function() {
  var half_width = Math.sqrt(Math.pow(this.true_side_length, 2) - Math.pow(this.true_side_length / 2, 2));
  return half_width * 2;
};
