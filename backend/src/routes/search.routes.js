const router = require('express').Router();
const ctrl   = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

router.get('/',       authenticate, ctrl.search);
router.get('/export', authenticate, ctrl.exportData);

module.exports = router;
