browser.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'SAVE_CAR') {
    browser.storage.local.get('garage').then(function(data) {
      var garage = data.garage || [];
      garage.push(msg.record);
      return browser.storage.local.set({ garage: garage });
    }).then(function() {
      sendResponse({ ok: true });
    }).catch(function(err) {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  if (msg.type === 'GET_GARAGE') {
    browser.storage.local.get('garage').then(function(data) {
      sendResponse({ garage: data.garage || [] });
    });
    return true;
  }

  if (msg.type === 'DELETE_CAR') {
    browser.storage.local.get('garage').then(function(data) {
      var garage = (data.garage || []).filter(function(r) { return r.id !== msg.id; });
      return browser.storage.local.set({ garage: garage });
    }).then(function() {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'CLEAR_GARAGE') {
    browser.storage.local.set({ garage: [] }).then(function() {
      sendResponse({ ok: true });
    });
    return true;
  }
});

browser.action.onClicked.addListener(function() {
  browser.sidebarAction.toggle();
});
