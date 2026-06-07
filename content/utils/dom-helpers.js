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
