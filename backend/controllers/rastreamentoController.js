const db = require('../config/db');

const historico = async (req, res, next) => {
  try {
    const { entrega_id } = req.params;

    const [entrega] = await db.query('SELECT id, codigo, status FROM entregas WHERE id = ?', [entrega_id]);
    if (!entrega.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });

    const [rows] = await db.query(
      `SELECT r.*, u.nome as atualizado_por_nome
       FROM rastreamento r
       LEFT JOIN usuarios u ON r.atualizado_por = u.id
       WHERE r.entrega_id = ? ORDER BY r.criado_em ASC`,
      [entrega_id]
    );

    res.json({ success: true, data: { entrega: entrega[0], historico: rows } });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const { entrega_id } = req.params;
    const { localizacao, latitude, longitude, status, descricao } = req.body;

    const [entrega] = await db.query('SELECT id, status FROM entregas WHERE id = ?', [entrega_id]);
    if (!entrega.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });

    if (entrega[0].status === 'entregue' || entrega[0].status === 'cancelada') {
      return res.status(400).json({ success: false, message: 'Não é possível atualizar uma entrega finalizada' });
    }

    // Inserir registro de rastreamento
    const [result] = await db.query(
      'INSERT INTO rastreamento (entrega_id, localizacao, latitude, longitude, status, descricao, atualizado_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [entrega_id, localizacao, latitude || null, longitude || null, status, descricao, req.user.id]
    );

    // Atualizar status da entrega
    const dataEntrega = status === 'entregue' ? ', data_entrega = NOW()' : '';
    await db.query(`UPDATE entregas SET status = ?${dataEntrega} WHERE id = ?`, [status, entrega_id]);

    // Se em_rota, atualizar status do motorista
    if (status === 'em_rota') {
      const [ent] = await db.query('SELECT motorista_id FROM entregas WHERE id = ?', [entrega_id]);
      if (ent[0]?.motorista_id) {
        await db.query("UPDATE motoristas SET status = 'em_rota' WHERE id = ?", [ent[0].motorista_id]);
      }
    }

    if (status === 'entregue' || status === 'cancelada') {
      const [ent] = await db.query('SELECT motorista_id FROM entregas WHERE id = ?', [entrega_id]);
      if (ent[0]?.motorista_id) {
        await db.query("UPDATE motoristas SET status = 'ativo' WHERE id = ?", [ent[0].motorista_id]);
      }
    }

    res.status(201).json({ success: true, message: 'Rastreamento atualizado com sucesso', data: { id: result.insertId } });
  } catch (error) { next(error); }
};

const listarTodos = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await db.query(
      `SELECT r.*, e.codigo, e.cliente_nome, u.nome as atualizado_por_nome
       FROM rastreamento r
       JOIN entregas e ON r.entrega_id = e.id
       LEFT JOIN usuarios u ON r.atualizado_por = u.id
       ORDER BY r.criado_em DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM rastreamento');

    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

module.exports = { historico, atualizar, listarTodos };
