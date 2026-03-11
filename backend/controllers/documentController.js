const Document = require('../models/Document');
const Version = require('../models/Version');
const User = require('../models/User');
const { sanitizeHtml } = require('../utils/sanitize');

// Helper: safely compare an ObjectId that may or may not be populated
const idStr = (val) => {
  if (!val) return '';
  if (val._id) return val._id.toString(); // populated User object
  return val.toString();                  // raw ObjectId or string
};

// GET /api/documents
const getDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { search, filter = 'all' } = req.query;

    let query = {};

    if (filter === 'owned') {
      query.ownerId = userId;
    } else if (filter === 'shared') {
      query['collaborators.userId'] = userId;
    } else {
      query.$or = [
        { ownerId: userId },
        { 'collaborators.userId': userId },
      ];
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const documents = await Document.find(query)
      .populate('ownerId', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

// POST /api/documents
const createDocument = async (req, res, next) => {
  try {
    const { title, content, emoji } = req.body;

    const document = new Document({
      title: title || 'Untitled Document',
      content: content || '',
      ownerId: req.user._id,
      emoji: emoji || '📄',
      lastEditedBy: req.user._id,
    });

    await document.save();
    await document.populate('ownerId', 'name email avatar');

    // Create initial version
    await Version.create({
      documentId: document._id,
      content: document.content,
      title: document.title,
      editedBy: req.user._id,
      versionNumber: 1,
      label: 'Initial version',
    });

    res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
};

// GET /api/documents/:id
const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('ownerId', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // hasAccess uses the safe idStr helper inside the model
    if (!document.hasAccess(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const role = document.getUserRole(req.user._id);
    res.json({ document, role });
  } catch (error) {
    next(error);
  }
};

// PUT /api/documents/:id
const updateDocument = async (req, res, next) => {
  try {
    // Fetch WITHOUT populate so ownerId is a raw ObjectId — safe for getUserRole
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const role = document.getUserRole(req.user._id);
    if (!role || role === 'viewer') {
      return res.status(403).json({ error: 'You do not have edit permissions' });
    }

    const { title, content, emoji } = req.body;
    const updates = { lastEditedBy: req.user._id };

    if (title !== undefined) updates.title = title;
    if (emoji !== undefined) updates.emoji = emoji;
    if (content !== undefined) {
      updates.content = sanitizeHtml(content);
      const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/);
      updates.wordCount = content.trim() ? words.length : 0;
    }

    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('ownerId', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar');

    res.json({ document: updatedDocument });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (idStr(document.ownerId) !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    await document.deleteOne();
    await Version.deleteMany({ documentId: req.params.id });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/documents/:id/share
const shareDocument = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (idStr(document.ownerId) !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can share this document' });
    }

    const userToShare = await User.findOne({ email: email.toLowerCase() });
    if (!userToShare) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    if (userToShare._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }

    const existingCollabIndex = document.collaborators.findIndex(
      c => idStr(c.userId) === userToShare._id.toString()
    );

    if (existingCollabIndex >= 0) {
      document.collaborators[existingCollabIndex].role = role;
    } else {
      document.collaborators.push({ userId: userToShare._id, role });
    }

    await document.save();
    await document.populate('collaborators.userId', 'name email avatar');
    await document.populate('ownerId', 'name email avatar');

    res.json({
      message: `Document shared with ${userToShare.name}`,
      document,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/documents/:id/collaborators/:userId
const removeCollaborator = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (idStr(document.ownerId) !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the owner can remove collaborators' });
    }

    document.collaborators = document.collaborators.filter(
      c => idStr(c.userId) !== req.params.userId
    );

    await document.save();
    res.json({ message: 'Collaborator removed', document });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
};
