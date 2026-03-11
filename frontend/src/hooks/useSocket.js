import { useEffect, useCallback, useRef } from 'react';
import { getSocket, SOCKET_EVENTS } from '../services/socket';
import { useEditorStore } from '../store/editorStore';
import toast from 'react-hot-toast';

export const useSocket = (documentId) => {
  const {
    setActiveUsers,
    addActiveUser,
    removeActiveUser,
    updateCursor,
    setSaved,
    setSaveError,
  } = useEditorStore();

  // Always hold the latest socket reference
  const socketRef = useRef(null);

  useEffect(() => {
    // Poll until socket is available (it connects async on login)
    const interval = setInterval(() => {
      const s = getSocket();
      if (s) {
        socketRef.current = s;
        clearInterval(interval);
      }
    }, 100);
    socketRef.current = getSocket();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!documentId) return;

    // Wait for socket to be ready
    let socket = getSocket();
    if (!socket) return;

    socketRef.current = socket;
    socket.emit(SOCKET_EVENTS.JOIN_DOCUMENT, { documentId });

    const onActiveUsers = ({ users }) => setActiveUsers(users);

    const onUserJoined = ({ user }) => {
      addActiveUser(user);
      toast(`${user.name} joined`, { icon: '👋', duration: 2000 });
    };

    const onUserLeft = ({ socketId }) => removeActiveUser(socketId);

    const onCursorPosition = (data) => updateCursor(data.socketId, data);

    const onDocumentSaved = ({ savedAt }) => setSaved(savedAt);

    const onSaveError = ({ message }) => {
      setSaveError(message);
      toast.error('Save failed: ' + message);
    };

    const onError = ({ message }) => toast.error(message);

    socket.on(SOCKET_EVENTS.ACTIVE_USERS, onActiveUsers);
    socket.on(SOCKET_EVENTS.USER_JOINED, onUserJoined);
    socket.on(SOCKET_EVENTS.USER_LEFT, onUserLeft);
    socket.on(SOCKET_EVENTS.CURSOR_POSITION, onCursorPosition);
    socket.on(SOCKET_EVENTS.DOCUMENT_SAVED, onDocumentSaved);
    socket.on(SOCKET_EVENTS.SAVE_ERROR, onSaveError);
    socket.on(SOCKET_EVENTS.ERROR, onError);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_DOCUMENT, { documentId });
      socket.off(SOCKET_EVENTS.ACTIVE_USERS, onActiveUsers);
      socket.off(SOCKET_EVENTS.USER_JOINED, onUserJoined);
      socket.off(SOCKET_EVENTS.USER_LEFT, onUserLeft);
      socket.off(SOCKET_EVENTS.CURSOR_POSITION, onCursorPosition);
      socket.off(SOCKET_EVENTS.DOCUMENT_SAVED, onDocumentSaved);
      socket.off(SOCKET_EVENTS.SAVE_ERROR, onSaveError);
      socket.off(SOCKET_EVENTS.ERROR, onError);
    };
  }, [documentId]);

  const emitDocumentChange = useCallback((content) => {
    const s = socketRef.current;
    if (s?.connected) s.emit(SOCKET_EVENTS.DOCUMENT_CHANGE, { documentId, content });
  }, [documentId]);

  const emitCursorPosition = useCallback((position, selection) => {
    const s = socketRef.current;
    if (s?.connected) s.emit(SOCKET_EVENTS.CURSOR_POSITION, { documentId, position, selection });
  }, [documentId]);

  const emitTitleChange = useCallback((title) => {
    const s = socketRef.current;
    if (s?.connected) s.emit(SOCKET_EVENTS.TITLE_CHANGE, { documentId, title });
  }, [documentId]);

  const emitSaveDocument = useCallback((content, title) => {
    const s = socketRef.current;
    if (s?.connected) s.emit(SOCKET_EVENTS.SAVE_DOCUMENT, { documentId, content, title });
  }, [documentId]);

  return { emitDocumentChange, emitCursorPosition, emitTitleChange, emitSaveDocument };
};
