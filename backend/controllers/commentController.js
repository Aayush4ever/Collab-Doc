const Comment = require('../models/Comment');
const Document = require('../models/Document');
const { sanitizeHtml } = require('../utils/sanitize');

// GET /api/comments/:documentId
const getComments = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (!document.hasAccess(req.user._id)) return res.status(403).json({ error: 'Access denied' });

    const comments = await Comment.find({ documentId: req.params.documentId })
      .populate('userId', 'name email avatar')
      .populate('replies.userId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments
const createComment = async (req, res, next) => {
  try {
    const { documentId, content, selectedText, position } = req.body;

    const document = await Document.findById(documentId);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (!document.hasAccess(req.user._id)) return res.status(403).json({ error: 'Access denied' });

    const comment = new Comment({
      documentId,
      userId: req.user._id,
      content: sanitizeHtml(content),
      selectedText,
      position,
    });

    await comment.save();
    await comment.populate('userId', 'name email avatar');

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/replies
const addReply = async (req, res, next) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const document = await Document.findById(comment.documentId);
    if (!document.hasAccess(req.user._id)) return res.status(403).json({ error: 'Access denied' });

    comment.replies.push({
      userId: req.user._id,
      content: sanitizeHtml(content),
    });

    await comment.save();
    await comment.populate('userId', 'name email avatar');
    await comment.populate('replies.userId', 'name email avatar');

    res.json({ comment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id/resolve
const resolveComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const document = await Document.findById(comment.documentId);
    const role = document.getUserRole(req.user._id);
    if (!role || role === 'viewer') return res.status(403).json({ error: 'Permission denied' });

    comment.isResolved = !comment.isResolved;
    comment.resolvedBy = comment.isResolved ? req.user._id : undefined;
    comment.resolvedAt = comment.isResolved ? new Date() : undefined;

    await comment.save();
    res.json({ comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, createComment, addReply, resolveComment, deleteComment };
