import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Share2, Clock, MessageCircle, Moon, Sun,
} from 'lucide-react';
import { useDocument } from '../../hooks/useDocument';
import { useEditorStore } from '../../store/editorStore';
import { useThemeStore } from '../../store/themeStore';
import CollaborativeEditor from '../../components/editor/CollaborativeEditor';
import ActiveUsers from '../../components/cursors/ActiveUsers';
import SaveStatus from '../../components/editor/SaveStatus';
import ShareModal from '../../components/editor/ShareModal';
import VersionHistory from '../../components/editor/VersionHistory';
import CommentsPanel from '../../components/comments/CommentsPanel';
import { useSocket } from '../../hooks/useSocket';
import { getSocket, SOCKET_EVENTS } from '../../services/socket';
import { debounce } from '../../utils/debounce';

export default function EditorPage() {
  const { id } = useParams();
  const { isDark, toggleTheme } = useThemeStore();
  const { setDocument, resetEditor, title, setTitle, role } = useEditorStore();
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const { data, isLoading, error } = useDocument(id);

  // Single socket hook for this page - passes emit fns to editor
  const { emitDocumentChange, emitCursorPosition, emitTitleChange, emitSaveDocument } = useSocket(id);

  // Initialize document in store
  useEffect(() => {
    if (data) {
      setDocument(data.document, data.role);
    }
    return () => resetEditor();
  }, [data]);

  // Listen for remote title changes
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onTitleChange = ({ title: newTitle }) => setTitle(newTitle);
    socket.on(SOCKET_EVENTS.TITLE_CHANGE, onTitleChange);
    return () => socket.off(SOCKET_EVENTS.TITLE_CHANGE, onTitleChange);
  }, [setTitle]);

  const debouncedEmitTitle = useCallback(
    debounce((t) => emitTitleChange(t), 500),
    [emitTitleChange]
  );

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedEmitTitle(newTitle);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {error.response?.status === 403 ? 'Access Denied' : 'Document Not Found'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {error.response?.data?.error || 'You do not have access to this document.'}
          </p>
          <Link to="/" className="btn-primary">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
        <div className="h-12 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4">
          <div className="skeleton w-8 h-8 rounded" />
          <div className="skeleton w-48 h-5 rounded" />
        </div>
        <div className="skeleton w-full h-10 rounded-none" />
        <div className="flex-1 p-16 space-y-4 max-w-3xl mx-auto w-full">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`skeleton h-4 rounded ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-4/5' : 'w-3/5'}`} />
          ))}
        </div>
      </div>
    );
  }

  const docData = data?.document;
  const isReadOnly = role === 'viewer';

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0 h-12">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link to="/" className="btn-ghost p-1.5 rounded-lg flex-shrink-0" title="Dashboard">
            <ArrowLeft size={16} />
          </Link>
          <span className="text-lg flex-shrink-0">{docData?.emoji || '📄'}</span>

          {isEditingTitle && !isReadOnly ? (
            <input
              type="text"
              className="text-sm font-semibold bg-slate-100 dark:bg-slate-800 border border-sky-300 dark:border-sky-600 rounded px-2 py-0.5 text-slate-900 dark:text-slate-100 focus:outline-none w-64"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              maxLength={200}
            />
          ) : (
            <h1
              onClick={() => !isReadOnly && setIsEditingTitle(true)}
              className={`text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs
                ${!isReadOnly ? 'cursor-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1.5 py-0.5 transition-colors' : ''}`}
              title={title}
            >
              {title || 'Untitled Document'}
            </h1>
          )}

          {role && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 hidden sm:inline-flex ${
              role === 'owner'
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                : role === 'editor'
                ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {role === 'owner' ? '👑 Owner' : role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
            </span>
          )}
        </div>

        {/* Center: save status + active users */}
        <div className="flex items-center gap-3 mx-4 flex-shrink-0">
          <SaveStatus />
          <ActiveUsers />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={toggleTheme} className="btn-ghost p-1.5 rounded-lg" title="Toggle theme">
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`btn-ghost p-1.5 rounded-lg ${showComments ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600' : ''}`}
            title="Comments"
          >
            <MessageCircle size={15} />
          </button>
          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`btn-ghost p-1.5 rounded-lg ${showVersions ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-600' : ''}`}
            title="Version History"
          >
            <Clock size={15} />
          </button>
          {role === 'owner' && (
            <button
              onClick={() => setShowShare(true)}
              className="btn-primary text-xs px-3 py-1.5 ml-1"
            >
              <Share2 size={13} />
              Share
            </button>
          )}
        </div>
      </header>

      {/* Editor area + side panels */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <CollaborativeEditor
            documentId={id}
            readOnly={isReadOnly}
            emitDocumentChange={emitDocumentChange}
            emitCursorPosition={emitCursorPosition}
            emitSaveDocument={emitSaveDocument}
          />
        </div>

        {showComments && (
          <CommentsPanel
            documentId={id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        )}
        {showVersions && (
          <VersionHistory
            documentId={id}
            isOpen={showVersions}
            onClose={() => setShowVersions(false)}
          />
        )}
      </div>

      {docData && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          document={docData}
        />
      )}
    </div>
  );
}
