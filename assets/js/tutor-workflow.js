(() => {
  const key = 'tmq-booking-TMQ-1024';
  let state = {};
  try { state = JSON.parse(sessionStorage.getItem(key) || '{}') || {}; } catch { state = {}; }
  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const show = (selector, visible) => all(selector).forEach((el) => { el.hidden = !visible; });
  const text = (selector, value) => all(selector).forEach((el) => { el.textContent = value; });
  function save(patch, form) {
    const next = { ...state, ...patch };
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      state = next;
      document.dispatchEvent(new Event('booking:updated'));
      return true;
    } catch {
      const error = form?.querySelector('[data-workflow-error]') || document.querySelector('[data-workflow-error]');
      if (error) error.textContent = 'The change could not be saved on this device. Please try again.';
      return false;
    }
  }
  const receipt = state.receipt;
  const hasReceipt = !!(receipt && /^data:(image\/(png|jpeg)|application\/pdf);base64,/.test(receipt.data || ''));
  const confirmed = hasReceipt && state.paymentReceived === true;
  function render() {
    text('[data-booking-status]', state.decision === 'accepted' ? 'Accepted' : state.decision === 'rejected' ? 'Rejected' : 'Awaiting tutor decision');
    show('[data-booking-decision]', !state.decision);
    show('[data-booking-accepted]', state.decision === 'accepted');
    show('[data-booking-rejected], [data-rejected-list]', state.decision === 'rejected');
    text('[data-booking-reason]', state.reason || 'No rejection has been recorded.');
    if (state.decision === 'rejected') {
      text('[data-rejection-title]', 'Booking rejected');
      const row = document.querySelector('#pending [data-booking-status]')?.closest('article');
      if (row) row.hidden = true;
    }
    text('[data-tutor-completion]', state.tutorCompleted ? 'Tutor confirmed completion.' : 'Waiting for the tutor to confirm completion.');
    text('[data-student-completion]', state.studentCompleted ? 'Student confirmed completion.' : 'Waiting for the student to confirm completion.');
    show('[data-payment-received-row]', confirmed);
    show('[data-payment-received-empty]', !confirmed);
    show('[data-payment-pending-row]', !confirmed);
    show('[data-payment-pending-empty]', confirmed);
    text('[data-receipt-status]', hasReceipt ? 'Receipt uploaded. Check the transfer before confirming.' : "Awaiting the student's receipt.");
    show('[data-receipt-present]', hasReceipt);
    show('[data-receipt-empty]', !hasReceipt);
    if (hasReceipt) {
      text('[data-receipt-name]', receipt.name);
      text('[data-receipt-amount]', `RM ${Number(receipt.amount).toFixed(2)}`);
      text('[data-receipt-date]', receipt.date);
      all('[data-receipt-download]').forEach((a) => { a.href = receipt.data; a.download = receipt.name; });
      if (receipt.data.startsWith('data:image/')) {
        all('[data-receipt-image]').forEach((image) => { image.src = receipt.data; image.hidden = false; });
      }
    }
    if (state.paymentIssue) {
      text('[data-payment-confirmation]', 'Issue reported · pending review');
      text('[data-receipt-status]', 'A payment issue is awaiting review.');
    }
    if (confirmed) {
      text('[data-payment-result-title]', 'Payment received');
      text('[data-payment-result-text]', 'Your acknowledgement is recorded. The payment is waiting for admin verification.');
      text('[data-payment-confirmation]', 'Received');
    }
    all('[data-payment-confirm] button[type="submit"]').forEach((button) => { button.disabled = !hasReceipt || confirmed; });
    if (!hasReceipt) text('[data-payment-confirm] [data-workflow-error]', 'A student receipt is required before confirming the payment.');
    if (confirmed) text('[data-payment-confirm] [data-workflow-error]', 'You have already acknowledged this payment.');
  }
  render();
  const bind = (selector, callback) => {
    const form = document.querySelector(selector);
    if (form) form.addEventListener('submit', (event) => { event.preventDefault(); if (form.reportValidity()) callback(form); });
  };
  bind('[data-booking-accept]', (form) => {
    if (state.decision) return;
    if (save({ decision: 'accepted', reason: '' }, form)) render();
  });
  bind('[data-booking-reject]', (form) => {
    const reason = form.elements.reason;
    if (!reason.value.trim()) { reason.setCustomValidity('Please give a reason for rejecting this booking.'); reason.reportValidity(); return; }
    if (!state.decision && save({ decision: 'rejected', reason: reason.value.trim() }, form)) location.assign('tutor-booking-rejected.html');
  });
  document.querySelector('[data-booking-reject] textarea')?.addEventListener('input', (event) => event.target.setCustomValidity(''));
  bind('[data-class-complete]', (form) => {
    if (state.decision !== 'accepted') { form.querySelector('[data-workflow-error]').textContent = 'Accept this booking before recording class completion.'; return; }
    if (save({ tutorCompleted: true }, form)) location.assign('tutor-booking-completed.html');
  });
  bind('[data-student-class-complete]', (form) => {
    if (state.decision !== 'accepted') { form.querySelector('[data-workflow-error]').textContent = 'Wait for your tutor to accept the booking before completing the class.'; return; }
    if (save({ studentCompleted: true }, form)) location.assign('student-booking-completed.html');
  });
  bind('[data-payment-confirm]', (form) => {
    if (!hasReceipt || confirmed || !form.elements.receiptChecked.checked) return;
    if (Number(receipt.amount) !== 40) { form.querySelector('[data-workflow-error]').textContent = 'The uploaded amount does not match RM 40.00. Report a payment issue before confirming.'; return; }
    if (save({ paymentReceived: true, paymentIssue: null, acknowledgedAt: new Date().toISOString() }, form)) location.assign('tutor-payment-received.html');
  });
  bind('[data-payment-issue]', (form) => {
    const explanation = form.elements.tutorPaymentRemark.value.trim();
    if (!explanation) { form.querySelector('[data-workflow-error]').textContent = 'Please explain the payment issue.'; return; }
    if (save({ paymentIssue: { type: form.elements.tutorPaymentIssue.value, explanation }, paymentReceived: false }, form)) location.assign('tutor-payment-view.html');
  });
  bind('[data-student-receipt]', (form) => {
    const error = form.querySelector('[data-workflow-error]');
    if (state.decision === 'rejected') { error.textContent = 'This booking was rejected. No payment is due.'; return; }
    if (!state.tutorCompleted || !state.studentCompleted) { error.textContent = 'Both participants must confirm that the class took place before uploading payment.'; return; }
    const file = form.elements.payReceipt.files[0];
    if (!file || !['image/png', 'image/jpeg', 'application/pdf'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      error.textContent = 'Choose a PDF, JPG or PNG receipt up to 2 MB.'; return;
    }
    const reader = new FileReader();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    reader.onerror = () => { error.textContent = 'The receipt could not be read. Please choose it again.'; submit.disabled = false; };
    reader.onload = () => {
      const entry = {name:file.name, data:reader.result, amount:Number(form.elements.payAmount.value), date:form.elements.payDate.value};
      if (save({receipt:entry, paymentReceived:false, paymentIssue:null}, form)) location.assign('student-payment-view.html');
      submit.disabled = false;
    };
    reader.readAsDataURL(file);
  });
})();
