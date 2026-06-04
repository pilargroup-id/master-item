const router = require('express').Router();
const ctrl   = require('../controllers/options.controller');

router.get('/brands',     ctrl.brands);
router.get('/categories', ctrl.categories);
router.get('/item-types', ctrl.itemTypes);
router.get('/ports',      ctrl.ports);

module.exports = router;
