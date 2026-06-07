function extractJsonLd() {
  var result = {};
  try {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(function(script) {
      try {
        var data = JSON.parse(script.textContent);
        var items = Array.isArray(data) ? data : [data];
        items.forEach(function(item) {
          mergeJsonLdItem(item, result);
          // Check @graph
          if (item['@graph']) {
            item['@graph'].forEach(function(g) { mergeJsonLdItem(g, result); });
          }
        });
      } catch(e) {}
    });
  } catch(e) {}

  // Supplement with Open Graph meta tags
  try {
    var ogTitle = qsAttr('meta[property="og:title"]', 'content');
    var ogDesc = qsAttr('meta[property="og:description"]', 'content');
    var ogUrl = qsAttr('meta[property="og:url"]', 'content');
    if (!result.url && ogUrl) result.url = ogUrl;
    if (!result._titleHint && ogTitle) result._titleHint = ogTitle;
    if (!result._descHint && ogDesc) result._descHint = ogDesc;
  } catch(e) {}

  return result;
}

function mergeJsonLdItem(item, result) {
  var type = item['@type'] || '';
  var isVehicle = /car|vehicle|automobile/i.test(type);
  var isProduct = /product/i.test(type);
  if (!isVehicle && !isProduct) return;

  if (item.name && !result._titleHint) result._titleHint = item.name;
  if (item.url && !result.url) result.url = item.url;

  if (item.vehicleIdentificationNumber && !result.vin)
    result.vin = item.vehicleIdentificationNumber;

  if (item.mileageFromOdometer) {
    var mfr = item.mileageFromOdometer;
    var val = mfr.value || mfr;
    if (!result.mileage) result.mileage = parseMileage(String(val));
  }

  if (item.fuelType && !result.fuelType)
    result.fuelType = normalizeFuelType(item.fuelType);

  if (item.driveWheelConfiguration && !result.drivetrain)
    result.drivetrain = normalizeDrivetrain(item.driveWheelConfiguration);

  if (item.vehicleTransmission && !result.transmission)
    result.transmission = normalizeTransmission(item.vehicleTransmission);

  if (item.color && !result.colorExterior)
    result.colorExterior = item.color;

  if (item.vehicleInteriorColor && !result.colorInterior)
    result.colorInterior = item.vehicleInteriorColor;

  if (item.vehicleEngine) {
    var eng = item.vehicleEngine;
    if (!result.engine) result.engine = eng.name || eng.engineDisplacement || '';
  }

  if (item.bodyType && !result.bodyStyle) result.bodyStyle = item.bodyType;

  if (item.itemCondition && !result.condition) {
    result.condition = normalizeCondition(item.itemCondition.replace('https://schema.org/', ''));
  }

  if (item.numberOfOwners != null && result.owners == null)
    result.owners = parseInt(item.numberOfOwners, 10) || null;

  // Offers
  var offer = item.offers || item.offer;
  if (offer) {
    var offerItem = Array.isArray(offer) ? offer[0] : offer;
    if (offerItem.price != null && result.price == null)
      result.price = parsePrice(String(offerItem.price));
  }
  if (item.price != null && result.price == null)
    result.price = parsePrice(String(item.price));

  if (item.vehicleModelDate && !result.year)
    result.year = normalizeYear(String(item.vehicleModelDate));

  if (item.brand) {
    var brand = item.brand.name || item.brand;
    if (!result.make && brand) result.make = String(brand).trim();
  }

  if (item.model && !result.model) result.model = String(item.model).trim();
}
