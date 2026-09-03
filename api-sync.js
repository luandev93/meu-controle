(function () {
  const KEY = 'finapp-data';
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let cache = null;
  let loaded = false;
  let dirty = false;
  let stateVersion = null;
  let pending = Promise.resolve();

  function apiState() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `/api/state?fresh=${Date.now()}`, false);
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store');
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        return {
          data: JSON.parse(xhr.responseText),
          updatedAt: xhr.getResponseHeader('X-State-Updated-At') || null
        };
      }
    } catch (_) {}
    return null;
  }

  function localState() {
    try {
      const raw = originalGetItem.call(window.localStorage, KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function putState(data, keepalive) {
    const body = JSON.stringify(data);
    let lastError;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(`/api/state?fresh=${Date.now()}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
          body,
          keepalive: !!keepalive,
          cache: 'no-store'
        });
        if (response.ok) {
          stateVersion = response.headers.get('X-State-Updated-At') || stateVersion;
          dirty = false;
          return true;
        }
        lastError = new Error(`HTTP ${response.status}`);
      } catch (error) {
        lastError = error;
      }

      if (!keepalive && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 350));
      }
    }

    console.error('Não foi possível persistir os dados no servidor.', lastError);
    return false;
  }

  function queuePersist(data) {
    dirty = true;
    pending = pending
      .catch(() => {})
      .then(() => putState(data, false));
    return pending;
  }

  function refreshFromServer() {
    if (!loaded || dirty) return;
    const snapshot = apiState();
    if (!snapshot) return;

    const serverVersion = snapshot.updatedAt ? Date.parse(snapshot.updatedAt) : 0;
    const localVersion = stateVersion ? Date.parse(stateVersion) : 0;

    if (serverVersion && localVersion && serverVersion <= localVersion) return;
    if (!serverVersion && JSON.stringify(snapshot.data) === JSON.stringify(cache)) return;

    cache = snapshot.data;
    stateVersion = snapshot.updatedAt;
    originalSetItem.call(window.localStorage, KEY, JSON.stringify(cache));
    window.location.reload();
  }

  const initial = apiState();
  if (initial) {
    cache = initial.data;
    stateVersion = initial.updatedAt;
  } else {
    cache = localState();
  }
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
        originalSetItem.call(this, key, value);
        queuePersist(cache);
      } catch (error) {
        console.error('Estado inválido ao salvar.', error);
      }
      return;
    }
    return originalSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && key === KEY) {
      cache = null;
      originalRemoveItem.call(this, key);
      queuePersist({ debts: [], shifts: [], scheduleConfig: {} });
      return;
    }
    return originalRemoveItem.call(this, key);
  };

  window.addEventListener('focus', refreshFromServer);
  window.addEventListener('pageshow', refreshFromServer);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshFromServer();
  });

  window.addEventListener('pagehide', () => {
    if (!cache || !dirty) return;
    putState(cache, true);
  });
})();
