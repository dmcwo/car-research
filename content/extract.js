// Injected via scripting.executeScript — no ES module imports available.
// All dependencies are injected as separate files before this one.
// Returns a CarRecord object as the last expression value.

(function() {
  var hostname = window.location.hostname;
  var url = window.location.href;

  // Determine which site-specific extractor to run
  var siteResult = {};
  try {
    if (hostname.includes('carvana.com'))    siteResult = extractCarvana();
    else if (hostname.includes('carmax.com'))     siteResult = extractCarmax();
    else if (hostname.includes('cars.com'))        siteResult = extractCarsCom();
    else if (hostname.includes('autotrader.com'))  siteResult = extractAutotrader();
    else if (hostname.includes('kbb.com'))         siteResult = extractKbb();
    else if (hostname.includes('craigslist.org'))  siteResult = extractCraigslist();
  } catch(e) {}

  // Tier 2: generic JSON-LD
  var jsonldResult = {};
  try { jsonldResult = extractJsonLd(); } catch(e) {}

  // Tier 3: heuristic DOM
  var heuristicResult = {};
  try { heuristicResult = extractHeuristic(); } catch(e) {}

  // Merge: site-specific wins, then JSON-LD, then heuristic
  var merged = createCarRecord();
  [heuristicResult, jsonldResult, siteResult].forEach(function(src) {
    Object.keys(src).forEach(function(k) {
      if (k.startsWith('_')) return; // skip hints
      var v = src[k];
      if (v == null || v === '') return;
      if (merged[k] == null || merged[k] === '' || merged[k] === false) {
        merged[k] = v;
      }
    });
  });

  // Parse make/model/year from title hint if still missing
  var titleHint = siteResult._titleHint || jsonldResult._titleHint || heuristicResult._titleHint || '';
  if (titleHint) {
    if (!merged.year) {
      var ym = titleHint.match(/\b(19|20)\d{2}\b/);
      if (ym) merged.year = parseInt(ym[0], 10);
    }
  }

  // Always set URL and websiteName
  merged.url = url;
  merged.websiteName = getWebsiteName(hostname);

  // Compute combined MPG if we have city + highway
  if (merged.mpgCombined == null && merged.mpgCity && merged.mpgHighway) {
    merged.mpgCombined = Math.round((merged.mpgCity * 0.55 + merged.mpgHighway * 0.45) * 10) / 10;
  }

  return merged;
})();
