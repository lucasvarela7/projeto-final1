const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Middleware de autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário no banco
    const [rows] = await db.query(
      'SELECT id, nome, email, cargo, ativo FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length || !rows[0].ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo'
      });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expirado' });
    }
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

/**
 * Middleware de autorização por cargo
 */
const authorize = (...cargos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Não autenticado' });
    }
    if (!cargos.includes(req.user.cargo)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
