var BoardInitializer = function(small_num, large_num) {
  return {
    boardVertices: this.createVertices(small_num, large_num)
  };
};

BoardInitializer.prototype.createVertices = function(small_num, large_num) {
  if(small_num >= large_num) { throw 'Cannot create vertices when large_num (' + large_num + ') is <= small_num (' + small_num + ')'; }
  var iterator = 1, current_row_size = small_num, board = [];

  while(current_row_size >= small_num) {
    board.push(this.createRow(current_row_size));
    if(current_row_size !== small_num) { board.push(this.createRow(current_row_size)); }
    if(current_row_size > large_num) { iterator = -1; }
    current_row_size += iterator;
  }
  return board;
};

BoardInitializer.prototype.createRow = function(num_elements) {
  var row = [];
  for(var i=0; i<num_elements;i++) {
    row.push({
      connections: {
        vertical: null,
        left: null,
        right: null
      },
      adjacent_tiles: [],
      owner: null,
      hasSettlementOrCity: null,
      land: true,
      port: null
    });
  }
  return row;
};

BoardInitializer.prototype.createResources = function(small_num, large_num) {
  var num_tiles = large_num;
  for(var i=large_num-1;i>=small_num;i--){
    num_tiles+= (i*2);
  }
  var num_extra_deserts= Math.round(num_tiles/15)-1;
  if(num_extra_deserts<0){
    num_extra_deserts=0;
  }

  var numberChit_bank = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];
  var numberChits = [];
  i=0;
  while(numberChits.length+num_extra_deserts+1 < num_tiles){
    numberChits.push(numberChit_bank[i%18]);
    i++;
  }

  // There is one less of ore and brick than the other resources
  var resources = ['grain', 'lumber', 'wool'];
  while(num_extra_deserts--){
    resources.push('desert');
  }

  var resource_bank = this.game.shuffle(['grain', 'lumber', 'wool', 'brick', 'ore'])
  i=0;

  resources.unshift("desert");
  while(resources.length < num_tiles){
    resources.push(resource_bank[i%5]);
    i++;
  }
  numberChits = numberChits.reverse();
  resources = this.game.shuffle(resources);
  var tempHexArray = [];
  var desertRandomizer = Math.ceil((Math.random() * num_tiles));

  // Inserted first desert manually
  // Using modulus to insert each tile by index and loop back to zero index to fill in tiles that come before the desert
  for (i = desertRandomizer; i<(desertRandomizer+num_tiles); i++) {
    var this_resource = resources.pop();
    if(this_resource==='desert'){
      var this_chit = 7;
      var robber = true;
    }
    else {
      this_chit = numberChits.pop();
      robber = false;
    }
    tempHexArray[i%num_tiles] = {
      hex: i%num_tiles +1,
      resource: this_resource,
      chit: this_chit,
      robber: robber
    };
  }

  // Restructure array of tiles into a multi-dimensional array with same dimensions as the board rendering
  var increment = 1;
  var used_tiles=0;
  this.boardTiles=[];
  for(var i=small_num;i>=small_num;i+=increment){
    this.boardTiles.push(tempHexArray.slice(used_tiles, used_tiles+i));
    used_tiles+=i;
    if(i===large_num){
      increment= -1;
    }
  }
};

BoardInitializer.prototype.setVerticesOnTile = function(){
  var num_rows = this.boardTiles.length;
  var num_vertex_rows = this.boardVertices.length;

  for(var row=0; row<num_rows; row++){
    for(var col=0, num_cols=this.boardTiles[row].length; col<num_cols; col++){
      var vertex_row = row*2;
      var current_tile = this.boardTiles[row][col];

      // Add resource tile to vertices on the second and third rows of the tile
      for(var i=1;i<=2;i++){
        this.boardVertices[vertex_row+i][col].adjacent_tiles.push(current_tile);
        this.boardVertices[vertex_row+i][col+1].adjacent_tiles.push(current_tile);
      }

      // Adjust column of top vertex of tile depending on whether the vertex is in the top or bottom half of board
      if(vertex_row<(num_vertex_rows/2)){
        var top_col_adjusted = col;
      } else {
        top_col_adjusted = col + 1;
      }

      // Adjust column of bottom vertex of tile depending on whether the vertex is in the top or bottom half of board
      if(vertex_row+3<(num_vertex_rows/2)){
        var bottom_col_adjusted = col + 1;
      } else {
        bottom_col_adjusted = col;
      }

      // Add resource tile to top and bottom vertices of the tile
      this.boardVertices[vertex_row][top_col_adjusted].adjacent_tiles.unshift(current_tile);
      this.boardVertices[vertex_row+3][bottom_col_adjusted].adjacent_tiles.push(current_tile);
    }
  }
};

BoardInitializer.prototype.portCreation = function() {
  var num_sides = (this.boardVertices.length -1 + ((this.boardVertices[0].length-1)*2)) * 2;
  var num_spaces = Math.round(2*num_sides/3);
  var num_ports = num_sides - num_spaces;
  var two_space_intervals = 0;
  var three_space_intervals = 0;
  var space_interval_sum=0;

  // Number of tile sides between ports can either be 2 or three
  // Based on the size of the board,calculate exactly how many 2 and 3-interval gaps there are so that it circles the board once
  // while maintaining as close as possible to a 2:1 ratio of 2:3 side gaps
  while(space_interval_sum<num_spaces){
    two_space_intervals+=2;
    three_space_intervals++;
    space_interval_sum = (two_space_intervals*2)+(three_space_intervals*3);
  }
  var space_interval_diff = space_interval_sum-num_spaces - 1;
  switch(space_interval_diff){
    case 1:
      two_space_intervals++;
      three_space_intervals--;
      break;
    case 2:
      two_space_intervals--;
      break;
    case 3:
      three_space_intervals--;
      break;
    case 4:
      two_space_intervals-=2;
      break;
    case 5:
      two_space_intervals--;
      three_space_intervals--;
      break;
    case 6:
      three_space_intervals-=2;
      break;
  }

  // Creates an array of ports to be placed
  // Even number of general ports and specific ports, and roughly even number of ports for each resource
  var resource_ports = ['lumber', 'grain', 'wool', 'brick', 'ore'];
  var all_ports = [];
  var i=0;
  var len = resource_ports.length;
  for(var count=1;count<=num_ports; count++){
    if(count%2===1){
      all_ports.push(resource_ports[i%len])
      i++;
    } else {
      all_ports.push('general');
    }
  }

  var all_intervals = [];

  var frequency = Math.floor(num_ports/three_space_intervals);

  // Creates an array with the order of 2 and 3 interval gaps
  // This way, the 3 interval gaps aren't all grouped on one side of the board
  // NOTE: Intervals of 2 and 3 spaces skip 1 and 2 ports respectively
  for(i=1;i<=num_ports;i++){
    if(i%frequency===0 && three_space_intervals!==0){
      all_intervals.push(2);
      three_space_intervals--;
    } else {
      all_intervals.push(1);
    }
  }


  // Create an array with references to all outer vertex objects to facilitate port assignment
  var vertex = [1, 0];
  var border_vertices = [];

  while(vertex!==null){
    border_vertices.push(vertex);
    vertex = this.getRoadDestination(vertex, "right");
  }

  var left_side = [];
  for(var row=2, num_rows=this.boardVertices.length; row<=this.boardVertices.length-3; row++){
    border_vertices.push([row, this.boardVertices[row].length-1]);
    left_side.push([row, 0]);
  }

  left_side = left_side.reverse();

  vertex = [num_rows-2, this.boardVertices[num_rows-2].length-1];

  while(vertex!==null){
    border_vertices.push(vertex);
    vertex = this.getRoadDestination(vertex, "left");
  }

  border_vertices = border_vertices.concat(left_side);

  // Since port was built on first vertex in array, don't need last vertex
  border_vertices.pop();

  // Don't need to iterate through last interval, since it just leads back to first vertex
  all_intervals.pop();

  // Ports beng assigned to vertices
  // At the beginning of each loop, i is at a buildable vertex
  // Assigns ports on that vertex and the next one before looping through next interval
  for(i=0, len=border_vertices.length; i<len;i++) {
    var this_port = all_ports.pop();
    var row=border_vertices[i][0];
    var col = border_vertices[i][1];
    this.boardVertices[row][col].port = this_port;
    i++;
    if(i<len){
      var row=border_vertices[i][0];
      var col = border_vertices[i][1];
      this.boardVertices[row][col].port = this_port;
    }

    // Fast-forwards to next port-buildable vertex, using the array of 2 & 3 gap interval values
    while(all_intervals[0]>0){
      i++;
      all_intervals[0]--;
    }
    all_intervals.shift();
  }
};

exports.BoardInitializer = BoardInitializer;