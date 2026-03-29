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

function fmt(n) {
  return '$' + parseFloat(n).toFixed(2);
}

function renderDashboard() {
  const txs = getTransactions();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('total-income').textContent = fmt(income);
  document.getElementById('total-expense').textContent = fmt(expense);
  document.getElementById('balance').textContent = fmt(balance);

  const canvas = document.getElementById('pie-chart');
  const noData = document.getElementById('no-data');

  if (income === 0 && expense === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';

  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#9ccc65', '#e53935'],
        borderColor: ['#7cb342', '#c62828'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + fmt(ctx.parsed)
          }
        }
      }
    }
  });
}

renderDashboard();
