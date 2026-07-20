/* Kaya Raízes Performance — main.js */

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');

hamburger?.addEventListener('click', () => {
  const open = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('nav--open', !open);
  document.body.style.overflow = open ? '' : 'hidden';
});

nav?.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.setAttribute('aria-expanded', 'false');
    nav.classList.remove('nav--open');
    document.body.style.overflow = '';
  });
});

/* ============================================================
   HEADER HIDE ON SCROLL DOWN
   ============================================================ */
let lastScroll = 0;
const header   = document.getElementById('header');

window.addEventListener('scroll', () => {
  const cur = window.scrollY;
  if (cur > lastScroll && cur > 200) {
    header.style.transform = 'translateY(-100%)';
  } else {
    header.style.transform = '';
  }
  lastScroll = cur;
}, { passive: true });

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
document.querySelectorAll('.faq-item__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const panelId  = btn.getAttribute('aria-controls');
    const panel    = document.getElementById(panelId);

    // Fechar todos
    document.querySelectorAll('.faq-item__q').forEach(b => b.setAttribute('aria-expanded', 'false'));
    document.querySelectorAll('.faq-item__a').forEach(p => { p.hidden = true; });

    // Abrir o clicado (se estava fechado)
    if (!expanded && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      track('faq_open', { faq_id: panelId });
    }
  });
});

/* ============================================================
   FORMULÁRIO
   ============================================================ */
const form        = document.getElementById('form-contato');
const formSuccess = document.getElementById('form-success');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Honeypot
  if (form.querySelector('[name="_hp"]')?.value) return;

  // Validação básica
  let valid = true;
  form.querySelectorAll('[required]').forEach(f => {
    f.classList.remove('error');
    if (!f.value.trim()) { f.classList.add('error'); valid = false; }
  });

  if (!valid) {
    form.querySelector('.error')?.focus();
    return;
  }

  const submitBtn      = form.querySelector('[type="submit"]');
  const originalLabel  = submitBtn.textContent;
  submitBtn.disabled   = true;
  submitBtn.textContent = 'Enviando...';

  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload._hp;

  try {
    /* TODO: substituir 'FORM_ENDPOINT_URL' pela URL real antes do lançamento.
       Opções: Formspree (https://formspree.io), Make webhook, EmailJS, etc. */
    const res = await fetch('FORM_ENDPOINT_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      form.hidden       = true;
      formSuccess.hidden = false;
      track('form_submit', {
        segmento:     payload.segmento,
        investimento: payload.investimento || 'nao_informado'
      });
    } else {
      throw new Error('Servidor retornou erro');
    }
  } catch {
    submitBtn.disabled   = false;
    submitBtn.textContent = originalLabel;
    alert('Ocorreu um erro ao enviar o formulário. Por favor, fale com a Kaya pelo WhatsApp.');
  }
});

/* Remove classe error ao digitar */
form?.addEventListener('input', e => {
  if (e.target.classList.contains('error') && e.target.value.trim()) {
    e.target.classList.remove('error');
  }
});

/* ============================================================
   RASTREAMENTO DE EVENTOS (GA4)
   ============================================================ */
function track(event, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', event, params);
  }
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    console.log('[KRP Track]', event, params);
  }
}

/* Cliques WhatsApp */
document.querySelectorAll('[data-track^="whatsapp"]').forEach(el => {
  el.addEventListener('click', () => {
    track('whatsapp_click', { position: el.dataset.track });
  });
});

/* Cliques nos serviços */
document.querySelectorAll('[data-track^="servico"]').forEach(el => {
  el.addEventListener('click', () => {
    track('servico_click', { servico: el.dataset.track });
  });
});

/* ============================================================
   SCROLL DEPTH
   ============================================================ */
const depths  = [25, 50, 75, 90];
const tracked = new Set();

window.addEventListener('scroll', () => {
  const pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
  depths.forEach(d => {
    if (pct >= d && !tracked.has(d)) {
      tracked.add(d);
      track('scroll_depth', { percent: d });
    }
  });
}, { passive: true });
