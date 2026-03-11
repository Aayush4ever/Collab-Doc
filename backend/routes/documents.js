const express = require('express');
const { body } = require('express-validator');
const {
  getDocuments,
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
} = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getDocuments);

router.post(
  '/',
  [body('title').optional().isString().isLength({ max: 200 })],
  validate,
  createDocument
);

router.get('/:id', getDocument);

router.put(
  '/:id',
  [
    body('title').optional().isString().isLength({ max: 200 }),
    body('content').optional().isString(),
  ],
  validate,
  updateDocument
);

router.delete('/:id', deleteDocument);

router.post(
  '/:id/share',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor'),
  ],
  validate,
  shareDocument
);

router.delete('/:id/collaborators/:userId', removeCollaborator);

module.exports = router;
