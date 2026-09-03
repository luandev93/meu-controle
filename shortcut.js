(() => {
  function openRequestedView() {
    const view = new URLSearchParams(window.location.search).get('view');
    if (view !== 'dividas' && view !== 'escala') return;

    const button = document.querySelector(`.tab-btn[data-tab="${view}"]`);
    if (button) button.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openRequestedView, { once: true });
  } else {
    openRequestedView();
  }
})();
