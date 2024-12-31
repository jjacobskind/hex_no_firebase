import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import {
  generateHexBoard,
  generateEdges,
  generateVertices
} from '../utils/board_utils';

export const GameStateContext = createContext(null);

export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [vertices, setVertices] = useState([]);
  const [roads, setRoads] = useState([]);
  const [settlements, setSettlements] = useState([]);

  // Minimal resource tracking: { [username]: numberOfResources }
  const [playerResources, setPlayerResources] = useState({});

  const [selectedTile, setSelectedTile] = useState(null);

  // Build modes
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  // Robber
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

  // Dice rolling
  const [diceResult, setDiceResult] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    const existingGameState = getGameState();
    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);
      const newVertices = generateVertices(newTiles);

      setGameState({
        tiles: newTiles,
        edges: newEdges,
        vertices: newVertices,
        roads: [],
        settlements: [],
        robberTileId: null,
        playerResources: {}
      });

      setTiles(newTiles);
      setEdges(newEdges);
      setVertices(newVertices);
      setRobberTileId(null);
    } else {
      setTiles(existingGameState.tiles);
      setEdges(existingGameState.edges || []);
      setVertices(existingGameState.vertices || []);
      setRoads(existingGameState.roads || []);
      setSettlements(existingGameState.settlements || []);
      setRobberTileId(existingGameState.robberTileId || null);
      setPlayerResources(existingGameState.playerResources || {});
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit('join-game', { playerName: 'DefaultPlayer' });

    const handlePlayersUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setGameState({ players: updatedPlayers });
    };

    socket.on('players-updated', handlePlayersUpdate);

    return () => {
      socket.off('players-updated', handlePlayersUpdate);
    };
  }, [socket]);

  // Periodic sync
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) setPlayers(gs.players);
    if (gs.tiles && gs.tiles !== tiles) setTiles(gs.tiles);
    if (gs.edges && gs.edges !== edges) setEdges(gs.edges);
    if (gs.vertices && gs.vertices !== vertices) setVertices(gs.vertices);
    if (gs.roads && gs.roads !== roads) setRoads(gs.roads);
    if (gs.settlements && gs.settlements !== settlements) setSettlements(gs.settlements);
    if (gs.robberTileId !== undefined && gs.robberTileId !== robberTileId) {
      setRobberTileId(gs.robberTileId);
    }
    if (gs.playerResources && gs.playerResources !== playerResources) {
      setPlayerResources(gs.playerResources);
    }
  }, [players, tiles, edges, vertices, roads, settlements, robberTileId, playerResources]);

  /** Place a road on an edge */
  function buildRoad(edgeId, owner) {
    const existing = roads.find(r => r.edgeId === edgeId);
    if (existing) {
      console.log('Edge already has a road!');
      return;
    }
    const newRoad = { edgeId, owner };
    const updatedRoads = [...roads, newRoad];
    setRoads(updatedRoads);
    setGameState({ roads: updatedRoads });
    console.log(`Road built by ${owner} on edge ${edgeId}`);
  }

  /** Place a settlement on a vertex */
  function buildSettlement(vertexId, owner) {
    const existing = settlements.find(s => s.vertexId === vertexId);
    if (existing) {
      console.log('Vertex already has a settlement!');
      return;
    }
    const newSet = { vertexId, owner };
    const updatedSetts = [...settlements, newSet];
    setSettlements(updatedSetts);
    setGameState({ settlements: updatedSetts });
    console.log(`Settlement built by ${owner} on vertex ${vertexId}`);
  }

  /**
   * Move the robber to a tile
   * Then find which players can be stolen from (who have settlements on this tile).
   */
  function moveRobber(tileId) {
    setRobberTileId(tileId);
    setGameState({ robberTileId: tileId });

    // find adjacent owners
    const tileVertices = vertices.filter((v) => v.tiles.includes(tileId));
    const owners = new Set();
    tileVertices.forEach((v) => {
      const foundSet = settlements.find((s) => s.vertexId === v.vertexId);
      if (foundSet) {
        owners.add(foundSet.owner);
      }
    });
    setPlayersToStealFrom(Array.from(owners));
  }

  /** 
   * For now, just log it. 
   * In a real game, you'd transfer a random resource card from that player.
   */
  function stealFromPlayer(victim) {
    console.log(`Steal from player: ${victim}`);
    setPlayersToStealFrom([]);
    setIsMovingRobber(false);
  }

  /**
   * Roll dice: 2d6
   */
  function rollDice(rollerName) {
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const total = die1 + die2;

    setDiceResult(total);

    console.log(`${rollerName} rolled a ${die1} + ${die2} = ${total}`);

    if (total === 7) {
      console.log('You rolled a 7! Move the robber!');
      // force robber move
      setIsMovingRobber(true);
    } else {
      // distribute resources
      distributeResources(total);
    }
  }

  /**
   * Very simplified resource distribution:
   * - For each tile with diceNumber == total
   * - find settlements on that tile's corners
   * - +1 resource to that settlement's owner
   */
  function distributeResources(total) {
    const matchingTiles = tiles.filter((t) => t.diceNumber === total && t.id !== robberTileId);
    // if robberTileId is on a tile with diceNumber == total, that tile is blocked
    // so skip it

    // For each tile, find vertices, check if there's a settlement
    const newResources = { ...playerResources };

    matchingTiles.forEach((tile) => {
      const tileVerts = vertices.filter((v) => v.tiles.includes(tile.id));
      tileVerts.forEach((vert) => {
        const foundSet = settlements.find((s) => s.vertexId === vert.vertexId);
        if (foundSet) {
          // give +1 resource
          const owner = foundSet.owner;
          if (!newResources[owner]) {
            newResources[owner] = 0;
          }
          newResources[owner] += 1;
          console.log(`Player ${owner} gets +1 resource from tile #${tile.id}`);
        }
      });
    });

    setPlayerResources(newResources);
    setGameState({ playerResources: newResources });
  }

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    robberTileId,
    diceResult,
    playerResources,

    selectedTile,
    setSelectedTile: (tile) => setSelectedTile(tile),

    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,

    isMovingRobber,
    setIsMovingRobber,
    playersToStealFrom,
    stealFromPlayer,

    buildRoad,
    buildSettlement,
    moveRobber,
    rollDice
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
