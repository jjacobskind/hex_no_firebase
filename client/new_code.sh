#!/usr/bin/env bash

#############################################
# PHASE 2 UPDATE SCRIPT
# Adds/updates the Socket layer + Game State
#############################################

# 1) Create/Update src/services/socket_service.js
mkdir -p src/services
cat << 'EOF' > src/services/socket_service.js
import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize the socket connection.
 * @param {string} url The server URL, e.g. 'http://localhost:4000'
 */
export function initSocket(url = 'http://localhost:4000') {
  if (!socket) {
    socket = io(url);

    // Example event handlers (adapt to your server's actual events)
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Add more listeners, e.g.:
    // socket.on('player-joined', (data) => {...});
    // socket.on('chat-message', (msg) => {...});
  }
  return socket;
}

/**
 * Get the existing socket connection (null if uninitialized).
 */
export function getSocket() {
  return socket;
}

/**
 * Disconnect the socket (if needed).
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
EOF

# 2) Create/Update src/services/game_service.js
cat << 'EOF' > src/services/game_service.js
/**
 * This file replicates some logic from the old Angular gameService.
 * We'll store "global" game data and provide functions to mutate it.
 *
 * In Phase 2, we're just a placeholder. We'll expand in later phases
 * to handle dice rolls, building, robber, trades, etc.
 */

const gameState = {
  players: [],
  // e.g., tiles: [], devCards: [], etc. (later)
};

/**
 * Retrieve the entire game state object.
 */
export function getGameState() {
  return gameState;
}

/**
 * Set or merge new properties into the game state.
 * Usage example: setGameState({ players: [...] });
 */
export function setGameState(newState) {
  Object.assign(gameState, newState);
}
EOF

# 3) Create/Update src/hooks/use_socket.js
mkdir -p src/hooks
cat << 'EOF' > src/hooks/use_socket.js
import { useEffect, useState } from 'react';
import { initSocket, getSocket } from '../services/socket_service';

/**
 * A custom hook that ensures the socket is initialized once,
 * and provides it to the calling component.
 */
export function useSocket(url = 'http://localhost:4000') {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // If there's no socket, init it
    if (!getSocket()) {
      initSocket(url);
    }
    // Acquire the socket reference
    setSocket(getSocket());

    return () => {
      // Optionally disconnect on unmount if you want to fully reset
      // Example: 
      // disconnectSocket();
    };
  }, [url]);

  return socket;
}
EOF

# 4) Create/Update src/hooks/use_game_state.js
cat << 'EOF' > src/hooks/use_game_state.js
import { useContext } from 'react';
import { GameStateContext } from '../context/game_state_context';

/**
 * A custom hook to get or set game state from anywhere in the app.
 */
export function useGameState() {
  return useContext(GameStateContext);
}
EOF

# 5) Create/Update src/context/game_state_context.jsx
mkdir -p src/context
cat << 'EOF' > src/context/game_state_context.jsx
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
EOF

# 6) Update src/app.jsx to wrap with GameStateProvider
cat << 'EOF' > src/app.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import MainRouter from './main_router';

import { AuthProvider } from './context/auth_context';
import { GameStateProvider } from './context/game_state_context'; 
// We add GameStateProvider in Phase 2

import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameStateProvider>
          <MainRouter />
        </GameStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
EOF

# 7) Update src/components/game_page/game_page.jsx to show minimal usage
cat << 'EOF' > src/components/game_page/game_page.jsx
import React, { useEffect } from 'react';
import { useGameState } from '../../hooks/use_game_state';
import './game_page.css';

/**
 * Phase 2: We show how to read from the game context
 * and how to handle real-time changes (the players array).
 */
export default function GamePage() {
  const { players } = useGameState();

  // Example: log whenever players change
  useEffect(() => {
    console.log('[GamePage] players updated:', players);
  }, [players]);

  return (
    <div className="game-page">
      <h2>Welcome to Hex Island!</h2>
      <p>Real-time data will appear here as we expand.</p>

      <div style={{ marginTop: 20 }}>
        <h3>Players in the game:</h3>
        <ul>
          {players.map((p, idx) => (
            <li key={idx}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
EOF

# Done
echo "Phase 2 files created/updated successfully!"
echo "Next steps:"
echo "1) Run 'npm install' if you haven't already (or to update)."
echo "2) Run 'npm start' to launch the app at http://localhost:3000."
echo "3) In the console, watch for the '[Socket] Connected:' message."
echo "4) Check the server logs to see that a 'join-game' event is emitted."
echo "5) The 'players-updated' event is a placeholder; adapt it to match your server's actual events."
echo
echo "Phase 2 sets up real-time + game state context. On to Phase 3: the 3D board with react-three-fiber!"