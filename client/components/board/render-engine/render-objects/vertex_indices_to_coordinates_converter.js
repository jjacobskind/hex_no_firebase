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
  if(indices.row === 7 && indices.col == 3) { console.log(offset); }
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
  var center_row = this.vertices.length / 2;
  var row_gaps = [0.5, 1];
  var row_diff = row_num - center_row;
  var counter = Math.abs(row_diff) - 0.5;
  var offset = 0.5;
  for(var i = 0;i < counter ; i++) {
    offset += row_gaps[i % row_gaps.length];
  }
  if (row_diff > 0) { offset *= -1; }
  return offset;
};
