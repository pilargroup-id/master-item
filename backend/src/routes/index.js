const router = require('express').Router();

router.use('/auth',       require('./auth.routes'));
router.use('/parents',    require('./parents.routes'));
router.use('/variants',   require('./variants.routes'));
router.use('/bundles',    require('./bundles.routes'));
router.use('/categories', require('./categories.routes'));
router.use('/options',    require('./options.routes'));
router.use('/search',     require('./search.routes'));
router.use('/master',     require('./master.routes'));
router.use('/stats',      require('./stats.routes'));

module.exports = router;
