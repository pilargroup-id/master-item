require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/parents',    require('./routes/parents'));
app.use('/api/variants',   require('./routes/variants'));
app.use('/api/bundles',    require('./routes/bundles'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/options',    require('./routes/options'));
app.use('/api/search',     require('./routes/search'));
app.use('/api/master',     require('./routes/master'));

// Stats route
app.use('/api/stats',      require('./routes/stats'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SKU Generator API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     SKU Generator API - Pilar Group      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Server   : http://localhost:${PORT}         ║`);
  console.log(`║  Database : ${process.env.DB_NAME || 'db_masteritem'}               ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
