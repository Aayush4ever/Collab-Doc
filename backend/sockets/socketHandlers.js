const { authenticateSocket } = require('../middleware/auth');
const Document = require('../models/Document');
const { saveVersion } = require('../controllers/versionController');
const { sanitizeHtml } = require('../utils/sanitize');

// In-memory room tracking: roomId -> Map(socketId -> userInfo)
const activeRooms = new Map();

const SOCKET_EVENTS = {
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

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#82E0AA',
  '#F1948A', '#85C1E9', '#F8C471', '#AEB6BF', '#F0B27A',
];
let colorIndex = 0;
const getUserColor = () => CURSOR_COLORS[(colorIndex++) % CURSOR_COLORS.length];

const getRoomId = (documentId) => `doc:${documentId}`;

const leaveRoom = async (socket, io, roomId) => {
  const roomUsers = activeRooms.get(roomId);
  if (roomUsers) {
    roomUsers.delete(socket.id);
    if (roomUsers.size === 0) {
      activeRooms.delete(roomId);
    } else {
      io.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, {
        socketId: socket.id,
        userId: socket.user._id.toString(),
        name: socket.user.name,
      });
      io.to(roomId).emit(SOCKET_EVENTS.ACTIVE_USERS, {
        users: [...roomUsers.values()],
      });
    }
  }
  socket.leave(roomId);
};

const initializeSocketHandlers = (io) => {
  // Auth middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      const user = await authenticateSocket(token);
      if (!user) return next(new Error('Authentication failed'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.user.name} (${socket.id})`);

    // ── JOIN_DOCUMENT ──
    socket.on(SOCKET_EVENTS.JOIN_DOCUMENT, async ({ documentId }) => {
      try {
        if (!documentId) {
          return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Document ID required' });
        }

        const document = await Document.findById(documentId);
        if (!document) {
          return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Document not found' });
        }
        if (!document.hasAccess(socket.user._id)) {
          return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Access denied' });
        }

        const role = document.getUserRole(socket.user._id);
        const roomId = getRoomId(documentId);

        // Leave any existing doc rooms first
        for (const room of socket.rooms) {
          if (room !== socket.id && room.startsWith('doc:')) {
            await leaveRoom(socket, io, room);
          }
        }

        socket.join(roomId);

        if (!activeRooms.has(roomId)) activeRooms.set(roomId, new Map());
        const roomUsers = activeRooms.get(roomId);

        const userInfo = {
          socketId: socket.id,
          userId: socket.user._id.toString(),
          name: socket.user.name,
          email: socket.user.email,
          avatar: socket.user.avatar,
          color: getUserColor(),
          role,
        };

        roomUsers.set(socket.id, userInfo);
        socket.currentRoom = roomId;
        socket.currentDocumentId = documentId;

        // Notify others
        socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, { user: userInfo, documentId });

        // Send current users to the joiner
        socket.emit(SOCKET_EVENTS.ACTIVE_USERS, {
          users: [...roomUsers.values()],
          documentId,
        });

        console.log(`📄 ${socket.user.name} joined doc:${documentId} as ${role}`);
      } catch (err) {
        console.error('JOIN_DOCUMENT error:', err.message);
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join document' });
      }
    });

    // ── DOCUMENT_CHANGE ──
    socket.on(SOCKET_EVENTS.DOCUMENT_CHANGE, ({ documentId, content }) => {
      try {
        const roomId = getRoomId(documentId);
        const roomUsers = activeRooms.get(roomId);
        const userInfo = roomUsers?.get(socket.id);
        if (!userInfo || userInfo.role === 'viewer') return;

        socket.to(roomId).emit(SOCKET_EVENTS.DOCUMENT_CHANGE, {
          content,
          userId: socket.user._id.toString(),
          userName: socket.user.name,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('DOCUMENT_CHANGE error:', err.message);
      }
    });

    // ── CURSOR_POSITION ──
    socket.on(SOCKET_EVENTS.CURSOR_POSITION, ({ documentId, position, selection }) => {
      try {
        const roomId = getRoomId(documentId);
        const roomUsers = activeRooms.get(roomId);
        const userInfo = roomUsers?.get(socket.id);
        if (!userInfo) return;

        socket.to(roomId).emit(SOCKET_EVENTS.CURSOR_POSITION, {
          userId: socket.user._id.toString(),
          socketId: socket.id,
          name: socket.user.name,
          color: userInfo.color,
          position,
          selection,
        });
      } catch (err) {
        console.error('CURSOR_POSITION error:', err.message);
      }
    });

    // ── TITLE_CHANGE ──
    socket.on(SOCKET_EVENTS.TITLE_CHANGE, ({ documentId, title }) => {
      try {
        const roomId = getRoomId(documentId);
        socket.to(roomId).emit(SOCKET_EVENTS.TITLE_CHANGE, {
          title,
          userId: socket.user._id.toString(),
        });
      } catch (err) {
        console.error('TITLE_CHANGE error:', err.message);
      }
    });

    // ── SAVE_DOCUMENT ──
    socket.on(SOCKET_EVENTS.SAVE_DOCUMENT, async ({ documentId, content, title }) => {
      try {
        if (!documentId) return;

        const document = await Document.findById(documentId);
        if (!document) return;

        const role = document.getUserRole(socket.user._id);
        if (!role || role === 'viewer') return;

        const sanitized = sanitizeHtml(content || '');
        const plainText = sanitized.replace(/<[^>]*>/g, '').trim();
        const wordCount = plainText ? plainText.split(/\s+/).length : 0;

        await Document.findByIdAndUpdate(documentId, {
          content: sanitized,
          title: title || document.title,
          lastEditedBy: socket.user._id,
          wordCount,
          updatedAt: new Date(),
        });

        // Save version snapshot (ignores duplicates)
        await saveVersion(
          documentId,
          sanitized,
          title || document.title,
          socket.user._id
        );

        socket.emit(SOCKET_EVENTS.DOCUMENT_SAVED, {
          documentId,
          savedAt: new Date().toISOString(),
        });

        console.log(`💾 Saved: ${documentId} by ${socket.user.name}`);
      } catch (err) {
        console.error('SAVE_DOCUMENT error:', err.message);
        socket.emit(SOCKET_EVENTS.SAVE_ERROR, { message: 'Failed to save document' });
      }
    });

    // ── LEAVE_DOCUMENT ──
    socket.on(SOCKET_EVENTS.LEAVE_DOCUMENT, async ({ documentId }) => {
      const roomId = getRoomId(documentId);
      await leaveRoom(socket, io, roomId);
    });

    // ── DISCONNECT ──
    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${socket.user.name} (${socket.id})`);
      if (socket.currentRoom) {
        await leaveRoom(socket, io, socket.currentRoom);
      }
    });
  });
};

module.exports = { initializeSocketHandlers, SOCKET_EVENTS };
