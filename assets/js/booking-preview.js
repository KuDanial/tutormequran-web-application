(() => {
  const form = document.querySelector('[data-booking-chat]');
  if (!form) return;
  const input = form.querySelector('textarea');
  const messages = document.querySelector('[data-booking-messages]');
  const toggle = form.querySelector('[data-location-toggle]');
  const panel = form.querySelector('#chat-location');
  const status = form.querySelector('[data-location-status]');
  const preview = form.querySelector('[data-location-preview]');
  const current = form.querySelector('[data-location-current]');
  let pending;
  let request = 0;
  function append(body) {
    const message = document.createElement('article');
    message.className = 'portal-message chat-outgoing';
    const author = document.createElement('strong');
    author.textContent = form.dataset.author || 'You - Student';
    const stamp = document.createElement('small');
    stamp.textContent = new Intl.DateTimeFormat('en-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: 'numeric', minute: '2-digit' }).format(new Date()) + ' MYT - preview, not sent';
    message.append(author, body, stamp);
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) { input.setCustomValidity('Write a message first.'); input.reportValidity(); return; }
    const body = document.createElement('p'); body.textContent = text;
    append(body); input.value = ''; input.focus({ preventScroll: true });
  });
  input.addEventListener('input', () => input.setCustomValidity(''));
  function reset() { request++; pending = null; preview.hidden = true; status.textContent = ''; current.disabled = false; }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); reset();
    if (!panel.hidden) form.querySelector('#location-address').focus();
  });
  function prepare(title, url) {
    pending = { title, url }; preview.hidden = false;
    const link = form.querySelector('[data-location-map]'); link.href = url; link.textContent = 'Preview: ' + title;
    status.textContent = 'Check the meeting point, then select Share this location.';
  }
  const address = form.querySelector('#location-address');
  address.addEventListener('input', reset);
  form.querySelector('[data-location-address]').addEventListener('click', () => {
    reset(); const venue = address.value.trim();
    if (!venue) { status.textContent = 'Enter a venue or full address first.'; address.focus(); return; }
    prepare(venue, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue));
  });
  current.addEventListener('click', () => {
    reset();
    if (!window.isSecureContext || !navigator.geolocation) { status.textContent = 'Current location needs HTTPS and browser location support. You can share a venue address instead.'; return; }
    const token = request;
    current.disabled = true; status.textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition((position) => {
      if (token !== request) return;
      current.disabled = false;
      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { status.textContent = 'Location unavailable. Enter a venue address instead.'; return; }
      prepare('Current location (' + latitude.toFixed(5) + ', ' + longitude.toFixed(5) + ')', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(latitude + ',' + longitude));
    }, (error) => {
      if (token !== request) return;
      current.disabled = false;
      status.textContent = error.code === 1 ? 'Location permission was denied. Enter a venue address instead.' : 'Your location could not be found. Try again or enter a venue address.';
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });
  form.querySelector('[data-location-send]').addEventListener('click', () => {
    if (!pending) return;
    const card = document.createElement('a'); card.className = 'chat-location-card'; card.href = pending.url; card.target = '_blank'; card.rel = 'noopener noreferrer';
    const title = document.createElement('strong'); title.textContent = 'Shared location';
    const venue = document.createElement('span'); venue.textContent = pending.title;
    const hint = document.createElement('span'); hint.textContent = 'Open in Maps';
    card.append(title, venue, hint); append(card);
    reset(); panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus();
  });
})();
