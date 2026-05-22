(function () {
  function init() {
    const burger = document.querySelector('.burger');
    const overlay = document.querySelector('.menu-overlay');
    if (!burger || !overlay) return;

    function setOpen(open) {
      overlay.classList.toggle('abierto', open);
      burger.setAttribute('aria-expanded', String(open));
      overlay.setAttribute('aria-hidden', String(!open));
    }

    burger.addEventListener('click', () => {
      setOpen(!overlay.classList.contains('abierto'));
    });

    overlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('abierto')) setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
