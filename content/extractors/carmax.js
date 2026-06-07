function extractCarmax() {
  var result = {};
  try {
    var el = document.getElementById('__NEXT_DATA__');
    if (!el) return result;
    var data = JSON.parse(el.textContent);
    var pages = data && data.props && data.props.pageProps;
    if (!pages) return result;

    // Deep search for vehicle object anywhere in pageProps
    function findVehicle(obj, depth) {
      if (!obj || typeof obj !== 'object' || depth > 8) return null;
      if ((obj.make || obj.year) && (obj.vin || obj.stockNumber || obj.price || obj.mileage)) return obj;
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        var found = findVehicle(obj[keys[i]], depth + 1);
        if (found) return found;
      }
      return null;
    }

    var vdp = pages.vehicle || pages.vehicleDetails || pages.car || findVehicle(pages, 0);
    if (!vdp) return result;

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
      var mpg = vdp.mpg;
      if (mpg.city != null) result.mpgCity = parseMpg(String(mpg.city));
      if (mpg.highway != null) result.mpgHighway = parseMpg(String(mpg.highway));
    }
    if (vdp.bodyStyle) result.bodyStyle = vdp.bodyStyle;
    result.condition = 'Used';
    result.sellerType = 'Dealer';
    result.sellerName = 'CarMax';
  } catch(e) {}
  return result;
}
