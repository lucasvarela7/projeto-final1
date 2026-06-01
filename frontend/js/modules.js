/* ============================================================
   LogiTrack - Módulos: Motoristas, Rotas, Rastreamento, Usuários
   ============================================================ */

/* ============================================================
   MOTORISTAS
   ============================================================ */
const Motoristas = {
  currentPage: 1,
  totalPages: 1,
  filters: { status: '', busca: '' },
  editingId: null,

  async load() {
    await this.fetch();
    await this.loadStats();
  },

  async fetch() {
    const params = new URLSearchParams({
      page: this.currentPage, limit: 10,
      ...(this.filters.status && { status: this.filters.status }),
      ...(this.filters.busca && { busca: this.filters.busca })
    });
    const result = await API.get('/motoristas?' + params.toString());
    if (!result || !result.ok) return;
    this.totalPages = result.data.pagination.pages;
    this.renderTable(result.data.data);
    this.renderPagination(result.data.pagination);
  },

  async loadStats() {
    const result = await API.get('/motoristas/estatisticas');
    if (!result || !result.ok) return;
    const s = result.data.data;
    const el = document.getElementById('motoristas-stats');
    if (el) {
      el.innerHTML =
        '<span class="badge badge-ativo">Ativos: ' + (s.ativos || 0) + '</span> ' +
        '<span class="badge badge-em_rota">Em Rota: ' + (s.em_rota || 0) + '</span> ' +
        '<span class="badge badge-inativo">Inativos: ' + (s.inativos || 0) + '</span>';
    }
  },

  renderTable(motoristas) {
    const tbody = document.getElementById('motoristas-tbody');
    if (!tbody) return;
    if (!motoristas.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🚛</div><h3>Nenhum motorista encontrado</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = motoristas.map(m =>
      '<tr>' +
      '<td><div class="fw-600">' + m.nome + '</div><div class="fs-12 text-muted">' + m.cpf + '</div></td>' +
      '<td>' + m.telefone + '</td>' +
      '<td>' + m.cnh + ' <span class="badge badge-operador">' + m.categoria_cnh + '</span></td>' +
      '<td>' + (m.veiculo || '—') + '</td>' +
      '<td>' + (m.placa_veiculo || '—') + '</td>' +
      '<td>' + Utils.badge(m.status) + '</td>' +
      '<td><div class="d-flex gap-8">' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="Motoristas.edit(' + m.id + ')" title="Editar">✏️</button>' +
        (App.canAccess(['administrador']) ? '<button class="btn btn-ghost btn-sm btn-icon" onclick="Motoristas.delete(' + m.id + ', \'' + m.nome + '\')" title="Excluir">🗑️</button>' : '') +
      '</div></td>' +
      '</tr>'
    ).join('');
  },

  renderPagination(pagination) {
    const el = document.getElementById('motoristas-pagination');
    if (!el) return;
    const { total, page, limit, pages } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    let btns = '<button class="page-btn" onclick="Motoristas.goToPage(' + (page-1) + ')" ' + (page<=1?'disabled':'') + '>‹</button>';
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
      btns += '<button class="page-btn ' + (i===page?'active':'') + '" onclick="Motoristas.goToPage(' + i + ')">' + i + '</button>';
    }
    btns += '<button class="page-btn" onclick="Motoristas.goToPage(' + (page+1) + ')" ' + (page>=pages?'disabled':'') + '>›</button>';
    el.innerHTML = '<span class="text-muted">Exibindo ' + start + '–' + end + ' de ' + total + '</span><div class="pagination-controls">' + btns + '</div>';
  },

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetch();
  },

  applyFilters() {
    this.filters.status = document.getElementById('filter-motorista-status').value;
    this.filters.busca = document.getElementById('search-motoristas').value;
    this.currentPage = 1;
    this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    document.getElementById('modal-motorista-title').textContent = id ? 'Editar Motorista' : 'Novo Motorista';
    if (id) {
      const result = await API.get('/motoristas/' + id);
      if (result && result.ok) {
        const m = result.data.data;
        document.getElementById('mot-nome').value = m.nome || '';
        document.getElementById('mot-cpf').value = m.cpf || '';
        document.getElementById('mot-telefone').value = m.telefone || '';
        document.getElementById('mot-cnh').value = m.cnh || '';
        document.getElementById('mot-categoria').value = m.categoria_cnh || 'B';
        document.getElementById('mot-veiculo').value = m.veiculo || '';
        document.getElementById('mot-placa').value = m.placa_veiculo || '';
        document.getElementById('mot-status').value = m.status || 'ativo';
        document.getElementById('mot-observacoes').value = m.observacoes || '';
      }
    } else {
      document.getElementById('form-motorista').reset();
      document.getElementById('mot-status').value = 'ativo';
    }
    Modal.open('modal-motorista');
  },

  async save() {
    const data = {
      nome: document.getElementById('mot-nome').value.trim(),
      cpf: document.getElementById('mot-cpf').value.trim(),
      telefone: document.getElementById('mot-telefone').value.trim(),
      cnh: document.getElementById('mot-cnh').value.trim(),
      categoria_cnh: document.getElementById('mot-categoria').value,
      veiculo: document.getElementById('mot-veiculo').value.trim(),
      placa_veiculo: document.getElementById('mot-placa').value.trim(),
      status: document.getElementById('mot-status').value,
      observacoes: document.getElementById('mot-observacoes').value.trim()
    };
    if (!data.nome || !data.cpf || !data.telefone || !data.cnh) {
      Toast.show('Preencha todos os campos obrigatórios', 'warning');
      return;
    }
    const btn = document.getElementById('btn-salvar-motorista');
    btn.disabled = true; btn.textContent = 'Salvando...';
    const result = this.editingId
      ? await API.put('/motoristas/' + this.editingId, data)
      : await API.post('/motoristas', data);
    btn.disabled = false; btn.textContent = 'Salvar';
    if (result && result.ok) {
      Toast.show(this.editingId ? 'Motorista atualizado!' : 'Motorista cadastrado!', 'success');
      Modal.close('modal-motorista');
      this.fetch();
      this.loadStats();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar', 'error');
    }
  },

  edit(id) { this.openModal(id); },

  delete(id, nome) {
    Utils.confirm('Deseja excluir o motorista ' + nome + '?', async function() {
      const result = await API.delete('/motoristas/' + id);
      if (result && result.ok) {
        Toast.show('Motorista excluído', 'success');
        Motoristas.fetch();
        Motoristas.loadStats();
      } else {
        Toast.show(result?.data?.message || 'Erro ao excluir', 'error');
      }
    });
  }
};

/* ============================================================
   ROTAS
   ============================================================ */
const Rotas = {
  currentPage: 1,
  totalPages: 1,
  filters: { busca: '' },
  editingId: null,

  async load() { await this.fetch(); },

  async fetch() {
    const params = new URLSearchParams({
      page: this.currentPage, limit: 10,
      ...(this.filters.busca && { busca: this.filters.busca })
    });
    const result = await API.get('/rotas?' + params.toString());
    if (!result || !result.ok) return;
    this.totalPages = result.data.pagination.pages;
    this.renderTable(result.data.data);
    this.renderPagination(result.data.pagination);
  },

  renderTable(rotas) {
    const tbody = document.getElementById('rotas-tbody');
    if (!tbody) return;
    if (!rotas.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">🗺️</div><h3>Nenhuma rota encontrada</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = rotas.map(r =>
      '<tr>' +
      '<td class="fw-600">' + r.nome + '</td>' +
      '<td>' + r.cidade_origem + '</td>' +
      '<td>' + r.cidade_destino + '</td>' +
      '<td>' + (r.regiao || '—') + '</td>' +
      '<td>' + (r.distancia_km ? r.distancia_km + ' km' : '—') + '</td>' +
      '<td>' + (r.tempo_estimado || '—') + '</td>' +
      '<td>' + Utils.badge(r.ativa ? 'ativo' : 'inativo') + '</td>' +
      '<td><div class="d-flex gap-8">' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="Rotas.edit(' + r.id + ')">✏️</button>' +
        (App.canAccess(['administrador']) ? '<button class="btn btn-ghost btn-sm btn-icon" onclick="Rotas.delete(' + r.id + ', \'' + r.nome + '\')">🗑️</button>' : '') +
      '</div></td>' +
      '</tr>'
    ).join('');
  },

  renderPagination(pagination) {
    const el = document.getElementById('rotas-pagination');
    if (!el) return;
    const { total, page, limit, pages } = pagination;
    const start = (page-1)*limit+1, end = Math.min(page*limit, total);
    let btns = '<button class="page-btn" onclick="Rotas.goToPage(' + (page-1) + ')" ' + (page<=1?'disabled':'') + '>‹</button>';
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
      btns += '<button class="page-btn ' + (i===page?'active':'') + '" onclick="Rotas.goToPage(' + i + ')">' + i + '</button>';
    }
    btns += '<button class="page-btn" onclick="Rotas.goToPage(' + (page+1) + ')" ' + (page>=pages?'disabled':'') + '>›</button>';
    el.innerHTML = '<span class="text-muted">Exibindo ' + start + '–' + end + ' de ' + total + '</span><div class="pagination-controls">' + btns + '</div>';
  },

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.fetch();
  },

  applyFilters() {
    this.filters.busca = document.getElementById('search-rotas').value;
    this.currentPage = 1; this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    document.getElementById('modal-rota-title').textContent = id ? 'Editar Rota' : 'Nova Rota';
    if (id) {
      const result = await API.get('/rotas/' + id);
      if (result && result.ok) {
        const r = result.data.data;
        document.getElementById('rota-nome').value = r.nome || '';
        document.getElementById('rota-origem').value = r.cidade_origem || '';
        document.getElementById('rota-destino').value = r.cidade_destino || '';
        document.getElementById('rota-regiao').value = r.regiao || '';
        document.getElementById('rota-distancia').value = r.distancia_km || '';
        document.getElementById('rota-tempo').value = r.tempo_estimado || '';
        document.getElementById('rota-descricao').value = r.descricao || '';
        document.getElementById('rota-ativa').value = r.ativa ? '1' : '0';
      }
    } else {
      document.getElementById('form-rota').reset();
      document.getElementById('rota-ativa').value = '1';
    }
    Modal.open('modal-rota');
  },

  async save() {
    const data = {
      nome: document.getElementById('rota-nome').value.trim(),
      cidade_origem: document.getElementById('rota-origem').value.trim(),
      cidade_destino: document.getElementById('rota-destino').value.trim(),
      regiao: document.getElementById('rota-regiao').value.trim(),
      distancia_km: document.getElementById('rota-distancia').value || null,
      tempo_estimado: document.getElementById('rota-tempo').value.trim(),
      descricao: document.getElementById('rota-descricao').value.trim(),
      ativa: document.getElementById('rota-ativa').value === '1' ? 1 : 0
    };
    if (!data.nome || !data.cidade_origem || !data.cidade_destino) {
      Toast.show('Preencha os campos obrigatórios', 'warning'); return;
    }
    const btn = document.getElementById('btn-salvar-rota');
    btn.disabled = true; btn.textContent = 'Salvando...';
    const result = this.editingId
      ? await API.put('/rotas/' + this.editingId, data)
      : await API.post('/rotas', data);
    btn.disabled = false; btn.textContent = 'Salvar';
    if (result && result.ok) {
      Toast.show(this.editingId ? 'Rota atualizada!' : 'Rota criada!', 'success');
      Modal.close('modal-rota'); this.fetch();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar', 'error');
    }
  },

  edit(id) { this.openModal(id); },

  delete(id, nome) {
    Utils.confirm('Deseja excluir a rota ' + nome + '?', async function() {
      const result = await API.delete('/rotas/' + id);
      if (result && result.ok) { Toast.show('Rota excluída', 'success'); Rotas.fetch(); }
      else Toast.show(result?.data?.message || 'Erro ao excluir', 'error');
    });
  }
};

/* ============================================================
   RASTREAMENTO
   ============================================================ */
const Rastreamento = {
  currentPage: 1,
  totalPages: 1,

  async load() { await this.fetch(); },

  async fetch() {
    const params = new URLSearchParams({ page: this.currentPage, limit: 20 });
    const result = await API.get('/rastreamento?' + params.toString());
    if (!result || !result.ok) return;
    this.totalPages = result.data.pagination.pages;
    this.renderTable(result.data.data);
    this.renderPagination(result.data.pagination);
  },

  renderTable(items) {
    const tbody = document.getElementById('rastreamento-tbody');
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📍</div><h3>Nenhuma movimentação</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = items.map(r =>
      '<tr>' +
      '<td><strong class="text-primary">' + r.codigo + '</strong></td>' +
      '<td>' + r.cliente_nome + '</td>' +
      '<td>📍 ' + r.localizacao + '</td>' +
      '<td>' + Utils.badge(r.status) + '</td>' +
      '<td>' + (r.atualizado_por_nome || '—') + '</td>' +
      '<td>' + Utils.formatDateTime(r.criado_em) + '</td>' +
      '</tr>'
    ).join('');
  },

  renderPagination(pagination) {
    const el = document.getElementById('rastreamento-pagination');
    if (!el) return;
    const { total, page, limit, pages } = pagination;
    const start = (page-1)*limit+1, end = Math.min(page*limit, total);
    let btns = '<button class="page-btn" onclick="Rastreamento.goToPage(' + (page-1) + ')" ' + (page<=1?'disabled':'') + '>‹</button>';
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
      btns += '<button class="page-btn ' + (i===page?'active':'') + '" onclick="Rastreamento.goToPage(' + i + ')">' + i + '</button>';
    }
    btns += '<button class="page-btn" onclick="Rastreamento.goToPage(' + (page+1) + ')" ' + (page>=pages?'disabled':'') + '>›</button>';
    el.innerHTML = '<span class="text-muted">Exibindo ' + start + '–' + end + ' de ' + total + '</span><div class="pagination-controls">' + btns + '</div>';
  },

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.fetch();
  },

  async openUpdateModal() {
    document.getElementById('form-rastreamento').reset();
    // Carregar entregas em andamento
    const result = await API.get('/entregas?status=em_rota&limit=50');
    const sel = document.getElementById('rastr-entrega');
    sel.innerHTML = '<option value="">Selecionar entrega...</option>';
    if (result && result.ok) {
      result.data.data.forEach(e => {
        sel.innerHTML += '<option value="' + e.id + '">' + e.codigo + ' — ' + e.cliente_nome + '</option>';
      });
    }
    Modal.open('modal-rastreamento');
  },

  async save() {
    const entregaId = document.getElementById('rastr-entrega').value;
    const data = {
      localizacao: document.getElementById('rastr-localizacao').value.trim(),
      status: document.getElementById('rastr-status').value,
      descricao: document.getElementById('rastr-descricao').value.trim()
    };
    if (!entregaId || !data.localizacao || !data.status) {
      Toast.show('Preencha todos os campos', 'warning'); return;
    }
    const btn = document.getElementById('btn-salvar-rastreamento');
    btn.disabled = true; btn.textContent = 'Salvando...';
    const result = await API.post('/rastreamento/entrega/' + entregaId, data);
    btn.disabled = false; btn.textContent = 'Atualizar';
    if (result && result.ok) {
      Toast.show('Rastreamento atualizado!', 'success');
      Modal.close('modal-rastreamento'); this.fetch();
    } else {
      Toast.show(result?.data?.message || 'Erro ao atualizar', 'error');
    }
  }
};

/* ============================================================
   USUÁRIOS
   ============================================================ */
const Usuarios = {
  currentPage: 1,
  totalPages: 1,
  editingId: null,

  async load() { await this.fetch(); },

  async fetch() {
    const params = new URLSearchParams({ page: this.currentPage, limit: 10 });
    const result = await API.get('/usuarios?' + params.toString());
    if (!result || !result.ok) return;
    this.totalPages = result.data.pagination.pages;
    this.renderTable(result.data.data);
    this.renderPagination(result.data.pagination);
  },

  renderTable(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    if (!tbody) return;
    if (!usuarios.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><h3>Nenhum usuário encontrado</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = usuarios.map(u =>
      '<tr>' +
      '<td><div class="d-flex align-center gap-8"><div class="user-avatar" style="width:30px;height:30px;font-size:12px">' + u.nome.charAt(0) + '</div><div><div class="fw-600">' + u.nome + '</div></div></div></td>' +
      '<td>' + u.email + '</td>' +
      '<td>' + Utils.badge(u.cargo) + '</td>' +
      '<td>' + Utils.badge(u.ativo ? 'ativo' : 'inativo') + '</td>' +
      '<td>' + (u.ultimo_login ? Utils.formatDateTime(u.ultimo_login) : '<span class="text-muted">Nunca</span>') + '</td>' +
      '<td><div class="d-flex gap-8">' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="Usuarios.edit(' + u.id + ')">✏️</button>' +
        '<button class="btn btn-ghost btn-sm btn-icon" onclick="Usuarios.delete(' + u.id + ', \'' + u.nome + '\')">🗑️</button>' +
      '</div></td>' +
      '</tr>'
    ).join('');
  },

  renderPagination(pagination) {
    const el = document.getElementById('usuarios-pagination');
    if (!el) return;
    const { total, page, limit, pages } = pagination;
    const start = (page-1)*limit+1, end = Math.min(page*limit, total);
    let btns = '<button class="page-btn" onclick="Usuarios.goToPage(' + (page-1) + ')" ' + (page<=1?'disabled':'') + '>‹</button>';
    for (let i = Math.max(1, page-2); i <= Math.min(pages, page+2); i++) {
      btns += '<button class="page-btn ' + (i===page?'active':'') + '" onclick="Usuarios.goToPage(' + i + ')">' + i + '</button>';
    }
    btns += '<button class="page-btn" onclick="Usuarios.goToPage(' + (page+1) + ')" ' + (page>=pages?'disabled':'') + '>›</button>';
    el.innerHTML = '<span class="text-muted">Exibindo ' + start + '–' + end + ' de ' + total + '</span><div class="pagination-controls">' + btns + '</div>';
  },

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    document.getElementById('modal-usuario-title').textContent = id ? 'Editar Usuário' : 'Novo Usuário';
    const senhaGroup = document.getElementById('senha-group');
    if (id) {
      if (senhaGroup) senhaGroup.style.display = 'none';
      const result = await API.get('/usuarios/' + id);
      if (result && result.ok) {
        const u = result.data.data;
        document.getElementById('usr-nome').value = u.nome || '';
        document.getElementById('usr-email').value = u.email || '';
        document.getElementById('usr-cargo').value = u.cargo || 'operador';
        document.getElementById('usr-ativo').value = u.ativo ? '1' : '0';
      }
    } else {
      if (senhaGroup) senhaGroup.style.display = 'block';
      document.getElementById('form-usuario').reset();
      document.getElementById('usr-cargo').value = 'operador';
      document.getElementById('usr-ativo').value = '1';
    }
    Modal.open('modal-usuario');
  },

  async save() {
    const data = {
      nome: document.getElementById('usr-nome').value.trim(),
      email: document.getElementById('usr-email').value.trim(),
      cargo: document.getElementById('usr-cargo').value,
      ativo: document.getElementById('usr-ativo').value === '1' ? 1 : 0
    };
    if (!this.editingId) {
      data.senha = document.getElementById('usr-senha').value;
    }
    if (!data.nome || !data.email) {
      Toast.show('Preencha os campos obrigatórios', 'warning'); return;
    }
    const btn = document.getElementById('btn-salvar-usuario');
    btn.disabled = true; btn.textContent = 'Salvando...';
    const result = this.editingId
      ? await API.put('/usuarios/' + this.editingId, data)
      : await API.post('/usuarios', data);
    btn.disabled = false; btn.textContent = 'Salvar';
    if (result && result.ok) {
      Toast.show(this.editingId ? 'Usuário atualizado!' : 'Usuário criado!', 'success');
      Modal.close('modal-usuario'); this.fetch();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar', 'error');
    }
  },

  edit(id) { this.openModal(id); },

  delete(id, nome) {
    Utils.confirm('Deseja excluir o usuário ' + nome + '?', async function() {
      const result = await API.delete('/usuarios/' + id);
      if (result && result.ok) { Toast.show('Usuário excluído', 'success'); Usuarios.fetch(); }
      else Toast.show(result?.data?.message || 'Erro ao excluir', 'error');
    });
  }
};
