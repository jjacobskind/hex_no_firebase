import { io } from 'socket.io-client';

let socket = null;

export function initSocket(url = 'http://localhost:4000') {
  if (!socket) {
    socket = io(url);

    // Example event handlers
    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    // Listen for a "game-state-updated" event from server
    socket.on('game-state-updated', (newState) => {
      // We'll have the client sync local state with newState
      console.log('[Socket] Received updated game state from server:', newState);
      // We'll let GameStateContext handle merging
      if (typeof window !== 'undefined' && window.handleServerGameState) {
        window.handleServerGameState(newState);
      }
    });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
