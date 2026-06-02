const db = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, busca } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND m.status = ?'; params.push(status); }
    if (busca) { where += ' AND (m.nome LIKE ? OR m.cpf LIKE ? OR m.cnh LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`); }

    const [rows] = await db.query(
      `SELECT m.*, u.nome as usuario_nome, v.license_plate, v.model as vehicle_model FROM motoristas m
       LEFT JOIN usuarios u ON m.usuario_id = u.id
       LEFT JOIN vehicles v ON v.id = m.vehicle_id
       ${where} ORDER BY m.nome LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM motoristas m ${where}`, params);

    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, u.nome as usuario_nome, v.license_plate, v.model as vehicle_model FROM motoristas m
       LEFT JOIN usuarios u ON m.usuario_id = u.id
       LEFT JOIN vehicles v ON v.id = m.vehicle_id
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });

    // Buscar entregas do motorista
    const [entregas] = await db.query(
      'SELECT id, codigo, cliente_nome, status, data_prevista FROM entregas WHERE motorista_id = ? ORDER BY criado_em DESC LIMIT 5',
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], entregas_recentes: entregas } });
  } catch (error) { next(error); }
};

const criar = async (req, res, next) => {
  try {
    const { nome, cpf, telefone, cnh, categoria_cnh, veiculo, placa_veiculo, status, usuario_id, observacoes, vehicle_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO motoristas (nome, cpf, telefone, cnh, categoria_cnh, veiculo, placa_veiculo, status, usuario_id, observacoes, vehicle_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, cpf, telefone, cnh, categoria_cnh || 'B', veiculo, placa_veiculo, status || 'ativo', usuario_id || null, observacoes, vehicle_id || null]
    );

    res.status(201).json({ success: true, message: 'Motorista cadastrado com sucesso', data: { id: result.insertId } });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const { nome, cpf, telefone, cnh, categoria_cnh, veiculo, placa_veiculo, status, usuario_id, observacoes, vehicle_id } = req.body;
    const [rows] = await db.query('SELECT id FROM motoristas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });

    await db.query(
      `UPDATE motoristas SET nome=?, cpf=?, telefone=?, cnh=?, categoria_cnh=?, veiculo=?, placa_veiculo=?, status=?, usuario_id=?, observacoes=?, vehicle_id=? WHERE id=?`,
      [nome, cpf, telefone, cnh, categoria_cnh || 'B', veiculo, placa_veiculo, status || 'ativo', usuario_id || null, observacoes, vehicle_id || null, req.params.id]
    );

    res.json({ success: true, message: 'Motorista atualizado com sucesso' });
  } catch (error) { next(error); }
};

const excluir = async (req, res, next) => {
  try {
    // Verificar se tem entregas em andamento
    const [entregas] = await db.query(
      "SELECT id FROM entregas WHERE motorista_id = ? AND status IN ('em_preparacao','em_rota')",
      [req.params.id]
    );
    if (entregas.length) {
      return res.status(400).json({ success: false, message: 'Motorista possui entregas em andamento. Finalize-as antes de excluir.' });
    }

    const [result] = await db.query('DELETE FROM motoristas WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Motorista não encontrado' });
    res.json({ success: true, message: 'Motorista excluído com sucesso' });
  } catch (error) { next(error); }
};

const estatisticas = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'em_rota' THEN 1 ELSE 0 END) as em_rota,
        SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) as inativos
      FROM motoristas
    `);
    res.json({ success: true, data: stats[0] });
  } catch (error) { next(error); }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir, estatisticas };
