const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = (name) => fs.readFileSync(path.join(__dirname, '../assets/js/', name + '.js'), 'utf8');
function store() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
function setup() {
  const localStorage = store();
  const context = { window: {}, localStorage, Intl, Date };
  vm.runInNewContext(source('lesson-slots'), context);
  return { api: context.window.LessonSlots, localStorage };
}
const slot = { date: '2099-11-04', start: '13:00', end: '14:00', mode: 'Physical', status: 'Available' };
test('existing one-hour records remain valid, including midnight', () => {
  const { api } = setup();
  for (let hour = 0; hour < 24; hour++) assert.equal(api.valid({ ...slot, start: String(hour).padStart(2, '0') + ':00', end: String((hour + 1) % 24).padStart(2, '0') + ':00' }), true);
  assert.match(api.range({ start: '23:00', end: '00:00' }), /next day/);
});
test('rejects odd intervals, shifted hours, ambiguous legacy durations, invalid dates and modes', () => {
  const { api } = setup();
  for (const patch of [{ end: '14:15' }, { start: '13:15', end: '14:15' }, { end: '15:00' }, { end: '13:00' }, { end: '12:00' }, { end: '24:00' }, { start: '13:00:01' }, { date: '2099-02-30' }, { mode: 'Unknown' }]) {
    assert.equal(api.valid({ ...slot, ...patch }), false, JSON.stringify(patch));
    assert.throws(() => api.save({ ...slot, ...patch }));
  }
});
test('saves, reloads and edits slots; prevents duplicates', () => {
  const { api } = setup();
  api.save(slot);
  assert.ok(api.read().some((entry) => entry.id === api.id(slot)));
  assert.throws(() => api.save(slot), /overlaps/);
  api.save({ ...slot, start: '14:00', end: '15:00' }, api.id(slot));
  assert.equal(api.read().some((entry) => entry.id === api.id(slot)), false);
});
test('supports every whole-hour duration from 1 to 24 hours at every start hour', () => {
  const { api } = setup();
  for (let start = 0; start < 24; start++) {
    for (let hours = 1; hours <= 24; hours++) {
      const lesson = { ...slot, start: String(start).padStart(2, '0') + ':00', end: String((start + hours) % 24).padStart(2, '0') + ':00', durationMinutes: hours * 60 };
      assert.equal(api.valid(lesson), true);
      assert.equal(api.overnight(lesson), start + hours >= 24);
    }
  }
});
test('rejects tampered duration and end-time mismatches', () => {
  const { api } = setup();
  for (const minutes of [0, -60, 30, 90, 1500, '120', NaN, Infinity]) assert.equal(api.valid({ ...slot, durationMinutes: minutes }), false);
  assert.equal(api.valid({ ...slot, durationMinutes: 120 }), false);
});
test('persists longer lessons and prevents partial, enclosed and overnight overlaps', () => {
  const { api } = setup();
  const longer = { ...slot, start: '13:00', end: '16:00', durationMinutes: 180 };
  api.save(longer);
  assert.equal(api.read().find((entry) => entry.id === api.id(longer)).durationMinutes, 180);
  for (const [start, end, minutes] of [['12:00', '14:00', 120], ['14:00', '15:00', 60], ['12:00', '17:00', 300]]) assert.throws(() => api.save({ ...slot, start, end, durationMinutes: minutes }), /overlaps/);
  api.save({ ...slot, start: '16:00', end: '18:00', durationMinutes: 120 });
  api.save({ ...slot, start: '23:00', end: '02:00', durationMinutes: 180 });
  assert.throws(() => api.save({ ...slot, date: '2099-11-05', start: '01:00', end: '02:00' }), /overlaps/);
  api.save({ ...slot, date: '2099-11-05', start: '02:00', end: '03:00' });
});
test('protects booked slots and rejects past dates and missing edit targets', () => {
  const { api } = setup();
  const booked = api.read().find((entry) => entry.status === 'Booked');
  assert.throws(() => api.save(slot, booked.id), /cannot be edited/);
  assert.throws(() => api.save(slot, 'missing'), /cannot be edited/);
  assert.throws(() => api.save({ ...slot, date: '2000-01-01' }));
});
test('malformed saved intervals are not offered to students', () => {
  const { api, localStorage } = setup();
  localStorage.setItem('tmq-availability-v1', JSON.stringify([slot, { ...slot, end: '14:15' }]));
  assert.equal(api.read().length, 1);
});
test('storage errors propagate instead of reporting a successful save', () => {
  const { api, localStorage } = setup();
  localStorage.setItem = () => { throw new Error('Storage full'); };
  assert.throws(() => api.save(slot), /Storage full/);
});
function workflow(decision) {
  const sessionStorage = store();
  const key = 'tmq-booking-TMQ-1024';
  sessionStorage.setItem(key, JSON.stringify({ decision }));
  const elements = Object.fromEntries(['button', 'status', 'next', 'error'].map((name) => [name, {}]));
  const selectors = { '[data-arrangement-button]': elements.button, '[data-arrangement-status]': elements.status, '[data-arrangement-next]': elements.next, '[data-workflow-error]': elements.error };
  let submit;
  const form = { querySelector: (selector) => selectors[selector], addEventListener: (_, handler) => { submit = handler; }, reportValidity: () => true };
  const document = { querySelector: (selector) => selector === '[data-arrangement-complete]' ? form : null, querySelectorAll: (selector) => selector === '[data-arrangement-complete]' ? [form] : [], dispatchEvent: () => {} };
  vm.runInNewContext(source('tutor-workflow'), { document, sessionStorage, Event: class {} });
  return { submit: () => submit({ preventDefault() {} }), state: () => JSON.parse(sessionStorage.getItem(key)), elements };
}
test('arrangement completion requires acceptance and does not complete the class', () => {
  for (const decision of [undefined, 'rejected', 'cancelled']) {
    const flow = workflow(decision); flow.submit();
    assert.equal(flow.state().arrangementCompleted, undefined);
    assert.equal(flow.elements.button.disabled, true);
  }
  const flow = workflow('accepted'); flow.submit();
  assert.equal(flow.state().arrangementCompleted, true);
  assert.equal(flow.state().tutorCompleted, undefined);
  assert.equal(flow.state().studentCompleted, undefined);
  assert.equal(flow.elements.next.hidden, false);
  assert.equal(flow.elements.button.disabled, true);
});
