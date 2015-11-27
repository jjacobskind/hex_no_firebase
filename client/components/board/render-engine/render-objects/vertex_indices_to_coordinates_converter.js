var VertexIndicesToCoordinatesConverter = function(vertices, side_length, bevel_size) {
  this.vertices = vertices;
  this.true_side_length = this.distanceToBevelledCorner(side_length, bevel_size);
  this.tile_width = this.calculateTileWidth();
};

VertexIndicesToCoordinatesConverter.prototype.convert = function(indices){
  var x_coord = this.calculateX(indices);
  var z_coord = this.calculateZ(indices);
	return { x: x_coord, z: z_coord };
};

VertexIndicesToCoordinatesConverter.prototype.calculateX = function(indices) {
  var row_length = this.vertices[indices.row].length;
  var center = row_length / 2;
  var offset = center - indices.col - 0.5;
  return offset * this.tile_width;
};

VertexIndicesToCoordinatesConverter.prototype.calculateZ = function(indices) {
  var offset = this.calculateZOffset(indices.row);
  return offset * this.true_side_length;
};

VertexIndicesToCoordinatesConverter.prototype.calculateTileWidth = function(side_length, bevel_size) {
  return this.true_side_length * Math.sin(Math.PI/3) * 2;
};

VertexIndicesToCoordinatesConverter.prototype.distanceToBevelledCorner = function(side_length, bevel_size) {
  var bevel_corner_thickness = Math.sqrt(Math.pow(bevel_size, 2) + Math.pow(bevel_size / 2, 2));
  return bevel_corner_thickness + side_length;
};

VertexIndicesToCoordinatesConverter.prototype.calculateZOffset = function(row_num) {
  // from z = 0, the distance to the nearest vertex row is 0.5 side length
  // after that, distance between vertex rows alternates between 0.5 and 1 (averaging 0.75/row)

  var center_row_index = this.vertices.length / 2;
  if(row_num < center_row_index) { center_row_index--; }
  var offset = 0.5;
  var row_gaps = [0.5, 1];
  var higher_row = Math.max(center_row_index, row_num);
  var lower_row = Math.min(center_row_index, row_num);
  for(var i = lower_row; i < higher_row; i++) {
    offset += row_gaps[i % row_gaps.length];
  }
  if(row_num < this.vertices.length / 2) { offset *= -1; }
  return offset;
};
