var GameBoard = function(game, small_num, large_num) {
    this.game = game; 
};

GameBoard.prototype.placeSettlement = function(player, location) {
    var vertices = this.boardVertices;
    //board initialization place settlement, get board tiles, and if the location does not have the property owner OR there is not a settlement within one vertex, allow them to build
    var row = location[0], col = location[1];
    if(!vertices[row][col]){
        return {err: "This vertex does not exist!"};
    }
    else if (vertices[row][col].owner !== null){
        return {err:"This location is owned already!"};
    };
    //check if there is a settlement within one tile
    var nearestThreeVertices = [];
    nearestThreeVertices.push(this.getRoadDestination(location, 'left'));
    nearestThreeVertices.push(this.getRoadDestination(location, 'vertical'));
    nearestThreeVertices.push(this.getRoadDestination(location, 'right'));
    while (nearestThreeVertices.length !== 0) {
        var thisVertex = nearestThreeVertices[0];
        if (!!thisVertex && vertices[thisVertex[0]][thisVertex[1]].owner !== null) {
            return {err: "Cannot build next to another settlement!"};
        }
        nearestThreeVertices.shift();
    };
    // place settlement within initial setup phase
    if ((vertices[row][col].owner === null && this.boardIsSetup === false) || 
        (vertices[row][col].owner === null && player.rulesValidatedBuildableVertices.indexOf(location) !== -1))
    {   
        vertices[row][col].owner = player.playerID;
        vertices[row][col].hasSettlementOrCity = 'settlement';
        player.constructionPool.settlements--;
        player.playerQualities.settlements++;
        //add one point to their score
        player.playerQualities.privatePoints++;
        player.ownedProperties.settlements.push({settlementID: location});
        //validate new buildable tiles?
        this.validateNewVertices(player, location);
        if (vertices[location[0]][location[1]].port !== null) {
            if (vertices[location[0]][location[1]].port === 'general') {
                for (var resource in player.tradingCosts) {
                    player.tradingCosts[resource] === 4 ? player.tradingCosts[resource] = 3 : player.tradingCosts[resource] = player.tradingCosts[resource];
                }
            }
            else {
                var resourceToModify = vertices[row][col].port;
                for (var resource in player.tradingCosts) {
                    resourceToModify === resource ? player.tradingCosts[resource] = 2 : player.tradingCosts[resource] = player.tradingCosts[resource];
                }
            }
        }
    }
    if (this.game.turn >= this.game.players.length * 2) {
      player.resources.wool--;
      player.resources.grain--;
      player.resources.lumber--;
      player.resources.brick--;
    }
    this.game.findLongestRoad();

    return {'type':'settlement', 'location':location};
};



GameBoard.prototype.upgradeSettlementToCity = function(player, location) {
    //TO DO
    //change score
    //resources - but this should be checked on a different module?
    var row = location[0], col = location[1];
    var vertices = this.boardVertices;
    if (vertices[row][col].owner === null){
        return {err: 'No settlement to upgrade at this vertex!'};
    };
    if (vertices[row][col].owner !== player.playerID){
        return {err: 'This isn\'t your settlement!'};
    };
    if (vertices[row][col].owner === player.playerID) {
        vertices[row][col].hasSettlementOrCity = 'city';
        player.ownedProperties.settlements.forEach(function(item, index){
            if (item.settlementID = location){
                player.ownedProperties.settlements.splice(index, 1);
            }
        });
        //switch settlement in city in player qualities
        player.playerQualities.settlements--;
        player.playerQualities.cities++;
        //remove city 'piece' from construction pool, add settlement piece
        player.constructionPool.settlements++;
        player.constructionPool.cities--;
        player.playerQualities.privatePoints++;
        player.ownedProperties.cities.push({settlementID: location});
        return { 'type': 'city', 'location': location
        };
    }

};

GameBoard.prototype.validateNewVertices = function(player, endpointLocation) {
    var endpointX = endpointLocation[0]; //[0,1]
    var endpointY = endpointLocation[1];
    var vertices = this.boardVertices;
    if (endpointX % 2 === 0) {
        //if x is an EVEN number, will build laterally to the left and right, one row up
        player.rulesValidatedBuildableVertices.push([endpointX+1, endpointY]);
        if (endpointY < vertices[endpointX].length) {
            //checking there is a 'right' to build to
         player.rulesValidatedBuildableVertices.push([endpointX+1, endpointY+1]);
        }
        if (endpointX !== 0) {
            //and if X is NOT 0, will build one row higher (ie, lower in x val)
          player.rulesValidatedBuildableVertices.push([endpointX-1, endpointY]);  
        }
    }
    if (endpointX % 2 !== 0) {
        if (endpointY > 0){
            //if y is greater than 0, build laterally to the left, one row down
            player.rulesValidatedBuildableVertices.push([endpointX-1, endpointY-1]);
        }
            //then build laterally to the right, one row down
        player.rulesValidatedBuildableVertices.push([endpointX-1, endpointY]);  
        if (endpointX !== 11) {
            //and if X is NOT 11, one row higher
          player.rulesValidatedBuildableVertices.push([endpointX+1, endpointY]);  
        }     
    }
    player.ownedProperties.settlements.forEach(function(item, index){
        for (var i = player.rulesValidatedBuildableVertices.length - 1; i >= 0; i--) {
            if (item.settlementID.toString() === player.rulesValidatedBuildableVertices[i].toString()) {
                player.rulesValidatedBuildableVertices.splice(i, 1);
            }
        };
    });
    player.ownedProperties.cities.forEach(function(item, index){
        for (var i = player.rulesValidatedBuildableVertices.length - 1; i >= 0; i--) {
            if (item.settlementID.toString() === player.rulesValidatedBuildableVertices[i].toString()) {
                player.rulesValidatedBuildableVertices.splice(i, 1);
            }
        };
    });
};

GameBoard.prototype.placeRoad = function(player, currentLocation, newDirection) {
    if (player.constructionPool.roads === 0) {
        return {err: "no roads left"};
    }
    else if(!!this.boardVertices[currentLocation[0]][currentLocation[1]].connections[newDirection]){
        return {err: "occupied"};
    }
    else {
        var destinationCoords = this.game.gameBoard.getRoadDestination(currentLocation, newDirection);
        if(!destinationCoords){
            return {err: "Vertex [" + currentLocation + "] doesn't have a '" + newDirection + "' road!"};
        }

        // Check to make sure this road is adjacent to this player's settlement/city/other road
        var currentVertex = this.boardVertices[currentLocation[0]][currentLocation[1]];
        var destinationVertex = this.boardVertices[destinationCoords[0]][destinationCoords[1]];
        var player_adjacent_road_currentVertex = false;
        var player_adjacent_road_destinationVertex = false;
        for(var key in currentVertex.connections){
            if(currentVertex.connections[key]===player.playerID){
                player_adjacent_road_currentVertex = true;
            }
            if(destinationVertex.connections[key]===player.playerID){
                player_adjacent_road_destinationVertex = true;
            }
        }

        // Check that player either owns one of the adjacent vertices, 
        // OR owns a road attached to one of those vertices, and that another player doesn't own the vertex in between that road and the road being built
        // Negating the logic in order to return an error instead of putting the rest of the function inside the IF statement
        if(!((currentVertex.owner===player.playerID || destinationVertex.owner===player.playerID)
            ||(player_adjacent_road_currentVertex && currentVertex.owner===null)
            ||player_adjacent_road_destinationVertex && destinationVertex.owner===null)) {
            return {err:"Road is not adjacent to player's current road, settlement, or city!"};
        }
        else if((this.game.turn<this.game.players.length*2)
                && !((currentVertex.owner===player.playerID && !player_adjacent_road_currentVertex)
                    || (destinationVertex.owner===player.playerID && !player_adjacent_road_destinationVertex))) {
                            return {err:"Must place road adjacent to most recent settlement during board setup phase!"};
        }


        switch (newDirection) {  
            case "left":
               var originDirection = "right";
               break;
           case "right":
               var originDirection = "left";
               break;
           case "vertical":
               var originDirection = "vertical";
               break;
        };
        this.game.gameBoard.boardVertices[currentLocation[0]][currentLocation[1]].connections[newDirection] = player.playerID;
        this.game.gameBoard.boardVertices[destinationCoords[0]][destinationCoords[1]].connections[originDirection] = player.playerID;
        //housekeeping
        player.playerQualities.roadSegments++;
        player.constructionPool.roads--;
        player.ownedProperties.roads.push({
            origin: currentLocation,
            destination: destinationCoords,
        });
        //TO DO: resource removal?
        //validation - this is two lines because validateNewVertices does not account for the vertex that is passed in, so we manually pass in the vertex and then validate all surrounding
        player.rulesValidatedBuildableVertices.push(destinationCoords);
        this.validateNewVertices(player, destinationCoords);
        if (this.game.turn >= this.game.players.length * 2) {
          player.resources.lumber--;
          player.resources.brick--;
        }
        this.game.findLongestRoad();
        return { 'location': currentLocation, 
                'locationDirection':newDirection, 
                'destination': destinationCoords,
                'destinationDirection': originDirection
            };
    }
};

// returns vertex object that a given road goes to
GameBoard.prototype.getRoadDestination = function(currentLocation, direction) {
    var num_rows = this.boardVertices.length;

    //added this so that we can pass in a uniform location to all functions
    var row = currentLocation[0];
    var col = currentLocation[1];

    // Row index of vertical adjacent vertex is one greater than the current vertex row if the current row is odd
    // If the current row is even, the adjacent vertical vertex is one less than the current row index
    // If water is vertically adjacent to current vertex, return null
    if(direction==="vertical"){
        if(row===0 || (row+1 >= num_rows)){
            return null;
        }
        else if (row%2===0){
            return [row-1, col];
        }
        else {
            return [row+1, col];
        }
    }

    if(row%2===0){
        var adjusted_row = row+1;
    } else {
        adjusted_row = row-1;
    }

    if(direction==="left"){
        // If water is to left of vertex, return null
        if(col===0){
            if(row<num_rows/2 && row%2===1){
                return null;
            }
            else if (row>=num_rows/2 && row%2===0){
                return null;
            }
        }

        // Column number of left adjacent vertex is the same as current vertex
        // UNLESS the current vertex is in an odd-indexed row in top half of board
        // OR the current vertex is in an even-indexed row in bottom half of board
        if(row<num_rows/2){
            if(row % 2===1) {
                col--;
            }
        } else if(row % 2===0) {
            col--;
        } 
        return [adjusted_row, col];       
    }
    else if(direction==="right"){
        var last_col = this.boardVertices[row].length-1;

        // If water is to right of vertex, return null
        if(col===last_col){
            if(row<num_rows/2 && row%2===1){
                return null;
            }
            else if (row>=num_rows/2 && row%2===0){
                return null;
            }
        }

        // Column number of right adjacent vertex is the same as current vertex
        // UNLESS the current vertex is in an even-indexed row in top half of board
        // OR the current vertex is in an odd-indexed row in bottom half of board
        if(row<num_rows/2){
            if(row % 2===0) {
                col++;
            }
        } else if(row % 2===1) {
            col++;
        }
        return [adjusted_row, col]; 
    }
};

GameBoard.prototype.followRoad = function(location, road, player) {
    var row = location[0];
    var col = location[1];
    var vertex = this.boardVertices[row][col];
    var longest_road = [];

    // If this is the starting vertex
    if(!road){
        var road=[];
        road.push([row, col]);
        for(var key in vertex.connections){
            var next_vertex = this.getRoadDestination([row, col], String(key));
            if(!!next_vertex && vertex.connections[key]!==null){
                var temp_road = this.followRoad(next_vertex, road.slice(0), vertex.connections[key]);
                if(temp_road.length>longest_road.length){
                    longest_road = temp_road;
                }
            }
        }
        return longest_road;
    // If this vertex and previous vertex have been visited twice, return array that doesn't include the road between the two vertices
    } else if ((this.game.getNestedArrayIndex(road, road[road.length-1])!==road.length-1)  //Check if there is an earlier instance of the last road on the array
                && (this.game.getNestedArrayIndex(road, [row, col])!==-1)) {
        return road;
    // Prevent from double-backing on itself and adding an extra length to the longest road
    } else if(road.length>1 && this.game.getNestedArrayIndex(road, [row, col])===road.length-2){
        return road;
    // Return road if we hit a vertex owned by another player
    } else if(vertex.owner!==null && vertex.owner!==player){
        road.push([row, col]);
        return road;
    } else {
        // console.log(this.game.getNestedArrayIndex(road, [row, col]));
        road.push([row, col]);
        for(key in vertex.connections){
            if(vertex.connections[key]===player){
                next_vertex = this.getRoadDestination([row, col], String(key));
                if(!!next_vertex){
                    temp_road = this.followRoad(next_vertex, road.slice(0), player); 
                    if(temp_road.length>longest_road.length){
                        longest_road = temp_road;
                    }
                }
            }
        }
        return longest_road;
    }
};

GameBoard.prototype.getDevelopmentCard = function(player) {
    var deck = {
        size: 25,
        choiceCeiling: [14,19,21,23,25]
    };
    if (this.game.players.length > 4) {
        deck.choiceCeiling = [19,24,26,28,30];
        deck.size = 30;
    }
    var cardChoice = Math.floor((Math.random() * deck.size)) + 1;
    switch (true){
        case (cardChoice <= deck.choiceCeiling[0]):
            player.devCards.knight++;
            break;
        case (cardChoice > deck.choiceCeiling[0] && cardChoice <= deck.choiceCeiling[1]):
            player.devCards.point++;
            break;
        case (cardChoice > deck.choiceCeiling[1] && cardChoice <= deck.choiceCeiling[2]):
            player.devCards.monopoly++;
            break;
        case (cardChoice > deck.choiceCeiling[2] && cardChoice <= deck.choiceCeiling[3]):
            player.devCards.plenty++;
            break;
        case (cardChoice > deck.choiceCeiling[3] && cardChoice <= deck.choiceCeiling[4]):
            player.devCards.roadBuilding++;
            break;
        default:
            throw new Error ('Something weird happened in the deck: Error on this draw - ' + cardChoice);
    }
    currentGameData.child('players').set(JSON.stringify(game.players));
};

GameBoard.prototype.moveRobber = function(location) {
    var old_location;
    for(var row=0, num_rows=this.boardTiles.length; row<num_rows; row++){
        for(var col=0, num_cols=this.boardTiles[row].length; col<num_cols; col++){
            if(this.boardTiles[row][col].robber===true){
                old_location = [row, col];
            }
        }
    }

    if(old_location!==location){
        var old_row = old_location[0], old_col=old_location[1];
        this.boardTiles[old_row][old_col].robber=false;
        this.boardTiles[location[0]][location[1]].robber=true;
        return {'boardTiles': JSON.stringify(this.boardTiles)};
    } else {
        return {err: "You must move the Robber to another tile!"};
    }
};