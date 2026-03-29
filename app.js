function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0) === (tab === 'login'))
  );
  document.getElementById('login-form').classList.toggle('active', tab === 'login');
  document.getElementById('register-form').classList.toggle('active', tab === 'register');
  clearMessages();
}

function clearMessages() {
  ['login-error', 'register-error', 'register-success'].forEach(id => {
    const el = document.getElementById(id);
    el.style.display = 'none';
    el.textContent = '';
  });
}

function showMsg(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}

function getUsers() {
  return JSON.parse(localStorage.getItem('ft_users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('ft_users', JSON.stringify(users));
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  clearMessages();

  if (!email || !password) {
    showMsg('login-error', 'Please fill in all fields.');
    return;
  }

  const users = getUsers();
  if (!users[email] || users[email] !== password) {
    showMsg('login-error', 'Invalid email or password. Please try again.');
    return;
  }

  localStorage.setItem('ft_current_user', email);
  window.location.href = 'dashboard.html';
}

function handleRegister() {
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  clearMessages();

  if (!email || !password || !confirm) {
    showMsg('register-error', 'Please fill in all fields.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMsg('register-error', 'Please enter a valid email address.');
    return;
  }

  if (password.length < 6) {
    showMsg('register-error', 'Password must be at least 6 characters.');
    return;
  }

  if (password !== confirm) {
    showMsg('register-error', 'Passwords do not match.');
    return;
  }

  const users = getUsers();
  if (users[email]) {
    showMsg('register-error', 'An account with this email already exists.');
    return;
  }

  users[email] = password;
  saveUsers(users);
  showMsg('register-success', 'Account created! You can now log in.');
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-confirm').value = '';
}
