const Version = require('../models/Version');
const Document = require('../models/Document');

// GET /api/versions/:documentId
const getVersions = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) return res.status(404).json({ error: 'Document not found' });
    if (!document.hasAccess(req.user._id)) return res.status(403).json({ error: 'Access denied' });

    const versions = await Version.find({ documentId: req.params.documentId })
      .populate('editedBy', 'name email avatar')
      .sort({ versionNumber: -1 })
      .limit(50);

    res.json({ versions });
  } catch (error) {
    next(error);
  }
};

// POST /api/versions/:documentId/restore/:versionId
const restoreVersion = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.documentId);
    if (!document) return res.status(404).json({ error: 'Document not found' });

    const role = document.getUserRole(req.user._id);
    if (!role || role === 'viewer') return res.status(403).json({ error: 'Edit permission required' });

    const version = await Version.findById(req.params.versionId);
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Save current state as a new version before restoring
    const latestVersion = await Version.findOne({ documentId: document._id })
      .sort({ versionNumber: -1 });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    await Version.create({
      documentId: document._id,
      content: document.content,
      title: document.title,
      editedBy: req.user._id,
      versionNumber: nextVersionNumber,
      label: 'Auto-saved before restore',
    });

    // Restore the selected version
    document.content = version.content;
    document.title = version.title;
    document.lastEditedBy = req.user._id;
    await document.save();

    await document.populate('ownerId', 'name email avatar');
    await document.populate('collaborators.userId', 'name email avatar');

    res.json({ message: 'Version restored successfully', document });
  } catch (error) {
    next(error);
  }
};

// Internal: save a version snapshot (called from socket handler)
const saveVersion = async (documentId, content, title, userId) => {
  try {
    const latestVersion = await Version.findOne({ documentId })
      .sort({ versionNumber: -1 });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Don't create duplicate if content hasn't changed
    if (latestVersion && latestVersion.content === content) return null;

    return await Version.create({
      documentId,
      content,
      title: title || 'Untitled',
      editedBy: userId,
      versionNumber: nextVersionNumber,
    });
  } catch (error) {
    console.error('saveVersion error:', error.message);
    return null;
  }
};

module.exports = { getVersions, restoreVersion, saveVersion };
