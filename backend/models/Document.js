const mongoose = require('mongoose');

const collaboratorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'editor'],
    default: 'viewer',
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Untitled Document',
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [collaboratorSchema],
    isPublic: {
      type: Boolean,
      default: false,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    emoji: {
      type: String,
      default: '📄',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
documentSchema.index({ ownerId: 1, updatedAt: -1 });
documentSchema.index({ 'collaborators.userId': 1 });

// Safely extract the string ID whether ownerId/userId is populated (object) or raw ObjectId
const toIdString = (val) => {
  if (!val) return '';
  // Populated document: val is a User object with _id
  if (val._id) return val._id.toString();
  // Raw ObjectId or string
  return val.toString();
};

// Check if user has access (works whether or not document is populated)
documentSchema.methods.hasAccess = function (userId) {
  const userIdStr = userId.toString();
  if (toIdString(this.ownerId) === userIdStr) return true;
  return this.collaborators.some(c => toIdString(c.userId) === userIdStr);
};

documentSchema.methods.getUserRole = function (userId) {
  const userIdStr = userId.toString();
  if (toIdString(this.ownerId) === userIdStr) return 'owner';
  const collaborator = this.collaborators.find(c => toIdString(c.userId) === userIdStr);
  return collaborator ? collaborator.role : null;
};

const Document = mongoose.model('Document', documentSchema);
module.exports = Document;
