'use strict';

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

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

// ── Mini Carousels ─────────────────────────────────────────────────────────────
const initCarousels = () => {
  $$('.mini-carousel').forEach(carousel => {
    const slides = $$('.slide-item', carousel);
    const dots   = $$('.dot-item',   carousel);
    if (!slides.length) return;

    let current  = 0;
    let interval = null;

    const show = idx => {
      slides.forEach((s, i) => {
        s.classList.toggle('opacity-100', i === idx);
        s.classList.toggle('opacity-0',   i !== idx);
        s.classList.toggle('z-10', i === idx);
        s.classList.toggle('z-0',  i !== idx);
      });
      dots.forEach((d, i) => {
        d.classList.toggle('bg-white',    i === idx);
        d.classList.toggle('bg-white/50', i !== idx);
        d.classList.toggle('scale-125',   i === idx);
      });
      current = idx;
    };

    const move = dir => show((current + dir + slides.length) % slides.length);

    const startAutoplay = () => {
      clearInterval(interval);
      interval = setInterval(() => move(1), 4000);
    };

    // Event delegation on carousel for prev/next/dots
    carousel.addEventListener('click', e => {
      const btn = e.target.closest('.prev-slide, .next-slide, .dot-item');
      if (!btn) return;
      e.preventDefault();
      if (btn.classList.contains('prev-slide')) move(-1);
      else if (btn.classList.contains('next-slide')) move(1);
      else show(dots.indexOf(btn));
      startAutoplay();
    });

    carousel.addEventListener('mouseenter', () => clearInterval(interval));
    carousel.addEventListener('mouseleave', startAutoplay);

    let touchStartX = 0;
    carousel.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      clearInterval(interval);
    }, { passive: true });

    carousel.addEventListener('touchend', e => {
      const delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) > 50) move(delta < 0 ? 1 : -1);
      startAutoplay();
    }, { passive: true });

    startAutoplay();
  });
};

// ── Sticky Navbar ──────────────────────────────────────────────────────────────
const initNavbar = () => {
  const navbar = $('#navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 20;
    navbar.classList.toggle('shadow-md',   scrolled);
    navbar.classList.toggle('bg-white',    scrolled);
    navbar.classList.toggle('bg-white/90', !scrolled);
  }, { passive: true });
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
const WEEKDAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  if (!audio || !ui || !toggle || !progress) return;

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
    toggle.setAttribute('aria-label', isActive ? 'Pausar mensaje del Dr. Colcca' : 'Reproducir mensaje del Dr. Colcca');
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

// ── Teleconsulta: Badge de disponibilidad ──────────────────────────────────────
const readTeleconsultaConfig = () => {
  const node = $('#teleconsulta-config');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent);
  } catch {
    return null; // JSON inválido → se mantiene el texto neutro del badge
  }
};

/** @param {string} hhmm "09:30" @returns {number|null} minutos desde 00:00 */
const toMinutes = hhmm => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

const parseRange = range => {
  if (!Array.isArray(range) || range.length !== 2) return null;
  const [start, end] = range.map(toMinutes);
  return start !== null && end !== null && start < end ? { start, end } : null;
};

/** Día de la semana (0-6) y minutos actuales en la zona horaria indicada */
const getZonedNow = timeZone => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const read = type => parts.find(part => part.type === type)?.value;
  return {
    weekday: WEEKDAYS_EN.indexOf(read('weekday')),
    minutes: Number(read('hour')) * 60 + Number(read('minute')),
  };
};

const describeAvailability = (schedule, now) => {
  const today = parseRange(schedule[now.weekday]);
  if (today && now.minutes < today.end) return { state: 'today', text: 'Disponible hoy' };

  for (let offset = 1; offset <= WEEKDAYS_ES.length; offset++) {
    const day = (now.weekday + offset) % WEEKDAYS_ES.length;
    if (parseRange(schedule[day])) return { state: 'later', text: `Próxima atención: ${WEEKDAYS_ES[day]}` };
  }
  return null;
};

const initAvailabilityBadge = () => {
  const badge = $('[data-availability]');
  const label = badge && $('[data-availability-text]', badge);
  if (!label) return;

  const config = readTeleconsultaConfig();
  const schedule = config?.horario;
  // Sin horario definido no se afirma disponibilidad: queda el texto neutro del HTML
  if (!schedule || typeof schedule !== 'object') return;

  try {
    const now = getZonedNow(config.timezone || 'America/Lima');
    if (now.weekday < 0 || !Number.isFinite(now.minutes)) return;
    const availability = describeAvailability(schedule, now);
    if (!availability) return;
    badge.dataset.state = availability.state;
    label.textContent = availability.text;
  } catch {
    // Zona horaria inválida (RangeError) → se mantiene el texto neutro
  }
};

// ── Teleconsulta: Foto del doctor (fallback a placeholder "DC") ────────────────
const initDoctorPhoto = () => {
  const img = $('[data-tele-photo]');
  if (!img) return;
  const markMissing = () => img.classList.add('is-missing');
  if (img.complete && img.naturalWidth === 0) markMissing();
  img.addEventListener('error', markMissing, { once: true });
};

// ── Bootstrap ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollReveal();
  initCarousels();
  initNavbar();
  initForm();
  initDoctorPhoto();
  initAvailabilityBadge();
  initAudioPlayer();
});