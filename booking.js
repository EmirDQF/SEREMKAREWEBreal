'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   AGENDA DE CITAS — sin servidor, funcional hoy
   Flujo: tipo → día (próximos SITE.agenda.diasAdelante, sin domingos ni feriados) →
   hora (franjas de SITE.agenda.duracionMin en hora de Lima) → datos → WhatsApp + .ics.

   Depende de: site-config.js (SITE, waLink, isPending) · tele.js (LimaTime, DAY_NAMES_ES)
   · main.js (validateFields, setFieldError, sanitizePhone; se usan después de DOMContentLoaded).

   PARA CONECTAR UN BACKEND (Google Apps Script, Formspree, Cal.com, Supabase…)
   cambia solo submitBooking(): la interfaz no se toca (ejemplo en su comentario).
═══════════════════════════════════════════════════════════════════════════ */

const MONTHS_ES = Object.freeze(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']);
const MONTHS_SHORT_ES = Object.freeze(['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']);
const DAY_SHORT_ES = Object.freeze(['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']);
const DAY_STATUS_LABEL = Object.freeze({ feriado: 'Feriado', cerrado: 'Cerrado', 'sin-horarios': 'Sin horarios' });
const BOOKING_STORAGE_KEY = 'sermekare:paciente';
const ICS_MAX_LINE_BYTES = 75;
const COPY_STATUS_MS = 4000;

// ═══ CALENDARIO (funciones puras) ═══════════════════════════════════════════

/** Valor del radio marcado de un grupo ('' si ninguno). Evita el caso de un único radio en form.elements */
const radioValue = (form, name) => form.querySelector(`input[name="${name}"]:checked`)?.value || '';

const findTipo = id => SITE.agenda.tipos.find(tipo => tipo.id === id) || null;

/** Horario de un tipo de cita (si no define el suyo, el general) */
const scheduleFor = tipo => (tipo && tipo.horario) || SITE.horario;

const minutesToHHMM = minutes => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Franjas (minutos desde 00:00) de un día; las ya pasadas de hoy se ocultan */
const slotsFor = (iso, schedule, now) => {
  const start = LimaTime.toMinutes(schedule.desde);
  const end = LimaTime.toMinutes(schedule.hasta);
  const step = SITE.agenda.duracionMin;
  const all = Array.from({ length: Math.floor((end - start) / step) }, (_, i) => start + i * step);
  return iso === now.iso ? all.filter(minutes => minutes > now.minutes) : all;
};

/** 'ok' · 'feriado' · 'cerrado' · 'sin-horarios' */
const dayStatus = (iso, schedule, now) => {
  if (SITE.agenda.feriados.includes(iso)) return 'feriado';
  if (!schedule.dias.includes(LimaTime.weekdayOf(iso))) return 'cerrado';
  return slotsFor(iso, schedule, now).length ? 'ok' : 'sin-horarios';
};

const upcomingDays = (schedule, now) => Array.from({ length: SITE.agenda.diasAdelante }, (_, offset) => {
  const iso = LimaTime.addDays(now.iso, offset);
  return { iso, offset, status: dayStatus(iso, schedule, now) };
});

const splitIso = iso => iso.split('-').map(Number);

/** "viernes 9 de octubre de 2026" */
const formatDateLong = iso => {
  const [year, month, day] = splitIso(iso);
  return `${DAY_NAMES_ES[LimaTime.weekdayOf(iso)]} ${day} de ${MONTHS_ES[month - 1]} de ${year}`;
};

const formatHora = hhmm => LimaTime.formatMinutes(LimaTime.toMinutes(hhmm));

const presencialLocation = () => {
  const { calle, distrito } = SITE.direccion;
  return isPending(calle) ? 'Consultorio SERMEKARE, Lima (te enviamos la dirección al confirmar)' : `${calle}, ${distrito}, Lima`;
};

const locationFor = tipo => (tipo.modalidad === 'virtual' ? 'Videollamada (WhatsApp, Zoom o Google Meet)' : presencialLocation());

// ═══ MENSAJE, CALENDARIO .ics Y ENVÍO ═══════════════════════════════════════

/** Texto de la cita para WhatsApp y para "Copiar detalles" */
const buildBookingMessage = data => [
  `Hola ${SITE.doctor.nombre}, deseo agendar una cita:`,
  `• Tipo: ${data.tipo.nombre}`,
  `• Fecha: ${formatDateLong(data.fecha)}`,
  `• Hora: ${formatHora(data.hora)} (hora de Lima)`,
  `• Nombre: ${data.nombre}`,
  `• Celular: ${data.celular}`,
  data.motivo ? `• Motivo: ${data.motivo}` : '',
  '¿Me confirman la cita, por favor? Gracias.',
].filter(Boolean).join('\n');

const icsEscape = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Pliega una línea .ics a 75 bytes (RFC 5545), sin cortar caracteres UTF-8 */
const icsFold = line => {
  const encoder = new TextEncoder();
  const chunks = [];
  let current = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = chunks.length ? ICS_MAX_LINE_BYTES - 1 : ICS_MAX_LINE_BYTES; // las continuaciones empiezan con un espacio
    if (bytes + size > limit) {
      chunks.push(current);
      current = '';
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  return [...chunks, current].join('\r\n ');
};

const toIcsLocal = (iso, minutes) => `${iso.replace(/-/g, '')}T${minutesToHHMM(minutes).replace(':', '')}00`;

/** Archivo de calendario con la cita (por confirmar) y un recordatorio 1 hora antes */
const buildIcs = data => {
  const tz = SITE.horario.timezone;
  const start = LimaTime.toMinutes(data.hora);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SERMEKARE//Agenda web//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    // Lima no tiene horario de verano: UTC-5 todo el año
    'BEGIN:VTIMEZONE', `TZID:${tz}`, 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0500', 'TZNAME:-05', 'END:STANDARD', 'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${data.id}@sermekare.pe`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${toIcsLocal(data.fecha, start)}`,
    `DTEND;TZID=${tz}:${toIcsLocal(data.fecha, start + SITE.agenda.duracionMin)}`,
    `SUMMARY:${icsEscape(`${data.tipo.nombre} con el ${SITE.doctor.nombre} (por confirmar)`)}`,
    `DESCRIPTION:${icsEscape(buildBookingMessage(data))}`,
    `LOCATION:${icsEscape(locationFor(data.tipo))}`,
    'STATUS:TENTATIVE',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Recordatorio de tu cita en SERMEKARE', 'TRIGGER:-PT1H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return `${lines.map(icsFold).join('\r\n')}\r\n`;
};

/**
 * Envía la reserva. HOY: abre WhatsApp con el mensaje armado (no hay servidor).
 * window.open se llama de inmediato (antes de cualquier await) para que el navegador no lo bloquee.
 *
 * Para usar un backend, agrega la llamada aquí y conserva el objeto devuelto, por ejemplo:
 *   const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
 *   if (!res.ok) throw new Error('No se pudo registrar la cita');
 *
 * @param {object} data reserva validada (ver readBooking)
 * @returns {Promise<{ ok: boolean, channel: string, url: string }>}
 */
const submitBooking = async data => {
  const url = waLink(buildBookingMessage(data));
  window.open(url, '_blank', 'noopener');
  return { ok: true, channel: 'whatsapp', url };
};

// ═══ ALMACENAMIENTO OPCIONAL (solo nombre y celular, con permiso) ═══════════
// localStorage puede no existir (modo privado, bloqueado): en ese caso la agenda funciona igual.

const patientStore = Object.freeze({
  read() {
    try { return JSON.parse(localStorage.getItem(BOOKING_STORAGE_KEY)) || null; } catch { return null; }
  },
  write(value) {
    try { localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(value)); } catch { /* sin almacenamiento: no se recuerda */ }
  },
  clear() {
    try { localStorage.removeItem(BOOKING_STORAGE_KEY); } catch { /* sin almacenamiento: nada que borrar */ }
  },
});

// ═══ INTERFAZ ═══════════════════════════════════════════════════════════════

/** Crea un elemento con atributos e hijos (texto o nodos), sin innerHTML */
const h = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === false || value == null) return;
    node.setAttribute(key, value === true ? '' : String(value));
  });
  node.append(...[].concat(children).filter(child => child != null && child !== ''));
  return node;
};

const icon = name => h('i', { class: `ph-fill ${name}`, 'aria-hidden': 'true' });

const renderTypes = box => {
  const options = SITE.agenda.tipos.map(tipo => h('label', { class: 'booking-opt booking-type' }, [
    h('input', { type: 'radio', name: 'tipo', value: tipo.id, class: 'booking-radio', required: true }),
    h('span', { class: 'booking-opt-body' }, [
      icon(tipo.icono),
      h('span', {}, [h('strong', {}, tipo.nombre), h('small', {}, tipo.detalle)]),
    ]),
  ]));
  box.replaceChildren(...options);
};

const dayLabel = ({ iso, offset }) => {
  if (offset === 0) return 'Hoy';
  if (offset === 1) return 'Mañana';
  return DAY_SHORT_ES[LimaTime.weekdayOf(iso)];
};

const renderDays = (box, schedule, selected) => {
  const now = LimaTime.now();
  const days = upcomingDays(schedule, now).map(day => {
    const [, month, dayNum] = splitIso(day.iso);
    const open = day.status === 'ok';
    return h('label', { class: 'booking-opt booking-day', title: formatDateLong(day.iso) }, [
      h('input', { type: 'radio', name: 'fecha', value: day.iso, class: 'booking-radio', disabled: !open, checked: open && day.iso === selected, 'aria-label': `${formatDateLong(day.iso)}${open ? '' : `: ${DAY_STATUS_LABEL[day.status]}`}` }),
      h('span', { class: 'booking-opt-body', 'aria-hidden': 'true' }, [
        h('small', {}, dayLabel(day)),
        h('strong', {}, String(dayNum)),
        h('small', {}, open ? MONTHS_SHORT_ES[month - 1] : DAY_STATUS_LABEL[day.status]),
      ]),
    ]);
  });
  box.replaceChildren(...days);
};

const renderSlots = (box, iso, schedule, selected) => {
  if (!iso) {
    box.replaceChildren(h('p', { class: 'booking-empty' }, 'Primero elige un día.'));
    return;
  }
  const slots = slotsFor(iso, schedule, LimaTime.now());
  if (!slots.length) {
    box.replaceChildren(h('p', { class: 'booking-empty' }, 'Ya no quedan horarios para este día. Elige otro día.'));
    return;
  }
  box.replaceChildren(...slots.map(minutes => {
    const value = minutesToHHMM(minutes);
    return h('label', { class: 'booking-opt booking-slot' }, [
      h('input', { type: 'radio', name: 'hora', value, class: 'booking-radio', checked: value === selected }),
      h('span', { class: 'booking-opt-body' }, LimaTime.formatMinutes(minutes)),
    ]);
  }));
};

const renderDoneList = (list, data) => {
  const rows = [
    ['Tipo', data.tipo.nombre],
    ['Fecha', formatDateLong(data.fecha)],
    ['Hora', `${formatHora(data.hora)} (hora de Lima)`],
    ['Lugar', locationFor(data.tipo)],
    ['Nombre', data.nombre],
    ['Celular', data.celular],
    ['Motivo', data.motivo],
  ].filter(([, value]) => value);
  list.replaceChildren(...rows.flatMap(([term, value]) => [h('dt', {}, term), h('dd', {}, value)]));
};

const downloadIcs = data => {
  const blob = new Blob([buildIcs(data)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: `cita-sermekare-${data.fecha}.ics`, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const newBookingId = () => (window.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

// ═══ CONTROLADOR ════════════════════════════════════════════════════════════

const queryBookingElements = () => {
  const form = document.getElementById('booking-form');
  if (!form) return null;
  const pick = selector => document.querySelector(selector);
  return {
    form,
    home: pick('[data-booking-home]'),
    dialog: document.getElementById('booking-dialog'),
    slot: pick('[data-booking-slot]'),
    types: pick('[data-booking-types]'),
    days: pick('[data-booking-days]'),
    slots: pick('[data-booking-slots]'),
    summary: pick('[data-booking-summary]'),
    live: pick('[data-booking-live]'),
    done: pick('[data-booking-done]'),
    doneList: pick('[data-booking-done-list]'),
    doneWa: pick('[data-booking-wa]'),
    copyStatus: pick('[data-booking-copy-status]'),
  };
};

const createBooking = ui => {
  const { form } = ui;
  const fields = form.elements;
  let lastResult = null; // { data, result } de la última reserva enviada
  let returnFocus = null;

  const selectedTipo = () => findTipo(radioValue(form, 'tipo'));
  const schedule = () => scheduleFor(selectedTipo());
  const announce = text => { ui.live.textContent = text; };

  const setGroupError = (name, invalid) => {
    const error = document.getElementById(`booking-${name}-error`);
    if (error) error.hidden = !invalid;
    form.querySelectorAll(`input[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', String(invalid)));
  };

  const updateSummary = () => {
    const fecha = radioValue(form, 'fecha');
    const hora = radioValue(form, 'hora');
    const parts = [selectedTipo()?.nombre, fecha && formatDateLong(fecha), hora && formatHora(hora)].filter(Boolean);
    ui.summary.hidden = parts.length === 0;
    ui.summary.replaceChildren(icon('ph-calendar-check'), h('span', {}, parts.join(' · ')));
  };

  const refreshCalendar = () => {
    const keepDate = radioValue(form, 'fecha');
    const keepHour = radioValue(form, 'hora');
    renderDays(ui.days, schedule(), keepDate);
    const date = radioValue(form, 'fecha'); // vacío si el día elegido ya no está disponible
    renderSlots(ui.slots, date, schedule(), date === keepDate ? keepHour : '');
    updateSummary();
  };

  return {
    ui, form, fields, setGroupError, updateSummary, refreshCalendar, announce,
    getLast: () => lastResult,
    setLast: value => { lastResult = value; },
    getReturnFocus: () => returnFocus,
    setReturnFocus: el => { returnFocus = el; },
  };
};

const validateBooking = ctx => {
  const { fields, form } = ctx;
  const missing = ['tipo', 'fecha', 'hora'].filter(name => {
    const empty = !radioValue(form, name);
    ctx.setGroupError(name, empty);
    return empty;
  });
  const fieldsOk = validateFields([fields.nombre, fields.celular, fields.consentimiento]);
  if (missing.length) form.querySelector(`input[name="${missing[0]}"]:not(:disabled)`)?.focus();
  return missing.length === 0 && fieldsOk;
};

const readBooking = form => Object.freeze({
  id: newBookingId(),
  tipo: findTipo(radioValue(form, 'tipo')),
  fecha: radioValue(form, 'fecha'),
  hora: radioValue(form, 'hora'),
  nombre: form.elements.nombre.value.trim().replace(/\s+/g, ' '),
  celular: form.elements.celular.value,
  motivo: form.elements.motivo.value.trim().replace(/\s+/g, ' '),
  creado: new Date().toISOString(),
});

const rememberPatient = (fields, data) => {
  if (fields.recordar.checked) patientStore.write({ nombre: data.nombre, celular: data.celular });
  else patientStore.clear();
};

const showDone = (ctx, data, result) => {
  const { ui } = ctx;
  ctx.setLast({ data, result });
  renderDoneList(ui.doneList, data);
  ui.doneWa.href = result.url;
  ui.copyStatus.textContent = '';
  ui.form.hidden = true;
  ui.done.hidden = false;
  ui.done.focus();
};

const handleSubmit = (ctx, event) => {
  event.preventDefault();
  const { fields } = ctx;
  if (fields.empresa.value) return; // honeypot lleno: probable bot, no se envía nada
  if (!validateBooking(ctx)) {
    ctx.announce('Revisa los campos marcados.');
    return;
  }
  const data = readBooking(ctx.form);
  rememberPatient(fields, data);
  submitBooking(data)
    .then(result => showDone(ctx, data, result))
    .catch(() => ctx.announce('No pudimos completar la reserva. Escríbenos por WhatsApp, por favor.'));
};

const handleChange = (ctx, { target }) => {
  const { form } = ctx;
  if (target.name === 'tipo') {
    ctx.setGroupError('tipo', false);
    ctx.refreshCalendar();
  }
  if (target.name === 'fecha') {
    ctx.setGroupError('fecha', false);
    renderSlots(ctx.ui.slots, radioValue(form, 'fecha'), scheduleFor(findTipo(radioValue(form, 'tipo'))), '');
    ctx.announce(`Elegiste el ${formatDateLong(radioValue(form, 'fecha'))}. Ahora elige la hora.`);
  }
  if (target.name === 'hora') {
    ctx.setGroupError('hora', false);
    ctx.announce(`Hora elegida: ${formatHora(radioValue(form, 'hora'))}.`);
  }
  if (target.type === 'checkbox' && target.checked) setFieldError(target, false);
  ctx.updateSummary();
};

const handleInput = ({ target }) => {
  if (target.name === 'celular') target.value = sanitizePhone(target.value);
  if (target.name === 'motivo') delete target.dataset.auto; // el paciente lo editó: no se reemplaza
  if (target.getAttribute('aria-invalid') === 'true' && target.checkValidity()) setFieldError(target, false);
};

const resetBooking = ctx => {
  const { ui, fields } = ctx;
  const remembered = patientStore.read();
  ui.form.reset();
  if (remembered) {
    fields.nombre.value = remembered.nombre || '';
    fields.celular.value = remembered.celular || '';
    fields.recordar.checked = true;
  }
  ['tipo', 'fecha', 'hora'].forEach(name => ctx.setGroupError(name, false));
  ctx.refreshCalendar();
  ui.done.hidden = true;
  ui.form.hidden = false;
};

/** Preselecciona tipo y motivo según el botón que abrió la agenda */
const applyTrigger = (ctx, trigger) => {
  const { fields } = ctx;
  const tipo = trigger?.dataset.book;
  if (tipo && findTipo(tipo)) {
    const radio = ctx.form.querySelector(`input[name="tipo"][value="${tipo}"]`);
    if (radio) radio.checked = true;
  }
  const motivo = trigger?.dataset.motivo;
  if (motivo && (!fields.motivo.value || fields.motivo.dataset.auto === 'true')) {
    fields.motivo.value = motivo;
    fields.motivo.dataset.auto = 'true';
  }
  ctx.refreshCalendar();
};

const focusFirstStep = ctx => {
  const { form } = ctx;
  const target = radioValue(form, 'tipo')
    ? form.querySelector('input[name="fecha"]:not(:disabled)')
    : form.querySelector('input[name="tipo"]');
  target?.focus({ preventScroll: true });
};

const openBooking = (ctx, trigger) => {
  const { ui } = ctx;
  if (!ui.done.hidden) resetBooking(ctx);
  applyTrigger(ctx, trigger);

  // Sin <dialog> (navegadores antiguos): se lleva al usuario a la sección
  if (!ui.dialog || typeof ui.dialog.showModal !== 'function') {
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' });
    focusFirstStep(ctx);
    return;
  }
  ctx.setReturnFocus(trigger);
  ui.slot.append(ui.form, ui.done);
  ui.dialog.showModal();
  ui.slot.scrollTop = 0;
  focusFirstStep(ctx);
};

const bindDialog = ctx => {
  const { ui } = ctx;
  if (!ui.dialog) return;
  ui.dialog.addEventListener('close', () => {
    ui.home.append(ui.form, ui.done);
    ctx.getReturnFocus()?.focus({ preventScroll: true });
  });
  // Clic en el fondo oscuro = cerrar
  ui.dialog.addEventListener('click', event => { if (event.target === ui.dialog) ui.dialog.close(); });
  ui.dialog.querySelector('[data-booking-close]')?.addEventListener('click', () => ui.dialog.close());
};

const copyBookingDetails = ctx => {
  const last = ctx.getLast();
  const { copyStatus } = ctx.ui;
  if (!last) return;
  const show = text => {
    copyStatus.textContent = text;
    setTimeout(() => { copyStatus.textContent = ''; }, COPY_STATUS_MS);
  };
  if (!navigator.clipboard) {
    show('Tu navegador no permite copiar. Usa el botón de WhatsApp.');
    return;
  }
  navigator.clipboard.writeText(buildBookingMessage(last.data))
    .then(() => show('Detalles copiados.'))
    .catch(() => show('No se pudo copiar. Usa el botón de WhatsApp.'));
};

const bindDoneActions = ctx => {
  const { done } = ctx.ui;
  done.querySelector('[data-booking-ics]')?.addEventListener('click', () => {
    const last = ctx.getLast();
    if (last) downloadIcs(last.data);
  });
  done.querySelector('[data-booking-copy]')?.addEventListener('click', () => copyBookingDetails(ctx));
  done.querySelector('[data-booking-reset]')?.addEventListener('click', () => {
    resetBooking(ctx);
    focusFirstStep(ctx);
  });
};

const initBooking = () => {
  const ui = queryBookingElements();
  if (!ui) return;
  const ctx = createBooking(ui);

  renderTypes(ui.types);
  resetBooking(ctx);

  ui.form.addEventListener('submit', event => handleSubmit(ctx, event));
  ui.form.addEventListener('change', event => handleChange(ctx, event));
  ui.form.addEventListener('input', handleInput);
  bindDialog(ctx);
  bindDoneActions(ctx);

  // Todos los botones "Agendar" del sitio abren el mismo flujo
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-book]');
    if (!trigger || ui.form.contains(trigger)) return;
    event.preventDefault();
    openBooking(ctx, trigger);
  });
};

document.addEventListener('DOMContentLoaded', initBooking);
