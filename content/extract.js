// Injected via scripting.executeScript — no ES module imports available.
// All dependencies are injected as separate files before this one.
// Returns a CarRecord object as the last expression value.

(function() {
  var hostname = window.location.hostname;
  var url = window.location.href;
  var _debug = { site: null, siteError: null, jsonldError: null, heuristicError: null };

  try {
    // Determine which site-specific extractor to run
    var siteResult = {};
    var extractorName = 'none';
    try {
      if (hostname.includes('carvana.com'))         { extractorName = 'carvana';    siteResult = extractCarvana(); }
      else if (hostname.includes('carmax.com'))      { extractorName = 'carmax';     siteResult = extractCarmax(); }
      else if (hostname.includes('cars.com'))         { extractorName = 'cars-com';   siteResult = extractCarsCom(); }
      else if (hostname.includes('autotrader.com'))   { extractorName = 'autotrader'; siteResult = extractAutotrader(); }
      else if (hostname.includes('kbb.com'))          { extractorName = 'kbb';        siteResult = extractKbb(); }
      else if (hostname.includes('craigslist.org'))   { extractorName = 'craigslist'; siteResult = extractCraigslist(); }
      else                                            { extractorName = 'generic'; }
      _debug.site = extractorName;
    } catch(e) {
      _debug.site = extractorName;
      _debug.siteError = e.message + ' @ ' + e.stack;
      console.error('[car-research] site extractor (' + extractorName + ') threw:', e);
    }

    // Tier 2: generic JSON-LD
    var jsonldResult = {};
    try { jsonldResult = extractJsonLd(); } catch(e) {
      _debug.jsonldError = e.message;
      console.error('[car-research] JSON-LD extractor threw:', e);
    }

    // Tier 3: heuristic DOM
    var heuristicResult = {};
    try { heuristicResult = extractHeuristic(); } catch(e) {
      _debug.heuristicError = e.message;
      console.error('[car-research] heuristic extractor threw:', e);
    }

    // Merge: site-specific wins, then JSON-LD, then heuristic
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

    // Parse year from title hint if still missing
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
    console.log('[car-research] extraction complete', _debug, merged);
    return merged;

  } catch(e) {
    console.error('[car-research] fatal extraction error:', e);
    // Return a minimal record so the popup always gets something non-null
    var fallback = { _fatal: e.message + '\n' + e.stack, url: url, websiteName: hostname };
    return fallback;
  }
})();
