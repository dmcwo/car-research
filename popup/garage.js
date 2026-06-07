function loadGarage(onLoaded) {
  browser.runtime.sendMessage({ type: 'GET_GARAGE' }).then(function(resp) {
    onLoaded(resp.garage || []);
  });
}

function garageIcon(name, size) {
  var img = document.createElement('img');
  img.src = '../icons/lucide/' + name + '.svg';
  img.alt = '';
  img.width = size || 13;
  img.height = size || 13;
  return img;
}

function renderGarage(garage, container, onDelete, onExportCsv, onExportJson, onClear) {
  container.innerHTML = '';

  // ── Header bar ─────────────────────────────────────────────────────────────
  var header = document.createElement('div');
  header.className = 'garage-header';
  header.appendChild(garageIcon('store', 15));
  var headerTitle = document.createElement('span');
  headerTitle.textContent = 'Saved Cars';
  header.appendChild(headerTitle);
  container.appendChild(header);

  // ── Action buttons ──────────────────────────────────────────────────────────
  var actions = document.createElement('div');
  actions.className = 'garage-actions';

  [['btn-export-garage-csv',  'download',  'Export CSV',  false],
   ['btn-export-garage-json', 'file-json', 'Export JSON', false],
   ['btn-clear-garage',       'trash-2',   'Clear All',   true]
  ].forEach(function(def) {
    var btn = document.createElement('button');
    btn.id = def[0];
    btn.appendChild(garageIcon(def[1]));
    btn.appendChild(document.createTextNode(def[2]));
    if (def[3]) btn.classList.add('btn-danger');
    actions.appendChild(btn);
  });
  container.appendChild(actions);

  document.getElementById('btn-export-garage-csv').onclick  = onExportCsv;
  document.getElementById('btn-export-garage-json').onclick = onExportJson;
  document.getElementById('btn-clear-garage').onclick       = onClear;

  // ── Body (table or empty state) ─────────────────────────────────────────────
  var body = document.createElement('div');
  body.className = 'garage-body';

  if (!garage.length) {
    var empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'No saved cars yet. Use "Save to Garage" on a listing.';
    body.appendChild(empty);
    container.appendChild(body);
    return;
  }

  var table = document.createElement('table');
  table.className = 'garage-table';
  var thead = document.createElement('thead');
  var headerRow = document.createElement('tr');
  ['Year','Make','Model','Price','Miles','Site',''].forEach(function(h) {
    var th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  var tbody = document.createElement('tbody');
  garage.forEach(function(car) {
    var tr = document.createElement('tr');
    [String(car.year || ''),
     car.make || '',
     car.model || '',
     car.price   ? '$' + car.price.toLocaleString()   : '',
     car.mileage ? car.mileage.toLocaleString() + ' mi' : '',
     car.websiteName || ''
    ].forEach(function(text) {
      var td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });

    var btnTd = document.createElement('td');
    var delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.dataset.id = car.id;
    delBtn.title = 'Delete';
    delBtn.appendChild(garageIcon('x', 11));
    btnTd.appendChild(delBtn);
    tr.appendChild(btnTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  body.appendChild(table);

  var count = document.createElement('p');
  count.className = 'garage-count';
  count.textContent = garage.length + ' car' + (garage.length !== 1 ? 's' : '') + ' saved';
  body.appendChild(count);

  container.appendChild(body);

  container.querySelectorAll('.btn-delete').forEach(function(btn) {
    btn.onclick = function() { onDelete(btn.dataset.id); };
  });
}
