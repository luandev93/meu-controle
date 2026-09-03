(() => {
  function mountWatermark() {
    if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
    if (!document.body || document.getElementById('app-watermark')) return;

    const host = document.querySelector('.app-frame') || document.body;
    const mark = document.createElement('img');
    mark.id = 'app-watermark';
    mark.src = '/icon-512.png';
    mark.alt = '';
    mark.setAttribute('aria-hidden', 'true');
    Object.assign(mark.style, {
      position: 'absolute',
      right: '24px',
      bottom: '92px',
      width: 'min(30vw, 170px)',
      height: 'auto',
      opacity: '0.035',
      filter: 'saturate(.55) brightness(.72)',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: '0',
      transform: 'translateZ(0)',
      transition: 'opacity .35s ease'
    });
    host.appendChild(mark);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWatermark, { once: true });
  } else {
    mountWatermark();
  }
})();
