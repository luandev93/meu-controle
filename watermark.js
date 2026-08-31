(() => {
  if (window.matchMedia('(prefers-reduced-transparency: reduce)').matches) return;
  const mark = document.createElement('img');
  mark.src = '/icon-512.png';
  mark.alt = '';
  mark.setAttribute('aria-hidden', 'true');
  Object.assign(mark.style, {
    position: 'fixed',
    right: '7vw',
    bottom: '13vh',
    width: 'min(52vw, 300px)',
    height: 'auto',
    opacity: '0.075',
    filter: 'saturate(.75) brightness(.8)',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: '0',
    transform: 'translateZ(0)',
    transition: 'opacity .35s ease'
  });
  document.body.appendChild(mark);
})();
