require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const motoristasRoutes = require('./routes/motoristas');
const entregasRoutes = require('./routes/entregas');
const rotasRoutes = require('./routes/rotas');
const rastreamentoRoutes = require('./routes/rastreamento');
const veiculosRoutes = require('./routes/veiculos');
const clientesRoutes = require('./routes/clientes');
const mapaRoutes = require('./routes/mapa');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Middlewares Globais
// ============================================================

// Rate limiting para proteção contra brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requisições por IP
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3001').split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// Rotas da API
// ============================================================
app.use('/api/auth', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') {
    return loginLimiter(req, res, next);
  }
  next();
}, authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/motoristas', motoristasRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/rotas', rotasRoutes);
app.use('/api/rastreamento', rastreamentoRoutes);
app.use('/api/veiculos', veiculosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/mapa', mapaRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: { persistAuthorization: true }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'LogiTrack API está funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Servir frontend para todas as outras rotas
// Servir frontend para todas as outras rotas (SPA fallback)
app.use(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================================
// Middlewares de Erro
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// Iniciar Servidor
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║         LogiTrack API Server           ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(28)}║`);
  console.log(`║  Porta: ${String(PORT).padEnd(31)}║`);
  console.log(`║  URL: http://localhost:${PORT}            ║`);
  console.log('╚════════════════════════════════════════╝\n');
});

module.exports = app;
