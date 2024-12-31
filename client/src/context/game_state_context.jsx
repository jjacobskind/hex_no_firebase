import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';
import { generateHexBoard } from '../utils/board_utils';

export const GameStateContext = createContext(null);

/**
 * Provides a global game state + socket subscriptions.
 * In Phase 3, we also generate hex tiles upon mount and store in context.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [tiles, setTiles] = useState([]);
  const socket = useSocket(); // Connect to server

  // On mount: generate board if we haven't yet
  useEffect(() => {
    const existingGameState = getGameState();

    // If no tiles in the game state, generate them
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

  // Update local states if game_service changes
  // (In a bigger app, we might unify this in Redux or a single source of truth)
  useEffect(() => {
    const gs = getGameState();
    if (gs.players && gs.players !== players) {
      setPlayers(gs.players);
    }
    if (gs.tiles && gs.tiles !== tiles) {
      setTiles(gs.tiles);
    }
  }, [players, tiles]);

  const contextValue = {
    players,
    setPlayers,
    tiles,
    setTiles,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
