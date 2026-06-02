/* ============================================================
   LogiTrack - Enterprise Modules (Vehicles, Customers, Mapbox)
   ============================================================ */

const Veiculos = {
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
    const result = await API.get('/veiculos?' + params.toString());
    if (!result || !result.ok) return;
    this.totalPages = result.data.pagination.pages;
    const tbody = document.getElementById('veiculos-tbody');
    if (!tbody) return;
    tbody.innerHTML = result.data.data.map(v => '<tr>'
      + '<td><strong>' + v.license_plate + '</strong></td>'
      + '<td>' + v.manufacturer + ' ' + v.model + '</td>'
      + '<td>' + (v.year || '—') + '</td>'
      + '<td>' + (v.cargo_capacity || '—') + '</td>'
      + '<td>' + (v.fuel_type || '—') + '</td>'
      + '<td>' + Utils.badge(v.status) + '</td>'
      + '<td><button class="btn btn-ghost btn-sm" onclick="Veiculos.openModal(' + v.id + ')">✏️</button></td>'
      + '</tr>').join('');
  },

  async loadStats() {
    const result = await API.get('/veiculos/estatisticas');
    if (!result || !result.ok) return;
    const s = result.data.data;
    const el = document.getElementById('veiculos-stats');
    if (el) el.innerHTML = '<span class="badge badge-ativo">Disponíveis: ' + (s.available || 0) + '</span> '
      + '<span class="badge badge-em_rota">Em uso: ' + (s.in_use || 0) + '</span> '
      + '<span class="badge badge-inativo">Manutenção: ' + (s.maintenance || 0) + '</span>';
  },

  applyFilters() {
    this.filters.status = document.getElementById('filter-veiculo-status').value;
    this.filters.busca = document.getElementById('search-veiculos').value;
    this.currentPage = 1;
    this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    const form = document.getElementById('form-veiculo');
    if (!form) return;
    form.reset();
    document.getElementById('modal-veiculo-title').textContent = id ? 'Editar Veículo' : 'Novo Veículo';
    if (id) {
      const result = await API.get('/veiculos/' + id);
      if (result && result.ok) {
        const v = result.data.data;
        document.getElementById('vei-placa').value = v.license_plate || '';
        document.getElementById('vei-modelo').value = v.model || '';
        document.getElementById('vei-fabricante').value = v.manufacturer || '';
        document.getElementById('vei-ano').value = v.year || '';
        document.getElementById('vei-capacidade').value = v.cargo_capacity || '';
        document.getElementById('vei-combustivel').value = v.fuel_type || '';
        document.getElementById('vei-status').value = v.status || 'available';
      }
    }
    Modal.open('modal-veiculo');
  },

  async save() {
    const data = {
      license_plate: document.getElementById('vei-placa').value.trim(),
      model: document.getElementById('vei-modelo').value.trim(),
      manufacturer: document.getElementById('vei-fabricante').value.trim(),
      year: document.getElementById('vei-ano').value || null,
      cargo_capacity: document.getElementById('vei-capacidade').value || null,
      fuel_type: document.getElementById('vei-combustivel').value.trim(),
      status: document.getElementById('vei-status').value
    };
    if (!data.license_plate || !data.model || !data.manufacturer) return Toast.show('Preencha os campos obrigatórios', 'warning');
    const result = this.editingId ? await API.put('/veiculos/' + this.editingId, data) : await API.post('/veiculos', data);
    if (result && result.ok) {
      Modal.close('modal-veiculo');
      Toast.show('Veículo salvo com sucesso', 'success');
      this.fetch();
      this.loadStats();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar veículo', 'error');
    }
  }
};

const Clientes = {
  currentPage: 1,
  filters: { busca: '' },
  editingId: null,

  async load() {
    await this.fetch();
    await this.loadStats();
  },

  async fetch() {
    const params = new URLSearchParams({
      page: this.currentPage, limit: 10,
      ...(this.filters.busca && { busca: this.filters.busca })
    });
    const result = await API.get('/clientes?' + params.toString());
    if (!result || !result.ok) return;
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;
    tbody.innerHTML = result.data.data.map(c => '<tr>'
      + '<td><strong>' + c.name + '</strong></td>'
      + '<td>' + c.cpf_cnpj + '</td>'
      + '<td>' + (c.email || '—') + '</td>'
      + '<td>' + (c.phone || '—') + '</td>'
      + '<td>' + [c.street, c.neighborhood, c.city, c.state].filter(Boolean).join(', ') + '</td>'
      + '<td><button class="btn btn-ghost btn-sm" onclick="Clientes.openModal(' + c.id + ')">✏️</button></td>'
      + '</tr>').join('');
  },

  async loadStats() {
    const result = await API.get('/clientes/estatisticas');
    if (!result || !result.ok) return;
    const s = result.data.data;
    const el = document.getElementById('clientes-stats');
    if (el) el.innerHTML = '<span class="badge badge-operador">Total: ' + (s.total_customers || 0) + '</span> '
      + '<span class="badge badge-ativo">Últimos 30 dias: ' + (s.new_last_30_days || 0) + '</span>';
  },

  applyFilters() {
    this.filters.busca = document.getElementById('search-clientes').value;
    this.currentPage = 1;
    this.fetch();
  },

  async openModal(id) {
    this.editingId = id || null;
    document.getElementById('form-cliente').reset();
    document.getElementById('modal-cliente-title').textContent = id ? 'Editar Cliente' : 'Novo Cliente';
    if (id) {
      const result = await API.get('/clientes/' + id);
      if (result && result.ok) {
        const c = result.data.data;
        document.getElementById('cli-nome').value = c.name || '';
        document.getElementById('cli-doc').value = c.cpf_cnpj || '';
        document.getElementById('cli-email').value = c.email || '';
        document.getElementById('cli-telefone').value = c.phone || '';
        document.getElementById('cli-cep').value = c.zip_code || '';
        document.getElementById('cli-rua').value = c.street || '';
        document.getElementById('cli-bairro').value = c.neighborhood || '';
        document.getElementById('cli-cidade').value = c.city || '';
        document.getElementById('cli-estado').value = c.state || '';
      }
    }
    Modal.open('modal-cliente');
  },

  async save() {
    const data = {
      name: document.getElementById('cli-nome').value.trim(),
      cpf_cnpj: document.getElementById('cli-doc').value.trim(),
      email: document.getElementById('cli-email').value.trim(),
      phone: document.getElementById('cli-telefone').value.trim(),
      zip_code: document.getElementById('cli-cep').value.trim(),
      street: document.getElementById('cli-rua').value.trim(),
      neighborhood: document.getElementById('cli-bairro').value.trim(),
      city: document.getElementById('cli-cidade').value.trim(),
      state: document.getElementById('cli-estado').value.trim()
    };
    if (!data.name || !data.cpf_cnpj) return Toast.show('Nome e CPF/CNPJ são obrigatórios', 'warning');
    const result = this.editingId ? await API.put('/clientes/' + this.editingId, data) : await API.post('/clientes', data);
    if (result && result.ok) {
      Modal.close('modal-cliente');
      Toast.show('Cliente salvo com sucesso', 'success');
      this.fetch();
      this.loadStats();
    } else {
      Toast.show(result?.data?.message || 'Erro ao salvar cliente', 'error');
    }
  }
};

const MapaLogistico = {
  map: null,
  routeLayerId: 'delivery-route',
  routeSourceId: 'route-source',
  mapboxToken: '',
  markers: [],

  async load() {
    const sel = document.getElementById('map-entrega');
    if (!sel) return;
    const tokenResponse = await API.get('/mapa/token');
    this.mapboxToken = tokenResponse?.ok ? tokenResponse.data.data.access_token : '';
    const result = await API.get('/entregas?limit=100');
    if (!result || !result.ok) return;
    sel.innerHTML = '<option value="">Selecione uma entrega...</option>';
    result.data.data.forEach(e => {
      sel.innerHTML += '<option value="' + e.id + '">' + e.codigo + ' - ' + e.cliente_nome + '</option>';
    });
  },

  async renderRoute() {
    const deliveryId = document.getElementById('map-entrega').value;
    if (!deliveryId) return;
    const result = await API.get('/mapa/entrega/' + deliveryId);
    if (!result || !result.ok) return Toast.show(result?.data?.message || 'Erro ao gerar rota', 'error');
    const d = result.data.data;
    const token = this.mapboxToken || '';
    if (!token) return Toast.show('MAPBOX_ACCESS_TOKEN não configurado', 'warning');
    mapboxgl.accessToken = token;
    if (!this.map) {
      this.map = new mapboxgl.Map({
        container: 'map-container',
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [d.origin.longitude, d.origin.latitude],
        zoom: 5
      });
    }
    const drawRoute = () => {
      if (this.map.getSource(this.routeSourceId)) {
        this.map.removeLayer(this.routeLayerId);
        this.map.removeSource(this.routeSourceId);
      }
      this.map.addSource(this.routeSourceId, { type: 'geojson', data: { type: 'Feature', geometry: d.route } });
      this.map.addLayer({
        id: this.routeLayerId,
        type: 'line',
        source: this.routeSourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#4caf50', 'line-width': 5 }
      });
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
      this.markers.push(new mapboxgl.Marker({ color: '#2196f3' }).setLngLat([d.origin.longitude, d.origin.latitude]).addTo(this.map));
      this.markers.push(new mapboxgl.Marker({ color: '#f44336' }).setLngLat([d.destination.longitude, d.destination.latitude]).addTo(this.map));
      if (d.driver_location && d.driver_location.longitude && d.driver_location.latitude) {
        this.markers.push(new mapboxgl.Marker({ color: '#ff9800' }).setLngLat([Number(d.driver_location.longitude), Number(d.driver_location.latitude)]).addTo(this.map));
      }
      this.map.fitBounds([
        [d.origin.longitude, d.origin.latitude],
        [d.destination.longitude, d.destination.latitude]
      ], { padding: 40 });
    };
    if (!this.map.isStyleLoaded()) {
      this.map.once('load', drawRoute);
    } else {
      drawRoute();
    }
    document.getElementById('map-distance').textContent = d.distance_km + ' km';
    document.getElementById('map-eta').textContent = d.estimated_travel_time_minutes + ' min';
  }
};
