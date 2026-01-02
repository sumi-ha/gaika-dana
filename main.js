let data = [];
let rates = null;

// 為替レート取得
async function fetchRates() {
  const res = await fetch('https://v6.exchangerate-api.com/v6/5b41fe836b1d49c716447948/latest/JPY');
  const json = await res.json();

  const timeEl = document.getElementById('rate-time');
  if (json.time_last_update_unix) {
    const d = new Date(json.time_last_update_unix * 1000);
    timeEl.textContent = `為替レート：${d.toLocaleString('ja-JP')} 時点`;
  }

  return json.conversion_rates || {};
}

// ローカルストレージ data init
async function init() {
  load();
  rates = await fetchRates();
  render();
}

// ローカルストレージ data save
function save() {
  localStorage.setItem('gaika-dana', JSON.stringify(data));
}

// ローカルストレージ data load
function load() {
  const raw = localStorage.getItem('gaika-dana');
  if(raw) {
    data = JSON.parse(raw);
  }
}

// 描画処理
async function render() {
  if (!rates) return;

  const tbody = document.getElementById('rows');
  tbody.innerHTML = '';

  if (data.length === 0) {
    document.getElementById('total').textContent = '0';
    return;
  }
 
  const converted = data.map(item => {
    const rate = rates[item.currency];
    if (!rate) {
      console.warn('rate missing:', item.currency);
      return { ...item, yen: 0 };
    }
    return { ...item, yen: item.amount / rate };
  });

  converted.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.classList.add('divide-x');
    tr.dataset.index = index;
    tr.innerHTML = `
      <td class="px-4 py-2 text-left">${item.currency}</td>
      <td class="px-4 py-2 text-right">${item.amount}</td>
      <td class="px-4 py-2 text-right">${Math.round(item.yen).toLocaleString('ja-JP')}</td>
      `;
    tbody.appendChild(tr);
  });

  const total = converted.reduce((sum, item) => {
    return sum + item.yen;
  }, 0);
  const totalEl = document.getElementById('total');
  totalEl.textContent = Math.round(total).toLocaleString('ja-JP');
}


// create処理
document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();
  const currency = document.getElementById('currency').value.toUpperCase();
  const amount = Number(document.getElementById('amount').value);
  data.push({ currency, amount });
  save();
  render();
});

// delete処理
document.getElementById('rows').addEventListener('click', e => {
  const tr = e.target.closest('tr');
  if (!tr) return;

  const index = Number(tr.dataset.index);
  if (Number.isNaN(index)) return;

  data.splice(index, 1); // 削除
  save();
  render();
});

//
init();
load();
render();


