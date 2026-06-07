var KNOWN_MAKES = [
  'Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Buick','Cadillac',
  'Chevrolet','Chrysler','Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda',
  'Hyundai','Infiniti','Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus',
  'Lincoln','Maserati','Mazda','McLaren','Mercedes-Benz','Mercedes','MINI','Mitsubishi',
  'Nissan','Pontiac','Porsche','Ram','Rivian','Rolls-Royce','Saturn','Subaru','Tesla',
  'Toyota','Volkswagen','Volvo'
];

// Parse year/make/model/condition from a text string (title, h1, etc.)
function parseTitleText(text) {
  var result = {};
  if (!text) return result;

  var yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) result.year = parseInt(yearMatch[0], 10);

  if (/\bnew\b/i.test(text)) result.condition = 'New';
  else if (/\bcertified\b|\bcpo\b/i.test(text)) result.condition = 'CPO';
  else if (/\bused\b/i.test(text)) result.condition = 'Used';

  for (var i = 0; i < KNOWN_MAKES.length; i++) {
    var makeRegex = new RegExp('\\b' + KNOWN_MAKES[i].replace('-', '[-\\s]?') + '\\b', 'i');
    if (makeRegex.test(text)) {
      result.make = KNOWN_MAKES[i];
      // Get everything after the make name
      var afterMake = text.replace(new RegExp('^.*?' + KNOWN_MAKES[i] + '\\s*', 'i'), '');
      // Grab up to 3 words for model (handles "Prius c", "Model 3", "Elantra N Line")
      var modelMatch = afterMake.match(/^([\w][\w\-]*(?:\s+[\w][\w\-]*){0,2}?)(?:\s*(?:\||in\s|\d{5}|$))/i);
      if (modelMatch) {
        result.model = modelMatch[1].trim();
      } else {
        var simpleMatch = afterMake.match(/^([\w][\w\-]*(?:\s+[\w][\w\-]*){0,2})/);
        if (simpleMatch) result.model = simpleMatch[1].trim();
      }
      break;
    }
  }
  return result;
}

function extractHeuristic() {
  var result = {};
  try {
    var titleText = cleanText(document.title);
    var h1Text = qsText('h1');
    var h2Text = qsText('h2');

    // Try all candidates and merge — don't stop at first non-empty string
    // because h1/h2 may not contain make/model on SPAs
    var candidates = [h1Text, h2Text, titleText].filter(Boolean);
    var titleParsed = {};
    for (var c = 0; c < candidates.length; c++) {
      var parsed = parseTitleText(candidates[c]);
      if (parsed.make && !titleParsed.make) titleParsed.make = parsed.make;
      if (parsed.model && !titleParsed.model) titleParsed.model = parsed.model;
      if (parsed.year && !titleParsed.year) titleParsed.year = parsed.year;
      if (parsed.condition && !titleParsed.condition) titleParsed.condition = parsed.condition;
    }
    Object.assign(result, titleParsed);

    // Price: find $ followed by digits
    var bodyText = document.body.innerText || '';
    var priceMatches = bodyText.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
    if (priceMatches) {
      for (var j = 0; j < priceMatches.length; j++) {
        var p = parsePrice(priceMatches[j]);
        if (p && p >= 1000 && p <= 500000) { result.price = p; break; }
      }
    }

    // Mileage
    var mileageMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles?|mi\.?)\b/i);
    if (mileageMatch) {
      var m = parseMileage(mileageMatch[1]);
      if (m && m < 500000) result.mileage = m;
    }

    // VIN
    var vinMatch = bodyText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
    if (vinMatch) result.vin = vinMatch[1];

    result._titleHint = titleText;
  } catch(e) {}
  return result;
}
