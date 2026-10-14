(() => {
  const key = 'tmq-demo-tutor-TU-001-duitnow-qr';
  const form = document.querySelector('[data-duitnow-upload]');
  const status = document.querySelector('[data-duitnow-status]');
  const images = document.querySelectorAll('[data-duitnow-image]');

  function showQr(data) {
    if (!/^data:image\/(png|jpeg);base64,/.test(data || '')) return;
    images.forEach((image) => { image.src = data; image.hidden = false; });
    document.querySelectorAll('[data-duitnow-empty], [data-duitnow-missing]').forEach((el) => { el.hidden = true; });
    const actions = document.querySelector('[data-duitnow-actions]');
    if (actions) actions.hidden = false;
    const download = document.querySelector('[data-duitnow-download]');
    if (download) {
      download.href = data;
      download.download = `tutor-TU-001-duitnow-qr.${data.startsWith('data:image/png;') ? 'png' : 'jpg'}`;
    }
    const open = document.querySelector('[data-duitnow-open]');
    if (open) {
      // A blob URL allows opening the original image in a new tab.
      const [header, encoded] = data.split(',');
      const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
      open.href = URL.createObjectURL(new Blob([bytes], { type: header.slice(5, header.indexOf(';')) }));
    }
  }

  try { showQr(sessionStorage.getItem(key)); } catch {
    if (status) status.textContent = 'Browser storage is unavailable. The QR cannot be shared with the payment preview.';
  }

  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const file = form.querySelector('input[type="file"]').files[0];
    if (!file || !['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      status.textContent = 'Choose a JPG or PNG image up to 2 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => { status.textContent = 'The image could not be read. Please choose it again.'; };
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => { status.textContent = 'This file is not a readable image. Please choose a JPG or PNG.'; };
      image.onload = () => {
        try {
          sessionStorage.setItem(key, reader.result);
          showQr(reader.result);
          status.textContent = 'QR saved for this demo tab. Open the student payment preview to see it.';
        } catch {
          status.textContent = 'The QR could not be saved in this browser. Try a smaller image or allow browser storage.';
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
})();
