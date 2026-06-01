/* ============================================================
   LogiTrack - Módulo Dashboard
   ============================================================ */

const Dashboard = {
  charts: {},

  async load() {
    const result = await API.get('/entregas/dashboard');
    if (!result || !result.ok) return;
    const data = result.data.data;
    this.renderStats(data);
    this.renderCharts(data);
    this.renderUltimasEntregas(data.ultimas_entregas);
  },

  renderStats(data) {
    const e = data.entregas;
    const m = data.motoristas;

    document.getElementById('stat-total').textContent = e.total || 0;
    document.getElementById('stat-entregues').textContent = e.entregues || 0;
    document.getElementById('stat-em-rota').textContent = e.em_rota || 0;
    document.getElementById('stat-atrasadas').textContent = e.atrasadas || 0;
    document.getElementById('stat-pendentes').textContent = e.pendentes || 0;
    document.getElementById('stat-motoristas').textContent = m.total || 0;
    document.getElementById('stat-motoristas-ativos').textContent = m.ativos || 0;

    // Taxa de sucesso
    const taxa = e.total > 0 ? Math.round((e.entregues / e.total) * 100) : 0;
    const taxaEl = document.getElementById('stat-taxa');
    if (taxaEl) taxaEl.textContent = taxa + '%';
  },

  renderCharts(data) {
    this.renderStatusChart(data.graficos.porStatus);
    this.renderDiaChart(data.graficos.porDia);
  },

  renderStatusChart(porStatus) {
    const ctx = document.getElementById('chart-status');
    if (!ctx) return;

    if (this.charts.status) this.charts.status.destroy();

    const labels = porStatus.map(s => Utils.formatStatus(s.status));
    const values = porStatus.map(s => s.total);
    const colors = {
      pendente: '#ff9800', em_preparacao: '#2196f3',
      em_rota: '#9c27b0', entregue: '#4caf50', cancelada: '#f44336'
    };
    const bgColors = porStatus.map(s => colors[s.status] || '#8b949e');

    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderColor: '#1c2128',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8b949e', padding: 16, font: { size: 12 } }
          }
        },
        cutout: '65%'
      }
    });
  },

  renderDiaChart(porDia) {
    const ctx = document.getElementById('chart-dia');
    if (!ctx) return;

    if (this.charts.dia) this.charts.dia.destroy();

    const labels = porDia.map(d => {
      const date = new Date(d.data);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    this.charts.dia = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total',
            data: porDia.map(d => d.total),
            backgroundColor: 'rgba(33, 150, 243, 0.3)',
            borderColor: '#2196f3',
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: 'Entregues',
            data: porDia.map(d => d.entregues),
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            borderColor: '#4caf50',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#8b949e', font: { size: 12 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#8b949e' },
            grid: { color: 'rgba(48, 54, 61, 0.5)' }
          },
          y: {
            ticks: { color: '#8b949e', stepSize: 1 },
            grid: { color: 'rgba(48, 54, 61, 0.5)' },
            beginAtZero: true
          }
        }
      }
    });
  },

  renderUltimasEntregas(entregas) {
    const tbody = document.getElementById('ultimas-entregas-tbody');
    if (!tbody) return;

    if (!entregas || !entregas.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:24px">Nenhuma entrega encontrada</td></tr>';
      return;
    }

    tbody.innerHTML = entregas.map(e => {
      const atrasada = Utils.isAtrasada(e.data_prevista, e.status);
      return '<tr>' +
        '<td><strong>' + e.codigo + '</strong></td>' +
        '<td>' + e.cliente_nome + '</td>' +
        '<td>' + (e.motorista_nome || '<span class="text-muted">Não atribuído</span>') + '</td>' +
        '<td>' + (atrasada ? '<span class="badge badge-cancelada">Atrasada</span>' : Utils.badge(e.status)) + '</td>' +
        '<td>' + Utils.formatDate(e.data_prevista) + '</td>' +
        '</tr>';
    }).join('');
  }
};
