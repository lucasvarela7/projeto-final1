const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'logitrack',
  password: process.env.DB_PASSWORD || 'LogiTrack@2024',
  database: process.env.DB_NAME || 'logitrack',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  waitForConnections: true,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '-03:00',
  dateStrings: false
});

// Testar conexão ao iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexão com MySQL estabelecida com sucesso');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
  });

module.exports = pool;
