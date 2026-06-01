const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    const [rows] = await db.query(
      'SELECT id, nome, email, senha, cargo, ativo FROM usuarios WHERE email = ?',
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    const usuario = rows[0];

    if (!usuario.ativo) {
      return res.status(403).json({ success: false, message: 'Usuário inativo. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Atualizar último login
    await db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [usuario.id]);

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, cargo: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          cargo: usuario.cargo
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { nome, email, senha, cargo } = req.body;

    // Verificar se email já existe
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const senhaHash = await bcrypt.hash(senha, rounds);

    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, cargo || 'operador']
    );

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      data: { id: result.insertId, nome, email, cargo: cargo || 'operador' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const me = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { senha_atual, nova_senha } = req.body;
    const [rows] = await db.query('SELECT senha FROM usuarios WHERE id = ?', [req.user.id]);

    const valida = await bcrypt.compare(senha_atual, rows[0].senha);
    if (!valida) {
      return res.status(400).json({ success: false, message: 'Senha atual incorreta' });
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const novaHash = await bcrypt.hash(nova_senha, rounds);
    await db.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaHash, req.user.id]);

    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, me, changePassword };
