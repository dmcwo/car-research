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
