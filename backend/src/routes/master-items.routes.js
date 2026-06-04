const router = require('express').Router();
const ctrl = require('../controllers/parents.controller');
const { authenticate } = require('../middleware/auth');

router.get('/form-options', authenticate, ctrl.getFormOptions);
router.get('/preview-sku', authenticate, ctrl.previewSku);

module.exports = router;
