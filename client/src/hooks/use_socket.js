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
