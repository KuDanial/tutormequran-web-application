(() => {
  const form = document.querySelector('[data-booking-chat]');
  if (!form) return;
  const input = form.querySelector('textarea');
  const messages = document.querySelector('[data-booking-messages]');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity('Write a message before previewing it.');
      input.reportValidity();
      return;
    }
    const message = document.createElement('div');
    message.className = 'portal-message';
    const author = document.createElement('strong');
    author.textContent = form.dataset.author || 'You · Student';
    const body = document.createElement('p');
    body.textContent = text;
    const status = document.createElement('small');
    status.textContent = 'Local preview · not sent';
    message.append(author, body, status);
    messages.append(message);
    input.value = '';
    input.focus({ preventScroll: true });
  });

  input.addEventListener('input', () => input.setCustomValidity(''));
})();
