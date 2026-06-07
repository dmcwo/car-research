function loadGarage(onLoaded) {
  browser.runtime.sendMessage({ type: 'GET_GARAGE' }).then(function(resp) {
    onLoaded(resp.garage || []);
  });
}

function renderGarage(garage, container, onDelete, onExportCsv, onExportJson, onClear) {
  container.innerHTML = '';

  var actions = document.createElement('div');
  actions.className = 'garage-actions';
  [['btn-export-garage-csv','Export CSV',false],
   ['btn-export-garage-json','Export JSON',false],
   ['btn-clear-garage','Clear All',true]].forEach(function(def) {
    var btn = document.createElement('button');
    btn.id = def[0];
    btn.textContent = def[1];
    if (def[2]) btn.classList.add('btn-danger');
    actions.appendChild(btn);
  });
  container.appendChild(actions);

  document.getElementById('btn-export-garage-csv').onclick = onExportCsv;
  document.getElementById('btn-export-garage-json').onclick = onExportJson;
  document.getElementById('btn-clear-garage').onclick = onClear;

  if (!garage.length) {
    var empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'No saved cars yet. Use "Save to Garage" on a listing.';
    container.appendChild(empty);
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
    var cells = [
      String(car.year || ''),
      car.make || '',
      car.model || '',
      car.price ? '$' + car.price.toLocaleString() : '',
      car.mileage ? car.mileage.toLocaleString() : '',
      car.websiteName || ''
    ];
    cells.forEach(function(text) {
      var td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    var btnTd = document.createElement('td');
    var delBtn = document.createElement('button');
    delBtn.className = 'btn-delete btn-danger';
    delBtn.dataset.id = car.id;
    delBtn.textContent = '✕';
    btnTd.appendChild(delBtn);
    tr.appendChild(btnTd);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  container.querySelectorAll('.btn-delete').forEach(function(btn) {
    btn.onclick = function() { onDelete(btn.dataset.id); };
  });

  var count = document.createElement('p');
  count.className = 'garage-count';
  count.textContent = garage.length + ' car' + (garage.length !== 1 ? 's' : '') + ' saved';
  container.appendChild(count);
}
