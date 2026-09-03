(() => {
  function mountWatermark() {
    if (!document.body || document.getElementById('app-watermark')) return;

    const host = document.querySelector('.app-frame') || document.body;
    const mark = document.createElement('div');
    mark.id = 'app-watermark';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<div class="watermark-logo"><span>C</span></div><div class="watermark-text">CONTROLE · PESSOAL</div>';
    host.appendChild(mark);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWatermark, { once: true });
  } else {
    mountWatermark();
  }
})();
