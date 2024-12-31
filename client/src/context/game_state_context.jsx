import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides a global game state + socket subscriptions.
 * Now includes selectedTile for UI interactions.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [selectedTile, setSelectedTile] = useState(null);

  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    if (!existingGameState.tiles) {
      const newTiles = generateHexBoard();
      setGameState({ tiles: newTiles });
      setTiles(newTiles);
    } else {
      setTiles(existingGameState.tiles);
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
  }, [players, tiles]);

  // Update the service if we change selectedTile
  // (Optionally: store it in game_service if you want it persistent)
  function handleSelectTile(tile) {
    setSelectedTile(tile);
  }

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
    selectedTile,
    setSelectedTile: handleSelectTile,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
