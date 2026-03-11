# CollabDocs — Real-Time Collaborative Document Editor

A production-ready Google Docs-style collaborative document editor built with React, Node.js, MongoDB, and Socket.io.

---

## ✨ Features

- **Real-Time Collaboration** — Multiple users editing simultaneously with live sync
- **Rich Text Editor** — TipTap-powered with bold, italic, headings, lists, code blocks, links, and more
- **Live Presence** — See who's in the document with colored user indicators
- **Auto Save** — Documents auto-save every 5 seconds via WebSocket
- **Version History** — Full history with restore capability
- **Comments System** — Inline comments with replies and resolve/unresolve
- **Document Sharing** — Invite collaborators by email with viewer/editor roles
- **Dark Mode** — Full dark/light theme support
- **JWT Auth** — Secure signup/login with bcrypt password hashing
- **Protected Routes** — Frontend and backend route protection

---

## 🏗️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI framework |
| TailwindCSS | Styling |
| Zustand | Client state management |
| TanStack React Query | Server state + caching |
| TipTap | Rich text editor |
| Socket.io Client | Real-time events |
| React Router v6 | Routing |
| React Hot Toast | Notifications |
| Lucide React | Icons |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | HTTP server |
| MongoDB + Mongoose | Database |
| Socket.io | WebSocket server |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| helmet + cors | Security middleware |
| express-rate-limit | Rate limiting |
| express-validator | Input validation |
| dompurify + jsdom | HTML sanitization |

---

## 📁 Folder Structure

```
collab-docs/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # signup, login, getMe
│   │   ├── documentController.js # CRUD + share
│   │   ├── commentController.js  # comments + replies
│   │   ├── versionController.js  # version history
│   │   └── userController.js     # user search
│   ├── middleware/
│   │   ├── auth.js              # JWT middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validate.js          # express-validator helper
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Comment.js
│   │   └── Version.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── comments.js
│   │   ├── versions.js
│   │   └── users.js
│   ├── sockets/
│   │   └── socketHandlers.js    # All Socket.io logic
│   ├── utils/
│   │   └── sanitize.js          # DOMPurify HTML sanitizer
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── comments/
    │   │   │   └── CommentsPanel.jsx
    │   │   ├── cursors/
    │   │   │   └── ActiveUsers.jsx
    │   │   ├── editor/
    │   │   │   ├── CollaborativeEditor.jsx
    │   │   │   ├── SaveStatus.jsx
    │   │   │   ├── ShareModal.jsx
    │   │   │   └── VersionHistory.jsx
    │   │   ├── toolbar/
    │   │   │   └── Toolbar.jsx
    │   │   └── ui/
    │   │       ├── Avatar.jsx
    │   │       ├── Modal.jsx
    │   │       ├── PageLoader.jsx
    │   │       ├── ProtectedRoute.jsx
    │   │       └── Skeleton.jsx
    │   ├── hooks/
    │   │   ├── useAutoSave.js
    │   │   ├── useComments.js
    │   │   ├── useDocument.js
    │   │   └── useSocket.js
    │   ├── pages/
    │   │   ├── Dashboard/index.jsx
    │   │   ├── EditorPage/index.jsx
    │   │   ├── Login/index.jsx
    │   │   └── Signup/index.jsx
    │   ├── services/
    │   │   ├── api.js            # Axios instance + all API calls
    │   │   └── socket.js         # Socket.io client
    │   ├── store/
    │   │   ├── authStore.js      # Zustand auth state
    │   │   ├── editorStore.js    # Zustand editor state
    │   │   └── themeStore.js     # Zustand theme state
    │   ├── utils/
    │   │   └── debounce.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the repository

```bash
git clone <repo-url>
cd collab-docs
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### 4. Open the app

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/collab-docs
# Or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/collab-docs

# JWT (use a strong random string in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|:---:|
| POST | `/api/auth/signup` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ |

### Documents
| Method | Endpoint | Description | Auth Required |
|--------|---------|-------------|:---:|
| GET | `/api/documents` | List documents | ✅ |
| POST | `/api/documents` | Create document | ✅ |
| GET | `/api/documents/:id` | Get document | ✅ |
| PUT | `/api/documents/:id` | Update document | ✅ |
| DELETE | `/api/documents/:id` | Delete document | ✅ |
| POST | `/api/documents/:id/share` | Share document | ✅ |
| DELETE | `/api/documents/:id/collaborators/:userId` | Remove collaborator | ✅ |

### Comments
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/comments/:documentId` | Get comments |
| POST | `/api/comments` | Create comment |
| POST | `/api/comments/:id/replies` | Add reply |
| PUT | `/api/comments/:id/resolve` | Toggle resolve |
| DELETE | `/api/comments/:id` | Delete comment |

### Versions
| Method | Endpoint | Description |
|--------|---------|-------------|
| GET | `/api/versions/:documentId` | Get version history |
| POST | `/api/versions/:documentId/restore/:versionId` | Restore version |

---

## 🔌 Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `JOIN_DOCUMENT` | `{ documentId }` | Join document room |
| `LEAVE_DOCUMENT` | `{ documentId }` | Leave document room |
| `DOCUMENT_CHANGE` | `{ documentId, content }` | Broadcast content change |
| `CURSOR_POSITION` | `{ documentId, position, selection }` | Broadcast cursor |
| `TITLE_CHANGE` | `{ documentId, title }` | Broadcast title change |
| `SAVE_DOCUMENT` | `{ documentId, content, title }` | Trigger server save |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `USER_JOINED` | `{ user, documentId }` | User joined notification |
| `USER_LEFT` | `{ socketId, userId, name }` | User left notification |
| `ACTIVE_USERS` | `{ users }` | Current users in room |
| `DOCUMENT_CHANGE` | `{ content, userId, timestamp }` | Content from other user |
| `CURSOR_POSITION` | `{ userId, socketId, name, color, position }` | Cursor from other user |
| `TITLE_CHANGE` | `{ title, userId }` | Title from other user |
| `DOCUMENT_SAVED` | `{ documentId, savedAt }` | Save confirmation |
| `SAVE_ERROR` | `{ message }` | Save error |

---

## 🛡️ Security

- **Password hashing**: bcryptjs with 12 salt rounds
- **JWT tokens**: Expire in 7 days, verified on every request
- **HTML sanitization**: DOMPurify on all user-generated content
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: HTTP security headers
- **CORS**: Configured for specific frontend origin
- **Input validation**: express-validator on all endpoints
- **Socket auth**: JWT verified on WebSocket connection

---

## 🚢 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas or a managed MongoDB service
4. Consider Redis for Socket.io scaling across multiple instances
5. Use PM2 for process management: `pm2 start server.js`

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with nginx or any static file server
```

### Docker (optional)
Consider containerizing both services with Docker Compose for easier deployment.

---

## 🧪 Development Tips

- The backend uses `nodemon` for hot reload
- The frontend uses Vite's HMR for instant updates
- Socket.io requests are proxied through Vite in development (see `vite.config.js`)
- Use MongoDB Compass for visual database inspection
- Use the browser's DevTools Network tab to monitor WebSocket frames

---

## 📄 License

MIT
