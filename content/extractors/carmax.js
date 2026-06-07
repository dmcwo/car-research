function extractCarmax() {
  var result = {};
  try {
    // Always parse title first — reliable source of make/model/year/condition
    var titleParsed = parseTitleText(cleanText(document.title));
    if (titleParsed.year) result.year = titleParsed.year;
    if (titleParsed.make) result.make = titleParsed.make;
    if (titleParsed.model) result.model = titleParsed.model;
    if (titleParsed.condition) result.condition = titleParsed.condition;

    // Try __NEXT_DATA__ (present on some CarMax pages)
    var el = document.getElementById('__NEXT_DATA__');
    if (el) {
      var data = JSON.parse(el.textContent);
      var pages = data && data.props && data.props.pageProps;
      if (pages) {
        var vdp = pages.vehicle || pages.vehicleDetails || pages.car || findVehicleObj(pages, 0);
        if (vdp) {
          if (vdp.year != null) result.year = parseInt(vdp.year, 10);
          if (vdp.make) result.make = vdp.make;
          if (vdp.model) result.model = vdp.model;
          if (vdp.trim) result.trim = vdp.trim;
          if (vdp.vin) result.vin = vdp.vin;
          if (vdp.stockNumber) result.stockNumber = String(vdp.stockNumber);
          if (vdp.price != null || vdp.listPrice != null)
            result.price = parsePrice(String(vdp.price || vdp.listPrice));
          if (vdp.mileage != null || vdp.miles != null)
            result.mileage = parseMileage(String(vdp.mileage || vdp.miles));
          if (vdp.exteriorColor) result.colorExterior = vdp.exteriorColor;
          if (vdp.interiorColor) result.colorInterior = vdp.interiorColor;
          if (vdp.transmission) result.transmission = normalizeTransmission(vdp.transmission);
          if (vdp.driveTrain || vdp.driveType)
            result.drivetrain = normalizeDrivetrain(vdp.driveTrain || vdp.driveType);
          if (vdp.engine) result.engine = vdp.engine;
          if (vdp.fuelType) result.fuelType = normalizeFuelType(vdp.fuelType);
          if (vdp.mpg) {
            if (vdp.mpg.city != null) result.mpgCity = parseMpg(String(vdp.mpg.city));
            if (vdp.mpg.highway != null) result.mpgHighway = parseMpg(String(vdp.mpg.highway));
          }
          if (vdp.bodyStyle) result.bodyStyle = vdp.bodyStyle;
          // Debug: record found keys to help diagnose missing fields
          result._vdpKeys = Object.keys(vdp).join(',');
        }
      }
    }

    // DOM fallback — try rendered page selectors
    var domResult = extractCarmaxDom();
    var domKeys = Object.keys(domResult);
    for (var i = 0; i < domKeys.length; i++) {
      var k = domKeys[i];
      if (domResult[k] && !result[k]) result[k] = domResult[k];
    }

    result.condition = result.condition || 'Used';
    result.sellerType = 'Dealer';
    result.sellerName = 'CarMax';
  } catch(e) {}
  return result;
}

function findVehicleObj(obj, depth) {
  if (!obj || typeof obj !== 'object' || depth > 8) return null;
  if ((obj.make || obj.year) && (obj.vin || obj.stockNumber || obj.price || obj.mileage)) return obj;
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var found = findVehicleObj(obj[keys[i]], depth + 1);
    if (found) return found;
  }
  return null;
}

function extractCarmaxDom() {
  var r = {};
  try {
    // CarMax renders listing details in identifiable elements
    var priceEl = qs('[class*="price"]:not([class*="history"])') ||
                  qs('[data-qa="price"]') || qs('[data-testid*="price"]');
    if (priceEl) r.price = parsePrice(priceEl.textContent);

    var mileEl = qs('[class*="mileage"]') || qs('[data-qa="mileage"]') ||
                 qs('[data-testid*="mileage"]');
    if (mileEl) r.mileage = parseMileage(mileEl.textContent);

    var h1 = qsText('h1');
    if (h1) {
      var parsed = parseTitleText(h1);
      if (parsed.make) r.make = parsed.make;
      if (parsed.model) r.model = parsed.model;
      if (parsed.year) r.year = parsed.year;
    }

    var vinEl = qs('[data-qa="vin"]') || qs('[data-testid*="vin"]') ||
                qs('[class*="vin"]');
    if (vinEl) r.vin = cleanText(vinEl.textContent).replace(/[^A-HJ-NPR-Z0-9]/g, '').slice(0, 17);

    var stockEl = qs('[data-qa="stock"]') || qs('[data-testid*="stock"]');
    if (stockEl) r.stockNumber = cleanText(stockEl.textContent);
  } catch(e) {}
  return r;
}
