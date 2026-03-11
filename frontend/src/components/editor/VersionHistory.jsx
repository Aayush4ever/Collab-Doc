import { useState } from 'react';
import { Clock, RotateCcw, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { versionsApi } from '../../services/api';
import { useEditorStore } from '../../store/editorStore';
import { formatDistanceToNow, format } from 'date-fns';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

export default function VersionHistory({ documentId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { setContent, setTitle } = useEditorStore();
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['versions', documentId],
    queryFn: () => versionsApi.getByDocument(documentId).then(r => r.data.versions),
    enabled: isOpen && !!documentId,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId) => versionsApi.restore(documentId, versionId).then(r => r.data),
    onSuccess: (res) => {
      const doc = res.document;
      if (doc) {
        setContent(doc.content || '');
        setTitle(doc.title || 'Untitled Document');
        queryClient.invalidateQueries({ queryKey: ['document', documentId] });
        queryClient.invalidateQueries({ queryKey: ['versions', documentId] });
      }
      toast.success('Version restored successfully');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to restore version'),
  });

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-slate-500" />
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Version History</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}
          </div>
        ) : !data?.length ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No saved versions yet. Versions are created automatically as you edit.
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {data.map((version, idx) => (
              <div
                key={version._id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => setExpandedId(expandedId === version._id ? null : version._id)}
                >
                  <Avatar user={version.editedBy} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{version.label || `Version ${version.versionNumber}`}</span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded flex-shrink-0">
                          Latest
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 flex-shrink-0 transition-transform ${expandedId === version._id ? 'rotate-180' : ''}`}
                  />
                </div>

                {expandedId === version._id && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <p className="text-[11px] text-slate-500">
                      {format(new Date(version.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      By {version.editedBy?.name || 'Unknown'}
                    </p>
                    <button
                      onClick={() => restoreMutation.mutate(version._id)}
                      disabled={restoreMutation.isPending || idx === 0}
                      className="btn-secondary w-full text-xs py-1.5 disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      {idx === 0 ? 'Current version' : restoreMutation.isPending ? 'Restoring...' : 'Restore this version'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
