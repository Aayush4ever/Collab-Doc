const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
    },
    content: {
      type: String,
      default: '',   // was `required: true` — empty docs are valid
    },
    title: {
      type: String,
      default: 'Untitled Document',
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      trim: true,
      maxlength: [100, 'Version label cannot exceed 100 characters'],
    },
  },
  { timestamps: true }
);

versionSchema.index({ documentId: 1, versionNumber: -1 });

const Version = mongoose.model('Version', versionSchema);
module.exports = Version;
