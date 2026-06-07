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
