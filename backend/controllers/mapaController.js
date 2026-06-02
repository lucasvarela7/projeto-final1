const mbxClient = require('@mapbox/mapbox-sdk');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const db = require('../config/db');

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
let directionsClient = null;
let geocodingClient = null;

const getMapboxClients = () => {
  if (!mapboxToken) return null;
  if (!directionsClient || !geocodingClient) {
    const baseClient = mbxClient({ accessToken: mapboxToken });
    directionsClient = mbxDirections(baseClient);
    geocodingClient = mbxGeocoding(baseClient);
  }
  return { directionsClient, geocodingClient };
};

const geocodeAddress = async (address) => {
  const clients = getMapboxClients();
  if (!clients) return null;

  const response = await geocodingClient.forwardGeocode({
    query: address,
    limit: 1,
    countries: ['br']
  }).send();

  const feature = response.body.features?.[0];
  if (!feature) return null;

  return {
    longitude: feature.center[0],
    latitude: feature.center[1],
    place_name: feature.place_name
  };
};

const rotaEntrega = async (req, res, next) => {
  try {
    const clients = getMapboxClients();
    if (!clients) {
      return res.status(500).json({ success: false, message: 'MAPBOX_ACCESS_TOKEN não configurado ou inválido' });
    }

    const [rows] = await db.query(
      `SELECT e.id, e.codigo, e.endereco_origem, e.endereco_destino, e.status, e.data_saida, e.data_entrega,
              m.nome as motorista_nome
       FROM entregas e
       LEFT JOIN motoristas m ON m.id = e.motorista_id
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Entrega não encontrada' });
    const entrega = rows[0];

    const origem = await geocodeAddress(entrega.endereco_origem);
    const destino = await geocodeAddress(entrega.endereco_destino);
    if (!origem || !destino) {
      return res.status(400).json({ success: false, message: 'Não foi possível geocodificar os endereços da entrega' });
    }

    const routeResponse = await clients.directionsClient.getDirections({
      profile: 'driving',
      geometries: 'geojson',
      overview: 'full',
      waypoints: [
        { coordinates: [origem.longitude, origem.latitude] },
        { coordinates: [destino.longitude, destino.latitude] }
      ]
    }).send();

    const route = routeResponse.body.routes?.[0];
    if (!route) {
      return res.status(404).json({ success: false, message: 'Rota não encontrada no Mapbox' });
    }

    const [latestTracking] = await db.query(
      `SELECT latitude, longitude, localizacao, criado_em
       FROM rastreamento
       WHERE entrega_id = ?
       ORDER BY criado_em DESC
       LIMIT 1`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        delivery: entrega,
        origin: origem,
        destination: destino,
        route: route.geometry,
        distance_km: Number((route.distance / 1000).toFixed(2)),
        estimated_travel_time_minutes: Math.round(route.duration / 60),
        driver_location: latestTracking[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

const metricas = async (req, res, next) => {
  try {
    const [[stats]] = await db.query(
      `SELECT
        COALESCE(SUM(route_distance_km), 0) as total_distance_traveled,
        COALESCE(AVG(route_distance_km), 0) as average_route_distance,
        COALESCE(AVG(CASE
          WHEN data_saida IS NOT NULL AND data_entrega IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, data_saida, data_entrega)
          ELSE NULL END), 0) as average_delivery_time_minutes
      FROM entregas
      WHERE route_distance_km IS NOT NULL`
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const token = async (req, res) => {
  res.json({ success: true, data: { access_token: mapboxToken || '' } });
};

module.exports = { rotaEntrega, metricas, token };
