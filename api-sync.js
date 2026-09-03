(function () {
  const KEY = 'finapp-data';
  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  let cache = null;
  let loaded = false;
  let pending = Promise.resolve();

  function apiState() {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/state', false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText);
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
        const response = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: !!keepalive
        });
        if (response.ok) return true;
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
    pending = pending
      .catch(() => {})
      .then(() => putState(data, false));
    return pending;
  }

  // O adaptador é carregado no <head>. O GET síncrono garante que o app legado
  // receba os dados do Neon antes de executar seu próprio código de inicialização.
  cache = apiState();
  if (!cache) cache = localState();
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
        // Mantém um fallback local e, em paralelo, persiste no Neon.
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

  // Se o usuário editar e atualizar/fechar imediatamente, tenta concluir a
  // última gravação mesmo com o ciclo de vida da página terminando.
  window.addEventListener('pagehide', () => {
    if (!cache) return;
    putState(cache, true);
  });
})();
