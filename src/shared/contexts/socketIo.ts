import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize a socket connection (create new or reuse existing one)
 */
export async function initSocket(userId: string): Promise<Socket | null> {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // Fetch token from AsyncStorage
  const token = await AsyncStorage.getItem('token');
  console.log('🟢 JWT being sent to socket:', token);

  if (!token) {
    console.error('❌ Socket cannot connect: token missing');
    return null;
  }

  socket = io('http://192.168.43.72:3000', {
    transports: ['websocket'],
    auth: { token, userId },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    forceNew: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
    socket?.emit('register', userId);
    socket?.emit('userReconnected', userId);
  });

  socket.on('connect_error', err => {
    console.error('❌ Socket connection error wahala:', err.message);
  });

  socket.on('disconnect', reason => {
    console.warn('🔌 Socket disconnected:', reason);
  });

  return socket;
}

/**
 * Safely get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Cleanly disconnect and reset the socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
