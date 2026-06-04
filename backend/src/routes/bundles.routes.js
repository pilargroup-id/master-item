const router = require('express').Router();
const ctrl   = require('../controllers/bundles.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/',     authenticate,                                   ctrl.list);
router.get('/:id',  authenticate,                                   ctrl.getById);
router.post('/',    authenticate, requireRole(['product', 'goto_ecommerce']), ctrl.create);
router.put('/:id',  authenticate, requireRole(['product']),          ctrl.update);
router.delete('/:id', authenticate, requireRole(['product']),        ctrl.remove);

module.exports = router;
