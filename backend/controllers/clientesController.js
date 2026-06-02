const db = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, busca } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (busca) {
      where += ' AND (name LIKE ? OR cpf_cnpj LIKE ? OR email LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    const [rows] = await db.query(
      `SELECT *
       FROM customers
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM customers ${where}`, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });

    const [deliveries] = await db.query(
      `SELECT id, codigo, status, data_prevista
       FROM entregas WHERE customer_id = ?
       ORDER BY criado_em DESC LIMIT 10`,
      [req.params.id]
    );

    const [orders] = await db.query(
      `SELECT id, order_code, status, created_at
       FROM customer_orders WHERE customer_id = ?
       ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], deliveries, orders } });
  } catch (error) {
    next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const {
      name, cpf_cnpj, email, phone, zip_code, street,
      neighborhood, city, state
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO customers
      (name, cpf_cnpj, email, phone, zip_code, street, neighborhood, city, state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, cpf_cnpj, email, phone, zip_code, street, neighborhood, city, state]
    );

    res.status(201).json({ success: true, message: 'Cliente cadastrado com sucesso', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const {
      name, cpf_cnpj, email, phone, zip_code, street,
      neighborhood, city, state
    } = req.body;

    const [rows] = await db.query('SELECT id FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });

    await db.query(
      `UPDATE customers SET
      name = ?, cpf_cnpj = ?, email = ?, phone = ?, zip_code = ?, street = ?, neighborhood = ?, city = ?, state = ?
      WHERE id = ?`,
      [name, cpf_cnpj, email, phone, zip_code, street, neighborhood, city, state, req.params.id]
    );

    res.json({ success: true, message: 'Cliente atualizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

const excluir = async (req, res, next) => {
  try {
    const [inUse] = await db.query("SELECT id FROM entregas WHERE customer_id = ? AND status IN ('em_preparacao', 'em_rota')", [req.params.id]);
    if (inUse.length) {
      return res.status(400).json({ success: false, message: 'Cliente possui entregas em andamento' });
    }

    await db.query('UPDATE entregas SET customer_id = NULL WHERE customer_id = ?', [req.params.id]);
    await db.query('DELETE FROM customer_orders WHERE customer_id = ?', [req.params.id]);
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Cliente não encontrado' });

    res.json({ success: true, message: 'Cliente removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

const estatisticas = async (req, res, next) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
        COUNT(*) as total_customers,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_last_30_days
      FROM customers`
    );

    const [[relations]] = await db.query(
      `SELECT
        COUNT(DISTINCT customer_id) as customers_with_deliveries,
        COUNT(*) as total_orders
      FROM customer_orders`
    );

    res.json({ success: true, data: { ...stats, ...relations } });
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir, estatisticas };
