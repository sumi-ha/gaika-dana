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
    return { ...item,yen_rate: 1 / rate, yen: item.amount / rate };
  });

  converted.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.classList.add('divide-x');
    tr.dataset.index = index;
    tr.innerHTML = `
      <td class="px-4 py-2 text-left">${item.currency}</td>
      <td class="px-4 py-2 text-right">${Math.round(item.yen_rate).toLocaleString('ja-JP')}</td>
      <td class="px-4 py-2 text-right">${item.amount}</td>
      <td class="px-4 py-2 text-right">${Math.round(item.yen).toLocaleString('ja-JP')}</td>
      <td class="text-center">
        <button class="delete-btn text-gray-500 hover:text-red-700">
          <!-- Heroicons: mini/trash -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline" viewBox="0 0 20 20" fill="currentColor" class="size-5">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd" />
          </svg>
        </button>
      </td>
      `;
    tbody.appendChild(tr);

    // deleteボタン作成
    const btn = tr.querySelector('button');
    btn.addEventListener('click', e => {
      e.stopPropagation(); // 念のため、行クリックとバッティング防止
      if (!window.confirm('本当に削除しますか？')) return;

      data.splice(index, 1); // データ削除
      save();
      render(); // 再描画
    });
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
  e.target.reset();
});

// reloadボタン
document.getElementById('reload-btn').addEventListener('click', async () => {
  location.reload();
});

//
init();
load();
render();


