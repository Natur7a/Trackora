const user = localStorage.getItem('ft_current_user');
if (!user) window.location.href = 'index.html';

document.getElementById('user-badge').textContent = user;

function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('active');
}

function logout() {
  localStorage.removeItem('ft_current_user');
  window.location.href = 'index.html';
}

function getTransactions() {
  return JSON.parse(localStorage.getItem('ft_transactions_' + user) || '[]');
}

function saveTransactions(txs) {
  localStorage.setItem('ft_transactions_' + user, JSON.stringify(txs));
}

function fmt(n) {
  return '$' + parseFloat(n).toFixed(2);
}

function showSection(view) {
  document.getElementById('section-add').classList.toggle('hidden', view !== 'add');
  document.getElementById('section-list').classList.toggle('hidden', view !== 'list');
  if (view === 'list') renderList();
  toggleMenu();
}

// Read URL param on load
(function init() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'add';
  document.getElementById('section-add').classList.toggle('hidden', view !== 'add');
  document.getElementById('section-list').classList.toggle('hidden', view !== 'list');
  if (view === 'list') renderList();

  // Set today as default date
  document.getElementById('tx-date').valueAsDate = new Date();
})();

function addTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const type = document.getElementById('tx-type').value;
  const category = document.getElementById('tx-category').value;
  const date = document.getElementById('tx-date').value;
  const note = document.getElementById('tx-note').value.trim();
  const errEl = document.getElementById('form-error');

  errEl.style.display = 'none';

  if (!amount || amount <= 0) {
    errEl.textContent = 'Please enter a valid amount.';
    errEl.style.display = 'block';
    return;
  }

  if (!date) {
    errEl.textContent = 'Please select a date.';
    errEl.style.display = 'block';
    return;
  }

  const txs = getTransactions();
  txs.unshift({ id: Date.now(), amount, type, category, date, note });
  saveTransactions(txs);

  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-note').value = '';
  document.getElementById('tx-date').valueAsDate = new Date();

  alert('Transaction added!');
}

function renderList() {
  const txs = getTransactions();
  const container = document.getElementById('tx-list');

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  document.getElementById('list-income').textContent = fmt(income);
  document.getElementById('list-expense').textContent = fmt(expense);
  document.getElementById('list-balance').textContent = fmt(income - expense);

  if (txs.length === 0) {
    container.innerHTML = '<p class="empty-msg">No transactions found.</p>';
    return;
  }

  container.innerHTML = txs.map(tx => `
    <div class="tx-item">
      <div class="tx-left">
        <div class="tx-dot ${tx.type}"></div>
        <div class="tx-info">
          <div class="tx-category">${tx.category}</div>
          <div class="tx-meta">${tx.date}${tx.note ? ' · ' + tx.note : ''}</div>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${fmt(tx.amount)}</span>
        <button class="btn btn-edit" onclick="openEdit(${tx.id})">Edit</button>
        <button class="btn btn-delete" onclick="deleteTransaction(${tx.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function deleteTransaction(id) {
  if (!confirm('Delete this transaction?')) return;
  const txs = getTransactions().filter(t => t.id !== id);
  saveTransactions(txs);
  renderList();
}

let editingId = null;

function openEdit(id) {
  const tx = getTransactions().find(t => t.id === id);
  if (!tx) return;
  editingId = id;
  document.getElementById('edit-amount').value = tx.amount;
  document.getElementById('edit-type').value = tx.type;
  document.getElementById('edit-category').value = tx.category;
  document.getElementById('edit-date').value = tx.date;
  document.getElementById('edit-note').value = tx.note || '';
  document.getElementById('modal-overlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  editingId = null;
}

function saveEdit() {
  const amount = parseFloat(document.getElementById('edit-amount').value);
  if (!amount || amount <= 0) { alert('Enter a valid amount.'); return; }

  const txs = getTransactions().map(t => {
    if (t.id !== editingId) return t;
    return {
      ...t,
      amount,
      type: document.getElementById('edit-type').value,
      category: document.getElementById('edit-category').value,
      date: document.getElementById('edit-date').value,
      note: document.getElementById('edit-note').value.trim()
    };
  });

  saveTransactions(txs);
  closeModal();
  renderList();
}
