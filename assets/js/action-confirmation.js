/* Declarative confirmations. Existing handlers run only after confirmation.
   PHP endpoints must still validate authorization, CSRF and the booking state. */
(() => {
  function confirmAction(control) {
    return window.confirm(control.dataset.confirm);
  }
  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-confirm]');
    if (!control || control.disabled) return;
    // Submit events also cover pressing Enter and requestSubmit().
    if (control.tagName === 'BUTTON' && control.type === 'submit' && control.form) return;
    if (!confirmAction(control)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('submit', (event) => {
    const control = event.submitter?.matches('[data-confirm]') ? event.submitter : event.target.querySelector('[type="submit"][data-confirm]');
    if (!control) return;
    if (!confirmAction(control)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
})();
