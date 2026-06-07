function extractAutotrader() {
  var result = {};
  try {
    // AutoTrader has JSON-LD; also try window state objects
    var stateKeys = ['__BONNET_DATA__', '__PRELOADED_STATE__', '__AT_DATA__'];
    var state = null;
    for (var i = 0; i < stateKeys.length; i++) {
      if (window[stateKeys[i]]) { state = window[stateKeys[i]]; break; }
    }

    if (state) {
      // Navigate to listing data — structure varies
      var listing = deepFind(state, function(v) {
        return v && typeof v === 'object' && (v.make || v.vin) && v.year;
      });
      if (listing) {
        if (listing.year != null) result.year = parseInt(listing.year, 10);
        if (listing.make) result.make = listing.make;
        if (listing.model) result.model = listing.model;
        if (listing.trim) result.trim = listing.trim;
        if (listing.vin) result.vin = listing.vin;
        if (listing.price != null) result.price = parsePrice(String(listing.price));
        if (listing.mileage != null) result.mileage = parseMileage(String(listing.mileage));
        if (listing.exteriorColor) result.colorExterior = listing.exteriorColor;
        if (listing.interiorColor) result.colorInterior = listing.interiorColor;
        if (listing.transmission) result.transmission = normalizeTransmission(listing.transmission);
        if (listing.driveTrain) result.drivetrain = normalizeDrivetrain(listing.driveTrain);
        if (listing.engine) result.engine = listing.engine;
        if (listing.fuelType) result.fuelType = normalizeFuelType(listing.fuelType);
        if (listing.bodyStyle) result.bodyStyle = listing.bodyStyle;
      }
    }

    // DOM fallback for seller
    var dealer = qsText('[class*="seller-name"]') || qsText('[data-cmp="sellerName"]');
    if (dealer) result.sellerName = dealer;
    var phone = qsText('[class*="seller-phone"]') || qsText('[data-cmp="sellerPhone"]');
    if (phone) result.sellerPhone = phone;
    result.sellerType = 'Dealer';
  } catch(e) {}
  return result;
}

function deepFind(obj, predicate, depth) {
  if (depth === undefined) depth = 0;
  if (depth > 6) return null;
  if (!obj || typeof obj !== 'object') return null;
  if (predicate(obj)) return obj;
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    var found = deepFind(obj[keys[i]], predicate, depth + 1);
    if (found) return found;
  }
  return null;
}
