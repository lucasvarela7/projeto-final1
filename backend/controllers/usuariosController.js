const bcrypt = require('bcryptjs');
const db = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, cargo, busca } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (cargo) { where += ' AND cargo = ?'; params.push(cargo); }
    if (busca) { where += ' AND (nome LIKE ? OR email LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`); }

    const [rows] = await db.query(
      `SELECT id, nome, email, cargo, ativo, ultimo_login, criado_em FROM usuarios ${where} ORDER BY nome LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM usuarios ${where}`, params);

    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, nome, email, cargo, ativo, ultimo_login, criado_em FROM usuarios WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
};

const criar = async (req, res, next) => {
  try {
    const { nome, email, senha, cargo } = req.body;
    const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'E-mail já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const [result] = await db.query('INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)', [nome, email, senhaHash, cargo || 'operador']);

    res.status(201).json({ success: true, message: 'Usuário criado com sucesso', data: { id: result.insertId, nome, email, cargo: cargo || 'operador' } });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, email, cargo, ativo } = req.body;
    const [rows] = await db.query('SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    await db.query('UPDATE usuarios SET nome = ?, email = ?, cargo = ?, ativo = ? WHERE id = ?',
      [nome, email, cargo, ativo !== undefined ? ativo : 1, req.params.id]);

    res.json({ success: true, message: 'Usuário atualizado com sucesso' });
  } catch (error) { next(error); }
};

const excluir = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Não é possível excluir o próprio usuário' });
    }
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) { next(error); }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
