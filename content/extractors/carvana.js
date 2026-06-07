function extractCarvana() {
  var result = {};
  try {
    // Always parse title first — reliable source of make/model/year
    var titleParsed = parseTitleText(cleanText(document.title));
    if (titleParsed.year) result.year = titleParsed.year;
    if (titleParsed.make) result.make = titleParsed.make;
    if (titleParsed.model) result.model = titleParsed.model;

    // Try __NEXT_DATA__ (present on some Carvana pages)
    var el = document.getElementById('__NEXT_DATA__');
    if (el) {
      var data = JSON.parse(el.textContent);
      var pages = data && data.props && data.props.pageProps;
      if (pages) {
        var vdp = pages.vehicleDetails || pages.vehicle || pages.listing;
        if (!vdp) {
          var keys = Object.keys(pages);
          for (var i = 0; i < keys.length; i++) {
            var v = pages[keys[i]];
            if (v && typeof v === 'object' && (v.make || v.year || v.vin)) { vdp = v; break; }
          }
        }
        if (vdp) {
          if (vdp.year != null) result.year = parseInt(vdp.year, 10);
          if (vdp.make) result.make = vdp.make;
          if (vdp.model) result.model = vdp.model;
          if (vdp.trim) result.trim = vdp.trim;
          if (vdp.vin) result.vin = vdp.vin;
          if (vdp.listingPrice != null) result.price = parsePrice(String(vdp.listingPrice));
          if (vdp.mileage != null) result.mileage = parseMileage(String(vdp.mileage));
          if (vdp.exteriorColor) result.colorExterior = vdp.exteriorColor;
          if (vdp.interiorColor) result.colorInterior = vdp.interiorColor;
          if (vdp.transmission) result.transmission = normalizeTransmission(vdp.transmission);
          if (vdp.driveType) result.drivetrain = normalizeDrivetrain(vdp.driveType);
          if (vdp.engineDescription) result.engine = vdp.engineDescription;
          if (vdp.fuelType) result.fuelType = normalizeFuelType(vdp.fuelType);
          if (vdp.mpgCity != null) result.mpgCity = parseMpg(String(vdp.mpgCity));
          if (vdp.mpgHighway != null) result.mpgHighway = parseMpg(String(vdp.mpgHighway));
          if (vdp.bodyType) result.bodyStyle = vdp.bodyType;
          if (vdp.numberOfOwners != null) result.owners = parseInt(vdp.numberOfOwners, 10);
          if (vdp.accidentCount != null) result.accidentCount = parseInt(vdp.accidentCount, 10);
          result._vdpKeys = Object.keys(vdp).join(',');
        }
      }
    }

    // DOM fallback — try rendered page selectors
    var domResult = extractCarvanaDom();
    var domKeys = Object.keys(domResult);
    for (var i = 0; i < domKeys.length; i++) {
      var k = domKeys[i];
      if (domResult[k] && !result[k]) result[k] = domResult[k];
    }

    result.condition = 'Used';
    result.sellerType = 'Dealer';
    result.sellerName = 'Carvana';
  } catch(e) {}
  return result;
}

function extractCarvanaDom() {
  var r = {};
  try {
    var h1 = qsText('h1');
    if (h1) {
      var parsed = parseTitleText(h1);
      if (parsed.make) r.make = parsed.make;
      if (parsed.model) r.model = parsed.model;
      if (parsed.year) r.year = parsed.year;
      if (parsed.trim) r.trim = parsed.trim;
    }

    var priceEl = qs('[class*="price"]') || qs('[data-qa="price"]') ||
                  qs('[data-testid*="price"]');
    if (priceEl) r.price = parsePrice(priceEl.textContent);

    var mileEl = qs('[class*="mileage"]') || qs('[class*="miles"]') ||
                 qs('[data-qa="mileage"]');
    if (mileEl) r.mileage = parseMileage(mileEl.textContent);

    var vinEl = qs('[data-qa="vin"]') || qs('[data-testid*="vin"]') ||
                qs('[class*="vin"]');
    if (vinEl) r.vin = cleanText(vinEl.textContent).replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);

    // Carvana renders specs in a list; look for fuel type, drivetrain, etc.
    var specItems = allText('[class*="spec"] li, [class*="feature"] li, [class*="detail"] li');
    specItems.forEach(function(text) {
      var t = text.toLowerCase();
      if (/mpg/.test(t)) {
        var mpgNums = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (mpgNums) { r.mpgCity = parseInt(mpgNums[1]); r.mpgHighway = parseInt(mpgNums[2]); }
      }
      if (!r.fuelType && /(electric|hybrid|gasoline|diesel|phev)/i.test(t))
        r.fuelType = normalizeFuelType(text);
      if (!r.drivetrain && /(fwd|awd|rwd|4wd|4x4|front.wheel|all.wheel|rear.wheel)/i.test(t))
        r.drivetrain = normalizeDrivetrain(text);
      if (!r.transmission && /(automatic|manual|cvt)/i.test(t))
        r.transmission = normalizeTransmission(text);
    });
  } catch(e) {}
  return r;
}
