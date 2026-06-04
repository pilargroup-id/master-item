const router = require('express').Router();
const ctrl   = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getDashboardStats);

module.exports = router;
