(() => {
  const root = document.querySelector('[data-lesson-weeks]');
  if (!root) return;
  const api = window.LessonSlots;
  const form = root.querySelector('[data-lesson-selection]');
  const options = root.querySelector('.slot-options');
  const message = root.querySelector('[data-slot-message]');
  const requested = new URLSearchParams(location.search).get('slot');
  let slots;
  try { slots = api.read(); } catch { message.textContent = 'Availability could not be loaded. Please enable browser storage and reload.'; options.replaceChildren(); return; }
  const monday = (value) => { const date = api.date(value); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); return date; };
  const firstWeek = monday(api.today());
  let week = monday(slots.find((slot) => slot.id === requested && slot.date >= api.today())?.date || api.today());
  let selection = '';
  const available = (slot) => slot.status === 'Available' && slot.date >= api.today() && api.valid(slot);
  function updateSummary() {
    if (!form) return;
    const slot = slots.find((entry) => entry.id === selection && available(entry));
    document.querySelector('[data-selected-duration]').textContent = slot ? api.durationLabel(slot) : 'Choose a lesson';
    document.querySelector('[data-selected-fee]').textContent = slot ? `RM ${(Number(form.dataset.hourlyRate) * api.duration(slot) / 60).toFixed(2)}` : 'Calculated from your selected duration';
  }
  function render() {
    const end = new Date(week); end.setUTCDate(end.getUTCDate() + 6);
    root.querySelector('[data-week-label]').textContent = `${api.label(api.day(week))} - ${api.label(api.day(end))}`;
    root.querySelector('[data-week-prev]').disabled = +week <= +firstWeek;
    options.replaceChildren();
    const visible = slots.filter((slot) => slot.date >= api.day(week) && slot.date <= api.day(end));
    visible.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).forEach((slot) => {
      const usable = available(slot);
      const item = document.createElement(form ? 'label' : usable ? 'a' : 'button');
      item.className = 'slot-btn lesson-slot-option' + (usable ? '' : ' booked');
      if (!form) { if (usable) item.href = 'student/student-booking-addNew.html?slot=' + encodeURIComponent(slot.id); else { item.type = 'button'; item.disabled = true; } }
      if (form) {
        const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'slotId'; radio.value = slot.id; radio.required = true; radio.disabled = !usable; radio.checked = selection === slot.id;
        item.append(radio);
      }
      [api.label(slot.date), api.range(slot), api.durationLabel(slot)].forEach((value, index) => {
        const span = document.createElement('span'); span.className = ['slot-day', 'slot-time', 'slot-duration'][index]; span.textContent = value; item.append(span);
      });
      const modes = document.createElement('span'); modes.className = 'slot-modes';
      (slot.mode === 'Both' ? ['Online', 'Physical'] : [slot.mode]).forEach((mode) => {
        const badge = document.createElement('span'); badge.className = 'slot-mode';
        const icon = document.createElement('i'); icon.className = mode === 'Online' ? 'fas fa-video' : 'fas fa-map-marker-alt'; icon.setAttribute('aria-hidden', 'true');
        badge.append(icon, mode === 'Physical' ? 'In person' : 'Online'); modes.append(badge);
      });
      const status = document.createElement('span'); status.className = 'slot-status-badge' + (usable ? ' vacant' : '');
      status.textContent = usable ? (selection === slot.id ? 'Selected' : 'Available') : slot.date < api.today() ? 'Past' : slot.status;
      item.append(modes, status);
      options.append(item);
    });
    if (!visible.length) { const empty = document.createElement('p'); empty.className = 'lesson-empty'; empty.textContent = 'No lessons planned for this week. Try another week.'; options.append(empty); }
    updateSummary();
  }
  ['prev', 'next'].forEach((direction) => root.querySelector(`[data-week-${direction}]`).addEventListener('click', () => {
    week.setUTCDate(week.getUTCDate() + (direction === 'next' ? 7 : -7)); selection = ''; message.textContent = 'Choose a lesson in this week.'; render();
  }));
  if (requested && slots.some((slot) => slot.id === requested && available(slot))) selection = requested;
  else if (requested) message.textContent = 'That lesson is unavailable. Please choose another slot.';
  form?.addEventListener('change', (event) => {
    if (event.target.name !== 'slotId') return;
    selection = event.target.value; message.textContent = '';
    const slot = slots.find((entry) => entry.id === selection);
    if (!slot) return;
    const mode = form.elements.classType;
    Array.from(mode.options).forEach((option) => { option.disabled = slot.mode !== 'Both' && option.value !== slot.mode; });
    if (slot.mode !== 'Both') mode.value = slot.mode;
    updateSummary();
    options.querySelectorAll('label').forEach((label) => { if (!label.querySelector('input').disabled) label.lastElementChild.textContent = label.querySelector('input').checked ? 'Selected' : 'Available'; });
  });
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    try {
      const slot = api.read().find((entry) => entry.id === form.elements.slotId?.value);
      if (!slot || !available(slot) || slot.date < api.day(week) || slot.date > api.day(new Date(+week + 6 * 86400000))) throw new Error('This lesson is unavailable. Please choose another slot.');
      if (slot.mode !== 'Both' && slot.mode !== form.elements.classType.value) throw new Error('Choose the class option offered for this slot.');
      location.assign('student-booking-view.html');
    } catch (failure) { message.textContent = failure.message; }
  });
  render();
  if (selection && form) form.querySelector('input:checked').dispatchEvent(new Event('change', { bubbles: true }));
})();
