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
