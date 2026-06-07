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
