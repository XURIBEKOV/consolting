// ---------- Mobile navigation toggle ----------
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle.addEventListener('click', () => {
  const isOpen = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Close the mobile menu after a link is clicked
mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ---------- Contact form validation ----------
const form = document.getElementById('contactForm');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const nameError = document.getElementById('nameError');
const phoneError = document.getElementById('phoneError');
const formSuccess = document.getElementById('formSuccess');

// ---------- Telegram sozlamalari ----------
// 1) @BotFather orqali bot yarating va TOKEN oling
// 2) Botga /start yozing, keyin CHAT_ID ni oling (pastdagi izohga qarang)
const TELEGRAM_BOT_TOKEN = '8915035349:AAHTqSra74zW3fxlq3drKlCNJB2qlTzHrk0';
const TELEGRAM_CHAT_ID = '5656359114';

async function sendToTelegram(data) {
  const text =
    `📩 Yangi ariza — Yo'lchi\n\n` +
    `👤 Ism: ${data.name}\n` +
    `📞 Telefon: ${data.phone}\n` +
    `🌍 Mamlakat: ${data.country || 'Tanlanmagan'}\n` +
    `💬 Xabar: ${data.message || '-'}`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text
    })
  });

  if (!response.ok) {
    throw new Error('Telegramga yuborishda xatolik');
  }
}

// Simple O'zbekiston telefon raqami andozasi: +998 90 123 45 67 (bo'shliqlar ixtiyoriy)
const phonePattern = /^\+?998[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  let isValid = true;

  // Ism tekshiruvi
  if (nameInput.value.trim().length < 2) {
    nameError.textContent = "Ismingizni to'liq kiriting.";
    isValid = false;
  } else {
    nameError.textContent = '';
  }

  // Telefon tekshiruvi
  if (!phonePattern.test(phoneInput.value.trim())) {
    phoneError.textContent = "Telefon raqamni +998 90 123 45 67 ko'rinishida kiriting.";
    isValid = false;
  } else {
    phoneError.textContent = '';
  }

  if (!isValid) {
    formSuccess.hidden = true;
    return;
  }

  const submitBtn = form.querySelector('.form-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Yuborilmoqda...';

  try {
    await sendToTelegram({
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      country: document.getElementById('country').value,
      message: document.getElementById('message').value.trim()
    });

    formSuccess.hidden = false;
    form.reset();
    setTimeout(() => { formSuccess.hidden = true; }, 5000);
  } catch (err) {
    phoneError.textContent = '';
    nameError.textContent = "Yuborishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Yuborish';
  }
});
