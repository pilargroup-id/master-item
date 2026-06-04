const router = require('express').Router();
const ctrl = require('../controllers/endpoints.controller');

router.get('/', ctrl.list);
router.get('/markdown', ctrl.markdown);

module.exports = router;
