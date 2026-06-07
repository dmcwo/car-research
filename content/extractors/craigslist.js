function extractCraigslist() {
  var result = {};
  try {
    // Title: "YYYY Make Model [trim]"
    var titleEl = qs('#titletextonly') || qs('.postingtitletext span#titletextonly') || qs('h2.postingtitle');
    var titleText = titleEl ? cleanText(titleEl.textContent) : cleanText(document.title);

    var yearMatch = titleText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) result.year = parseInt(yearMatch[0], 10);

    // Price
    var priceEl = qs('.price') || qs('[class*="price"]');
    if (priceEl) result.price = parsePrice(priceEl.textContent);

    // Attributes table
    var attrGroups = document.querySelectorAll('.attrgroup');
    attrGroups.forEach(function(group) {
      var spans = group.querySelectorAll('span');
      spans.forEach(function(span) {
        var text = cleanText(span.textContent);
        var parts = text.split(':').map(function(s) { return s.trim(); });

        if (/^odometer$/i.test(parts[0]) && parts[1])
          result.mileage = parseMileage(parts[1]);
        if (/^vin$/i.test(parts[0]) && parts[1])
          result.vin = parts[1];
        if (/^condition$/i.test(parts[0]) && parts[1])
          result.condition = normalizeCondition(parts[1]);
        if (/^fuel$/i.test(parts[0]) && parts[1])
          result.fuelType = normalizeFuelType(parts[1]);
        if (/^transmission$/i.test(parts[0]) && parts[1])
          result.transmission = normalizeTransmission(parts[1]);
        if (/^drive$/i.test(parts[0]) && parts[1])
          result.drivetrain = normalizeDrivetrain(parts[1]);
        if (/^type$/i.test(parts[0]) && parts[1])
          result.bodyStyle = parts[1];
        if (/^paint color$/i.test(parts[0]) && parts[1])
          result.colorExterior = parts[1];
        if (/^cylinders$/i.test(parts[0]) && parts[1])
          result.engine = parts[1];
        if (/^size$/i.test(parts[0]) && parts[1] && !result.bodyStyle)
          result.bodyStyle = parts[1];
        if (/^title status$/i.test(parts[0]) && parts[1])
          result._titleStatus = parts[1];
      });
    });

    // Location
    var locEl = qs('.postingtitletext small') || qs('[class*="location"]');
    if (locEl) result.sellerLocation = cleanText(locEl.textContent).replace(/[()]/g, '').trim();

    result.sellerType = 'Private';
    result.condition = result.condition || 'Used';

    result._titleHint = titleText;
  } catch(e) {}
  return result;
}
