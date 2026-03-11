import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  document: null,
  content: '',
  title: '',
  role: null,
  isSaving: false,
  lastSaved: null,
  saveError: null,
  activeUsers: [],
  cursors: {},
  hasUnsavedChanges: false,

  setDocument: (doc, role) => {
    set({
      document: doc,
      content: doc.content || '',
      title: doc.title || 'Untitled Document',
      role,
      hasUnsavedChanges: false,
    });
  },

  setContent: (content) => {
    set({ content, hasUnsavedChanges: true });
  },

  setTitle: (title) => {
    set({ title, hasUnsavedChanges: true });
  },

  setSaving: (isSaving) => set({ isSaving }),

  setSaved: (savedAt) => {
    set({ isSaving: false, lastSaved: savedAt, hasUnsavedChanges: false, saveError: null });
  },

  setSaveError: (error) => {
    set({ isSaving: false, saveError: error });
  },

  setActiveUsers: (users) => set({ activeUsers: users }),

  addActiveUser: (user) => {
    set((state) => ({
      activeUsers: [...state.activeUsers.filter(u => u.socketId !== user.socketId), user],
    }));
  },

  removeActiveUser: (socketId) => {
    set((state) => ({
      activeUsers: state.activeUsers.filter(u => u.socketId !== socketId),
      cursors: Object.fromEntries(
        Object.entries(state.cursors).filter(([k]) => k !== socketId)
      ),
    }));
  },

  updateCursor: (socketId, cursorData) => {
    set((state) => ({
      cursors: { ...state.cursors, [socketId]: cursorData },
    }));
  },

  resetEditor: () => {
    set({
      document: null,
      content: '',
      title: '',
      role: null,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      activeUsers: [],
      cursors: {},
      hasUnsavedChanges: false,
    });
  },
}));
