import { useState } from 'react';
import { UserPlus, Trash2, Crown } from 'lucide-react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { useShareDocument } from '../../hooks/useDocument';
import { documentsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function ShareModal({ isOpen, onClose, document }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [removing, setRemoving] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);
  const shareDocument = useShareDocument();
  const queryClient = useQueryClient();

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await shareDocument.mutateAsync({ id: document._id, email: email.trim(), role });
      setEmail('');
    } catch {}
  };

  const handleRemove = async (userId) => {
    if (!confirm('Remove this collaborator?')) return;
    setRemoving(userId);
    try {
      await documentsApi.removeCollaborator(document._id, userId);
      queryClient.invalidateQueries({ queryKey: ['document', document._id] });
      toast.success('Collaborator removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove collaborator');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (collab, newRole) => {
    if (!collab.userId?.email) return;
    setUpdatingRole(collab.userId._id);
    try {
      await documentsApi.share(document._id, { email: collab.userId.email, role: newRole });
      queryClient.invalidateQueries({ queryKey: ['document', document._id] });
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document" size="md">
      <div className="space-y-5">
        {/* Invite form */}
        <form onSubmit={handleShare} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              className="input flex-1"
              placeholder="Enter email address..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select
              className="input w-32 flex-shrink-0"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={shareDocument.isPending || !email.trim()}
            className="btn-primary w-full"
          >
            <UserPlus size={15} />
            {shareDocument.isPending ? 'Sharing...' : 'Invite'}
          </button>
        </form>

        {/* People with access */}
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            People with access
          </p>
          <div className="space-y-1">
            {/* Owner */}
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
              <Avatar user={document.ownerId} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {document.ownerId?.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{document.ownerId?.email}</p>
              </div>
              <span className="flex items-center gap-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                <Crown size={10} /> Owner
              </span>
            </div>

            {/* Collaborators */}
            {document.collaborators?.length > 0 ? (
              document.collaborators.map((collab) => (
                <div
                  key={collab.userId?._id || collab._id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <Avatar user={collab.userId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {collab.userId?.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{collab.userId?.email}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <select
                      className="text-xs border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-50"
                      value={collab.role}
                      disabled={updatingRole === collab.userId?._id}
                      onChange={(e) => handleRoleChange(collab, e.target.value)}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemove(collab.userId?._id)}
                      disabled={removing === collab.userId?._id}
                      className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-3">
                No collaborators yet. Invite someone above.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
