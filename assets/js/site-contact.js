(() => {
  const whatsappUrl = 'https://api.whatsapp.com/send/?phone=60162624834&text=' + encodeURIComponent('hi TutorMeQuran. i need more info about this booking quran tutor platform');
  const navbar = document.querySelector('.navbar');
  if (navbar && !document.querySelector('.site-header')) {
    const header = document.createElement('header');
    header.className = 'site-header';
    const contact = document.createElement('div');
    contact.className = 'site-contact-bar';
    contact.innerHTML = `<div class="container site-contact-inner">
      <div class="site-contact-links">
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp" aria-hidden="true"></i><span>+60 162624834</span></a>
        <a href="mailto:support@tutormequran.com.my"><i class="fas fa-envelope" aria-hidden="true"></i><span>support@tutormequran.com.my</span></a>
      </div>
      <div class="site-contact-socials" aria-label="Social media">
        <span role="img" aria-label="Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i></span>
        <span role="img" aria-label="YouTube"><i class="fab fa-youtube" aria-hidden="true"></i></span>
        <span role="img" aria-label="Instagram"><i class="fab fa-instagram" aria-hidden="true"></i></span>
      </div>
    </div>`;
    navbar.before(header);
    header.append(contact, navbar);
  }
  if (!document.querySelector('.joinchat')) {
    const chat = document.createElement('a');
    chat.className = 'joinchat joinchat--right joinchat--btn';
    chat.href = whatsappUrl;
    chat.target = '_blank';
    chat.rel = 'noopener noreferrer';
    chat.setAttribute('aria-label', 'Chat with TutorMeQuran on WhatsApp (opens in a new tab)');
    chat.title = 'Chat on WhatsApp';
    chat.innerHTML = '<i class="fab fa-whatsapp" aria-hidden="true"></i>';
    document.body.append(chat);
  }
})();
