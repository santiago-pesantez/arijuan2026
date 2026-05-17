(function () {
  function init() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.site-nav');
    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
      const abierto = nav.classList.toggle('abierto');
      burger.setAttribute('aria-expanded', String(abierto));
    });

    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('abierto');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
