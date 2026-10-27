/* Local prototype. The future API must repeat validation and authorize ownership. */
(() => {
  const key = 'tmq-availability-v1';
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const date = (value) => new Date(value + 'T00:00:00Z');
  const day = (value) => value.toISOString().slice(0, 10);
  const hour = (value) => Number(value.slice(0, 2));
  // Existing v1 records have no duration; only their original one-hour blocks migrate.
  const duration = (slot) => slot.durationMinutes ?? ((hour(slot.end) - hour(slot.start) + 24) % 24 === 1 ? 60 : NaN);
  const endTime = (start, minutes) => String((hour(start) + minutes / 60) % 24).padStart(2, '0') + ':00';
  const durationLabel = (slot) => `${duration(slot) / 60} ${duration(slot) === 60 ? 'hour' : 'hours'}`;
  const overnight = (slot) => hour(slot.start) + duration(slot) / 60 >= 24;
  const startAt = (slot) => +date(slot.date) + hour(slot.start) * 3600000;
  const overlaps = (a, b) => startAt(a) < startAt(b) + duration(b) * 60000 && startAt(b) < startAt(a) + duration(a) * 60000;
  function valid(slot) {
    if (!slot || !/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !Number.isFinite(+date(slot.date)) || day(date(slot.date)) !== slot.date) return false;
    if (!/^(0\d|1\d|2[0-3]):00$/.test(slot.start) || !/^(0\d|1\d|2[0-3]):00$/.test(slot.end)) return false;
    const minutes = duration(slot);
    return Number.isInteger(minutes) && minutes >= 60 && minutes <= 1440 && minutes % 60 === 0 && slot.end === endTime(slot.start, minutes) && ['Online', 'Physical', 'Both'].includes(slot.mode) && ['Available', 'Unavailable', 'Booked'].includes(slot.status);
  }
  const id = (slot) => 'TU-001-' + slot.date.replaceAll('-', '') + '-' + slot.start.replace(':', '');
  const samples = ['2026-10-21', '2026-10-28', '2026-11-04'].flatMap((date) => [20, 21].map((hour) => ({ date, start: hour + ':00', end: (hour + 1) + ':00', mode: 'Both', status: hour === 20 ? 'Available' : 'Booked' })));
  function read() {
    const raw = localStorage.getItem(key);
    const slots = raw === null ? samples : JSON.parse(raw);
    if (!Array.isArray(slots)) throw new Error('Invalid availability data.');
    return slots.filter(valid).map((slot) => ({ ...slot, durationMinutes: duration(slot), id: id(slot) }));
  }
  function save(slot, previousId) {
    if (!valid(slot) || slot.date < today() || slot.status === 'Booked') throw new Error('Choose today or a future date and a duration of 1 to 24 whole hours with a matching end time.');
    const slots = read();
    const previous = slots.find((entry) => entry.id === previousId);
    if (previousId && (!previous || previous.status === 'Booked')) throw new Error('This slot cannot be edited.');
    if (slots.some((entry) => entry.id !== previousId && overlaps(entry, slot))) throw new Error('This lesson overlaps an existing slot. Choose another time or edit that slot.');
    localStorage.setItem(key, JSON.stringify([...slots.filter((entry) => entry.id !== previousId), { ...slot, durationMinutes: duration(slot), id: id(slot) }]));
  }
  const time = (value) => `${Number(value.slice(0, 2)) % 12 || 12}:00 ${Number(value.slice(0, 2)) < 12 ? 'AM' : 'PM'}`;
  const range = (slot) => `${time(slot.start)} – ${time(slot.end)}${overnight(slot) ? ' (next day)' : ''}`;
  const label = (value) => new Intl.DateTimeFormat('en-MY', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(date(value));
  window.LessonSlots = { today, date, day, valid, id, read, save, time, range, label, duration, durationLabel, endTime, overnight, overlaps };
})();
