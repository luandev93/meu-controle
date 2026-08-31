(function () {
  const KEY = 'finapp-data';
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let cache = null;
  let loaded = false;

  function apiState() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/state', false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText);
    } catch (_) {}
    return null;
  }

  cache = apiState();
  loaded = true;

  Storage.prototype.getItem = function (key) {
    if (this === window.localStorage && key === KEY && loaded) {
      return cache ? JSON.stringify(cache) : null;
    }
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && key === KEY) {
      try {
        cache = JSON.parse(value);
        fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cache)
        }).catch(() => {});
      } catch (_) {}
      return;
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && key === KEY) {
      cache = null;
      fetch('/api/state', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debts: [], shifts: [], scheduleConfig: {} })
      }).catch(() => {});
      return;
    }
    return originalRemoveItem.call(this, key);
  };
})();
