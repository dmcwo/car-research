function csvEscape(v) {
  if (v == null) return '';
  var s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function toCsvRow(record, columns) {
  return columns.map(function(col) { return csvEscape(record[col]); }).join(',');
}

function toCsvString(records, columns) {
  var header = columns.join(',');
  var rows = records.map(function(r) { return toCsvRow(r, columns); });
  return [header].concat(rows).join('\r\n');
}

function toJsonString(records) {
  return JSON.stringify(records, null, 2);
}

function downloadBlob(content, filename, mimeType) {
  var blob = new Blob([content], { type: mimeType });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeFilename(record) {
  var parts = [record.year, record.make, record.model].filter(Boolean);
  return (parts.length ? parts.join('-') : 'car') + '-' + new Date().toISOString().slice(0, 10);
}
