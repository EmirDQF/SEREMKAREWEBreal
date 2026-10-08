'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const NAVBAR_COMPACT_OFFSET = 24; // px de scroll a partir de los cuales el header se compacta

// ── Mobile Menu ────────────────────────────────────────────────────────────────
const initMobileMenu = () => {
  const btn  = $('#mobile-menu-btn');
  const menu = $('#mobile-menu');
  if (!btn || !menu) return;

  const close = () => {
    menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('i')?.classList.replace('ph-x', 'ph-list');
  };

  btn.addEventListener('click', () => {
    const expanding = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !expanding);
    if (expanding) setTimeout(() => menu.classList.add('opacity-100'), 10);
    btn.setAttribute('aria-expanded', String(expanding));
    const icon = btn.querySelector('i');
    icon?.classList.replace(expanding ? 'ph-list' : 'ph-x', expanding ? 'ph-x' : 'ph-list');
  });

  menu.addEventListener('click', ({ target }) => target.closest('a') && close());
};

// ── Scroll Reveal ──────────────────────────────────────────────────────────────
const initScrollReveal = () => {
  const targets = $$('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
  if (!targets.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('active');
      obs.unobserve(target);
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
};

// ── Sticky Navbar ──────────────────────────────────────────────────────────────
const initNavbar = () => {
  const navbar = $('#navbar');
  if (!navbar) return;

  // Header compacto al bajar: un solo toggle por frame (rAF) para no forzar layout en cada evento
  let ticking = false;
  const update = () => {
    navbar.classList.toggle('is-compact', window.scrollY > NAVBAR_COMPACT_OFFSET);
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
};

// ── Contact Form ───────────────────────────────────────────────────────────────
const initForm = () => {
  const form = $('#contactForm');
  if (!form) return;

  const setFieldState = (input, invalid) => {
    input.classList.toggle('border-red-500', invalid);
    input.classList.toggle('ring-red-500',   invalid);
    input.classList.toggle('border-gray-300', !invalid);
    const err = input.nextElementSibling;
    err?.classList.toggle('hidden', !invalid);
    if (invalid) {
      input.classList.add('animate-pulse');
      setTimeout(() => input.classList.remove('animate-pulse'), 500);
    }
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    const inputs  = $$('input[required], textarea[required]', form);
    const isValid = inputs.reduce((acc, input) => {
      const ok = input.checkValidity();
      setFieldState(input, !ok);
      return acc && ok;
    }, true);

    if (!isValid) return;

    const btn      = $('button[type="submit"]', form);
    const original = btn.innerHTML;
    btn.innerHTML  = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> Enviando...';
    btn.classList.add('opacity-80', 'cursor-not-allowed');

    setTimeout(() => {
      alert('¡Validación exitosa! En un entorno real, este mensaje se enviaría de forma segura al servidor.');
      form.reset();
      btn.innerHTML = original;
      btn.classList.remove('opacity-80', 'cursor-not-allowed');
    }, 1000);
  });

  form.addEventListener('input', ({ target }) => {
    if (!target.matches('input, textarea') || !target.checkValidity()) return;
    setFieldState(target, false);
  });
};

// ═══ TELECONSULTA ═══════════════════════════════════════════════════════════════

const AUDIO_SEEK_STEP_SECONDS = 5;
const AUDIO_PLAYBACK_RATES    = [1, 1.25, 1.5];
const AUDIO_PRELOAD_MARGIN    = '300px';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/** @param {number} seconds @returns {string} "m:ss" */
const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// ── Teleconsulta: Reproductor de audio ─────────────────────────────────────────
const initAudioPlayer = () => {
  const player   = $('[data-audio-player]');
  const audio    = player && $('[data-audio]', player);
  const ui       = player && $('[data-audio-ui]', player);
  const toggle   = player && $('[data-audio-toggle]', player);
  const progress = player && $('[data-audio-progress]', player);
  // El reproductor solo aparece cuando existe el audio real (SITE.doctor.audio)
  if (!audio || !ui || !toggle || !progress || !SITE.doctor.audio) return;
  audio.src = SITE.doctor.audio;
  player.hidden = false;

  const errorMsg      = $('[data-audio-error]', player);
  const currentLabel  = $('[data-audio-current]', player);
  const totalLabel    = $('[data-audio-total]', player);
  const durationLabel = $('[data-audio-duration-label]', player);
  const speedBtn      = $('[data-audio-speed]', player);
  const muteBtn       = $('[data-audio-mute]', player);

  let rateIndex  = 0;
  let isDragging = false;
  let hasFailed  = false;

  const getDuration = () => (Number.isFinite(audio.duration) ? audio.duration : 0);

  const setState = state => {
    player.dataset.state = state;
    const isActive = state === 'playing' || state === 'loading';
    toggle.setAttribute('aria-label', isActive ? 'Pausar mensaje del Dr. Collcca' : 'Reproducir mensaje del Dr. Collcca');
  };

  const renderProgress = (time = audio.currentTime) => {
    const duration = getDuration();
    const safeTime = clamp(time, 0, duration);
    progress.style.setProperty('--p', duration ? String(safeTime / duration) : '0');
    progress.setAttribute('aria-valuemax', String(Math.round(duration)));
    progress.setAttribute('aria-valuenow', String(Math.round(safeTime)));
    progress.setAttribute('aria-valuetext', `${formatTime(safeTime)} de ${formatTime(duration)}`);
    if (currentLabel) currentLabel.textContent = formatTime(safeTime);
  };

  const renderDuration = () => {
    const duration = getDuration();
    if (!duration) return;
    if (totalLabel) totalLabel.textContent = formatTime(duration);
    if (durationLabel) durationLabel.textContent = `(${formatTime(duration)})`;
    renderProgress();
  };

  const showError = () => {
    if (hasFailed) return;
    hasFailed = true;
    audio.pause();
    ui.hidden = true;
    if (errorMsg) errorMsg.hidden = false;
    setState('error');
  };

  const play = async () => {
    setState('loading');
    audio.preload = 'auto'; // evita que loadMetadata() llame a load() y corte la reproducción
    try {
      await audio.play();
    } catch (error) {
      // AbortError: el usuario pausó antes de que terminara de cargar
      if (error instanceof DOMException && error.name === 'AbortError') return;
      showError();
    }
  };

  const seekTo = time => {
    const duration = getDuration();
    if (!duration) return;
    audio.currentTime = clamp(time, 0, duration);
    renderProgress(audio.currentTime);
  };

  // Carga solo los metadatos (duración) cuando el reproductor se acerca al viewport
  const loadMetadata = () => {
    if (hasFailed || audio.preload !== 'none') return;
    audio.preload = 'metadata';
    audio.load();
  };

  // Mejora progresiva: oculta el <audio controls> nativo y muestra la UI propia
  audio.removeAttribute('controls');
  audio.hidden = true;
  ui.hidden = false;
  setState('idle');

  if (audio.error) {
    showError();
    return;
  }

  toggle.addEventListener('click', () => {
    if (hasFailed) return;
    if (audio.paused) play();
    else audio.pause();
  });

  audio.addEventListener('playing', () => setState('playing'));
  audio.addEventListener('waiting', () => { if (!audio.paused) setState('loading'); });
  audio.addEventListener('pause',   () => { if (!hasFailed) setState('paused'); });
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    setState('idle');
    renderProgress(0);
  });
  audio.addEventListener('timeupdate', () => { if (!isDragging) renderProgress(); });
  audio.addEventListener('loadedmetadata', renderDuration);
  audio.addEventListener('durationchange', renderDuration);
  audio.addEventListener('error', showError);

  // Seek con mouse / touch (clic o arrastre)
  const timeFromPointer = clientX => {
    const rect = progress.getBoundingClientRect();
    return clamp((clientX - rect.left) / rect.width, 0, 1) * getDuration();
  };

  progress.addEventListener('pointerdown', e => {
    if (!getDuration()) return;
    isDragging = true;
    progress.setPointerCapture(e.pointerId);
    renderProgress(timeFromPointer(e.clientX));
  });

  progress.addEventListener('pointermove', e => {
    if (isDragging) renderProgress(timeFromPointer(e.clientX));
  });

  progress.addEventListener('pointerup', e => {
    if (!isDragging) return;
    isDragging = false;
    seekTo(timeFromPointer(e.clientX));
  });

  progress.addEventListener('pointercancel', () => {
    isDragging = false;
    renderProgress();
  });

  // Seek con teclado (patrón ARIA slider)
  const keyActions = {
    ArrowRight: t => t + AUDIO_SEEK_STEP_SECONDS,
    ArrowUp:    t => t + AUDIO_SEEK_STEP_SECONDS,
    ArrowLeft:  t => t - AUDIO_SEEK_STEP_SECONDS,
    ArrowDown:  t => t - AUDIO_SEEK_STEP_SECONDS,
    Home:       () => 0,
    End:        () => getDuration(),
  };

  progress.addEventListener('keydown', e => {
    const action = keyActions[e.key];
    if (!action) return;
    e.preventDefault();
    seekTo(action(audio.currentTime));
  });

  speedBtn?.addEventListener('click', () => {
    rateIndex = (rateIndex + 1) % AUDIO_PLAYBACK_RATES.length;
    const rate = AUDIO_PLAYBACK_RATES[rateIndex];
    audio.playbackRate = rate;
    speedBtn.textContent = `${rate}x`;
    speedBtn.setAttribute('aria-label', `Velocidad de reproducción: ${rate}x`);
  });

  muteBtn?.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
  });

  if (!('IntersectionObserver' in window)) {
    loadMetadata();
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    loadMetadata();
    obs.disconnect();
  }, { rootMargin: AUDIO_PRELOAD_MARGIN });

  observer.observe(player);
};

// ═══ DATOS CENTRALIZADOS (site-config.js → SITE) ══════════════════════════════

/** Lee una ruta tipo "doctor.cmp" dentro de SITE */
const readSite = path => path.split('.').reduce((obj, key) => (obj == null ? undefined : obj[key]), SITE);

/** Textos [data-site="ruta"]: los pendientes ('[CMP]') quedan resaltados */
const applySiteText = () => {
  $$('[data-site]').forEach(el => {
    const value = readSite(el.dataset.site);
    if (typeof value !== 'string') return;
    el.textContent = value;
    el.classList.toggle('is-placeholder', isPending(value));
  });
};

/** Enlaces [data-wa="teleconsulta|general"] y [data-tel] */
const applySiteLinks = () => {
  $$('[data-wa]').forEach(link => {
    link.href = waLink(link.dataset.waText || SITE.mensajes[link.dataset.wa] || SITE.mensajes.general);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  const tel = telLink();
  // Sin teléfono real los enlaces "Llamar" mantienen su respaldo (#contacto)
  if (tel) $$('[data-tel]').forEach(link => { link.href = tel; });
};

/** Formación del doctor: la lista solo aparece cuando SITE.doctor.formacion tiene datos */
const applyDoctorFormacion = () => {
  const list = $('[data-doctor-formacion]');
  if (!list || !SITE.doctor.formacion.length) return;
  const items = SITE.doctor.formacion.map(text => {
    const li = document.createElement('li');
    const icon = document.createElement('i');
    icon.className = 'ph-fill ph-graduation-cap';
    icon.setAttribute('aria-hidden', 'true');
    li.append(icon, document.createTextNode(` ${text}`));
    return li;
  });
  list.replaceChildren(...items);
  list.hidden = false;
};

const applySiteData = () => {
  applySiteText();
  applySiteLinks();
  applyDoctorFormacion();
};

// ── Foto del doctor: si no carga, queda visible el monograma "DC" ─────────────
const initDoctorPhoto = () => {
  $$('[data-doctor-photo]').forEach(img => {
    const markMissing = () => img.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing, { once: true });
  });
};

// ── Bootstrap ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applySiteData();
  initMobileMenu();
  initScrollReveal();
  initNavbar();
  initForm();
  initDoctorPhoto();
  initAudioPlayer();
});
