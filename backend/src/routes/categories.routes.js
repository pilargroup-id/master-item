const router = require('express').Router();
const ctrl   = require('../controllers/categories.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.list);

module.exports = router;
