const bcrypt = require('bcryptjs');
const pool = require('./db');

async function checkAndFixUser() {
  try {
    // Check existing users
    const [users] = await pool.query('SELECT id, name, username, division, is_active FROM sku_users');
    console.log('=== EXISTING USERS ===');
    console.log(JSON.stringify(users, null, 2));

    // Check if bayu exists
    const [[bayu]] = await pool.query('SELECT * FROM sku_users WHERE username = ?', ['bayu']);
    
    if (bayu) {
      console.log('\n=== USER BAYU FOUND ===');
      console.log('ID:', bayu.id);
      console.log('Name:', bayu.name);
      console.log('Username:', bayu.username);
      console.log('Division:', bayu.division);
      console.log('is_active:', bayu.is_active);
      
      // Test password
      const valid = await bcrypt.compare('123', bayu.password);
      console.log('\nPassword "123" valid:', valid);
      
      if (!valid) {
        // Reset password
        const hash = await bcrypt.hash('123', 10);
        await pool.query('UPDATE sku_users SET password = ? WHERE username = ?', [hash, 'bayu']);
        console.log('Password reset to "123" done!');
      }
      
      // Ensure active
      if (!bayu.is_active) {
        await pool.query('UPDATE sku_users SET is_active = 1 WHERE username = ?', ['bayu']);
        console.log('User activated!');
      }
    } else {
      console.log('\n=== USER BAYU NOT FOUND - CREATING ===');
      const hash = await bcrypt.hash('123', 10);
      await pool.query(
        'INSERT INTO sku_users (name, username, password, division, is_active) VALUES (?, ?, ?, ?, ?)',
        ['Bayu', 'bayu', hash, 'product', 1]
      );
      console.log('User bayu created with password 123!');
    }
    
    console.log('\n=== DONE ===');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

checkAndFixUser();
