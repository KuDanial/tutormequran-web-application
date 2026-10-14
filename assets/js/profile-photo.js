(() => {
  const input = document.getElementById('x-profilePicture');
  if (!input) return;
  const photos = document.querySelectorAll('.profile-photo, .profile-menu-avatar img');
  const defaults = Array.from(photos, (photo) => photo.src);
  let previewUrl;

  input.addEventListener('change', () => {
    const file = input.files[0];
    input.setCustomValidity('');
    if (file && !['image/jpeg', 'image/png'].includes(file.type)) {
      input.setCustomValidity('Choose a JPG or PNG photo.');
      input.reportValidity();
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = file ? URL.createObjectURL(file) : null;
    photos.forEach((photo, index) => {
      photo.src = previewUrl || defaults[index];
    });
  });
})();
