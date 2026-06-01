const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/rastreamentoController');
const exportCtrl = require('../controllers/exportController');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.use(authenticate);

router.get('/', ctrl.listarTodos);
router.get('/entrega/:entrega_id', ctrl.historico);
router.post('/entrega/:entrega_id', [
  body('localizacao').notEmpty().withMessage('Localização obrigatória'),
  body('status').notEmpty().withMessage('Status obrigatório').isIn(['pendente', 'em_preparacao', 'em_rota', 'entregue', 'cancelada'])
], validate, ctrl.atualizar);

// Exportações
router.get('/export/excel', exportCtrl.exportarEntregasExcel);
router.get('/export/pdf', exportCtrl.exportarEntregasPDF);

module.exports = router;
