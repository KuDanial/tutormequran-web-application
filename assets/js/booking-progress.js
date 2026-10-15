/* PHP migration: render data-progress-status and the matching ordered list on the server.
   Only explicitly marked local bookings read the static prototype's session state. */
(() => {
  const labels = ['Booking', 'Arrange', 'Class', 'Payment', 'Verified'];
  const stages = {
    requested: [0, 'Waiting for tutor acceptance'],
    accepted: [1, 'Booking accepted · arrange your class'],
    session: [2, 'Waiting for both participants to confirm class completion'],
    completed: [3, 'Class completed · payment due'],
    receipt: [3, 'Receipt uploaded · waiting for tutor confirmation'],
    received: [3, 'Payment received · waiting for admin verification'],
    issue: [3, 'Payment issue · review required'],
    verified: [5, 'Payment verified · booking closed'],
    rejected: [0, 'Booking rejected · no payment due'],
    cancelled: [0, 'Booking cancelled']
  };
  function statusFor(state) {
    if (state.decision === 'rejected' || state.decision === 'cancelled') return state.decision;
    if (state.decision !== 'accepted') return 'requested';
    if (state.paymentIssue) return 'issue';
    const receipt = /^data:(image\/(png|jpeg)|application\/pdf);base64,/.test(state.receipt?.data || '');
    if (receipt && state.paymentReceived) return 'received';
    if (receipt) return 'receipt';
    if (state.studentCompleted && state.tutorCompleted) return 'completed';
    if (state.studentCompleted || state.tutorCompleted) return 'session';
    return 'accepted';
  }
  function refresh() {
    document.querySelectorAll('[data-progress-status]').forEach((root) => {
      // Static step pages illustrate that process; opening them never writes booking state.
      if (root.dataset.progressSource === 'page') return;
      let status = root.dataset.progressStatus;
      if (root.dataset.progressSource === 'session') {
        try { status = statusFor(JSON.parse(sessionStorage.getItem('tmq-booking-' + root.dataset.progressBooking) || '{}') || {}); } catch { /* Keep server-rendered fallback. */ }
      }
      const [step, caption] = stages[status] || stages.requested;
      const stopped = status === 'rejected' || status === 'cancelled';
      root.dataset.progressStatus = status;
      root.querySelectorAll('.booking-journey li').forEach((item, index) => {
        item.className = stopped ? (index === 0 ? 'stopped' : '') : index < step ? 'done' : index === step ? 'current' : '';
        item.removeAttribute('aria-current');
        if (!stopped && index === step) item.setAttribute('aria-current', 'step');
        item.querySelector('.booking-step-dot').textContent = stopped && index === 0 ? '!' : index < step && !stopped ? '✓' : String(index + 1);
        item.querySelector('.booking-step').setAttribute('aria-label', labels[index] + ': ' + (stopped ? 'stopped' : index < step ? 'complete' : index === step ? 'current stage' : 'upcoming stage'));
      });
      root.querySelector('.booking-current-label').textContent = caption;
    });
  }
  document.addEventListener('booking:updated', refresh);
  refresh();
})();
