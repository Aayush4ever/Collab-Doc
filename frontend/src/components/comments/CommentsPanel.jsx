import { useState, memo } from 'react';
import { MessageCircle, Check, Trash2, Reply } from 'lucide-react';
import { useComments, useCreateComment, useAddReply, useResolveComment, useDeleteComment } from '../../hooks/useComments';
import Avatar from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const CommentItem = memo(({ comment, documentId }) => {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const { user } = useAuthStore();
  const addReply = useAddReply(documentId);
  const resolveComment = useResolveComment(documentId);
  const deleteComment = useDeleteComment(documentId);

  const isOwner = (comment.userId?._id || comment.userId) === user?._id;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await addReply.mutateAsync({ commentId: comment._id, content: replyText });
      setReplyText('');
      setShowReplyBox(false);
    } catch {}
  };

  return (
    <div className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden transition-opacity ${comment.isResolved ? 'opacity-60' : ''}`}>
      <div className="p-3">
        <div className="flex items-start gap-2">
          <Avatar user={comment.userId} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {comment.userId?.name || 'Unknown'}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isResolved && (
                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                  Resolved
                </span>
              )}
            </div>

            {comment.selectedText && (
              <div className="text-[11px] bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 pl-2 py-1 mb-2 text-slate-600 dark:text-slate-400 italic line-clamp-2">
                "{comment.selectedText}"
              </div>
            )}

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">
              {comment.content}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-2 pl-6">
          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="text-[11px] text-slate-500 hover:text-sky-500 flex items-center gap-1 transition-colors"
          >
            <Reply size={11} /> Reply
          </button>
          <button
            onClick={() => resolveComment.mutate(comment._id)}
            disabled={resolveComment.isPending}
            className={`text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50 ${
              comment.isResolved ? 'text-green-500' : 'text-slate-500 hover:text-green-500'
            }`}
          >
            <Check size={11} />
            {comment.isResolved ? 'Unresolve' : 'Resolve'}
          </button>
          {isOwner && (
            <button
              onClick={() => deleteComment.mutate(comment._id)}
              disabled={deleteComment.isPending}
              className="text-[11px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-auto disabled:opacity-50"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReplyBox && (
          <div className="mt-2 pl-6 flex gap-2">
            <input
              className="input text-xs py-1.5 flex-1"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleReply(); }}
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || addReply.isPending}
              className="btn-primary text-xs py-1 px-2 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
          {comment.replies.map((reply) => (
            <div key={reply._id} className="flex items-start gap-2 px-3 py-2">
              <Avatar user={reply.userId} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-slate-900 dark:text-slate-100">
                    {reply.userId?.name || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 break-words">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CommentItem.displayName = 'CommentItem';

export default function CommentsPanel({ documentId, isOpen, onClose }) {
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState('open');
  const { data: comments, isLoading } = useComments(documentId);
  const createComment = useCreateComment(documentId);

  if (!isOpen) return null;

  const filteredComments = comments?.filter(c =>
    filter === 'all' ? true : filter === 'open' ? !c.isResolved : c.isResolved
  ) || [];

  const handleCreate = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({ content: newComment.trim() });
      setNewComment('');
    } catch {}
  };

  const openCount = comments?.filter(c => !c.isResolved).length || 0;

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-slate-500" />
          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Comments</span>
          {openCount > 0 && (
            <span className="bg-sky-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {openCount > 9 ? '9+' : openCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      {/* New comment */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <textarea
          className="input text-sm resize-none"
          style={{ height: '72px' }}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleCreate(); }}
        />
        <button
          onClick={handleCreate}
          disabled={createComment.isPending || !newComment.trim()}
          className="btn-primary w-full mt-2 text-xs disabled:opacity-50"
        >
          {createComment.isPending ? 'Adding...' : 'Add Comment'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        {['open', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-500'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-lg" />)}
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            No {filter !== 'all' ? filter : ''} comments yet
          </div>
        ) : (
          filteredComments.map(comment => (
            <CommentItem key={comment._id} comment={comment} documentId={documentId} />
          ))
        )}
      </div>
    </div>
  );
}
