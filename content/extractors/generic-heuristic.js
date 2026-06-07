var KNOWN_MAKES = [
  'Acura','Alfa Romeo','Aston Martin','Audi','Bentley','BMW','Buick','Cadillac',
  'Chevrolet','Chrysler','Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda',
  'Hyundai','Infiniti','Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus',
  'Lincoln','Maserati','Mazda','McLaren','Mercedes-Benz','Mercedes','MINI','Mitsubishi',
  'Nissan','Pontiac','Porsche','Ram','Rivian','Rolls-Royce','Saturn','Subaru','Tesla',
  'Toyota','Volkswagen','Volvo'
];

// Known trims by make — used to extract trim from page body text
var TRIM_MAP = {
  'Toyota':     ['GR Corolla','GR86','GR Supra','Nightshade','TRD Pro','TRD Off-Road','TRD Sport','XSE','XLE Premium','XLE','XSE','SE','LE','L','Platinum','Limited','Premium'],
  'Honda':      ['Type R','Sport Touring','Touring','Sport','EX-L','EX','LX','Elite'],
  'Ford':       ['Raptor R','Raptor','King Ranch','Platinum','Lariat','XLT','XL','Titanium','SEL','SE','S','ST','ST-Line','Active','Tremor','Bronco Sport'],
  'Chevrolet':  ['High Country','LTZ','Premier','RS','SS','Z71','LT','LS','Trail Boss','ZR2','ZL1'],
  'GMC':        ['Denali Ultimate','Denali','AT4X','AT4','SLT','SLE','Pro','Elevation'],
  'RAM':        ['TRX','Limited','Longhorn','Laramie','Big Horn','Tradesman','Rebel','Power Wagon'],
  'Jeep':       ['Rubicon','Sahara','Overland','Trailhawk','Altitude','High Tide','Willys','Sport S','Sport'],
  'Dodge':      ['SRT Hellcat','SRT','R/T','GT','SXT','SE','Pursuit'],
  'Nissan':     ['Platinum','Pro-4X','SL','SR','SV','S','Rock Creek','Midnight Edition'],
  'Hyundai':    ['Calligraphy','Ultimate','Limited','N Line','SEL Plus','SEL','SE','N','XRT'],
  'Kia':        ['SX Prestige','SX','GT-Line','EX','LXS','LX','S','X-Pro','Nightfall Edition','X-Line'],
  'Subaru':     ['Wilderness','Touring','Onyx Edition XT','Onyx Edition','Sport','Limited XT','Limited','Premium','Base'],
  'Mazda':      ['Carbon Edition','Turbo','Premium Plus','Premium','Select','Sport','2.5 Turbo'],
  'BMW':        ['M Competition','Competition','M Sport','xDrive','sDrive','Gran Coupe'],
  'Mercedes-Benz': ['AMG 63','AMG 53','AMG 45','AMG 43','AMG','4MATIC+','4MATIC','Night Edition','Premium'],
  'Audi':       ['Competition','Prestige','Premium Plus','Premium','S line','Black Edition'],
  'Volkswagen': ['SEL Premium','SEL','SE','S','R-Line','GLI','GTI'],
  'Lexus':      ['Ultra Luxury','Executive','Inspiration Series','F Sport','Premium','L','Black Line'],
  'Acura':      ['Type S','Advance','A-Spec','Technology','Base'],
  'Infiniti':   ['Sensory','ProACTIVE','Essential','Pure','LUXE'],
  'Lincoln':    ['Black Label','Reserve','Select','Standard'],
  'Cadillac':   ['V-Series Blackwing','V-Series','Sport','Premium Luxury','Luxury','Base'],
  'Volvo':      ['Ultimate','Plus','Core','Recharge','B5','B6','T8','T6','T5']
};

// Parse year/make/model/condition from any text string
function parseTitleText(text) {
  var result = {};
  if (!text) return result;

  var yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) result.year = parseInt(yearMatch[0], 10);

  if (/\bnew\b/i.test(text)) result.condition = 'New';
  else if (/\bcertified\b|\bcpo\b/i.test(text)) result.condition = 'CPO';
  else if (/\bused\b/i.test(text)) result.condition = 'Used';

  for (var i = 0; i < KNOWN_MAKES.length; i++) {
    var makePattern = KNOWN_MAKES[i].replace('-', '[-\\s]?');
    var makeRegex = new RegExp('\\b' + makePattern + '\\b', 'i');
    if (makeRegex.test(text)) {
      result.make = KNOWN_MAKES[i];
      var afterMake = text.replace(new RegExp('^.*?' + makePattern + '\\s*', 'i'), '');
      // Grab up to 3 words for model (handles "Prius c", "Model 3", "Elantra N Line")
      var modelMatch = afterMake.match(/^([\w][\w\-]*(?:\s+[\w][\w\-]*){0,2}?)(?=\s*(?:\||in\s|–|-\s|\d{5}|$))/i);
      if (modelMatch && modelMatch[1].trim()) {
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

// Extract trim from page text using the make-specific lookup table
function extractTrimFromText(text, make) {
  if (!text || !make) return '';
  var trims = TRIM_MAP[make] || [];
  // Sort longest first so "XLE Premium" matches before "XLE"
  var sorted = trims.slice().sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < sorted.length; i++) {
    var trimRegex = new RegExp('\\b' + sorted[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    if (trimRegex.test(text)) return sorted[i];
  }
  return '';
}

// Extract MPG from page text — handles many formats:
// "47/43 MPG", "47 city / 43 hwy", "133 MPGe", "Up to 47 mpg"
function extractMpgFromText(text) {
  var result = {};
  if (!text) return result;

  // MPGe / eMPG (electric equivalent)
  var mpgeMatch = text.match(/(\d{2,3})\s*MPGe/i);
  if (mpgeMatch) result.mpgCombined = parseInt(mpgeMatch[1]);

  // City/Highway pair: "47 city / 43 hwy" or "47/43 mpg"
  var cityHwyMatch = text.match(/(\d{1,2})\s*(?:city|cty)[^\d]{0,10}(\d{1,2})\s*(?:hwy|highway)/i)
    || text.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:MPG|mpg)/i);
  if (cityHwyMatch) {
    result.mpgCity = parseInt(cityHwyMatch[1]);
    result.mpgHighway = parseInt(cityHwyMatch[2]);
    result.mpgCombined = result.mpgCombined ||
      Math.round(result.mpgCity * 0.55 + result.mpgHighway * 0.45);
  }

  // Single MPG value
  if (!result.mpgCombined) {
    var singleMatch = text.match(/(\d{1,2})\s*MPG/i);
    if (singleMatch) result.mpgCombined = parseInt(singleMatch[1]);
  }

  return result;
}

function extractHeuristic() {
  var result = {};
  try {
    var titleText = cleanText(document.title);
    var h1Text = qsText('h1');
    var h2Text = qsText('h2');

    // Try ALL candidates — don't stop at first non-empty (SPAs often have
    // non-car text in h1, while the page title reliably has make/model)
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

    var bodyText = document.body.innerText || '';

    // Price
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

    // MPG / eMPG
    var mpg = extractMpgFromText(bodyText);
    if (mpg.mpgCity) result.mpgCity = mpg.mpgCity;
    if (mpg.mpgHighway) result.mpgHighway = mpg.mpgHighway;
    if (mpg.mpgCombined) result.mpgCombined = mpg.mpgCombined;

    // Fuel type
    if (!result.fuelType) {
      if (/plug.in hybrid|phev/i.test(bodyText)) result.fuelType = 'PHEV';
      else if (/\bhybrid\b/i.test(bodyText)) result.fuelType = 'Hybrid';
      else if (/\belectric\b|\bev\b|\bbattery.electric/i.test(bodyText)) result.fuelType = 'Electric';
      else if (/\bdiesel\b/i.test(bodyText)) result.fuelType = 'Diesel';
    }

    // Drivetrain
    if (!result.drivetrain) {
      if (/\bAWD\b|all.wheel drive/i.test(bodyText)) result.drivetrain = 'AWD';
      else if (/\b4WD\b|\b4x4\b|four.wheel drive/i.test(bodyText)) result.drivetrain = '4WD';
      else if (/\bRWD\b|rear.wheel drive/i.test(bodyText)) result.drivetrain = 'RWD';
      else if (/\bFWD\b|front.wheel drive/i.test(bodyText)) result.drivetrain = 'FWD';
    }

    // Transmission
    if (!result.transmission) {
      if (/\bCVT\b/i.test(bodyText)) result.transmission = 'CVT';
      else if (/\bautomatic\b/i.test(bodyText)) result.transmission = 'Automatic';
      else if (/\bmanual\b|\bstick shift\b/i.test(bodyText)) result.transmission = 'Manual';
    }

    // Trim — use make-specific dictionary against full page text
    if (!result.trim && result.make) {
      result.trim = extractTrimFromText(bodyText, result.make);
    }

    // Body style
    if (!result.bodyStyle) {
      if (/\bSUV\b/i.test(bodyText)) result.bodyStyle = 'SUV';
      else if (/\btruck\b|\bpickup\b/i.test(bodyText)) result.bodyStyle = 'Truck';
      else if (/\bsedan\b/i.test(bodyText)) result.bodyStyle = 'Sedan';
      else if (/\bhatchback\b/i.test(bodyText)) result.bodyStyle = 'Hatchback';
      else if (/\bcoupe\b/i.test(bodyText)) result.bodyStyle = 'Coupe';
      else if (/\bconvertible\b/i.test(bodyText)) result.bodyStyle = 'Convertible';
      else if (/\bwagon\b/i.test(bodyText)) result.bodyStyle = 'Wagon';
      else if (/\bvan\b|\bminivan\b/i.test(bodyText)) result.bodyStyle = 'Van';
    }

    result._titleHint = titleText;
  } catch(e) {}
  return result;
}
