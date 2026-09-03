(() => {
  function mountWatermark() {
    if (!document.body || document.getElementById('app-watermark')) return;

    const host = document.querySelector('.app-frame') || document.body;
    const mark = document.createElement('div');
    mark.id = 'app-watermark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<img class="watermark-image" src="/icon-512.png" alt="">';
    host.appendChild(mark);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWatermark, { once: true });
  } else {
    mountWatermark();
  }
})();