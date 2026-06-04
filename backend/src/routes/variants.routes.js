const router = require('express').Router();
const ctrl   = require('../controllers/variants.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',                    authenticate,                        ctrl.list);
router.get('/preview-sku',         authenticate,                        ctrl.previewSku);
router.get('/:id',                 authenticate,                        ctrl.getById);
router.post('/',                   authenticate, requireRole(['product']), ctrl.create);
router.put('/bulk-status/update',  authenticate, requireRole(['product']), ctrl.bulkUpdateStatus);
router.put('/bulk-channel/update', authenticate, requireRole(['product']), ctrl.bulkUpdateChannel);
router.put('/:id',                 authenticate, requireRole(['product']), ctrl.update);
router.delete('/:id',              authenticate, requireRole(['product']), ctrl.remove);

module.exports = router;
