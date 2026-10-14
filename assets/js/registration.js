(() => {
  const layout = document.querySelector('.registration-layout');
  if (!layout) return;

  const links = layout.querySelectorAll('.registration-tabs a');

  function syncRegistration() {
    const selected = location.hash === '#tutor-application'
      ? '#tutor-application'
      : '#student-registration';

    layout.dataset.registration = selected === '#tutor-application' ? 'tutor' : 'student';
    links.forEach((link) => {
      if (link.getAttribute('href') === selected) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const hash = link.getAttribute('href');
      if (location.hash !== hash) history.pushState(null, '', hash);
      syncRegistration();
    });
  });

  window.addEventListener('popstate', syncRegistration);
  window.addEventListener('hashchange', syncRegistration);
  syncRegistration();
})();
