const app  = require('./app');

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     SKU Generator API - Pilar Group      ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Server   : http://localhost:${PORT}         ║`);
  console.log(`║  Database : ${(process.env.DB_NAME || 'db_masteritem').padEnd(14)}              ║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
