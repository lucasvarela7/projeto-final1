const db = require('../config/db');

// Gerar código único de entrega
const gerarCodigo = async () => {
  const ano = new Date().getFullYear();
  const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM entregas WHERE YEAR(criado_em) = ?', [ano]);
  return `LT-${ano}-${String(total + 1).padStart(4, '0')}`;
};

const listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, motorista_id, busca, data_inicio, data_fim } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND e.status = ?'; params.push(status); }
    if (motorista_id) { where += ' AND e.motorista_id = ?'; params.push(motorista_id); }
    if (busca) { where += ' AND (e.codigo LIKE ? OR e.cliente_nome LIKE ? OR e.endereco_destino LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`); }
    if (data_inicio) { where += ' AND e.data_prevista >= ?'; params.push(data_inicio); }
    if (data_fim) { where += ' AND e.data_prevista <= ?'; params.push(data_fim); }

    const [rows] = await db.query(
      `SELECT e.*, m.nome as motorista_nome, r.nome as rota_nome, v.license_plate as vehicle_plate,
              c.name as customer_name
       FROM entregas e
       LEFT JOIN motoristas m ON e.motorista_id = m.id
       LEFT JOIN vehicles v ON e.vehicle_id = v.id
       LEFT JOIN customers c ON e.customer_id = c.id
       LEFT JOIN rotas r ON e.rota_id = r.id
       ${where} ORDER BY e.criado_em DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM entregas e ${where}`, params);

    res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

const buscarPorId = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT e.*, m.nome as motorista_nome, m.telefone as motorista_telefone, r.nome as rota_nome,
              v.license_plate as vehicle_plate, c.name as customer_name
       FROM entregas e
       LEFT JOIN motoristas m ON e.motorista_id = m.id
       LEFT JOIN vehicles v ON e.vehicle_id = v.id
       LEFT JOIN customers c ON e.customer_id = c.id
       LEFT JOIN rotas r ON e.rota_id = r.id
       WHERE e.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });

    // Buscar histórico de rastreamento
    const [rastreamento] = await db.query(
      `SELECT r.*, u.nome as atualizado_por_nome FROM rastreamento r
       LEFT JOIN usuarios u ON r.atualizado_por = u.id
       WHERE r.entrega_id = ? ORDER BY r.criado_em ASC`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], rastreamento } });
  } catch (error) { next(error); }
};

const criar = async (req, res, next) => {
  try {
    const { cliente_nome, cliente_telefone, cliente_email, endereco_origem, endereco_destino,
      cidade_destino, cep_destino, motorista_id, rota_id, data_saida, data_prevista,
      peso_kg, volume_m3, valor_declarado, observacoes, vehicle_id, customer_id, route_distance_km } = req.body;

    const codigo = await gerarCodigo();

    const [result] = await db.query(
      `INSERT INTO entregas (codigo, cliente_nome, cliente_telefone, cliente_email, endereco_origem,
       endereco_destino, cidade_destino, cep_destino, motorista_id, rota_id, criado_por,
       data_saida, data_prevista, peso_kg, volume_m3, valor_declarado, observacoes, vehicle_id, customer_id, route_distance_km)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, cliente_nome, cliente_telefone, cliente_email, endereco_origem,
       endereco_destino, cidade_destino, cep_destino, motorista_id || null, rota_id || null,
       req.user.id, data_saida || null, data_prevista, peso_kg, volume_m3, valor_declarado, observacoes]
       .concat([vehicle_id || null, customer_id || null, route_distance_km || null])
    );

    // Registrar rastreamento inicial
    await db.query(
      'INSERT INTO rastreamento (entrega_id, localizacao, status, descricao, atualizado_por) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, endereco_origem, 'pendente', 'Entrega criada no sistema', req.user.id]
    );

    res.status(201).json({ success: true, message: 'Entrega criada com sucesso', data: { id: result.insertId, codigo } });
  } catch (error) { next(error); }
};

const atualizar = async (req, res, next) => {
  try {
    const { cliente_nome, cliente_telefone, cliente_email, endereco_origem, endereco_destino,
      cidade_destino, cep_destino, motorista_id, rota_id, data_saida, data_prevista,
      status, peso_kg, volume_m3, valor_declarado, observacoes, vehicle_id, customer_id, route_distance_km } = req.body;

    const [rows] = await db.query('SELECT id, status FROM entregas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });

const dataEntrega = status === 'entregue' ? new Date() : null;

await db.query(
  `UPDATE entregas SET cliente_nome=?, cliente_telefone=?, cliente_email=?, endereco_origem=?,
   endereco_destino=?, cidade_destino=?, cep_destino=?, motorista_id=?, rota_id=?,
   data_saida=?, data_prevista=?, status=?, data_entrega=?,
   peso_kg=?, volume_m3=?, valor_declarado=?, observacoes=?,
   vehicle_id=?, customer_id=?, route_distance_km=? WHERE id=?`,
  [
    cliente_nome,
    cliente_telefone,
    cliente_email,
    endereco_origem,
    endereco_destino,
    cidade_destino,
    cep_destino,
    motorista_id || null,
    rota_id || null,
    data_saida || null,
    data_prevista,
    status || rows[0].status,
    dataEntrega,
    peso_kg,
    volume_m3,
    valor_declarado,
    observacoes,
    vehicle_id || null,
    customer_id || null,
    route_distance_km || null,
    req.params.id
  ]
);

    // Se status mudou, registrar rastreamento
    if (status && status !== rows[0].status) {
      await db.query(
        'INSERT INTO rastreamento (entrega_id, localizacao, status, descricao, atualizado_por) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, endereco_destino || 'Atualização de status', status, `Status atualizado para: ${status}`, req.user.id]
      );
    }

    res.json({ success: true, message: 'Entrega atualizada com sucesso' });
  } catch (error) { next(error); }
};

const excluir = async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT status FROM entregas WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });
    if (rows[0].status === 'em_rota') {
      return res.status(400).json({ success: false, message: 'Não é possível excluir uma entrega em rota' });
    }

    await db.query('DELETE FROM rastreamento WHERE entrega_id = ?', [req.params.id]);
    await db.query('DELETE FROM entregas WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Entrega excluída com sucesso' });
  } catch (error) { next(error); }
};

const dashboard = async (req, res, next) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pendentes,
        SUM(CASE WHEN status = 'em_preparacao' THEN 1 ELSE 0 END) as em_preparacao,
        SUM(CASE WHEN status = 'em_rota' THEN 1 ELSE 0 END) as em_rota,
        SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as entregues,
        SUM(CASE WHEN status = 'cancelada' THEN 1 ELSE 0 END) as canceladas,
        SUM(CASE WHEN status NOT IN ('entregue','cancelada') AND data_prevista < NOW() THEN 1 ELSE 0 END) as atrasadas
      FROM entregas
    `);

    const [[motoristas]] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN status = 'em_rota' THEN 1 ELSE 0 END) as em_rota
      FROM motoristas
    `);

    const [[veiculos]] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use
      FROM vehicles
    `);

    const [[clientes]] = await db.query(`
      SELECT COUNT(*) as total FROM customers
    `);

    const [[metricasMapa]] = await db.query(`
      SELECT
        COALESCE(SUM(route_distance_km), 0) as total_distance_traveled,
        COALESCE(AVG(route_distance_km), 0) as average_route_distance,
        COALESCE(AVG(CASE
          WHEN data_saida IS NOT NULL AND data_entrega IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, data_saida, data_entrega)
          ELSE NULL END), 0) as average_delivery_time_minutes
      FROM entregas
      WHERE route_distance_km IS NOT NULL
    `);

    // Entregas por dia (últimos 7 dias)
    const [porDia] = await db.query(`
      SELECT DATE(criado_em) as data, COUNT(*) as total,
        SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as entregues
      FROM entregas
      WHERE criado_em >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(criado_em) ORDER BY data
    `);

    // Entregas por status
    const [porStatus] = await db.query(`
      SELECT status, COUNT(*) as total FROM entregas GROUP BY status
    `);

    // Últimas 5 entregas
    const [ultimas] = await db.query(`
      SELECT e.id, e.codigo, e.cliente_nome, e.status, e.data_prevista, m.nome as motorista_nome
      FROM entregas e LEFT JOIN motoristas m ON e.motorista_id = m.id
      ORDER BY e.criado_em DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        entregas: stats,
        motoristas,
        veiculos,
        clientes,
        map_metrics: metricasMapa,
        graficos: { porDia, porStatus },
        ultimas_entregas: ultimas
      }
    });
  } catch (error) { next(error); }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir, dashboard };
