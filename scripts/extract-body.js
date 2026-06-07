// Extraction body — included inside carResearchExtract() by the bundler.
// All helper functions are defined earlier in the same wrapper function scope.

var hostname = window.location.hostname;
var url = window.location.href;
var _debug = { site: null, siteError: null, jsonldError: null, heuristicError: null };

var _pageInfo = {
  hasNextData: !!document.getElementById('__NEXT_DATA__'),
  jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
  title: document.title.slice(0, 120),
  hostname: hostname
};

try {
  var siteResult = {};
  var extractorName = 'none';
  try {
    if (hostname.includes('carvana.com'))        { extractorName = 'carvana';    siteResult = extractCarvana(); }
    else if (hostname.includes('carmax.com'))     { extractorName = 'carmax';     siteResult = extractCarmax(); }
    else if (hostname.includes('cars.com'))        { extractorName = 'cars-com';   siteResult = extractCarsCom(); }
    else if (hostname.includes('autotrader.com'))  { extractorName = 'autotrader'; siteResult = extractAutotrader(); }
    else if (hostname.includes('kbb.com'))         { extractorName = 'kbb';        siteResult = extractKbb(); }
    else if (hostname.includes('craigslist.org'))  { extractorName = 'craigslist'; siteResult = extractCraigslist(); }
    else                                           { extractorName = 'generic'; }
    _debug.site = extractorName;
  } catch(e) {
    _debug.site = extractorName;
    _debug.siteError = e.message + '\n' + (e.stack || '');
  }

  var jsonldResult = {};
  try { jsonldResult = extractJsonLd(); } catch(e) { _debug.jsonldError = e.message; }

  var heuristicResult = {};
  try { heuristicResult = extractHeuristic(); } catch(e) { _debug.heuristicError = e.message; }

  var merged = createCarRecord();
  [heuristicResult, jsonldResult, siteResult].forEach(function(src) {
    Object.keys(src).forEach(function(k) {
      if (k.startsWith('_')) return;
      var v = src[k];
      if (v == null || v === '') return;
      if (merged[k] == null || merged[k] === '' || merged[k] === false) {
        merged[k] = v;
      }
    });
  });

  var titleHint = siteResult._titleHint || jsonldResult._titleHint || heuristicResult._titleHint || '';
  if (titleHint && !merged.year) {
    var ym = titleHint.match(/\b(19|20)\d{2}\b/);
    if (ym) merged.year = parseInt(ym[0], 10);
  }

  merged.url = url;
  merged.websiteName = getWebsiteName(hostname);

  if (merged.mpgCombined == null && merged.mpgCity && merged.mpgHighway) {
    merged.mpgCombined = Math.round((merged.mpgCity * 0.55 + merged.mpgHighway * 0.45) * 10) / 10;
  }

  merged._debug = _debug;
  merged._pageInfo = _pageInfo;
  return merged;

} catch(e) {
  return {
    _fatal: e.message + '\n' + (e.stack || ''),
    _pageInfo: _pageInfo,
    url: url,
    websiteName: hostname
  };
}
