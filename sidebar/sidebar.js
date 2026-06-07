var currentRecord = null;
var garageData = [];
var currentTabId = null;
var currentUrl = null;

// Field definitions: [fieldKey, label, inputType]
var FIELDS = [
  ['year',       'Year',         'number'],
  ['make',       'Make',         'text'],
  ['model',      'Model',        'text'],
  ['trim',       'Trim',         'text'],
  ['bodyStyle',  'Body Style',   'text'],
  ['condition',  'Condition',    'text'],
  ['engine',       'Engine',        'text'],
  ['fuelType',     'Fuel Type',     'text'],
  ['mpgCity',      'MPG City',      'number'],
  ['mpgHighway',   'MPG Hwy',       'number'],
  ['mpgCombined',  'MPG Combined',  'number'],
  ['drivetrain',   'Drivetrain',    'text'],
  ['transmission', 'Transmission',  'text'],
  ['colorExterior', 'Ext Color', 'text'],
  ['colorInterior', 'Int Color', 'text'],
  ['price',       'Price ($)',   'number'],
  ['mileage',     'Mileage',     'number'],
  ['vin',         'VIN',         'text'],
  ['stockNumber', 'Stock #',     'text'],
  ['owners',             '# Owners',    'number'],
  ['accidentCount',      'Accidents',   'number'],
  ['carfaxSummary',      'Carfax',      'text'],
  ['isCertifiedPreOwned','CPO',         'checkbox'],
  ['warrantyInfo',       'Warranty',    'text'],
  ['sellerName',     'Seller',          'text'],
  ['sellerType',     'Seller Type',     'text'],
  ['sellerPhone',    'Phone',           'text'],
  ['sellerLocation', 'Location',        'text'],
  ['daysOnLot',   'Days on Lot', 'number'],
  ['websiteName', 'Website',     'text'],
  ['url',         'URL',         'url']
];

var GROUPS = [
  { label: 'Vehicle',    keys: ['year','make','model','trim','bodyStyle','condition'] },
  { label: 'Powertrain', keys: ['engine','fuelType','mpgCity','mpgHighway','mpgCombined','drivetrain','transmission'] },
  { label: 'Appearance', keys: ['colorExterior','colorInterior'] },
  { label: 'Listing',    keys: ['price','mileage','vin','stockNumber'] },
  { label: 'History',    keys: ['owners','accidentCount','carfaxSummary','isCertifiedPreOwned','warrantyInfo'] },
  { label: 'Seller',     keys: ['sellerName','sellerType','sellerPhone','sellerLocation'] },
  { label: 'Meta',       keys: ['daysOnLot','websiteName','url'] }
];

document.addEventListener('DOMContentLoaded', function() {
  buildForm();
  switchTab('extract');

  document.getElementById('tab-extract').onclick = function() { switchTab('extract'); };
  document.getElementById('tab-garage').onclick  = function() { switchTab('garage'); };

  document.getElementById('btn-copy-csv').onclick     = copyAsCsv;
  document.getElementById('btn-download-csv').onclick = downloadCsv;
  document.getElementById('btn-download-json').onclick = downloadJson;
  document.getElementById('btn-save').onclick          = saveToGarage;

  // Initial extraction on the current active tab
  runExtraction();

  // Re-extract when the user switches to a different tab
  browser.tabs.onActivated.addListener(function(info) {
    currentTabId = info.tabId;
    // Small delay to let the tab settle before injecting
    setTimeout(runExtraction, 500);
  });

  // Re-extract when a tab finishes navigating to a new page
  browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tabId !== currentTabId) return;
    if (changeInfo.status !== 'complete') return;
    if (tab.url === currentUrl) return; // same URL — don't re-run
    currentUrl = tab.url;
    setTimeout(runExtraction, 500);
  });
});

function buildForm() {
  var form = document.getElementById('fields-form');
  var fieldMap = {};
  FIELDS.forEach(function(f) { fieldMap[f[0]] = f; });

  GROUPS.forEach(function(group) {
    var section = document.createElement('details');
    section.className = 'field-group';
    section.open = ['Vehicle','Listing','Seller'].includes(group.label);
    var summary = document.createElement('summary');
    summary.textContent = group.label;
    section.appendChild(summary);

    var grid = document.createElement('div');
    grid.className = 'field-grid';

    group.keys.forEach(function(key) {
      var def = fieldMap[key];
      if (!def) return;
      var label = document.createElement('label');
      label.setAttribute('for', 'field-' + key);
      label.textContent = def[1];

      var input;
      if (def[2] === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
      } else {
        input = document.createElement('input');
        input.type = def[2];
        input.placeholder = def[1];
      }
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
  notesArea.placeholder = 'Personal notes...';
  notesSection.appendChild(notesLabel);
  notesSection.appendChild(notesArea);
  form.appendChild(notesSection);
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

function switchTab(name) {
  document.getElementById('panel-extract').hidden = name !== 'extract';
  document.getElementById('panel-garage').hidden  = name !== 'garage';
  document.getElementById('tab-extract').classList.toggle('active', name === 'extract');
  document.getElementById('tab-garage').classList.toggle('active', name === 'garage');
  if (name === 'garage') refreshGarage();
}

function refreshGarage() {
  loadGarage(function(garage) {
    garageData = garage;
    document.getElementById('tab-garage').textContent = 'Garage (' + garage.length + ')';
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
      }
    );
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
      document.getElementById('tab-garage').textContent =
        'Garage (' + (garageData.length + 1) + ')';
    } else {
      showError('Save failed.');
    }
  });
}

function flash(btnId, msg) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  var orig = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(function() { btn.textContent = orig; btn.disabled = false; }, 1500);
}
