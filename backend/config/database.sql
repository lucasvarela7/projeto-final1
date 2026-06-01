-- ============================================================
-- LogiTrack - Sistema de Logística e Rastreamento de Entregas
-- Script de Criação do Banco de Dados
-- Versão: 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS logitrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE logitrack;

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  senha       VARCHAR(255) NOT NULL,
  cargo       ENUM('administrador','operador','motorista') NOT NULL DEFAULT 'operador',
  ativo       TINYINT(1) NOT NULL DEFAULT 1,
  avatar      VARCHAR(255) DEFAULT NULL,
  ultimo_login DATETIME DEFAULT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_email CHECK (email REGEXP '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: motoristas
-- ============================================================
CREATE TABLE IF NOT EXISTS motoristas (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(100) NOT NULL,
  cpf         CHAR(14) NOT NULL UNIQUE,
  telefone    VARCHAR(20) NOT NULL,
  cnh         VARCHAR(20) NOT NULL UNIQUE,
  categoria_cnh ENUM('A','B','C','D','E','AB','AC','AD','AE') NOT NULL DEFAULT 'B',
  veiculo     VARCHAR(100) DEFAULT NULL,
  placa_veiculo VARCHAR(10) DEFAULT NULL,
  status      ENUM('ativo','inativo','em_rota','ferias','afastado') NOT NULL DEFAULT 'ativo',
  usuario_id  INT UNSIGNED DEFAULT NULL,
  observacoes TEXT DEFAULT NULL,
  criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_motorista_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: rotas
-- ============================================================
CREATE TABLE IF NOT EXISTS rotas (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome            VARCHAR(100) NOT NULL,
  cidade_origem   VARCHAR(100) NOT NULL,
  cidade_destino  VARCHAR(100) NOT NULL,
  regiao          VARCHAR(100) DEFAULT NULL,
  distancia_km    DECIMAL(10,2) DEFAULT NULL,
  tempo_estimado  VARCHAR(50) DEFAULT NULL,
  descricao       TEXT DEFAULT NULL,
  ativa           TINYINT(1) NOT NULL DEFAULT 1,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: entregas
-- ============================================================
CREATE TABLE IF NOT EXISTS entregas (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo              VARCHAR(20) NOT NULL UNIQUE,
  cliente_nome        VARCHAR(100) NOT NULL,
  cliente_telefone    VARCHAR(20) DEFAULT NULL,
  cliente_email       VARCHAR(150) DEFAULT NULL,
  endereco_origem     VARCHAR(255) NOT NULL,
  endereco_destino    VARCHAR(255) NOT NULL,
  cidade_destino      VARCHAR(100) DEFAULT NULL,
  cep_destino         CHAR(9) DEFAULT NULL,
  motorista_id        INT UNSIGNED DEFAULT NULL,
  rota_id             INT UNSIGNED DEFAULT NULL,
  criado_por          INT UNSIGNED DEFAULT NULL,
  data_saida          DATETIME DEFAULT NULL,
  data_prevista       DATETIME NOT NULL,
  data_entrega        DATETIME DEFAULT NULL,
  status              ENUM('pendente','em_preparacao','em_rota','entregue','cancelada') NOT NULL DEFAULT 'pendente',
  peso_kg             DECIMAL(10,2) DEFAULT NULL,
  volume_m3           DECIMAL(10,4) DEFAULT NULL,
  valor_declarado     DECIMAL(12,2) DEFAULT NULL,
  observacoes         TEXT DEFAULT NULL,
  criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_entrega_motorista FOREIGN KEY (motorista_id)
    REFERENCES motoristas(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_entrega_rota FOREIGN KEY (rota_id)
    REFERENCES rotas(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_entrega_usuario FOREIGN KEY (criado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABELA: rastreamento
-- ============================================================
CREATE TABLE IF NOT EXISTS rastreamento (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entrega_id      INT UNSIGNED NOT NULL,
  localizacao     VARCHAR(255) NOT NULL,
  latitude        DECIMAL(10,8) DEFAULT NULL,
  longitude       DECIMAL(11,8) DEFAULT NULL,
  status          ENUM('pendente','em_preparacao','em_rota','entregue','cancelada') NOT NULL,
  descricao       TEXT DEFAULT NULL,
  atualizado_por  INT UNSIGNED DEFAULT NULL,
  criado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rastreamento_entrega FOREIGN KEY (entrega_id)
    REFERENCES entregas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rastreamento_usuario FOREIGN KEY (atualizado_por)
    REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_entregas_status ON entregas(status);
CREATE INDEX idx_entregas_motorista ON entregas(motorista_id);
CREATE INDEX idx_entregas_data_prevista ON entregas(data_prevista);
CREATE INDEX idx_entregas_codigo ON entregas(codigo);
CREATE INDEX idx_rastreamento_entrega ON rastreamento(entrega_id);
CREATE INDEX idx_motoristas_status ON motoristas(status);
CREATE INDEX idx_usuarios_cargo ON usuarios(cargo);

-- ============================================================
-- DADOS INICIAIS - Usuário Administrador
-- ============================================================
-- Senha: Admin@123 (hash bcrypt)
INSERT INTO usuarios (nome, email, senha, cargo) VALUES
('Administrador', 'admin@logitrack.com', '$2b$10$7zefb850D.eKpM11GfHBnOZkvONmk6/q90RNQp1/O37CyRZeJ1Jlq', 'administrador'),
('Operador Padrão', 'operador@logitrack.com', '$2b$10$7zefb850D.eKpM11GfHBnOZkvONmk6/q90RNQp1/O37CyRZeJ1Jlq', 'operador');

-- ============================================================
-- DADOS DE EXEMPLO - Rotas
-- ============================================================
INSERT INTO rotas (nome, cidade_origem, cidade_destino, regiao, distancia_km, tempo_estimado) VALUES
('Rota SP-RJ', 'São Paulo', 'Rio de Janeiro', 'Sudeste', 429.00, '5h 30min'),
('Rota SP-BH', 'São Paulo', 'Belo Horizonte', 'Sudeste', 586.00, '7h 00min'),
('Rota SP-Campinas', 'São Paulo', 'Campinas', 'Interior SP', 99.00, '1h 30min'),
('Rota SP-Santos', 'São Paulo', 'Santos', 'Litoral SP', 73.00, '1h 15min'),
('Rota RJ-Niterói', 'Rio de Janeiro', 'Niterói', 'Grande Rio', 14.00, '0h 30min');

-- ============================================================
-- DADOS DE EXEMPLO - Motoristas
-- ============================================================
INSERT INTO motoristas (nome, cpf, telefone, cnh, categoria_cnh, veiculo, placa_veiculo, status) VALUES
('Carlos Silva', '123.456.789-00', '(11) 99999-1111', 'CNH001234', 'C', 'Caminhão Truck VW 17.280', 'ABC-1234', 'ativo'),
('Marcos Oliveira', '987.654.321-00', '(11) 99999-2222', 'CNH005678', 'D', 'Ônibus Mercedes OF 1519', 'DEF-5678', 'ativo'),
('Fernanda Costa', '456.789.123-00', '(11) 99999-3333', 'CNH009012', 'B', 'Van Fiat Ducato', 'GHI-9012', 'em_rota'),
('Roberto Santos', '321.654.987-00', '(11) 99999-4444', 'CNH003456', 'E', 'Carreta Scania R450', 'JKL-3456', 'ativo');

-- ============================================================
-- DADOS DE EXEMPLO - Entregas
-- ============================================================
INSERT INTO entregas (codigo, cliente_nome, cliente_telefone, endereco_origem, endereco_destino, cidade_destino, motorista_id, rota_id, data_saida, data_prevista, status) VALUES
('LT-2024-0001', 'Empresa ABC Ltda', '(11) 3333-1111', 'Av. Paulista, 1000 - São Paulo/SP', 'Rua do Comércio, 500 - Rio de Janeiro/RJ', 'Rio de Janeiro', 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 'em_rota'),
('LT-2024-0002', 'João da Silva', '(21) 9999-2222', 'Rua Augusta, 200 - São Paulo/SP', 'Av. Atlântica, 300 - Rio de Janeiro/RJ', 'Rio de Janeiro', 2, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), 'entregue'),
('LT-2024-0003', 'Maria Souza', '(31) 8888-3333', 'Rua Oscar Freire, 50 - São Paulo/SP', 'Av. Afonso Pena, 1000 - Belo Horizonte/MG', 'Belo Horizonte', 3, 2, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 'em_preparacao'),
('LT-2024-0004', 'Tech Solutions SA', '(11) 7777-4444', 'Av. Faria Lima, 3000 - São Paulo/SP', 'Rua Barão de Campinas, 100 - Campinas/SP', 'Campinas', NULL, 3, NULL, DATE_ADD(NOW(), INTERVAL 3 DAY), 'pendente'),
('LT-2024-0005', 'Distribuidora XYZ', '(13) 6666-5555', 'Av. Paulista, 2000 - São Paulo/SP', 'Av. Ana Costa, 200 - Santos/SP', 'Santos', 4, 4, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), 'cancelada');

-- ============================================================
-- DADOS DE EXEMPLO - Rastreamento
-- ============================================================
INSERT INTO rastreamento (entrega_id, localizacao, status, descricao) VALUES
(1, 'São Paulo - SP (Origem)', 'em_preparacao', 'Pedido recebido e em preparação no centro de distribuição'),
(1, 'Rodovia Presidente Dutra, km 150', 'em_rota', 'Saiu para entrega - em trânsito'),
(2, 'São Paulo - SP (Origem)', 'em_preparacao', 'Pedido em preparação'),
(2, 'Rodovia Presidente Dutra, km 300', 'em_rota', 'Em trânsito'),
(2, 'Rio de Janeiro - RJ (Destino)', 'entregue', 'Entrega realizada com sucesso. Recebido por: João da Silva');
