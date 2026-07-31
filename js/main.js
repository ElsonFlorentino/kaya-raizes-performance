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
   FAQ ACCORDION — handler unificado (Motion override quando disponível)
   ============================================================ */
let motionAnimate = null;

document.querySelectorAll('.faq-item__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const panel    = document.getElementById(btn.getAttribute('aria-controls'));

    // Fecha todos os outros
    document.querySelectorAll('.faq-item__q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      const p = document.getElementById(b.getAttribute('aria-controls'));
      if (!p || p === panel) return;
      p.classList.remove('is-open');
      if (motionAnimate) {
        motionAnimate(p, { height: 0 }, { duration: 0.25, ease: [0.32, 0, 0.67, 0] });
      }
    });

    if (!expanded && panel) {
      btn.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      if (motionAnimate) {
        motionAnimate(panel, { height: 'auto' }, {
          type: 'spring', stiffness: 280, damping: 28
        });
      }
      track('faq_open', { faq_id: panel.id });
    } else if (expanded && panel) {
      panel.classList.remove('is-open');
      if (motionAnimate) {
        motionAnimate(panel, { height: 0 }, { duration: 0.25, ease: [0.32, 0, 0.67, 0] });
      }
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

  if (form.querySelector('[name="_hp"]')?.value) return;

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
    /* TODO: substituir 'FORM_ENDPOINT_URL' pela URL real antes do lançamento. */
    const res = await fetch('FORM_ENDPOINT_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      form.hidden        = true;
      formSuccess.hidden = false;
      formSuccess.focus();
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

document.querySelectorAll('[data-track^="whatsapp"]').forEach(el => {
  el.addEventListener('click', () => {
    track('whatsapp_click', { position: el.dataset.track });
  });
});

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

/* ============================================================
   MOTION — spring physics, scroll reveal, parallax, magnetic
   ============================================================ */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

async function initMotion() {
  try {
    const { animate, scroll, inView, stagger } = await import(
      'https://cdn.jsdelivr.net/npm/motion@latest/+esm'
    );

    // Habilita Motion no FAQ handler global
    motionAnimate = animate;

    if (reduced) return;

    /* ----- WORD REVEAL — H1 com spring physics ----- */
    const headline = document.querySelector('.hero__headline');
    if (headline) {
      headline.innerHTML = headline.textContent
        .split(' ')
        .map(w => `<span class="word-wrap"><span class="word">${w}</span></span>`)
        .join(' ');
      animate(headline.querySelectorAll('.word'), {
        opacity:   [0, 1],
        transform: ['translateY(110%)', 'translateY(0%)']
      }, {
        delay:     stagger(0.065, { start: 0.08 }),
        type:      'spring',
        stiffness: 220,
        damping:   28
      });
    }

    /* ----- HERO CASCADE — eyebrow, sub, ctas, tagline ----- */
    animate(
      document.querySelectorAll('.hero__eyebrow, .hero__sub, .hero__ctas, .hero__tagline'),
      { opacity: [0, 1], y: [16, 0] },
      {
        delay:     stagger(0.14, { start: 0.12 }),
        type:      'spring',
        stiffness: 150,
        damping:   22
      }
    );

    /* ----- SCROLL REVEAL helpers ----- */
    const hide = (els, axis = 'y') => els.forEach(el => {
      el.style.opacity   = '0';
      el.style.transform = axis === 'x' ? 'translateX(-28px)' : 'translateY(28px)';
    });

    /* Cards de problema — stagger em grupo */
    const problemCards = [...document.querySelectorAll('.card-problema')];
    hide(problemCards);
    if (problemCards.length) {
      inView(problemCards[0], () => {
        animate(problemCards, { opacity: [0, 1], y: [28, 0] }, {
          delay: stagger(0.08), type: 'spring', stiffness: 120, damping: 20
        });
      }, { amount: 0.15 });
    }

    /* Proposta */
    const proposta = document.querySelector('.proposta');
    if (proposta) {
      hide([proposta]);
      inView(proposta, () => {
        animate(proposta, { opacity: [0, 1], y: [28, 0] }, {
          type: 'spring', stiffness: 120, damping: 20
        });
      }, { amount: 0.2 });
    }

    /* Para quem cols — stagger */
    const paraQuemCols = [...document.querySelectorAll('.para-quem-col')];
    hide(paraQuemCols);
    if (paraQuemCols.length) {
      inView(paraQuemCols[0], () => {
        animate(paraQuemCols, { opacity: [0, 1], y: [28, 0] }, {
          delay: stagger(0.15), type: 'spring', stiffness: 130, damping: 22
        });
      }, { amount: 0.15 });
    }

    /* Sobre */
    ['.sobre__visual', '.sobre__text'].forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      hide([el]);
      inView(el, () => {
        animate(el, { opacity: [0, 1], y: [28, 0] }, {
          type: 'spring', stiffness: 120, damping: 20
        });
      }, { amount: 0.2 });
    });

    /* Serviço cards — stagger */
    const servicoCards = [...document.querySelectorAll('.servico-card')];
    hide(servicoCards);
    if (servicoCards.length) {
      inView(servicoCards[0], () => {
        animate(servicoCards, { opacity: [0, 1], y: [28, 0] }, {
          delay: stagger(0.1), type: 'spring', stiffness: 120, damping: 20
        });
      }, { amount: 0.1 });
    }

    /* Processo steps — slide da esquerda com stagger */
    const processoSteps = [...document.querySelectorAll('.processo-step')];
    hide(processoSteps, 'x');
    if (processoSteps.length) {
      inView(processoSteps[0], () => {
        animate(processoSteps, { opacity: [0, 1], x: [-28, 0] }, {
          delay: stagger(0.12), type: 'spring', stiffness: 150, damping: 22
        });
      }, { amount: 0.1 });
    }

    /* ----- HOVER SPRING — serviço cards ----- */
    servicoCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        animate(card, { y: -6 }, { type: 'spring', stiffness: 380, damping: 22 });
      });
      card.addEventListener('mouseleave', () => {
        animate(card, { y: 0  }, { type: 'spring', stiffness: 320, damping: 28 });
      });
    });

    /* ----- MAGNETIC BUTTONS — desktop ----- */
    if (window.innerWidth >= 900) {
      document.querySelectorAll('.btn--primary, .btn--whatsapp').forEach(btn => {
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width  / 2) * 0.22;
          const y = (e.clientY - r.top  - r.height / 2) * 0.22;
          animate(btn, { x, y }, { type: 'spring', stiffness: 600, damping: 28, duration: 0 });
        });
        btn.addEventListener('mouseleave', () => {
          animate(btn, { x: 0, y: 0 }, { type: 'spring', stiffness: 350, damping: 30 });
        });
      });
    }

    /* ----- PARALLAX — hero background ----- */
    const heroSection = document.getElementById('inicio');
    const heroBg      = document.querySelector('.hero__bg');
    if (heroSection && heroBg) {
      scroll(animate(heroBg, { y: ['0%', '18%'] }), {
        target: heroSection,
        offset: ['start start', 'end start']
      });
    }

  } catch (err) {
    console.warn('[KRP] Motion indisponível, usando fallback CSS', err);
  }
}

initMotion();
