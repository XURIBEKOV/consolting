// Head'dagi zaxira (failsafe) taymeriga: skript ishga tushdi, animatsiyalar yoqilgan bo'lib qolsin
window.__yolchiReady = true;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Skrolldagi paydo bo'lish animatsiyasi ----------
(function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');

  // Guruh ichidagi elementlar ketma-ket (stagger) chiqadi
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
      el.style.setProperty('--i', i);
    });
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  items.forEach((el) => observer.observe(el));
})();

// ---------- Raqamlar sanash animatsiyasi (260+, 91%, ...) ----------
(function initCounters() {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  const pattern = /^(\D*)(\d+(?:[.,]\d+)?)(\D*)$/;
  const counters = [];

  document.querySelectorAll('.hero-stats dt, .about-stats dt, .results-grid dt').forEach((el) => {
    const original = el.textContent.trim();
    const match = original.match(pattern);
    if (!match) return;
    counters.push({ el, original, prefix: match[1], target: parseFloat(match[2].replace(',', '.')), suffix: match[3] });
  });

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  function run(counter) {
    const duration = 1800;
    const start = performance.now();

    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(counter.target * easeOutExpo(progress));
      counter.el.textContent = counter.prefix + value + counter.suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        counter.el.textContent = counter.original; // oxirida aniq asl matn
      }
    }
    requestAnimationFrame(frame);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const counter = counters.find((c) => c.el === entry.target);
      observer.unobserve(entry.target);
      if (counter) run(counter);
    });
  }, { threshold: 0.6 });

  counters.forEach((counter) => {
    counter.el.textContent = counter.prefix + '0' + counter.suffix;
    observer.observe(counter.el);
  });
})();

// ---------- Header, skroll progress, "yuqoriga" tugmasi ----------
(function initScrollUi() {
  const header = document.querySelector('.site-header');
  const bar = document.getElementById('scrollProgress');
  const toTop = document.getElementById('toTop');
  let ticking = false;

  function update() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Menyuda joriy bo'limni belgilash ----------
(function initScrollSpy() {
  if (!('IntersectionObserver' in window)) return;
  const links = document.querySelectorAll('.main-nav a[href^="#"]');
  const byId = new Map();
  links.forEach((link) => byId.set(link.getAttribute('href').slice(1), link));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => l.classList.remove('is-active'));
      const active = byId.get(entry.target.id);
      if (active) active.classList.add('is-active');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
})();

// ---------- Kartalarda kursor ortidan yuruvchi yorug'lik ----------
(function initSpotlight() {
  if (!canHover) return;
  document.querySelectorAll('.service-card, .review-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (event.clientY - rect.top) + 'px');
    });
  });
})();

// ---------- Hero rasmi: kursorga qarab yengil qiyalik ----------
(function initTilt() {
  if (!canHover || prefersReducedMotion) return;
  const visual = document.querySelector('.hero-visual');
  const frame = visual && visual.querySelector('.hero-frame');
  if (!frame) return;

  visual.addEventListener('pointermove', (event) => {
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    frame.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
    frame.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
  });
  visual.addEventListener('pointerleave', () => {
    frame.style.setProperty('--ry', '0deg');
    frame.style.setProperty('--rx', '0deg');
  });
})();

// ---------- "Biz haqimizda" rasm slayderi ----------
(function initAboutSlider() {
  const slider = document.getElementById('aboutSlider');
  if (!slider) return;
  const slides = slider.querySelectorAll('.fade-slide');
  if (slides.length < 2) return;

  const DURATION = 3500;
  let current = 0;
  let timer = null;
  let remaining = DURATION;
  let startedAt = 0;

  slider.style.setProperty('--slide-ms', DURATION + 'ms');

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'slider-dots';
  const dots = Array.from(slides).map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot';
    dot.setAttribute('aria-label', (i + 1) + '-rasmni ko\'rsatish');
    dot.addEventListener('click', () => {
      show(i);
      if (!slider.classList.contains('is-paused')) schedule();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });
  slider.appendChild(dotsWrap);

  function show(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
    remaining = DURATION;
  }

  function schedule() {
    clearTimeout(timer);
    startedAt = Date.now();
    timer = setTimeout(() => { show(current + 1); schedule(); }, remaining);
  }

  function pause() {
    if (slider.classList.contains('is-paused')) return;
    slider.classList.add('is-paused');
    clearTimeout(timer);
    remaining = Math.max(remaining - (Date.now() - startedAt), 0);
  }

  function resume() {
    if (!slider.classList.contains('is-paused')) return;
    slider.classList.remove('is-paused');
    schedule();
  }

  slider.addEventListener('mouseenter', pause);
  slider.addEventListener('mouseleave', resume);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : resume()));

  show(0);
  schedule();
})();

// ---------- Mobile navigation toggle ----------
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

function setNavOpen(isOpen) {
  mainNav.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

navToggle.addEventListener('click', () => {
  setNavOpen(!mainNav.classList.contains('open'));
});

// Close the mobile menu after a link is clicked
mainNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

// Escape bosilganda yoki menyudan tashqariga bosilganda yopiladi
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setNavOpen(false);
});
document.addEventListener('click', (event) => {
  if (!mainNav.contains(event.target) && !navToggle.contains(event.target)) setNavOpen(false);
});

// ---------- Mamlakat tanlash (pill tugmalar) ----------
const countryPills = document.getElementById('countryPills');
const countryInput = document.getElementById('country');

countryPills.querySelectorAll('.pill').forEach((pill) => {
  pill.setAttribute('aria-pressed', 'false');
  pill.addEventListener('click', () => {
    countryPills.querySelectorAll('.pill').forEach((p) => {
      p.classList.remove('active');
      p.setAttribute('aria-pressed', 'false');
    });
    pill.classList.add('active');
    pill.setAttribute('aria-pressed', 'true');
    countryInput.value = pill.dataset.value;
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
    `🎂 Yosh: ${data.age || '-'}\n` +
    `📞 Telefon: ${data.phone}\n` +
    `✈️ Telegram: ${data.telegram || '-'}\n` +
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
      age: document.getElementById('age').value,
      phone: phoneInput.value.trim(),
      telegram: document.getElementById('telegram').value.trim(),
      country: document.getElementById('country').value,
      message: document.getElementById('message').value.trim()
    });

    formSuccess.hidden = false;
    form.reset();
    countryPills.querySelectorAll('.pill').forEach((p) => {
      p.classList.remove('active');
      p.setAttribute('aria-pressed', 'false');
    });
    countryInput.value = '';
    setTimeout(() => { formSuccess.hidden = true; }, 5000);
  } catch (err) {
    phoneError.textContent = '';
    nameError.textContent = "Yuborishda xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Yuborish';
  }
});
