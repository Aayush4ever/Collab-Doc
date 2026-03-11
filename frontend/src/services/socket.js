import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const SOCKET_EVENTS = {
  JOIN_DOCUMENT: 'JOIN_DOCUMENT',
  LEAVE_DOCUMENT: 'LEAVE_DOCUMENT',
  DOCUMENT_CHANGE: 'DOCUMENT_CHANGE',
  CURSOR_POSITION: 'CURSOR_POSITION',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  SAVE_DOCUMENT: 'SAVE_DOCUMENT',
  DOCUMENT_SAVED: 'DOCUMENT_SAVED',
  SAVE_ERROR: 'SAVE_ERROR',
  TITLE_CHANGE: 'TITLE_CHANGE',
  ACTIVE_USERS: 'ACTIVE_USERS',
  ERROR: 'ERROR',
};

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const emitEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  } else {
    console.warn('Socket not connected, cannot emit:', event);
  }
};
