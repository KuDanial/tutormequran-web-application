(() => {
  const menu = document.querySelector('.profile-menu:has(.student-menu-panel)');
  if (menu) {
    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menu.open = false;
        menu.querySelector('summary').focus();
      }
    });
    const current = location.pathname.split('/').pop();
    menu.querySelectorAll('a').forEach((link) => {
      if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'page');
    });
  }

  const tabs = document.querySelector('[data-student-tabs]');
  if (tabs) {
    const links = Array.from(tabs.querySelectorAll('a'));
    const panels = Array.from(document.querySelectorAll('[data-student-panel]'));
    function sync() {
      const selected = links.find((link) => link.hash === location.hash) || links[0];
      panels.forEach((panel) => { panel.hidden = '#' + panel.id !== selected.hash; });
      links.forEach((link) => {
        if (link === selected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    }
    tabs.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      sync();
    });
    // Menu links select a view, rather than using the panel as a scroll anchor.
    const isTabHash = (hash) => links.some((link) => link.hash === hash);
    const startAtTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    menu?.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      const target = new URL(link.href, location.href);
      if (target.pathname !== location.pathname || target.search !== location.search || !isTabHash(target.hash)) return;
      event.preventDefault();
      if (location.hash !== target.hash) history.pushState(null, '', target.hash);
      sync();
      menu.open = false;
      menu.querySelector('summary').focus({ preventScroll: true });
      startAtTop();
    });
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', () => {
      sync();
      if (isTabHash(location.hash)) startAtTop();
    });
    // Cross-page links and refreshes may trigger native fragment scrolling after parsing.
    window.addEventListener('pageshow', () => {
      if (isTabHash(location.hash)) {
        sync();
        startAtTop();
        requestAnimationFrame(startAtTop);
      }
    });
    sync();
  }

  const form = document.querySelector('[data-support-request]');
  if (!form) return;
  const category = form.querySelector('[name="category"]');
  const description = form.querySelector('[name="description"]');
  const photo = form.querySelector('[name="photo"]');
  const attachment = form.querySelector('[data-attachment]');
  const image = form.querySelector('[data-attachment-image]');
  const result = document.querySelector('[data-request-result]');
  let photoUrl;
  const guidance = {
    billing: 'Include the booking ID, amount and payment date. Refund questions are reviewed; submitting a request does not approve or issue a refund.',
    attendance: 'Include the lesson date and explain the absence, delay or interruption.',
    other: 'Describe the issue and what help you need.'
  };
  category.addEventListener('change', () => {
    form.querySelector('[data-request-guidance]').textContent = guidance[category.value] || 'Choose the topic that best describes your request.';
  });
  form.addEventListener('input', () => { result.hidden = true; description.setCustomValidity(''); });
  function clearPhoto() {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
    attachment.hidden = true;
    image.removeAttribute('src');
    photo.setCustomValidity('');
  }
  photo.addEventListener('change', () => {
    clearPhoto();
    const file = photo.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      photo.setCustomValidity('Choose one JPG or PNG image up to 5 MB.');
      photo.reportValidity();
      return;
    }
    photoUrl = URL.createObjectURL(file);
    image.src = photoUrl;
    attachment.hidden = false;
  });
  image.addEventListener('error', () => {
    clearPhoto();
    photo.setCustomValidity('This image could not be opened. Choose a different JPG or PNG.');
    photo.reportValidity();
  });
  form.querySelector('[data-remove-attachment]').addEventListener('click', () => {
    photo.value = '';
    clearPhoto();
    result.hidden = true;
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!description.value.trim()) description.setCustomValidity('Please describe your request.');
    if (!form.reportValidity()) return;
    result.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = 'Request prepared — not sent';
    const summary = document.createElement('p');
    summary.textContent = category.options[category.selectedIndex].text + (form.elements.booking.value.trim() ? ' · ' + form.elements.booking.value.trim() : '');
    const text = document.createElement('p');
    text.textContent = description.value.trim();
    const note = document.createElement('p');
    note.textContent = photo.files.length ? 'One photo selected locally. Nothing has been uploaded.' : 'No photo attached.';
    result.append(heading, summary, text, note);
    result.hidden = false;
  });
})();
