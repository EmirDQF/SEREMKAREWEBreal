// ═══ ANATOMÍA — "Conoce tu cuerpo" (#anatomia) ═════════════════════════════════
// Módulos: initBodyMap · initAnatomyViewer · initCompareSlider · initArthritisStages
// Script clásico con defer y envuelto en una IIFE: no crea variables globales.
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const MOBILE_QUERY      = '(max-width: 1023px)';
  const REDUCED_MOTION    = '(prefers-reduced-motion: reduce)';
  const COMPARE_STEP      = 5;
  const COMPARE_PAGE_STEP = 20;
  const STAGE_STAGGER_MS  = 140;
  const VIEWER_MARGIN     = '200px';
  const FOCUSABLE = 'a[href], button:not([disabled]):not([hidden]), [tabindex]:not([tabindex="-1"])';

  const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const readJsonConfig = id => {
    const node = document.getElementById(id);
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch {
      return null; // JSON inválido → la función que lo usa se queda en su estado seguro
    }
  };

  // ── 4.1 Mapa del dolor ───────────────────────────────────────────────────────
  const initBodyMap = () => {
    const figure   = $('[data-anat-figure]');
    const panel    = $('[data-anat-panel]');
    if (!figure || !panel) return;

    const toggle   = $('[data-anat-view-toggle]');
    const intro    = $('[data-anat-intro]', panel);
    const status   = $('[data-anat-status]', panel);
    const sheetBar = $('[data-anat-sheet-bar]', panel);
    const backdrop = $('[data-anat-backdrop]');
    const infos    = $$('.anat-zone-info', panel);
    const isMobile = window.matchMedia(MOBILE_QUERY);

    let lastTrigger = null;

    // Con JS se oculta el texto de todas las zonas y solo se muestra la elegida
    infos.forEach(info => { info.hidden = true; });
    if (toggle) toggle.hidden = false;

    const setView = view => {
      figure.dataset.currentView = view;
      $$('.anat-hotspots', figure).forEach(group => { group.hidden = group.dataset.view !== view; });
      $$('[data-anat-view]', toggle || document).forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.anatView === view));
      });
    };

    const isSheetOpen = () => panel.classList.contains('is-sheet-open');

    const openSheet = () => {
      panel.classList.add('is-sheet-open');
      if (sheetBar) sheetBar.hidden = false;
      if (backdrop) backdrop.hidden = false;
      document.documentElement.classList.add('anat-sheet-lock');
    };

    const closeSheet = ({ restoreFocus = true } = {}) => {
      if (!isSheetOpen()) return;
      panel.classList.remove('is-sheet-open');
      if (sheetBar) sheetBar.hidden = true;
      if (backdrop) backdrop.hidden = true;
      document.documentElement.classList.remove('anat-sheet-lock');
      if (restoreFocus && lastTrigger && lastTrigger.offsetParent) lastTrigger.focus();
    };

    const selectZone = (zone, trigger) => {
      const info = infos.find(item => item.dataset.zone === zone);
      if (!info) return;
      lastTrigger = trigger || null;

      infos.forEach(item => { item.hidden = item !== info; });
      if (intro) intro.hidden = true;
      panel.setAttribute('aria-labelledby', `${info.id}-title`);
      panel.removeAttribute('aria-label');

      $$('.anat-hotspot', figure).forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.zone === zone));
      });
      $$('.anat-zone-glow', figure).forEach(glow => {
        glow.classList.toggle('is-active', glow.dataset.zone === zone);
      });

      const title = $(`#${info.id}-title`, panel);
      if (status && title) status.textContent = `Mostrando información de: ${title.textContent}`;

      if (isMobile.matches) {
        openSheet();
        title?.focus({ preventScroll: true });
      }
    };

    figure.addEventListener('click', event => {
      const btn = event.target.closest('.anat-hotspot');
      if (btn) selectZone(btn.dataset.zone, btn);
    });

    toggle?.addEventListener('click', event => {
      const btn = event.target.closest('[data-anat-view]');
      if (btn) setView(btn.dataset.anatView);
    });

    $('[data-anat-close]', panel)?.addEventListener('click', () => closeSheet());
    backdrop?.addEventListener('click', () => closeSheet());

    // Escape cierra; Tab queda dentro del bottom sheet mientras está abierto
    document.addEventListener('keydown', event => {
      if (!isSheetOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSheet();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = $$(FOCUSABLE, panel).filter(el => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    });

    // Un enlace del panel (servicio o teleconsulta) navega fuera: cerrar el sheet sin devolver el foco
    panel.addEventListener('click', event => {
      if (event.target.closest('a[href^="#"]')) closeSheet({ restoreFocus: false });
    });

    // Al pasar a desktop, el panel vuelve a ser una columna normal
    isMobile.addEventListener('change', event => {
      if (!event.matches) closeSheet({ restoreFocus: false });
    });

    setView('front');
  };

  // ── 4.2 Visor 3D (model-viewer, carga diferida) ──────────────────────────────
  const hasWebGL = () => {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
      return false;
    }
  };

  const isSlowConnection = () => {
    const connection = navigator.connection;
    if (!connection) return false;
    return Boolean(connection.saveData) || /(^|-)2g$|^3g$/.test(connection.effectiveType || '');
  };

  const initAnatomyViewer = () => {
    const viewer = $('[data-anat-viewer]');
    const config = readJsonConfig('anatomia-config');
    const models = config && config.modelos && typeof config.modelos === 'object' ? config.modelos : {};
    const modelKeys = Object.keys(models).filter(key => models[key] && typeof models[key].sano === 'string');
    // Sin modelos configurados o sin WebGL: el 3D queda oculto y solo se usa el mapa SVG
    if (!viewer || !modelKeys.length || typeof config.modelViewerSrc !== 'string' || !hasWebGL()) return;

    const stage      = $('[data-anat-stage]', viewer);
    const poster     = $('[data-anat-poster]', viewer);
    const posterImg  = $('[data-anat-poster-img]', viewer);
    const loadBtn    = $('[data-anat-load]', viewer);
    const progress   = $('[data-anat-progress]', viewer);
    const fallback   = $('[data-anat-fallback]', viewer);
    const modelGroup = $('[data-anat-models]', viewer);
    const variants   = $('[data-anat-variants]', viewer);
    const info       = $('[data-anat-hotspot-info]', viewer);

    let currentKey = modelKeys[0];
    let currentVariant = 'sano';
    let modelViewer = null;
    let loadPromise = null;

    viewer.hidden = false;

    const showFallback = () => {
      if (modelViewer) modelViewer.hidden = true;
      if (progress) progress.hidden = true;
      if (poster) poster.hidden = false;
      if (loadBtn) loadBtn.hidden = true;
      if (fallback) fallback.hidden = false;
    };

    const updatePoster = () => {
      const model = models[currentKey];
      if (!posterImg) return;
      if (typeof model.poster === 'string') {
        posterImg.src = model.poster;
        posterImg.alt = model.alt || `Ilustración de ${model.nombre || currentKey}`;
        posterImg.hidden = false;
      } else {
        posterImg.hidden = true;
      }
    };

    const renderHotspots = () => {
      if (!modelViewer) return;
      $$('.anat-mv-hotspot', modelViewer).forEach(btn => btn.remove());
      if (info) info.textContent = '';
      const hotspots = Array.isArray(models[currentKey].hotspots) ? models[currentKey].hotspots : [];
      hotspots.forEach((spot, index) => {
        if (!spot || typeof spot.posicion !== 'string') return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'anat-mv-hotspot';
        btn.slot = `hotspot-${index}`;
        btn.dataset.position = spot.posicion;
        if (typeof spot.normal === 'string') btn.dataset.normal = spot.normal;
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = String(spot.etiqueta || `Punto ${index + 1}`);
        btn.addEventListener('click', () => {
          $$('.anat-mv-hotspot', modelViewer).forEach(other => other.setAttribute('aria-expanded', String(other === btn)));
          if (!info) return;
          info.replaceChildren();
          const title = document.createElement('p');
          title.className = 'font-bold text-brand-dark';
          title.textContent = btn.textContent;
          const text = document.createElement('p');
          text.className = 'text-gray-600 text-sm mt-1';
          text.textContent = String(spot.texto || '');
          info.append(title, text);
        });
        modelViewer.append(btn);
      });
    };

    const sourceFor = () => {
      const model = models[currentKey];
      return currentVariant === 'artrosis' && typeof model.artrosis === 'string' ? model.artrosis : model.sano;
    };

    const syncControls = () => {
      $$('[data-anat-model]', modelGroup).forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.anatModel === currentKey));
      });
      const hasVariant = typeof models[currentKey].artrosis === 'string';
      if (variants) variants.hidden = !hasVariant;
      if (!hasVariant) currentVariant = 'sano';
      $$('[data-anat-variant]', variants || document).forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.anatVariant === currentVariant));
      });
    };

    const applyModel = () => {
      syncControls();
      updatePoster();
      if (!modelViewer) return;
      const model = models[currentKey];
      // Si el modelo anterior falló, se restablece el visor antes de cargar el nuevo
      modelViewer.hidden = false;
      if (fallback) fallback.hidden = true;
      if (poster) poster.hidden = true;
      // Cambiar src descarta el modelo anterior y libera su memoria de GPU
      modelViewer.src = sourceFor();
      modelViewer.alt = model.alt || `Modelo 3D educativo de ${model.nombre || currentKey}`;
      if (progress) progress.hidden = false;
      renderHotspots();
    };

    const createModelViewer = () => {
      const model = models[currentKey];
      const element = document.createElement('model-viewer');
      element.className = 'anat-model-viewer';
      element.setAttribute('src', sourceFor());
      element.setAttribute('alt', model.alt || `Modelo 3D educativo de ${model.nombre || currentKey}`);
      element.setAttribute('camera-controls', '');
      element.setAttribute('touch-action', 'pan-y');
      element.setAttribute('interaction-prompt', 'none');
      element.setAttribute('shadow-intensity', '0.6');
      element.setAttribute('ar', '');
      element.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      if (typeof model.poster === 'string') element.setAttribute('poster', model.poster);
      if (!prefersReducedMotion()) {
        element.setAttribute('auto-rotate', '');
        element.setAttribute('rotation-per-second', '12deg');
        element.setAttribute('auto-rotate-delay', '0');
      }

      element.addEventListener('progress', event => {
        const total = Number(event.detail && event.detail.totalProgress) || 0;
        if (progress) {
          progress.hidden = total >= 1;
          progress.style.setProperty('--progress', String(total));
        }
      });
      element.addEventListener('load', () => {
        if (poster) poster.hidden = true;
        if (progress) progress.hidden = true;
      });
      element.addEventListener('error', showFallback);
      // El auto-rotate se detiene en cuanto la persona interactúa
      element.addEventListener('camera-change', event => {
        if (event.detail && event.detail.source === 'user-interaction') element.removeAttribute('auto-rotate');
      });
      return element;
    };

    const load = () => {
      if (loadPromise) return loadPromise;
      if (loadBtn) loadBtn.disabled = true;
      if (progress) progress.hidden = false;
      loadPromise = import(config.modelViewerSrc)
        .then(() => customElements.whenDefined('model-viewer'))
        .then(() => {
          modelViewer = createModelViewer();
          stage.prepend(modelViewer);
          // model-viewer muestra su propio póster y la barra de progreso; el nuestro solo vuelve si hay error
          if (poster) poster.hidden = true;
          renderHotspots();
        })
        .catch(() => {
          loadPromise = null;
          showFallback();
        });
      return loadPromise;
    };

    // Botones de modelo (texto desde la config, sin innerHTML)
    modelKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.anatModel = key;
      btn.textContent = String(models[key].nombre || key);
      modelGroup?.append(btn);
    });

    modelGroup?.addEventListener('click', event => {
      const btn = event.target.closest('[data-anat-model]');
      if (!btn || btn.dataset.anatModel === currentKey) return;
      currentKey = btn.dataset.anatModel;
      currentVariant = 'sano';
      applyModel();
    });

    variants?.addEventListener('click', event => {
      const btn = event.target.closest('[data-anat-variant]');
      if (!btn || btn.dataset.anatVariant === currentVariant) return;
      currentVariant = btn.dataset.anatVariant;
      applyModel();
    });

    loadBtn?.addEventListener('click', load);

    // "Ver en 3D" dentro de los paneles del mapa (solo zonas con modelo)
    $$('[data-anat-open-3d]').forEach(btn => {
      // getAttribute: dataset no convierte "-3d" (guion + dígito) a camelCase
      const key = btn.getAttribute('data-anat-open-3d');
      if (!models[key]) return;
      btn.hidden = false;
      btn.addEventListener('click', () => {
        currentKey = key;
        currentVariant = 'sano';
        applyModel();
        viewer.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
        load().then(() => modelViewer?.focus({ preventScroll: true }));
      });
    });

    syncControls();
    updatePoster();

    // Carga automática solo si la sección entra en pantalla y la conexión es buena.
    // Al salir de pantalla se pausa la rotación (model-viewer ya no renderiza fuera del viewport).
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isSlowConnection()) load();
          if (!modelViewer) return;
          if (!entry.isIntersecting) modelViewer.removeAttribute('auto-rotate');
        });
      }, { rootMargin: VIEWER_MARGIN });
      observer.observe(viewer);
    }
  };

  // ── 4.3a Comparador hueso sano vs osteoporosis ───────────────────────────────
  const describeCompare = value => {
    if (value <= 5) return 'Solo osteoporosis';
    if (value >= 95) return 'Solo hueso sano';
    if (value === 50) return 'Mitad hueso sano, mitad osteoporosis';
    return `${value} % hueso sano, ${100 - value} % osteoporosis`;
  };

  const initCompareSlider = () => {
    const compare = $('[data-anat-compare]');
    const handle  = compare && $('[data-anat-compare-handle]', compare);
    if (!handle) return;

    let value = 50;
    let dragging = false;

    const render = next => {
      value = Math.round(clamp(next, 0, 100));
      compare.style.setProperty('--pos', `${value}%`);
      handle.setAttribute('aria-valuenow', String(value));
      handle.setAttribute('aria-valuetext', describeCompare(value));
    };

    const valueFromPointer = clientX => {
      const rect = compare.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    };

    compare.addEventListener('pointerdown', event => {
      dragging = true;
      compare.setPointerCapture(event.pointerId);
      render(valueFromPointer(event.clientX));
      handle.focus({ preventScroll: true });
    });
    compare.addEventListener('pointermove', event => {
      if (dragging) render(valueFromPointer(event.clientX));
    });
    const stop = () => { dragging = false; };
    compare.addEventListener('pointerup', stop);
    compare.addEventListener('pointercancel', stop);

    const keyActions = {
      ArrowLeft:  v => v - COMPARE_STEP,
      ArrowDown:  v => v - COMPARE_STEP,
      ArrowRight: v => v + COMPARE_STEP,
      ArrowUp:    v => v + COMPARE_STEP,
      PageDown:   v => v - COMPARE_PAGE_STEP,
      PageUp:     v => v + COMPARE_PAGE_STEP,
      Home:       () => 0,
      End:        () => 100,
    };

    handle.addEventListener('keydown', event => {
      const action = keyActions[event.key];
      if (!action) return;
      event.preventDefault();
      render(action(value));
    });

    render(value);
  };

  // ── 4.3b Etapas de la artrosis (animación al hacer scroll) ───────────────────
  const initArthritisStages = () => {
    const list = $('[data-anat-stages]');
    if (!list) return;
    // Sin JS o con movimiento reducido: se ve directamente el estado final de cada etapa
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const cards = $$('.anat-stage-card', list);
    list.classList.add('anat-stages--animate');

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const index = cards.indexOf(entry.target);
        window.setTimeout(() => entry.target.classList.add('is-visible'), Math.max(index, 0) * STAGE_STAGGER_MS);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    cards.forEach(card => observer.observe(card));
  };

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  const start = () => {
    if (!document.getElementById('anatomia')) return;
    initBodyMap();
    initAnatomyViewer();
    initCompareSlider();
    initArthritisStages();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
