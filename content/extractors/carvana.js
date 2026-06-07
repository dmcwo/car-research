function extractCarvana() {
  var result = {};
  try {
    var el = document.getElementById('__NEXT_DATA__');
    if (!el) return result;
    var data = JSON.parse(el.textContent);
    // Navigate to vehicle details — path may vary by page
    var pages = data && data.props && data.props.pageProps;
    if (!pages) return result;

    var vdp = pages.vehicleDetails || pages.vehicle || pages.listing;
    if (!vdp) {
      // Try deeper paths
      var keys = Object.keys(pages);
      for (var i = 0; i < keys.length; i++) {
        var v = pages[keys[i]];
        if (v && typeof v === 'object' && (v.make || v.year || v.vin)) { vdp = v; break; }
      }
    }
    if (!vdp) return result;

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
    result.condition = 'Used';
    result.sellerType = 'Dealer';
    result.sellerName = 'Carvana';
  } catch(e) {}
  return result;
}
