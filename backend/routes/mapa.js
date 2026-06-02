const express = require('express');
const ctrl = require('../controllers/mapaController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
router.use(authenticate);

/**
 * @swagger
 * /api/mapa/entrega/{id}:
 *   get:
 *     summary: Obtém rota de uma entrega no Mapbox
 *     tags: [Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Dados da rota
 */
router.get('/entrega/:id', ctrl.rotaEntrega);
router.get('/metricas', ctrl.metricas);
router.get('/token', ctrl.token);

module.exports = router;
