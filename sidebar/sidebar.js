var currentRecord = null;
var garageData = [];
var currentTabId = null;
var currentUrl = null;
var garageOpen = false;

// ── Icon helper ──────────────────────────────────────────────────────────────
function icon(name, size) {
  var img = document.createElement('img');
  img.src = '../icons/lucide/' + name + '.svg';
  img.alt = '';
  img.width = size || 13;
  img.height = size || 13;
  return img;
}

// ── Controlled-vocabulary options ────────────────────────────────────────────
var FIELD_OPTIONS = {
  condition:  ['', 'New', 'Used', 'CPO'],
  fuelType:   ['', 'Gasoline', 'Diesel', 'Hybrid', 'PHEV', 'Electric', 'Hydrogen'],
  bodyStyle:  ['', 'Sedan', 'SUV', 'Truck', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Minivan'],
  sellerType: ['', 'Dealer', 'Private']
};

var KNOWN_MAKES = [
  'Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Buick','Cadillac',
  'Chevrolet','Chrysler','Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda',
  'Hyundai','Infiniti','Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus',
  'Lincoln','Maserati','Mazda','McLaren','Mercedes-Benz','MINI','Mitsubishi',
  'Nissan','Pontiac','Porsche','Ram','Rivian','Rolls-Royce','Saturn','Subaru',
  'Tesla','Toyota','Volkswagen','Volvo'
];

// Field definitions: [fieldKey, label, inputType]
var FIELDS = [
  ['year',        'Year',         'number'],
  ['make',        'Make',         'datalist'],
  ['model',       'Model',        'text'],
  ['trim',        'Trim',         'text'],
  ['bodyStyle',   'Body Style',   'select'],
  ['condition',   'Condition',    'select'],
  ['engine',      'Engine',       'text'],
  ['fuelType',    'Fuel Type',    'select'],
  ['mpgCity',     'MPG City',     'number'],
  ['mpgHighway',  'MPG Hwy',      'number'],
  ['mpgCombined', 'MPG Combined', 'number'],
  ['drivetrain',  'Drivetrain',   'text'],
  ['transmission','Transmission', 'text'],
  ['price',       'Price ($)',    'number'],
  ['mileage',     'Mileage',      'number'],
  ['vin',         'VIN',          'text'],
  ['stockNumber', 'Stock #',      'text'],
  ['colorExterior','Ext Color',   'text'],
  ['colorInterior','Int Color',   'text'],
  ['owners',             '# Owners',  'number'],
  ['accidentCount',      'Accidents', 'number'],
  ['carfaxSummary',      'Carfax',    'text'],
  ['isCertifiedPreOwned','CPO',        'checkbox'],
  ['warrantyInfo',       'Warranty',  'text'],
  ['sellerName',    'Seller',       'text'],
  ['sellerType',    'Seller Type',  'select'],
  ['sellerPhone',   'Phone',        'text'],
  ['sellerLocation','Location',     'text'],
  ['daysOnLot',   'Days on Lot',  'number'],
  ['websiteName', 'Website',      'text'],
  ['url',         'URL',          'url']
];

var GROUP_ICONS = {
  'Vehicle':    'car',
  'Listing':    'tag',
  'Appearance': 'palette',
  'History':    'history',
  'Seller':     'user',
  'Meta':       'info'
};

// Vehicle absorbs Powertrain. Listing at position 2.
var GROUPS = [
  { label: 'Vehicle',    keys: ['year','make','model','trim','bodyStyle','condition','engine','fuelType','mpgCity','mpgHighway','mpgCombined','drivetrain','transmission'] },
  { label: 'Listing',    keys: ['price','mileage','vin','stockNumber'] },
  { label: 'Appearance', keys: ['colorExterior','colorInterior'] },
  { label: 'History',    keys: ['owners','accidentCount','carfaxSummary','isCertifiedPreOwned','warrantyInfo'] },
  { label: 'Seller',     keys: ['sellerName','sellerType','sellerPhone','sellerLocation'] },
  { label: 'Meta',       keys: ['daysOnLot','websiteName','url'] }
];

document.addEventListener('DOMContentLoaded', function() {
  buildForm();
  buildGarageToggle();

  document.getElementById('btn-copy-csv').onclick      = copyAsCsv;
  document.getElementById('btn-download-csv').onclick  = downloadCsv;
  document.getElementById('btn-download-json').onclick = downloadJson;
  document.getElementById('btn-save').onclick           = saveToGarage;

  // Icons in action bar buttons
  document.getElementById('btn-copy-csv').prepend(icon('clipboard'));
  document.getElementById('btn-download-csv').prepend(icon('download'));
  document.getElementById('btn-download-json').prepend(icon('file-json'));
  document.getElementById('btn-save').prepend(icon('bookmark-plus'));

  runExtraction();

  browser.tabs.onActivated.addListener(function(info) {
    currentTabId = info.tabId;
    setTimeout(runExtraction, 500);
  });

  browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tabId !== currentTabId) return;
    if (changeInfo.status !== 'complete') return;
    if (tab.url === currentUrl) return;
    currentUrl = tab.url;
    setTimeout(runExtraction, 500);
  });
});

// Build the garage toggle strip at the bottom
function buildGarageToggle() {
  var btn = document.getElementById('garage-toggle');
  btn.appendChild(icon('warehouse', 16));
  var label = document.createElement('span');
  label.id = 'garage-label';
  label.textContent = 'Garage (0)';
  btn.appendChild(label);
  var chevron = document.createElement('span');
  chevron.className = 'garage-chevron';
  chevron.textContent = '▲';
  btn.appendChild(chevron);

  btn.addEventListener('click', toggleGarage);
}

function toggleGarage() {
  garageOpen = !garageOpen;
  var section = document.getElementById('garage-section');
  var toggle = document.getElementById('garage-toggle');
  section.classList.toggle('open', garageOpen);
  toggle.setAttribute('aria-expanded', String(garageOpen));
  if (garageOpen) refreshGarage();
}

function updateGarageLabel(count) {
  var label = document.getElementById('garage-label');
  if (label) label.textContent = 'Garage (' + count + ')';
}

function buildForm() {
  var form = document.getElementById('fields-form');
  var fieldMap = {};
  FIELDS.forEach(function(f) { fieldMap[f[0]] = f; });

  // Shared datalist for make typeahead
  var makeDatalist = document.createElement('datalist');
  makeDatalist.id = 'datalist-make';
  KNOWN_MAKES.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m;
    makeDatalist.appendChild(opt);
  });
  form.appendChild(makeDatalist);

  GROUPS.forEach(function(group) {
    var section = document.createElement('details');
    section.className = 'field-group';
    section.open = ['Vehicle','Listing','Seller'].includes(group.label);

    var summary = document.createElement('summary');

    var iconName = GROUP_ICONS[group.label];
    if (iconName) {
      var si = icon(iconName, 14);
      si.className = 'section-icon';
      summary.appendChild(si);
    }

    var labelSpan = document.createElement('span');
    labelSpan.textContent = group.label;
    summary.appendChild(labelSpan);

    var chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▶';
    summary.appendChild(chevron);

    section.appendChild(summary);

    var grid = document.createElement('div');
    grid.className = 'field-grid';

    group.keys.forEach(function(key) {
      var def = fieldMap[key];
      if (!def) return;

      var label = document.createElement('label');
      label.setAttribute('for', 'field-' + key);
      label.textContent = def[1];

      var input = createInput(def);
      input.id = 'field-' + key;
      input.dataset.key = key;

      var wrapper = document.createElement('div');
      wrapper.className = 'field-row' + (def[2] === 'url' ? ' field-full' : '');
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      grid.appendChild(wrapper);
    });

    section.appendChild(grid);
    form.appendChild(section);
  });

  // Notes
  var notesSection = document.createElement('div');
  notesSection.className = 'field-group';
  var notesLabel = document.createElement('label');
  notesLabel.setAttribute('for', 'field-notes');
  notesLabel.textContent = 'Notes';
  var notesArea = document.createElement('textarea');
  notesArea.id = 'field-notes';
  notesArea.rows = 3;
  notesArea.placeholder = 'Personal notes…';
  notesSection.appendChild(notesLabel);
  notesSection.appendChild(notesArea);
  form.appendChild(notesSection);
}

function createInput(def) {
  var key = def[0], type = def[2];

  if (type === 'select') {
    var sel = document.createElement('select');
    (FIELD_OPTIONS[key] || ['']).forEach(function(opt) {
      var o = document.createElement('option');
      o.value = opt;
      o.textContent = opt || '—';
      sel.appendChild(o);
    });
    return sel;
  }

  if (type === 'checkbox') {
    var cb = document.createElement('input');
    cb.type = 'checkbox';
    return cb;
  }

  var input = document.createElement('input');

  if (type === 'datalist') {
    input.type = 'text';
    input.setAttribute('list', 'datalist-make');
    input.placeholder = def[1];
    input.autocomplete = 'off';
    return input;
  }

  input.type = type;
  input.placeholder = def[1];
  return input;
}

function populateForm(record) {
  FIELDS.forEach(function(def) {
    var input = document.getElementById('field-' + def[0]);
    if (!input) return;
    if (def[2] === 'checkbox') {
      input.checked = !!record[def[0]];
    } else {
      var v = record[def[0]];
      input.value = v != null ? v : '';
    }
  });
  var notes = document.getElementById('field-notes');
  if (notes) notes.value = record.notes || '';
}

function readForm() {
  var record = Object.assign({}, currentRecord);
  FIELDS.forEach(function(def) {
    var input = document.getElementById('field-' + def[0]);
    if (!input) return;
    if (def[2] === 'checkbox') {
      record[def[0]] = input.checked;
    } else if (def[2] === 'number') {
      var v = input.value.trim();
      record[def[0]] = v !== '' ? parseFloat(v) : null;
    } else {
      record[def[0]] = input.value.trim();
    }
  });
  var notes = document.getElementById('field-notes');
  if (notes) record.notes = notes.value.trim();
  return record;
}

function runExtraction() {
  var status = document.getElementById('status');
  status.textContent = 'Extracting…';
  status.className = 'status loading';

  browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
    var tab = tabs[0];
    if (!tab) { showDiag('No active tab found.'); return; }
    currentTabId = tab.id;
    currentUrl = tab.url;

    browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: carResearchExtract
    }).then(function(results) {
      var record = results && results[0] && results[0].result;

      if (!record) {
        showDiag('executeScript returned null — scripting may be blocked on this page.');
        return;
      }

      if (record._fatal) {
        showDiag('Extraction error: ' + record._fatal, record._pageInfo);
        currentRecord = record;
        populateForm(record);
        return;
      }

      currentRecord = record;
      populateForm(record);

      var dbg = record._debug || {};
      var pi = record._pageInfo || {};
      var fieldsFound = ['year','make','model','price','mileage'].filter(function(f) {
        return record[f] != null && record[f] !== '';
      });

      if (fieldsFound.length === 0) {
        showDiag(
          'No vehicle data found. Extractor: ' + (dbg.site || 'generic') +
          ' | __NEXT_DATA__: ' + pi.hasNextData +
          ' | JSON-LD: ' + pi.jsonLdCount,
          pi
        );
      } else {
        status.textContent = 'Extracted via ' + (dbg.site || 'generic') +
          ' — ' + fieldsFound.length + ' core fields found.' +
          (dbg.siteError ? ' (site extractor failed, used fallback)' : '');
        status.className = dbg.siteError ? 'status warning' : 'status success';
      }
    }).catch(function(err) {
      showDiag('Injection failed: ' + err.message);
    });
  });
}

function showDiag(msg, pageInfo) {
  var status = document.getElementById('status');
  var text = msg;
  if (pageInfo) {
    text += '\n\nPage info: __NEXT_DATA__=' + pageInfo.hasNextData +
      ', JSON-LD count=' + pageInfo.jsonLdCount +
      '\nTitle: ' + pageInfo.title;
  }
  status.textContent = text;
  status.className = 'status error';
}

function showError(msg) {
  var status = document.getElementById('status');
  status.textContent = msg;
  status.className = 'status error';
}

function refreshGarage() {
  loadGarage(function(garage) {
    garageData = garage;
    updateGarageLabel(garage.length);
    if (!garageOpen) return;
    renderGarage(
      garage,
      document.getElementById('panel-garage'),
      function(id) {
        browser.runtime.sendMessage({ type: 'DELETE_CAR', id: id }).then(function() {
          refreshGarage();
        });
      },
      function() {
        if (!garageData.length) return;
        downloadBlob(toCsvString(garageData, CAR_RECORD_COLUMNS), 'car-garage.csv', 'text/csv');
      },
      function() {
        if (!garageData.length) return;
        downloadBlob(toJsonString(garageData), 'car-garage.json', 'application/json');
      },
      function() {
        if (!confirm('Clear all ' + garageData.length + ' saved cars?')) return;
        browser.runtime.sendMessage({ type: 'CLEAR_GARAGE' }).then(refreshGarage);
      },
      function() {
        openDashboard(garageData);
      }
    );
  });
}

function openDashboard(cars) {
  if (!cars || !cars.length) { showError('No saved cars to display.'); return; }
  browser.storage.local.set({ dashboardData: cars }).then(function() {
    browser.tabs.create({ url: browser.runtime.getURL('analysis/analysis.html') });
  });
}

function copyAsCsv() {
  var record = readForm();
  var csv = toCsvString([record], CAR_RECORD_COLUMNS);
  navigator.clipboard.writeText(csv).then(function() {
    flash('btn-copy-csv', 'Copied!');
  }).catch(function() {
    showError('Clipboard write failed.');
  });
}

function downloadCsv() {
  var record = readForm();
  downloadBlob(toCsvString([record], CAR_RECORD_COLUMNS), safeFilename(record) + '.csv', 'text/csv');
}

function downloadJson() {
  var record = readForm();
  downloadBlob(toJsonString([record]), safeFilename(record) + '.json', 'application/json');
}

function saveToGarage() {
  var record = readForm();
  browser.runtime.sendMessage({ type: 'SAVE_CAR', record: record }).then(function(resp) {
    if (resp.ok) {
      flash('btn-save', 'Saved!');
      updateGarageLabel(garageData.length + 1);
      garageData.push(record);
    } else {
      showError('Save failed.');
    }
  });
}

function flash(btnId, msg) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  // lastChild is the text node after the icon img
  var textNode = btn.lastChild;
  var orig = textNode.textContent;
  textNode.textContent = msg;
  btn.disabled = true;
  setTimeout(function() { textNode.textContent = orig; btn.disabled = false; }, 1500);
}
