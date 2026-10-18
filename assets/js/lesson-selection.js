(() => {
  const form = document.querySelector('[data-lesson-selection]');
  if (!form) return;
  const slots = Array.from(form.querySelectorAll('input[name="slotId"]'));
  const message = form.querySelector('[data-slot-message]');
  const requested = new URLSearchParams(location.search).get('slot');
  const available = slots.filter((slot) => !slot.disabled);
  const selected = available.find((slot) => slot.value === requested);
  if (selected) selected.checked = true;
  else if (requested) message.textContent = 'That lesson is unavailable. Please choose an available slot below.';

  function update() {
    available.forEach((slot) => {
      slot.closest('.slot-btn').querySelector('[data-slot-label]').textContent = slot.checked ? 'Selected' : 'Available';
    });
  }
  form.addEventListener('change', (event) => {
    if (event.target.name === 'slotId') { message.textContent = ''; update(); }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!available.some((slot) => slot.checked)) {
      message.textContent = 'Choose an available lesson before continuing.';
      return;
    }
    // Existing static destination; PHP must create a booking from an authorized,
    // still-available slot ID and derive its date/time from the tutor's record.
    location.assign('student-booking-view.html');
  });
  update();
})();
