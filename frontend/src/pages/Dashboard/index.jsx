import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Search, Trash2, Share2, Clock, Moon, Sun,
  LogOut, User, ChevronDown, MoreVertical, Grid, List, FileEdit,
  Users, Star,
} from 'lucide-react';
import { useDocuments, useCreateDocument, useDeleteDocument } from '../../hooks/useDocument';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import Avatar from '../../components/ui/Avatar';
import { SkeletonDocumentList } from '../../components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const EMOJIS = ['📄', '📝', '📋', '📊', '📈', '💡', '🎯', '🚀', '📚', '🔖'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data: documents, isLoading } = useDocuments({ filter });
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    if (!search.trim()) return documents;
    return documents.filter(d =>
      d.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [documents, search]);

  const handleCreate = async () => {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    try {
      const doc = await createDocument.mutateAsync({
        title: 'Untitled Document',
        emoji,
      });
      navigate(`/doc/${doc._id}`);
    } catch {}
  };

  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(docId);
    try {
      await deleteDocument.mutateAsync(docId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const isOwner = (doc) => {
    const ownerId = doc.ownerId?._id || doc.ownerId;
    return ownerId?.toString() === user?._id?.toString();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">CollabDocs</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="input pl-9 py-1.5 text-sm"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="btn-ghost p-2 rounded-lg">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 btn-ghost px-2 py-1.5 rounded-lg"
              >
                <Avatar user={user} size="sm" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block">
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 card shadow-lg z-20 py-1 animate-slide-in">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {filter === 'owned' ? 'My Documents' : filter === 'shared' ? 'Shared with Me' : 'All Documents'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={createDocument.isPending}
            className="btn-primary"
          >
            <Plus size={16} />
            {createDocument.isPending ? 'Creating...' : 'New Document'}
          </button>
        </div>

        {/* Filters + View toggle */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {[
              { id: 'all', label: 'All', icon: FileText },
              { id: 'owned', label: 'Mine', icon: User },
              { id: 'shared', label: 'Shared', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Document list */}
        {isLoading ? (
          <SkeletonDocumentList />
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {search ? 'No documents found' : 'No documents yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search ? 'Try a different search term' : 'Create your first document to get started'}
            </p>
            {!search && (
              <button onClick={handleCreate} className="btn-primary">
                <Plus size={16} /> Create Document
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                isOwner={isOwner(doc)}
                currentUserId={user?._id}
                onOpen={() => navigate(`/doc/${doc._id}`)}
                onDelete={(e) => handleDelete(e, doc._id)}
                isDeleting={deletingId === doc._id}
              />
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
            {filteredDocuments.map((doc) => (
              <DocumentRow
                key={doc._id}
                document={doc}
                isOwner={isOwner(doc)}
                onOpen={() => navigate(`/doc/${doc._id}`)}
                onDelete={(e) => handleDelete(e, doc._id)}
                isDeleting={deletingId === doc._id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DocumentCard({ document, isOwner, onOpen, onDelete, isDeleting }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onOpen}
      className="card hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all cursor-pointer group p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="text-2xl">{document.emoji || '📄'}</div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity btn-ghost"
          >
            <MoreVertical size={14} />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 card shadow-lg z-20 py-1 animate-slide-in">
                <button
                  onClick={onOpen}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <FileEdit size={13} /> Open
                </button>
                {isOwner && (
                  <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={13} /> {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2 mb-1">
          {document.title}
        </h3>
        {document.wordCount > 0 && (
          <p className="text-xs text-slate-400">{document.wordCount} words</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
        </span>
        <div className="flex items-center -space-x-1">
          <Avatar user={document.ownerId} size="xs" showTooltip />
          {document.collaborators?.slice(0, 2).map(c => (
            <Avatar key={c.userId._id} user={c.userId} size="xs" showTooltip />
          ))}
          {document.collaborators?.length > 2 && (
            <span className="text-[10px] text-slate-400 ml-1">+{document.collaborators.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ document, isOwner, onOpen, onDelete, isDeleting }) {
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer group transition-colors"
    >
      <span className="text-xl flex-shrink-0">{document.emoji || '📄'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{document.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{document.wordCount || 0} words</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="hidden sm:block">{formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}</span>
        <Avatar user={document.ownerId} size="xs" showTooltip />
      </div>
      {isOwner && (
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-400 hover:text-red-500 transition-all"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
