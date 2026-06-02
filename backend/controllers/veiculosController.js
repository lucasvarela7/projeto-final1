const db = require('../config/db');

const listar = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const { status, busca } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND v.status = ?';
      params.push(status);
    }
    if (busca) {
      where += ' AND (v.license_plate LIKE ? OR v.model LIKE ? OR v.manufacturer LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    const [rows] = await db.query(
      `SELECT v.*, m.nome as driver_name
       FROM vehicles v
       LEFT JOIN motoristas m ON m.vehicle_id = v.id
       ${where}
       ORDER BY v.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM vehicles v ${where}`, params);

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
    const [rows] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });

    const [rotas] = await db.query(
      `SELECT r.id, r.nome, r.cidade_origem, r.cidade_destino
       FROM vehicle_routes vr
       JOIN rotas r ON r.id = vr.route_id
       WHERE vr.vehicle_id = ?`,
      [req.params.id]
    );

    const [deliveries] = await db.query(
      `SELECT id, codigo, cliente_nome, status, data_prevista
       FROM entregas
       WHERE vehicle_id = ?
       ORDER BY criado_em DESC
       LIMIT 5`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], routes: rotas, latest_deliveries: deliveries } });
  } catch (error) {
    next(error);
  }
};

const criar = async (req, res, next) => {
  try {
    const { license_plate, model, manufacturer, year, cargo_capacity, fuel_type, status, route_ids = [] } = req.body;

    const [result] = await db.query(
      `INSERT INTO vehicles
      (license_plate, model, manufacturer, year, cargo_capacity, fuel_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [license_plate, model, manufacturer, year, cargo_capacity, fuel_type, status || 'available']
    );

    if (Array.isArray(route_ids) && route_ids.length) {
      const values = route_ids.map((routeId) => [result.insertId, routeId]);
      await db.query('INSERT INTO vehicle_routes (vehicle_id, route_id) VALUES ?', [values]);
    }

    res.status(201).json({ success: true, message: 'Veículo cadastrado com sucesso', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const { license_plate, model, manufacturer, year, cargo_capacity, fuel_type, status, route_ids = [] } = req.body;
    const [rows] = await db.query('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });

    await db.query(
      `UPDATE vehicles SET
      license_plate = ?, model = ?, manufacturer = ?, year = ?, cargo_capacity = ?, fuel_type = ?, status = ?
      WHERE id = ?`,
      [license_plate, model, manufacturer, year, cargo_capacity, fuel_type, status || 'available', req.params.id]
    );

    await db.query('DELETE FROM vehicle_routes WHERE vehicle_id = ?', [req.params.id]);
    if (Array.isArray(route_ids) && route_ids.length) {
      const values = route_ids.map((routeId) => [req.params.id, routeId]);
      await db.query('INSERT INTO vehicle_routes (vehicle_id, route_id) VALUES ?', [values]);
    }

    res.json({ success: true, message: 'Veículo atualizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

const excluir = async (req, res, next) => {
  try {
    const [inUse] = await db.query("SELECT id FROM entregas WHERE vehicle_id = ? AND status IN ('em_preparacao','em_rota')", [req.params.id]);
    if (inUse.length) {
      return res.status(400).json({ success: false, message: 'Veículo possui entregas em andamento' });
    }

    await db.query('UPDATE motoristas SET vehicle_id = NULL WHERE vehicle_id = ?', [req.params.id]);
    await db.query('DELETE FROM vehicle_routes WHERE vehicle_id = ?', [req.params.id]);
    const [result] = await db.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Veículo não encontrado' });

    res.json({ success: true, message: 'Veículo removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

const estatisticas = async (req, res, next) => {
  try {
    const [[fleet]] = await db.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM vehicles`
    );

    const [[relations]] = await db.query(
      `SELECT
        COUNT(DISTINCT m.id) as drivers_with_vehicle,
        COUNT(DISTINCT e.id) as deliveries_with_vehicle
      FROM vehicles v
      LEFT JOIN motoristas m ON m.vehicle_id = v.id
      LEFT JOIN entregas e ON e.vehicle_id = v.id`
    );

    res.json({ success: true, data: { ...fleet, ...relations } });
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir, estatisticas };
