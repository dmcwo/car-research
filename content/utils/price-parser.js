function parsePrice(str) {
  if (!str) return null;
  var m = String(str).replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!m) return null;
  var n = parseFloat(m[0]);
  return isNaN(n) ? null : Math.round(n);
}

function parseMileage(str) {
  if (!str) return null;
  var m = String(str).replace(/,/g, '').match(/\d+/);
  if (!m) return null;
  var n = parseInt(m[0], 10);
  return isNaN(n) ? null : n;
}

function parseMpg(str) {
  if (!str) return null;
  var m = String(str).replace(/,/g, '').match(/\d+(\.\d+)?/);
  if (!m) return null;
  var n = parseFloat(m[0]);
  return isNaN(n) ? null : n;
}
