// AUTO-GENERATED — do not edit. Run: npm run bundle

function carResearchExtract() {
  // === shared/model.js ===
  function createCarRecord(overrides) {
    var base = {
      // Identity
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36),
      dateScraped: new Date().toISOString(),
      url: '',
      websiteName: '',
  
      // Vehicle
      year: null,
      make: '',
      model: '',
      trim: '',
      bodyStyle: '',
      condition: '',       // "New" | "Used" | "CPO"
  
      // Powertrain
      engine: '',
      fuelType: '',        // "Gasoline" | "Electric" | "Hybrid" | "PHEV" | "Diesel"
      mpgCity: null,
      mpgHighway: null,
      mpgCombined: null,
      drivetrain: '',      // "FWD" | "AWD" | "RWD" | "4WD"
      transmission: '',
  
      // Appearance
      colorExterior: '',
      colorInterior: '',
  
      // Listing
      price: null,
      mileage: null,
      vin: '',
      stockNumber: '',
  
      // History
      owners: null,
      accidentCount: null,
      carfaxSummary: '',
      isCertifiedPreOwned: false,
      warrantyInfo: '',
  
      // Seller
      sellerName: '',
      sellerType: '',      // "Dealer" | "Private"
      sellerPhone: '',
      sellerLocation: '',
  
      // Meta
      daysOnLot: null,
      notes: ''
    };
  
    if (overrides) {
      Object.keys(overrides).forEach(function(k) {
        if (k in base) base[k] = overrides[k];
      });
    }
    return base;
  }
  
  // CSV column order — fixed for spreadsheet compatibility
  var CAR_RECORD_COLUMNS = [
    'year','make','model','trim','bodyStyle','condition',
    'price','mileage','fuelType','mpgCity','mpgHighway','mpgCombined',
    'engine','drivetrain','transmission',
    'colorExterior','colorInterior',
    'vin','stockNumber',
    'owners','accidentCount','carfaxSummary','isCertifiedPreOwned','warrantyInfo',
    'sellerName','sellerType','sellerPhone','sellerLocation',
    'daysOnLot','websiteName','url','dateScraped','notes','id'
  ];
  

  // === shared/constants.js ===
  var EXTRACTOR_MAP = {
    'www.carvana.com':     'carvana',
    'www.carmax.com':      'carmax',
    'www.cars.com':        'cars-com',
    'www.autotrader.com':  'autotrader',
    'www.kbb.com':         'kbb'
    // Craigslist matched by .includes('craigslist.org') in extract.js
  };
  
  var WEBSITE_NAMES = {
    'carvana.com':     'Carvana',
    'carmax.com':      'CarMax',
    'cars.com':        'Cars.com',
    'autotrader.com':  'AutoTrader',
    'kbb.com':         'KBB',
    'craigslist.org':  'Craigslist'
  };
  
  function getWebsiteName(hostname) {
    var keys = Object.keys(WEBSITE_NAMES);
    for (var i = 0; i < keys.length; i++) {
      if (hostname.includes(keys[i])) return WEBSITE_NAMES[keys[i]];
    }
    return hostname.replace(/^www\./, '');
  }
  

  // === content/utils/dom-helpers.js ===
  function qs(selector, root) {
    try { return (root || document).querySelector(selector); } catch(e) { return null; }
  }
  
  function qsText(selector, root) {
    var el = qs(selector, root);
    return el ? el.textContent.trim() : '';
  }
  
  function qsAttr(selector, attr, root) {
    var el = qs(selector, root);
    return el ? (el.getAttribute(attr) || '').trim() : '';
  }
  
  function allText(selector, root) {
    try {
      return Array.from((root || document).querySelectorAll(selector))
        .map(function(el) { return el.textContent.trim(); })
        .filter(Boolean);
    } catch(e) { return []; }
  }
  
  function cleanText(str) {
    return (str || '').replace(/\s+/g, ' ').trim();
  }
  

  // === content/utils/price-parser.js ===
  function parsePrice(str) {
    if (!str) return null;
    var m = String(str).replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0]);
    return isNaN(n) ? null : Math.round(n);
  }
  
  function parseMileage(str) {
    if (!str) return null;
    var m = String(str).replace(/,/g, '').match(/\d+/);
    if (!m) return null;
    var n = parseInt(m[0], 10);
    return isNaN(n) ? null : n;
  }
  
  function parseMpg(str) {
    if (!str) return null;
    var m = String(str).replace(/,/g, '').match(/\d+(\.\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0]);
    return isNaN(n) ? null : n;
  }
  

  // === content/utils/normalize.js ===
  function normalizeFuelType(raw) {
    if (!raw) return '';
    var s = raw.toLowerCase();
    if (s.includes('electric') && s.includes('plug')) return 'PHEV';
    if (s.includes('electric') || s.includes('ev') || s.includes('bev')) return 'Electric';
    if (s.includes('hybrid')) return 'Hybrid';
    if (s.includes('diesel')) return 'Diesel';
    if (s.includes('gas') || s.includes('petrol') || s.includes('benzin')) return 'Gasoline';
    return raw.trim();
  }
  
  function normalizeDrivetrain(raw) {
    if (!raw) return '';
    var s = raw.toUpperCase().replace(/[-\s]/g, '');
    if (s.includes('AWD') || s.includes('ALLWHEEL')) return 'AWD';
    if (s.includes('4WD') || s.includes('4X4') || s.includes('FOURWHEEL')) return '4WD';
    if (s.includes('RWD') || s.includes('REARWHEEL')) return 'RWD';
    if (s.includes('FWD') || s.includes('FRONTWHEEL')) return 'FWD';
    return raw.trim();
  }
  
  function normalizeCondition(raw) {
    if (!raw) return '';
    var s = raw.toLowerCase();
    if (s.includes('new')) return 'New';
    if (s.includes('certified') || s.includes('cpo')) return 'CPO';
    if (s.includes('used') || s.includes('pre')) return 'Used';
    return raw.trim();
  }
  
  function normalizeTransmission(raw) {
    if (!raw) return '';
    var s = raw.toLowerCase();
    if (s.includes('auto') || s.includes('a/t')) return 'Automatic';
    if (s.includes('manual') || s.includes('m/t') || s.includes('stick')) return 'Manual';
    if (s.includes('cvt')) return 'CVT';
    return raw.trim();
  }
  
  function normalizeYear(raw) {
    if (!raw) return null;
    var m = String(raw).match(/\b(19|20)\d{2}\b/);
    if (!m) return null;
    return parseInt(m[0], 10);
  }
  

  // === content/extractors/generic-jsonld.js ===
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
  

  // === content/extractors/generic-heuristic.js ===
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
  

  // === content/extractors/carvana.js ===
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
  

  // === content/extractors/carmax.js ===
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
  

  // === content/extractors/cars-com.js ===
  function extractCarsCom() {
    var result = {};
    try {
      // Cars.com has good JSON-LD; supplement with DOM for Carfax + dealer info
      result.sellerType = 'Dealer';
  
      var dealerName = qsText('.dealer-name') || qsText('[class*="dealer-name"]') || qsText('[class*="seller-name"]');
      if (dealerName) result.sellerName = dealerName;
  
      var location = qsText('.dealer-address') || qsText('[class*="dealer-address"]');
      if (location) result.sellerLocation = location;
  
      var phone = qsText('.dealer-phone') || qsText('[class*="dealer-phone"]');
      if (phone) result.sellerPhone = phone;
  
      // Carfax summary
      var carfax = qsText('.carfax-snapshot') || qsText('[class*="carfax"]') || qsText('[class*="history-report"]');
      if (carfax) result.carfaxSummary = cleanText(carfax);
  
      // Days on lot
      var daysEl = qsText('[class*="days-on-market"]') || qsText('[class*="days-on-lot"]');
      if (daysEl) {
        var dm = daysEl.match(/\d+/);
        if (dm) result.daysOnLot = parseInt(dm[0], 10);
      }
  
      // CPO badge
      var cpoEl = qs('[class*="certified"]') || qs('[class*="cpo"]');
      if (cpoEl) result.isCertifiedPreOwned = true;
  
      var conditionEl = qsText('[class*="listing-type"]') || qsText('[class*="condition"]');
      if (conditionEl) result.condition = normalizeCondition(conditionEl);
    } catch(e) {}
    return result;
  }
  

  // === content/extractors/autotrader.js ===
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
  

  // === content/extractors/kbb.js ===
  function extractKbb() {
    var result = {};
    try {
      // KBB has JSON-LD; add CPO flag and extra DOM details
      var cpoEl = qs('[class*="certified"]') || qs('[class*="cpo"]') || qs('[data-cmp*="certified"]');
      if (cpoEl) {
        result.isCertifiedPreOwned = true;
        result.condition = 'CPO';
      }
  
      var dealer = qsText('[class*="dealer-name"]') || qsText('[class*="seller-name"]');
      if (dealer) result.sellerName = dealer;
  
      var location = qsText('[class*="dealer-location"]') || qsText('[class*="seller-location"]');
      if (location) result.sellerLocation = location;
  
      var phone = qsText('[class*="dealer-phone"]') || qsText('[class*="seller-phone"]');
      if (phone) result.sellerPhone = phone;
  
      result.sellerType = 'Dealer';
    } catch(e) {}
    return result;
  }
  

  // === content/extractors/craigslist.js ===
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
  

  // Extraction body — included inside carResearchExtract() by the bundler.
  // All helper functions are defined earlier in the same wrapper function scope.
  
  var hostname = window.location.hostname;
  var url = window.location.href;
  var _debug = { site: null, siteError: null, jsonldError: null, heuristicError: null };
  
  var _pageInfo = {
    hasNextData: !!document.getElementById('__NEXT_DATA__'),
    jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
    title: document.title.slice(0, 120),
    hostname: hostname
  };
  
  try {
    var siteResult = {};
    var extractorName = 'none';
    try {
      if (hostname.includes('carvana.com'))        { extractorName = 'carvana';    siteResult = extractCarvana(); }
      else if (hostname.includes('carmax.com'))     { extractorName = 'carmax';     siteResult = extractCarmax(); }
      else if (hostname.includes('cars.com'))        { extractorName = 'cars-com';   siteResult = extractCarsCom(); }
      else if (hostname.includes('autotrader.com'))  { extractorName = 'autotrader'; siteResult = extractAutotrader(); }
      else if (hostname.includes('kbb.com'))         { extractorName = 'kbb';        siteResult = extractKbb(); }
      else if (hostname.includes('craigslist.org'))  { extractorName = 'craigslist'; siteResult = extractCraigslist(); }
      else                                           { extractorName = 'generic'; }
      _debug.site = extractorName;
    } catch(e) {
      _debug.site = extractorName;
      _debug.siteError = e.message + '\n' + (e.stack || '');
    }
  
    var jsonldResult = {};
    try { jsonldResult = extractJsonLd(); } catch(e) { _debug.jsonldError = e.message; }
  
    var heuristicResult = {};
    try { heuristicResult = extractHeuristic(); } catch(e) { _debug.heuristicError = e.message; }
  
    var merged = createCarRecord();
    [heuristicResult, jsonldResult, siteResult].forEach(function(src) {
      Object.keys(src).forEach(function(k) {
        if (k.startsWith('_')) return;
        var v = src[k];
        if (v == null || v === '') return;
        if (merged[k] == null || merged[k] === '' || merged[k] === false) {
          merged[k] = v;
        }
      });
    });
  
    var titleHint = siteResult._titleHint || jsonldResult._titleHint || heuristicResult._titleHint || '';
    if (titleHint && !merged.year) {
      var ym = titleHint.match(/\b(19|20)\d{2}\b/);
      if (ym) merged.year = parseInt(ym[0], 10);
    }
  
    merged.url = url;
    merged.websiteName = getWebsiteName(hostname);
  
    if (merged.mpgCombined == null && merged.mpgCity && merged.mpgHighway) {
      merged.mpgCombined = Math.round((merged.mpgCity * 0.55 + merged.mpgHighway * 0.45) * 10) / 10;
    }
  
    merged._debug = _debug;
    merged._pageInfo = _pageInfo;
    return merged;
  
  } catch(e) {
    return {
      _fatal: e.message + '\n' + (e.stack || ''),
      _pageInfo: _pageInfo,
      url: url,
      websiteName: hostname
    };
  }
  
}
