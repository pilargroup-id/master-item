const router = require('express').Router();
const ctrl   = require('../controllers/parents.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Endpoint statik harus di atas /:id agar tidak bentrok dengan dynamic param
router.get('/form-options',         authenticate,                        ctrl.getFormOptions);
router.get('/preview-sku',          authenticate,                        ctrl.previewSku);
router.get('/similar-sub-brands',   authenticate,                        ctrl.similarSubBrands);

router.get('/',     authenticate,                        ctrl.list);
router.get('/:id',  authenticate,                        ctrl.getById);
router.post('/',    authenticate, requireRole(['product']), ctrl.create);
router.put('/:id',  authenticate, requireRole(['product']), ctrl.update);
router.delete('/:id', authenticate, requireRole(['product']), ctrl.remove);

module.exports = router;
