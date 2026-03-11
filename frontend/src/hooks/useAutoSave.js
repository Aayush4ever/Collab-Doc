import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

const AUTO_SAVE_INTERVAL = 5000;

export const useAutoSave = (documentId, emitSaveDocument) => {
  const { setSaving, role } = useEditorStore();
  const timerRef = useRef(null);

  // Always read latest values from store via refs — avoids stale closure
  const storeRef = useRef(useEditorStore.getState());
  useEffect(() => {
    const unsub = useEditorStore.subscribe((state) => {
      storeRef.current = state;
    });
    return unsub;
  }, []);

  const save = useCallback(() => {
    const { content, title, hasUnsavedChanges, role: currentRole } = storeRef.current;
    if (!documentId || currentRole === 'viewer' || !hasUnsavedChanges) return;
    setSaving(true);
    if (emitSaveDocument) emitSaveDocument(content, title);
  }, [documentId, setSaving, emitSaveDocument]);

  // Auto-save timer
  useEffect(() => {
    if (!documentId || role === 'viewer') return;

    timerRef.current = setInterval(() => {
      const { hasUnsavedChanges } = storeRef.current;
      if (hasUnsavedChanges) save();
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(timerRef.current);
  }, [documentId, role, save]);

  // Save on unmount if unsaved
  useEffect(() => {
    return () => {
      const { hasUnsavedChanges, content, title, role: r } = storeRef.current;
      if (hasUnsavedChanges && documentId && r !== 'viewer' && emitSaveDocument) {
        emitSaveDocument(content, title);
      }
    };
  }, [documentId, emitSaveDocument]);

  return { save };
};
