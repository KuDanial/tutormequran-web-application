(() => {
  const api = window.LessonSlots;
  const form = document.querySelector('[data-availability-form]');
  const requested = new URLSearchParams(location.search).get('slot');
  const error = document.querySelector('[data-availability-message]');
  let slots;
  try { slots = api.read(); } catch { if (error) error.textContent = 'Availability could not be loaded. Please enable browser storage and reload.'; return; }
  if (form) {
    const fields = form.elements;
    const editing = form.dataset.edit === 'true';
    const existing = slots.find((slot) => slot.id === requested);
    fields.availabilityDate.min = api.today();
    for (let hour = 0; hour < 24; hour++) {
      const start = String(hour).padStart(2, '0') + ':00';
      fields.startTime.add(new Option(api.time(start), start));
    }
    for (let hours = 1; hours <= 24; hours++) fields.durationMinutes.add(new Option(`${hours} ${hours === 1 ? 'hour' : 'hours'}`, String(hours * 60)));
    if (editing && (!existing || existing.status === 'Booked')) {
      error.textContent = 'Choose an editable slot from My Availability first.';
      form.querySelector('button[type="submit"]').disabled = true;
      return;
    }
    fields.availabilityDate.value = existing?.date || api.today();
    fields.startTime.value = existing?.start || '13:00';
    fields.durationMinutes.value = String(existing ? api.duration(existing) : 60);
    fields.classType.value = existing?.mode || 'Online';
    fields.availabilityStatus.value = existing?.status || 'Available';
    function update() {
      const start = fields.startTime.value;
      const durationMinutes = Number(fields.durationMinutes.value);
      fields.endTime.value = api.endTime(start, durationMinutes);
      const slot = { start, end: fields.endTime.value, durationMinutes };
      form.querySelector('[data-slot-summary]').textContent = `${api.range(slot)} · ${api.durationLabel(slot)} · MYT`;
      error.textContent = '';
    }
    fields.startTime.addEventListener('change', update);
    fields.durationMinutes.addEventListener('change', update);
    update();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      try {
        api.save({ date: fields.availabilityDate.value, start: fields.startTime.value, end: fields.endTime.value, durationMinutes: Number(fields.durationMinutes.value), mode: fields.classType.value, status: fields.availabilityStatus.value }, editing ? requested : null);
        location.assign('tutor-availability.html');
      } catch (failure) { error.textContent = failure.message; }
    });
  }
  const table = document.querySelector('[data-availability-list]');
  if (table) {
    table.replaceChildren();
    slots.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).forEach((slot) => {
      const row = table.insertRow();
      [api.label(slot.date), api.time(slot.start), api.time(slot.end) + (api.overnight(slot) ? ' (+1 day)' : ''), api.durationLabel(slot), slot.mode === 'Both' ? 'Online / In person' : slot.mode === 'Physical' ? 'In person' : slot.mode, slot.status].forEach((value) => { row.insertCell().textContent = value; });
      const cell = row.insertCell();
      ['View', ...(slot.status !== 'Booked' ? ['Edit'] : [])].forEach((action) => {
        const link = document.createElement('a');
        link.className = 'btn btn-outline btn-sm'; link.textContent = action;
        link.href = `tutor-availability-${action.toLowerCase()}.html?slot=${encodeURIComponent(slot.id)}`;
        cell.append(link, ' ');
      });
    });
  }
  const detail = document.querySelector('[data-availability-detail]');
  if (detail) {
    const slot = slots.find((entry) => entry.id === requested);
    const edit = document.querySelector('[data-edit-slot]');
    if (!slot) { detail.textContent = 'Select a slot from My Availability to view its details.'; edit.hidden = true; return; }
    detail.querySelectorAll('dd').forEach((field, index) => { field.textContent = [api.label(slot.date), api.time(slot.start), api.time(slot.end) + (api.overnight(slot) ? ' (next day)' : ''), api.durationLabel(slot), slot.mode === 'Both' ? 'Online / In person' : slot.mode === 'Physical' ? 'In person' : slot.mode, slot.status][index]; });
    edit.href += '?slot=' + encodeURIComponent(slot.id); edit.hidden = slot.status === 'Booked';
  }
})();
