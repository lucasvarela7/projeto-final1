/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Drivers
 *   - name: Deliveries
 *   - name: Routes
 *   - name: Tracking
 *   - name: Vehicles
 *   - name: Customers
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autenticação com JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             login:
 *               value: { email: "admin@logitrack.com", senha: "password" }
 *     responses:
 *       200:
 *         description: Login com sucesso
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 value: { success: true, message: "Login realizado com sucesso", data: { token: "jwt-token", usuario: { id: 1, nome: "Administrador", cargo: "administrador" } } }
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             examples:
 *               error:
 *                 value: { success: false, message: "Credenciais inválidas" }
 */

/**
 * @swagger
 * /api/motoristas:
 *   get:
 *     summary: Listagem de motoristas
 *     tags: [Drivers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista carregada
 */

/**
 * @swagger
 * /api/entregas:
 *   post:
 *     summary: Cria entrega
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             createDelivery:
 *               value:
 *                 cliente_nome: "Empresa XPTO"
 *                 endereco_origem: "Av. Paulista, 1000 - São Paulo/SP"
 *                 endereco_destino: "Rua das Flores, 10 - Rio de Janeiro/RJ"
 *                 data_prevista: "2026-06-03T15:00:00"
 *                 motorista_id: 1
 *                 vehicle_id: 1
 *                 customer_id: 1
 *     responses:
 *       201:
 *         description: Entrega criada
 *       400:
 *         description: Erro de validação
 */

/**
 * @swagger
 * /api/rotas:
 *   get:
 *     summary: Lista rotas
 *     tags: [Routes]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Lista carregada
 */

/**
 * @swagger
 * /api/rastreamento/entrega/{entrega_id}:
 *   post:
 *     summary: Atualiza tracking
 *     tags: [Tracking]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: entrega_id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             trackUpdate:
 *               value: { localizacao: "Rod. Dutra km 150", status: "em_rota", latitude: -23.5, longitude: -46.6, descricao: "Atualização automática" }
 *     responses:
 *       201:
 *         description: Atualização registrada
 */

/**
 * @swagger
 * /api/veiculos:
 *   post:
 *     summary: Cadastra veículo da frota
 *     tags: [Vehicles]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             createVehicle:
 *               value: { license_plate: "ABC-1234", model: "Daily", manufacturer: "Iveco", year: 2024, cargo_capacity: 2500, fuel_type: "diesel", status: "available" }
 *     responses:
 *       201:
 *         description: Veículo criado
 *       400:
 *         description: Dados inválidos
 */

/**
 * @swagger
 * /api/clientes:
 *   post:
 *     summary: Cadastra cliente
 *     tags: [Customers]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           examples:
 *             createCustomer:
 *               value: { name: "Cliente Exemplo", cpf_cnpj: "12.345.678/0001-99", email: "contato@cliente.com", phone: "(11) 99999-0000", zip_code: "01000-000", city: "São Paulo", state: "SP" }
 *     responses:
 *       201:
 *         description: Cliente criado
 *       400:
 *         description: Dados inválidos
 */
