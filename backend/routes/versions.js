const express = require('express');
const { getVersions, restoreVersion } = require('../controllers/versionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/:documentId', getVersions);
router.post('/:documentId/restore/:versionId', restoreVersion);

module.exports = router;
