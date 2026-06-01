/* ============================================================
   LogiTrack - App Principal
   Gerenciamento de estado, autenticação e navegação
   ============================================================ */

const API_BASE = '/api';

// Estado global da aplicação
const App = {
  user: null,
  token: null,
  currentPage: 'dashboard',
  sidebarCollapsed: false,

  init() {
    this.token = localStorage.getItem('lt_token');
    const userStr = localStorage.getItem('lt_user');
    if (userStr) {
      try { this.user = JSON.parse(userStr); } catch(e) {}
    }
    if (!this.token || !this.user) {
      this.showLogin();
    } else {
      this.showApp();
    }
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  },

  showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    this.renderUserInfo();
    this.setupNavigation();
    this.applyPermissions();
    this.navigateTo('dashboard');
  },

  renderUserInfo() {
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = this.user.nome;
    if (roleEl) roleEl.textContent = this.getRoleLabel(this.user.cargo);
    if (avatarEl) avatarEl.textContent = this.user.nome.charAt(0).toUpperCase();
  },

  getRoleLabel(cargo) {
    const labels = { administrador: 'Administrador', operador: 'Operador Logístico', motorista: 'Motorista' };
    return labels[cargo] || cargo;
  },

  applyPermissions() {
    // Esconder itens de menu por permissão
    if (this.user.cargo !== 'administrador') {
      document.querySelectorAll('[data-role="administrador"]').forEach(el => el.style.display = 'none');
    }
  },

  setupNavigation() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.page;
        this.navigateTo(page);
        if (window.innerWidth <= 768) {
          document.getElementById('sidebar').classList.remove('mobile-open');
          document.getElementById('mobile-overlay').classList.remove('active');
        }
      });
    });
  },

  navigateTo(page) {
    this.currentPage = page;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
    document.querySelectorAll('.page').forEach(el => {
      el.classList.toggle('active', el.id === 'page-' + page);
    });
    const titles = {
      dashboard: { title: 'Dashboard', subtitle: 'Visão geral do sistema' },
      entregas: { title: 'Entregas', subtitle: 'Gerenciamento de entregas' },
      motoristas: { title: 'Motoristas', subtitle: 'Cadastro de motoristas' },
      rotas: { title: 'Rotas', subtitle: 'Gestão de rotas logísticas' },
      rastreamento: { title: 'Rastreamento', subtitle: 'Histórico de movimentações' },
      usuarios: { title: 'Usuários', subtitle: 'Gerenciamento de usuários' },
    };
    const info = titles[page] || { title: page, subtitle: '' };
    const titleEl = document.getElementById('header-title');
    const subtitleEl = document.getElementById('header-subtitle');
    if (titleEl) titleEl.textContent = info.title;
    if (subtitleEl) subtitleEl.textContent = info.subtitle;
    this.loadPage(page);
  },

  loadPage(page) {
    switch(page) {
      case 'dashboard': Dashboard.load(); break;
      case 'entregas': Entregas.load(); break;
      case 'motoristas': Motoristas.load(); break;
      case 'rotas': Rotas.load(); break;
      case 'rastreamento': Rastreamento.load(); break;
      case 'usuarios': Usuarios.load(); break;
    }
  },

  logout() {
    localStorage.removeItem('lt_token');
    localStorage.removeItem('lt_user');
    this.token = null;
    this.user = null;
    this.showLogin();
    Toast.show('Sessão encerrada com sucesso', 'info');
  },

  toggleSidebar() {
    if (window.innerWidth <= 768) {
      document.getElementById('sidebar').classList.toggle('mobile-open');
      document.getElementById('mobile-overlay').classList.toggle('active');
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      document.getElementById('sidebar').classList.toggle('collapsed', this.sidebarCollapsed);
      document.getElementById('main-content').classList.toggle('expanded', this.sidebarCollapsed);
    }
  },

  canAccess(roles) {
    return roles.includes(this.user?.cargo);
  }
};

/* ============================================================
   API Client
   ============================================================ */
const API = {
  async request(method, endpoint, data) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(App.token && { 'Authorization': 'Bearer ' + App.token })
      }
    };
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    const url = endpoint.startsWith('http') ? endpoint : API_BASE + endpoint;
    try {
      const response = await fetch(url, options);
      const json = await response.json();
      if (response.status === 401) {
        App.logout();
        return null;
      }
      return { ok: response.ok, status: response.status, data: json };
    } catch (error) {
      console.error('API Error:', error);
      Toast.show('Erro de conexão com o servidor', 'error');
      return null;
    }
  },
  get: (endpoint) => API.request('GET', endpoint),
  post: (endpoint, data) => API.request('POST', endpoint, data),
  put: (endpoint, data) => API.request('PUT', endpoint, data),
  delete: (endpoint) => API.request('DELETE', endpoint),

  async download(endpoint, filename) {
    try {
      const response = await fetch(API_BASE + endpoint, {
        headers: { 'Authorization': 'Bearer ' + App.token }
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      Toast.show('Erro ao baixar arquivo', 'error');
    }
  }
};

/* ============================================================
   Toast Notifications
   ============================================================ */
const Toast = {
  show(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    const container = document.getElementById('toast-container');
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
      '<span style="font-size:16px">' + icons[type] + '</span>' +
      '<span style="flex:1">' + message + '</span>' +
      '<button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:16px;padding:0 0 0 8px">×</button>';
    container.appendChild(toast);
    setTimeout(function() {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(function() { if (toast.parentElement) toast.remove(); }, 300);
    }, duration);
  }
};

/* ============================================================
   Modal Helper
   ============================================================ */
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
  }
};

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

/* ============================================================
   Utilitários
   ============================================================ */
const Utils = {
  formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  },
  formatDateTime(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  },
  formatStatus(status) {
    const map = {
      pendente: 'Pendente',
      em_preparacao: 'Em Preparação',
      em_rota: 'Em Rota',
      entregue: 'Entregue',
      cancelada: 'Cancelada',
      ativo: 'Ativo',
      inativo: 'Inativo',
      em_rota: 'Em Rota',
      ferias: 'Férias',
      afastado: 'Afastado',
      administrador: 'Administrador',
      operador: 'Operador',
      motorista: 'Motorista'
    };
    return map[status] || status;
  },
  badge(status) {
    return '<span class="badge badge-' + status + '">' + Utils.formatStatus(status) + '</span>';
  },
  isAtrasada(dataPrevista, status) {
    if (status === 'entregue' || status === 'cancelada') return false;
    return new Date(dataPrevista) < new Date();
  },
  confirm(message, callback) {
    if (window.confirm(message)) callback();
  },
  debounce(fn, delay) {
    let timer;
    return function() {
      clearTimeout(timer);
      timer = setTimeout(fn.apply.bind(fn, this, arguments), delay);
    };
  }
};

/* ============================================================
   Inicialização
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});
