const express = require('express');
const { body } = require('express-validator');
const { getComments, createComment, addReply, resolveComment, deleteComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);

router.get('/:documentId', getComments);
router.post(
  '/',
  [
    body('documentId').notEmpty().withMessage('Document ID required'),
    body('content').notEmpty().trim().withMessage('Comment content required'),
  ],
  validate,
  createComment
);
router.post('/:id/replies', [body('content').notEmpty().trim()], validate, addReply);
router.put('/:id/resolve', resolveComment);
router.delete('/:id', deleteComment);

module.exports = router;
