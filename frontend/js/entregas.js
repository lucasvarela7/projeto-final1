/* ============================================================
   LogiTrack - Módulo de Entregas
   ============================================================ */

const Entregas = {
  currentPage: 1,
  totalPages: 1,
  filters: { status: '', busca: '' },
  editingId: null,

  async load() {
    await this.fetch();
  },

  async fetch() {
    const params = new URLSearchParams({
      page: this.currentPage,
      limit: 10,
      ...(this.filters.status && { status: this.filters.status }),
      ...(this.filters.busca && { busca: this.filters.busca })
    });

    const result = await API.get('/entregas?' + params.toString());
    if (!result || !result.ok) return;

    this.totalPages = result.data.pagination.pages;
    this.renderTable(result.data.data);
    this.renderPagination(result.data.pagination);
  },

  renderTable(entregas) {
    const tbody = document.getElementById('entregas-tbody');
    if (!tbody) return;

    if (!entregas.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📦</div><h3>Nenhuma entrega encontrada</h3><p>Crie uma nova entrega para começar</p></div></td></tr>';
      return;
    }

    tbody.innerHTML = entregas.map(e => {
      const atrasada = Utils.isAtrasada(e.data_prevista, e.status);
      const statusBadge = atrasada && e.status !== 'entregue' && e.status !== 'cancelada'
        ? '<span class="badge badge-cancelada">⚠ Atrasada</span>'
        : Utils.badge(e.status);

      return '<tr>' +
        '<td><strong class="text-primary">' + e.codigo + '</strong></td>' +
        '<td>' +
          '<div class="fw-600">' + e.cliente_nome + '</div>' +
          '<div class="fs-12 text-muted">' + (e.cliente_telefone || '') + '</div>' +
        '</td>' +
        '<td class="truncate" style="max-width:180px" title="' + e.endereco_destino + '">' + e.endereco_destino + '</td>' +
        '<td>' + (e.motorista_nome || '<span class="text-muted">—</span>') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' + Utils.formatDate(e.data_prevista) + '</td>' +
        '<td>' + (e.data_entrega ? Utils.formatDate(e.data_entrega) : '<span class="text-muted">—</span>') + '</td>' +
        '<td>' +
          '<div class="d-flex gap-8">' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="Entregas.viewTracking(' + e.id + ')" title="Rastrear">🗺️</button>' +
            '<button class="btn btn-ghost btn-sm btn-icon" onclick="Entregas.edit(' + e.id + ')" title="Editar">✏️</button>' +
            (App.canAccess(['administrador']) ? '<button class="btn btn-ghost btn-sm btn-icon" onclick="Entregas.delete(' + e.id + ', \'' + e.codigo + '\')" title="Excluir">🗑️</button>' : '') +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');
  },

  renderPagination(pagination) {
    const el = document.getElementById('entregas-pagination');
    if (!el) return;

    const { total, page, limit, pages } = pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    let btns = '<button class="page-btn" onclick="Entregas.goToPage(' + (page - 1) + ')" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
      btns += '<button class="page-btn ' + (i === page ? 'active' : '') + '" onclick="Entregas.goToPage(' + i + ')">' + i + '</button>';
    }
    btns += '<button class="page-btn" onclick="Entregas.goToPage(' + (page + 1) + ')" ' + (page >= pages ? 'disabled' : '') + '>›</button>';

    el.innerHTML =
      '<span class="text-muted">Exibindo ' + start + '–' + end + ' de ' + total + ' entregas</span>' +
      '<div class="pagination-controls">' + btns + '</div>';
  },

  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.fetch();
  },

  applyFilters() {
    this.filters.status = document.getElementById('filter-entrega-status').value;
    this.filters.busca = document.getElementById('search-entregas').value;
    this.currentPage = 1;
    this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    const modal = document.getElementById('modal-entrega');
    const title = document.getElementById('modal-entrega-title');

    // Carregar motoristas e rotas para os selects
    await this.loadMotoristas();
    await this.loadRotas();
    await this.loadVeiculos();
    await this.loadClientes();

    if (id) {
      title.textContent = 'Editar Entrega';
      const result = await API.get('/entregas/' + id);
      if (result && result.ok) {
        const e = result.data.data;
        document.getElementById('ent-cliente-nome').value = e.cliente_nome || '';
        document.getElementById('ent-cliente-telefone').value = e.cliente_telefone || '';
        document.getElementById('ent-cliente-email').value = e.cliente_email || '';
        document.getElementById('ent-origem').value = e.endereco_origem || '';
        document.getElementById('ent-destino').value = e.endereco_destino || '';
        document.getElementById('ent-cidade-destino').value = e.cidade_destino || '';
        document.getElementById('ent-motorista').value = e.motorista_id || '';
        document.getElementById('ent-rota').value = e.rota_id || '';
        document.getElementById('ent-veiculo').value = e.vehicle_id || '';
        document.getElementById('ent-cliente-id').value = e.customer_id || '';
        document.getElementById('ent-data-saida').value = e.data_saida ? e.data_saida.substring(0, 16) : '';
        document.getElementById('ent-data-prevista').value = e.data_prevista ? e.data_prevista.substring(0, 16) : '';
        document.getElementById('ent-status').value = e.status || 'pendente';
        document.getElementById('ent-peso').value = e.peso_kg || '';
        document.getElementById('ent-route-distance').value = e.route_distance_km || '';
        document.getElementById('ent-observacoes').value = e.observacoes || '';
      }
    } else {
      title.textContent = 'Nova Entrega';
      document.getElementById('form-entrega').reset();
      document.getElementById('ent-status').value = 'pendente';
    }

    Modal.open('modal-entrega');
  },

  async loadMotoristas() {
    const result = await API.get('/motoristas?limit=100&status=ativo');
    if (!result || !result.ok) return;
    const sel = document.getElementById('ent-motorista');
    const current = sel.value;
    sel.innerHTML = '<option value="">Selecionar motorista...</option>';
    result.data.data.forEach(m => {
      sel.innerHTML += '<option value="' + m.id + '">' + m.nome + ' — ' + m.veiculo + '</option>';
    });
    if (current) sel.value = current;
  },

  async loadRotas() {
    const result = await API.get('/rotas?limit=100');
    if (!result || !result.ok) return;
    const sel = document.getElementById('ent-rota');
    const current = sel.value;
    sel.innerHTML = '<option value="">Selecionar rota...</option>';
    result.data.data.forEach(r => {
      sel.innerHTML += '<option value="' + r.id + '">' + r.nome + ' (' + r.cidade_origem + ' → ' + r.cidade_destino + ')</option>';
    });
    if (current) sel.value = current;
  },

  async loadVeiculos() {
    const result = await API.get('/veiculos?limit=100');
    if (!result || !result.ok) return;
    const sel = document.getElementById('ent-veiculo');
    const current = sel.value;
    sel.innerHTML = '<option value="">Selecionar veículo...</option>';
    result.data.data.forEach(v => {
      sel.innerHTML += '<option value="' + v.id + '">' + v.license_plate + ' — ' + v.manufacturer + ' ' + v.model + '</option>';
    });
    if (current) sel.value = current;
  },

  async loadClientes() {
    const result = await API.get('/clientes?limit=100');
    if (!result || !result.ok) return;
    const sel = document.getElementById('ent-cliente-id');
    const current = sel.value;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>';
    result.data.data.forEach(c => {
      sel.innerHTML += '<option value="' + c.id + '">' + c.name + ' — ' + c.cpf_cnpj + '</option>';
    });
    if (current) sel.value = current;
  },

  async save() {
    const data = {
      cliente_nome: document.getElementById('ent-cliente-nome').value.trim(),
      cliente_telefone: document.getElementById('ent-cliente-telefone').value.trim(),
      cliente_email: document.getElementById('ent-cliente-email').value.trim(),
      endereco_origem: document.getElementById('ent-origem').value.trim(),
      endereco_destino: document.getElementById('ent-destino').value.trim(),
      cidade_destino: document.getElementById('ent-cidade-destino').value.trim(),
      motorista_id: document.getElementById('ent-motorista').value || null,
      rota_id: document.getElementById('ent-rota').value || null,
      vehicle_id: document.getElementById('ent-veiculo').value || null,
      customer_id: document.getElementById('ent-cliente-id').value || null,
      data_saida: document.getElementById('ent-data-saida').value || null,
      data_prevista: document.getElementById('ent-data-prevista').value,
      status: document.getElementById('ent-status').value,
      peso_kg: document.getElementById('ent-peso').value || null,
      route_distance_km: document.getElementById('ent-route-distance').value || null,
      observacoes: document.getElementById('ent-observacoes').value.trim()
    };

    if (!data.cliente_nome || !data.endereco_origem || !data.endereco_destino || !data.data_prevista) {
      Toast.show('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    const btn = document.getElementById('btn-salvar-entrega');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    let result;
    if (this.editingId) {
      result = await API.put('/entregas/' + this.editingId, data);
    } else {
      result = await API.post('/entregas', data);
    }

    btn.disabled = false;
    btn.textContent = 'Salvar';

    if (result && result.ok) {
      Toast.show(this.editingId ? 'Entrega atualizada com sucesso!' : 'Entrega criada com sucesso!', 'success');
      Modal.close('modal-entrega');
      this.fetch();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar entrega', 'error');
    }
  },

  async edit(id) {
    await this.openModal(id);
  },

  async delete(id, codigo) {
    Utils.confirm('Deseja excluir a entrega ' + codigo + '?', async function() {
      const result = await API.delete('/entregas/' + id);
      if (result && result.ok) {
        Toast.show('Entrega excluída com sucesso', 'success');
        Entregas.fetch();
      } else {
        Toast.show(result?.data?.message || 'Erro ao excluir', 'error');
      }
    });
  },

  async viewTracking(id) {
    const result = await API.get('/rastreamento/entrega/' + id);
    if (!result || !result.ok) return;

    const { entrega, historico } = result.data.data;
    const container = document.getElementById('tracking-content');
    const title = document.getElementById('modal-tracking-title');

    title.textContent = 'Rastreamento — ' + entrega.codigo;

    if (!historico.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📍</div><h3>Sem movimentações</h3></div>';
    } else {
      container.innerHTML = '<div class="timeline">' +
        historico.map(h => {
          return '<div class="timeline-item">' +
            '<div class="timeline-dot ' + h.status + '"></div>' +
            '<div class="timeline-content">' +
              '<div class="timeline-time">📅 ' + Utils.formatDateTime(h.criado_em) + (h.atualizado_por_nome ? ' · por ' + h.atualizado_por_nome : '') + '</div>' +
              '<div class="timeline-location">📍 ' + h.localizacao + '</div>' +
              (h.descricao ? '<div class="timeline-desc">' + h.descricao + '</div>' : '') +
              '<div style="margin-top:6px">' + Utils.badge(h.status) + '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
        '</div>';
    }

    Modal.open('modal-tracking');
  },

  exportExcel() {
    const status = document.getElementById('filter-entrega-status').value;
    API.download('/rastreamento/export/excel' + (status ? '?status=' + status : ''), 'logitrack-entregas.xlsx');
  },

  exportPDF() {
    const status = document.getElementById('filter-entrega-status').value;
    API.download('/rastreamento/export/pdf' + (status ? '?status=' + status : ''), 'logitrack-entregas.pdf');
  }
};
