import { useEffect, useCallback, useRef, memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { useEditorStore } from '../../store/editorStore';
import { useAutoSave } from '../../hooks/useAutoSave';
import { getSocket, SOCKET_EVENTS } from '../../services/socket';
import Toolbar from '../toolbar/Toolbar';
import { debounce } from '../../utils/debounce';

const CollaborativeEditor = memo(({ documentId, readOnly = false, emitDocumentChange, emitSaveDocument, emitCursorPosition }) => {
  const { content, setContent, role } = useEditorStore();
  const isRemoteUpdate = useRef(false);

  const { save } = useAutoSave(documentId, emitSaveDocument);

  const isReadOnly = readOnly || role === 'viewer';

  const debouncedEmit = useCallback(
    debounce((html) => {
      if (emitDocumentChange) emitDocumentChange(html);
    }, 150),
    [emitDocumentChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        codeBlock: { HTMLAttributes: { class: 'hljs' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
    ],
    content: content || '',
    editable: !isReadOnly,
    onUpdate: ({ editor }) => {
      if (isRemoteUpdate.current) return;
      const html = editor.getHTML();
      setContent(html);
      debouncedEmit(html);
    },
    onSelectionUpdate: ({ editor }) => {
      if (isReadOnly || !emitCursorPosition) return;
      const { from, to } = editor.state.selection;
      emitCursorPosition(from, { from, to });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-16 py-10',
      },
    },
  });

  // Listen for remote document changes via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !editor) return;

    const onDocumentChange = ({ content: remoteContent }) => {
      if (!remoteContent) return;
      isRemoteUpdate.current = true;
      const { from, to } = editor.state.selection;
      editor.commands.setContent(remoteContent, false);
      try { editor.commands.setTextSelection({ from, to }); } catch {}
      isRemoteUpdate.current = false;
    };

    // Listen for version restores via store content changes
    const onTitleChange = () => {}; // handled in EditorPage

    socket.on(SOCKET_EVENTS.DOCUMENT_CHANGE, onDocumentChange);
    return () => {
      socket.off(SOCKET_EVENTS.DOCUMENT_CHANGE, onDocumentChange);
    };
  }, [editor]);

  // Sync store content into editor (e.g. after version restore)
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (!editor || isRemoteUpdate.current) return;
    // Only sync when content changed from outside (e.g. version restore)
    if (content !== prevContentRef.current && content !== editor.getHTML()) {
      isRemoteUpdate.current = true;
      editor.commands.setContent(content || '', false);
      isRemoteUpdate.current = false;
    }
    prevContentRef.current = content;
  }, [content, editor]);

  // Handle read-only state changes
  useEffect(() => {
    if (editor) editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  // Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Toolbar editor={editor} readOnly={isReadOnly} />
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
});

CollaborativeEditor.displayName = 'CollaborativeEditor';
export default CollaborativeEditor;
