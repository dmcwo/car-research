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
