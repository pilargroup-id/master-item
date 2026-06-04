const router = require('express').Router();

// ── Core ─────────────────────────────────────────────────────────────────────
router.use('/auth',         require('./auth.routes'));
router.use('/stats',        require('./stats.routes'));

// ── Parent SKUs ───────────────────────────────────────────────────────────────
router.use('/parent-skus',  require('./parent-skus.routes'));   // CRUD + similar-sub-brands
router.use('/master-items', require('./master-items.routes'));  // form-options + preview-sku

// ── Variant & Bundle ──────────────────────────────────────────────────────────
router.use('/variants',     require('./variants.routes'));
router.use('/bundles',      require('./bundles.routes'));

// ── Master Data & Lookup ──────────────────────────────────────────────────────
router.use('/master',       require('./master.routes'));
router.use('/options',      require('./options.routes'));
router.use('/categories',   require('./categories.routes'));

// ── Search & Export ───────────────────────────────────────────────────────────
router.use('/search',       require('./search.routes'));

// ── API Docs ──────────────────────────────────────────────────────────────────
router.use('/endpoints',    require('./endpoints.routes'));

module.exports = router;
