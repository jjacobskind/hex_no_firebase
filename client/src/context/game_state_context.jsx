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

  const [selectedTile, setSelectedTile] = useState(null);

  // Build modes
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);
  const [isBuildingSettlement, setIsBuildingSettlement] = useState(false);

  // Robber state
  const [isMovingRobber, setIsMovingRobber] = useState(false);
  const [robberTileId, setRobberTileId] = useState(null);
  // After placing robber, we find which players to steal from
  const [playersToStealFrom, setPlayersToStealFrom] = useState([]);

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
        robberTileId: null
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
  }, [players, tiles, edges, vertices, roads, settlements, robberTileId]);

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
    // Now see which players have a settlement on that tile's corners
    const tileVertices = vertices.filter((v) => v.tiles.includes(tileId));
    // For each vertex, if there's a settlement, gather the owner
    const owners = new Set();
    tileVertices.forEach((v) => {
      const foundSet = settlements.find((s) => s.vertexId === v.vertexId);
      if (foundSet) {
        owners.add(foundSet.owner);
      }
    });
    setPlayersToStealFrom(Array.from(owners));
  }

  function stealFromPlayer(victim) {
    // For now, just log it
    console.log(`Steal from player: ${victim}`);
    // In a real game, you'd transfer 1 random resource card from victim to the robber's owner
    setPlayersToStealFrom([]);
    setIsMovingRobber(false);
  }

  const contextValue = {
    players,
    tiles,
    edges,
    vertices,
    roads,
    settlements,
    selectedTile,

    isBuildingRoad,
    setIsBuildingRoad,
    isBuildingSettlement,
    setIsBuildingSettlement,

    // Robber
    isMovingRobber,
    setIsMovingRobber,
    robberTileId,
    playersToStealFrom,
    stealFromPlayer,

    setSelectedTile: (tile) => setSelectedTile(tile),
    buildRoad,
    buildSettlement,
    moveRobber
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
