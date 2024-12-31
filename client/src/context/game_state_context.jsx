import React, { createContext, useEffect, useState } from 'react';
import { useSocket } from '../hooks/use_socket';
import { getGameState, setGameState } from '../services/game_service';

export const GameStateContext = createContext(null);

/**
 * Provides a global game state + socket subscriptions.
 */
export function GameStateProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const socket = useSocket(); // Connect to server

  // On mount, attempt to "join the game"
  // Example: in Angular, maybe you'd have socketService.joinGame(...)
  // We'll replicate that logic here.
  useEffect(() => {
    if (!socket) return;

    // Example: let the server know we joined
    socket.emit('join-game', { playerName: 'DefaultPlayer' });

    // Listen for updated player list from server
    const handlePlayersUpdate = (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setGameState({ players: updatedPlayers });
    };

    socket.on('players-updated', handlePlayersUpdate);

    // Cleanup
    return () => {
      socket.off('players-updated', handlePlayersUpdate);
    };
  }, [socket]);

  // Sync local "players" state with gameService as well
  useEffect(() => {
    // On first render, if game_service has a pre-existing array
    const initial = getGameState().players;
    if (initial && initial.length) {
      setPlayers(initial);
    }
  }, []);

  const contextValue = {
    players,
    setPlayers,
    // In future phases, we might store tiles, dev cards, etc.
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
