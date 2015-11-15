var LongestRoadFinder = function(vertices) {
  this.vertices = vertices;
};

LongestRoadFinder.prototype.findLongestRoad = function() {
  var longest_roads = [];
  for(var row=0, num_rows=this.board.vertices.length; row<num_rows; row++){
    for(var col=0, num_cols=this.board.vertices[row].length; col<num_cols; col++){
      var road = this.board.followRoad([row, col]);
      if(longest_roads.length===0 || road.length > longest_roads[0].length){
        longest_roads=[road];
      }
      else if(longest_roads.length>0 && road.length===longest_roads[0].length) {
        // Need to do something here so that ties don't change possessor of points for longest road
        longest_roads.push(road);
      }
    }
  }

  // Return null if there aren't any roads yet
  if(longest_roads[0].length===0){
    return null;
  }

  // Remove redundant longest roads for each player
  // After this loop, 'owner' will store the owner of one of the longest roads, but will only be used if there is only one longest road
  var counted_players = [];
  for(var i=0, len=longest_roads.length; i<len;i++){
    var vertex1 = longest_roads[i][0];
    var vertex2 = longest_roads[i][1];
    for(var key in this.board.vertices[0][0].connections){
      var check_vert = this.board.getRoadDestination(vertex1, key);
      if(!!check_vert && check_vert[0]===vertex2[0] && check_vert[1]===vertex2[1]){
        var owner = this.board.vertices[vertex1[0]][vertex1[1]].connections[key];
        if(counted_players.indexOf(owner)===-1) {
          counted_players.push(owner);
        } else {
          longest_roads.splice(i, 1);
          i--;
          len--;
        }
      }
    }
  }

  var longest_road_length = longest_roads[0].length-1;   //number of roads is always one less than the number of vertices along it

  // Check if this is the first legitimate longest road of the game
  if(!this.longestRoad && longest_roads.length===1 && longest_road_length>=5) {
    this.longestRoad = {road_length: longest_road_length, owner: owner};
    this.players[owner].playerQualities.privatePoints+=2;
    this.players[owner].hasLongestRoad=true;
  }
  // Check if this longest road beats the current longest road and whether points need to be transferred
  else if(!!this.longestRoad && longest_roads.length===1 && longest_road_length>this.longestRoad.road_length) {
    if(owner!==this.longestRoad.owner){
      this.players[owner].playerQualities.privatePoints+=2;
      this.players[owner].hasLongestRoad=true;

      this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
      this.players[this.longestRoad.owner].hasLongestRoad = false;
    }
    this.longestRoad = {road_length: longest_road_length, owner: owner};
  }
  // check for when the longest road is split by a settlement so that there is no longer a valid longest road
  else if(!!this.longestRoad && this.longestRoad.length>longest_road_length && (longest_roads.length>1 || longest_road_length<5) ){
    this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
    this.players[this.longestRoad.owner].hasLongestRoad = false;
    this.longestRoad = null;
  }
  // check if there is a valid longest road after the longest road has been split by a settlement
  // WHEN THIS WORKS, COMBINE INTO SECOND CONDITIONAL ABOVE!!!
  else if(!!this.longestRoad && this.longestRoad.length>longest_road_length && longest_roads.length===1 && longest_road_length>=5 ){
    if(owner!==this.longestRoad.owner){
      this.players[owner].playerQualities.privatePoints+=2;
      this.players[owner].hasLongestRoad=true;

      this.players[this.longestRoad.owner].playerQualities.privatePoints-=2;
      this.players[this.longestRoad.owner].hasLongestRoad = false;
    }
    this.longestRoad = {road_length: longest_road_length, owner: owner};
  }
};

LongestRoadFinder.prototype.followRoad = function(vertex_indices, road, player) {
  var row = location.row, col = location.col;
  var vertex = this.vertices[row][col];
  var longest_road = [];

  // If this is the starting vertex
  if(!road) { var road=[]; }

  // If this vertex and previous vertex have been visited twice, return array that doesn't include the road between the two vertices
  if ((this.getNestedArrayIndex(road, road[road.length-1])!==road.length-1)  //Check if there is an earlier instance of the last road on the array
    && (this.getNestedArrayIndex(road, vertex_indices)!==-1)) {
      return road;
  // Prevent from double-backing on itself and adding an extra length to the longest road
  } else if(road.length > 1 && this.getNestedArrayIndex(road, vertex_indices) === road.length - 2){
    return road;
  // Return road if we hit a vertex owned by another player
  } else if(vertex.owner !== null && vertex.owner !== player){
    road.push(vertex_indices);
    return road;
  } else {
    road.push(vertex_indices);
    for(key in vertex.connections){
      if(vertex.connections[key] === player) {
        next_vertex = this.getRoadDestination(vertex_indices, String(key));
        if(!!next_vertex){
          temp_road = this.followRoad(next_vertex, road.slice(0), player);
          if(temp_road.length > longest_road.length) {
            longest_road = temp_road;
          }
        }
      }
    }
    return longest_road;
  }
};

// Finds the index of the first instance of a nested array in its parent array
  // ex: can use to find index of [1, 2] in array [ [0, 1], [3, 4], [1, 2]]
    // indexOf doesn't do this
LongestRoadFinder.prototype.getNestedArrayIndex = function(search_arr, find_arr) {
  for(var i=0, len=search_arr.length; i<len; i++) {
    var len2=find_arr.length;
    if(len2===search_arr[i].length){
      var match=true;
      for(var k=0; k<len2 && match; k++){
        if(search_arr[i][k]!==find_arr[k]) {
          match=false;
        }
      }
      if(match) {
        return i;
      }
    }
  }
  return -1;
};

module.exports = LongestRoadFinder;
