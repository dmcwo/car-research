function normalizeFuelType(raw) {
  if (!raw) return '';
  var s = raw.toLowerCase();
  if (s.includes('electric') && s.includes('plug')) return 'PHEV';
  if (s.includes('electric') || s.includes('ev') || s.includes('bev')) return 'Electric';
  if (s.includes('hybrid')) return 'Hybrid';
  if (s.includes('diesel')) return 'Diesel';
  if (s.includes('gas') || s.includes('petrol') || s.includes('benzin')) return 'Gasoline';
  return raw.trim();
}

function normalizeDrivetrain(raw) {
  if (!raw) return '';
  var s = raw.toUpperCase().replace(/[-\s]/g, '');
  if (s.includes('AWD') || s.includes('ALLWHEEL')) return 'AWD';
  if (s.includes('4WD') || s.includes('4X4') || s.includes('FOURWHEEL')) return '4WD';
  if (s.includes('RWD') || s.includes('REARWHEEL')) return 'RWD';
  if (s.includes('FWD') || s.includes('FRONTWHEEL')) return 'FWD';
  return raw.trim();
}

function normalizeCondition(raw) {
  if (!raw) return '';
  var s = raw.toLowerCase();
  if (s.includes('new')) return 'New';
  if (s.includes('certified') || s.includes('cpo')) return 'CPO';
  if (s.includes('used') || s.includes('pre')) return 'Used';
  return raw.trim();
}

function normalizeTransmission(raw) {
  if (!raw) return '';
  var s = raw.toLowerCase();
  if (s.includes('auto') || s.includes('a/t')) return 'Automatic';
  if (s.includes('manual') || s.includes('m/t') || s.includes('stick')) return 'Manual';
  if (s.includes('cvt')) return 'CVT';
  return raw.trim();
}

function normalizeYear(raw) {
  if (!raw) return null;
  var m = String(raw).match(/\b(19|20)\d{2}\b/);
  if (!m) return null;
  return parseInt(m[0], 10);
}
