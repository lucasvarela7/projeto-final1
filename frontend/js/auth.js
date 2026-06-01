/* ============================================================
   LogiTrack - Módulo de Autenticação
   ============================================================ */

const Auth = {
  async login(email, senha) {
    const btn = document.getElementById('btn-login');
    const btnText = document.getElementById('btn-login-text');
    const btnSpinner = document.getElementById('btn-login-spinner');
    const errorEl = document.getElementById('login-error');

    btn.disabled = true;
    btnText.textContent = 'Entrando...';
    btnSpinner.style.display = 'inline-block';
    errorEl.style.display = 'none';

    const result = await API.post('/auth/login', { email, senha });

    btn.disabled = false;
    btnText.textContent = 'Entrar';
    btnSpinner.style.display = 'none';

    if (!result || !result.ok) {
      const msg = result?.data?.message || 'Erro ao realizar login';
      errorEl.textContent = msg;
      errorEl.style.display = 'flex';
      return;
    }

    const { token, usuario } = result.data.data;
    localStorage.setItem('lt_token', token);
    localStorage.setItem('lt_user', JSON.stringify(usuario));
    App.token = token;
    App.user = usuario;
    App.showApp();
    Toast.show('Bem-vindo, ' + usuario.nome + '!', 'success');
  },

  fillDemo(email, senha) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-senha').value = senha;
  }
};

// Event listeners do formulário de login
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const senha = document.getElementById('login-senha').value;
      if (!email || !senha) {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = 'Preencha todos os campos';
        errorEl.style.display = 'flex';
        return;
      }
      Auth.login(email, senha);
    });
  }

  // Toggle senha
  const toggleBtn = document.getElementById('toggle-senha');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const input = document.getElementById('login-senha');
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.textContent = '🙈';
      } else {
        input.type = 'password';
        toggleBtn.textContent = '👁️';
      }
    });
  }
});
