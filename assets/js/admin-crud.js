(() => {
  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-delete-row]');
    if (!control) return;
    event.preventDefault();
    const row = control.closest('tr');
    if (!row) return;
    row.remove();
    const table = document.querySelector('.portal-table');
    if (table && !table.querySelector('tbody tr')) {
      const empty = document.createElement('p');
      empty.className = 'field-help admin-empty-state';
      empty.textContent = 'No records remain in this view.';
      table.closest('.portal-table-wrap')?.append(empty);
    }
  });
})();
