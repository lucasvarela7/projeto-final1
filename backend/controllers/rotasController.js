const db = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, ativa, busca } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (ativa !== undefined) { where += ' AND ativa = ?'; params.push(ativa); }
    if (busca) { where += ' AND (nome LIKE ? OR cidade_origem LIKE ? OR cidade_destino LIKE ? OR regiao LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`, `%${busca}%`); }

    const [rows] = await db.query(
      `SELECT * FROM rotas ${where} ORDER BY nome LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM rotas ${where}`, params);

    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM rotas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Rota não encontrada' });

    const [entregas] = await db.query(
      'SELECT COUNT(*) as total FROM entregas WHERE rota_id = ?', [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], total_entregas: entregas[0].total } });
  } catch (error) { next(error); }
};

const criar = async (req, res, next) => {
  try {
    const { nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado, descricao } = req.body;

    const [result] = await db.query(
      'INSERT INTO rotas (nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado, descricao]
    );

    res.status(201).json({ success: true, message: 'Rota criada com sucesso', data: { id: result.insertId } });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado, descricao, ativa } = req.body;
    const [rows] = await db.query('SELECT id FROM rotas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Rota não encontrada' });

    await db.query(
      'UPDATE rotas SET nome=?, cidade_origem=?, cidade_destino=?, regiao=?, distancia_km=?, tempo_estimado=?, descricao=?, ativa=? WHERE id=?',
      [nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado, descricao, ativa !== undefined ? ativa : 1, req.params.id]
    );

    res.json({ success: true, message: 'Rota atualizada com sucesso' });
  } catch (error) { next(error); }
};

const excluir = async (req, res, next) => {
  try {
    const [entregas] = await db.query("SELECT id FROM entregas WHERE rota_id = ? AND status IN ('em_preparacao','em_rota')", [req.params.id]);
    if (entregas.length) return res.status(400).json({ success: false, message: 'Rota possui entregas em andamento' });

    const [result] = await db.query('DELETE FROM rotas WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Rota não encontrada' });
    res.json({ success: true, message: 'Rota excluída com sucesso' });
  } catch (error) { next(error); }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
