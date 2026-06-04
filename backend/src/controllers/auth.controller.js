const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

function mapDivisionByDept(deptCode) {
  if (!deptCode) return 'goto_ecommerce';
  if (['SIT', 'BOD'].includes(deptCode)) return 'admin';
  if (['PRO', 'MKT'].includes(deptCode)) return 'product';
  return 'goto_ecommerce';
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
    }

    const uname = username.toLowerCase().trim();

    const [[cu]] = await pool.query(
      `SELECT cu.*, md.code AS dept_code
       FROM central_users cu
       LEFT JOIN central_user_departments cud ON cu.id = cud.user_id AND cud.is_primary = 1
       LEFT JOIN master_departments md ON cud.department_id = md.id
       WHERE cu.username = ? AND cu.is_active = 1`,
      [uname]
    );

    let [[user]] = await pool.query(
      'SELECT * FROM sku_users WHERE username = ? AND is_active = 1',
      [uname]
    );

    if (cu) {
      const isValid = await bcrypt.compare(password, cu.password);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
      }

      const division = mapDivisionByDept(cu.dept_code);

      await pool.query(
        `INSERT INTO sku_users (id, name, username, password, division, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), division=VALUES(division), is_active=1`,
        [cu.id, cu.name, cu.username, cu.password, division]
      );

      user = { id: cu.id, name: cu.name, username: cu.username, division };
    } else if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Username atau password salah.' });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, division: user.division, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: { id: user.id, name: user.name, username: user.username, division: user.division },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const me = (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { login, me };
