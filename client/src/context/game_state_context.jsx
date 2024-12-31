import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard, generateEdges } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides global game state + socket + building logic
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [edges, setEdges] = useState([]);
  const [roads, setRoads] = useState([]); // each road => { edgeId, owner }
  const [selectedTile, setSelectedTile] = useState(null);

  // Build mode flags
  const [isBuildingRoad, setIsBuildingRoad] = useState(false);

  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    // If no tiles in the game state, generate them
    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      const newEdges = generateEdges(newTiles);

      setGameState({ 
        tiles: newTiles,
        edges: newEdges,
        roads: []
      });
      setTiles(newTiles);
      setEdges(newEdges);
    } else {
      setTiles(existingGameState.tiles);
      setEdges(existingGameState.edges || []);
      setRoads(existingGameState.roads || []);
    }
  }, []);

  // Example: Let the server know we joined
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-game', { playerName: 'DefaultPlayer' });

    // Listen for updated players
    const handlePlayersUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setGameState({ players: updatedPlayers });
    };

    socket.on('players-updated', handlePlayersUpdate);

    return () => {
      socket.off('players-updated', handlePlayersUpdate);
    };
  }, [socket]);

  // Periodically sync with game_service
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) {
      setPlayers(gs.players);
    }
    if (gs.tiles && gs.tiles !== tiles) {
      setTiles(gs.tiles);
    }
    if (gs.edges && gs.edges !== edges) {
      setEdges(gs.edges);
    }
    if (gs.roads && gs.roads !== roads) {
      setRoads(gs.roads);
    }
  }, [players, tiles, edges, roads]);

  function handleSelectTile(tile) {
    setSelectedTile(tile);
  }

  /**
   * Attempt to build a road on an edge
   */
  function buildRoad(edgeId, owner) {
    // Check if there's already a road on this edge
    const existing = roads.find(r => r.edgeId === edgeId);
    if (existing) {
      console.log('Edge already has a road!');
      return;
    }

    // For real game: resource checks, adjacency checks, etc.
    const newRoad = { edgeId, owner };
    const updatedRoads = [...roads, newRoad];
    setRoads(updatedRoads);
    setGameState({ roads: updatedRoads });

    console.log(`Road built by ${owner} on edge ${edgeId}`);
  }

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
    edges,
    roads,
    selectedTile,
    setSelectedTile: handleSelectTile,

    // Build mode
    isBuildingRoad,
    setIsBuildingRoad,

    // Build actions
    buildRoad
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
