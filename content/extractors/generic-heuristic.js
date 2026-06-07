var KNOWN_MAKES = [
  'Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Buick','Cadillac',
  'Chevrolet','Chrysler','Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda',
  'Hyundai','Infiniti','Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus',
  'Lincoln','Maserati','Mazda','McLaren','Mercedes-Benz','Mercedes','MINI','Mitsubishi',
  'Nissan','Pontiac','Porsche','Ram','Rivian','Rolls-Royce','Saturn','Subaru','Tesla',
  'Toyota','Volkswagen','Volvo'
];

function extractHeuristic() {
  var result = {};
  try {
    var titleText = cleanText(document.title);
    var h1Text = qsText('h1');
    var h2Text = qsText('h2');
    var candidate = h1Text || h2Text || titleText;

    // Year
    var yearMatch = candidate.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) result.year = parseInt(yearMatch[0], 10);

    // Make
    for (var i = 0; i < KNOWN_MAKES.length; i++) {
      var makeRegex = new RegExp('\\b' + KNOWN_MAKES[i] + '\\b', 'i');
      if (makeRegex.test(candidate)) {
        result.make = KNOWN_MAKES[i];
        // Try to get model: word(s) after make
        var afterMake = candidate.replace(/.*?/i, '').replace(new RegExp('.*' + KNOWN_MAKES[i] + '\\s*', 'i'), '');
        var modelMatch = afterMake.match(/^([A-Z0-9][a-zA-Z0-9\-]+)/);
        if (modelMatch) result.model = modelMatch[1];
        break;
      }
    }

    // Price: find $ followed by digits with optional commas
    var bodyText = document.body.innerText || '';
    var priceMatches = bodyText.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatches && priceMatches.length) {
      // Pick the most prominent price (first one that looks like a car price: 1000-200000)
      for (var j = 0; j < priceMatches.length; j++) {
        var p = parsePrice(priceMatches[j]);
        if (p && p >= 1000 && p <= 500000) {
          result.price = p;
          break;
        }
      }
    }

    // Mileage: number followed by "miles" or "mi"
    var mileageMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi\.?)\b/i);
    if (mileageMatch) {
      var m = parseMileage(mileageMatch[1]);
      if (m && m < 500000) result.mileage = m;
    }

    // VIN: 17-char alphanumeric (no I, O, Q)
    var vinMatch = bodyText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
    if (vinMatch) result.vin = vinMatch[1];

    result._titleHint = candidate;
  } catch(e) {}
  return result;
}
