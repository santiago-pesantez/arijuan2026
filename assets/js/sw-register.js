(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost' && location.protocol === 'http:') {
    // Permitir SW también en localhost para desarrollo si se desea.
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.warn('SW no se pudo registrar:', err));
  });
})();
