// src/hooks/useSocket.ts

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (serverUrl: string = ' https://project-live-polling-backend-1.onrender.com') => {  // Use useState to store the socket instance
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Create the socket connection
    const newSocket = io(serverUrl);
    
    // Update the state with the new socket instance
    setSocket(newSocket);

    // Cleanup function to disconnect the socket when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [serverUrl]); // Re-run the effect if the serverUrl changes

  return socket;
};