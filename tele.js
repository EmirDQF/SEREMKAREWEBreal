'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   HORA DE LIMA + ESTADO DE TELECONSULTA EN VIVO
   Depende de site-config.js (SITE). Expone LimaTime, que también usa booking.js.
   Siempre calcula con la hora de Lima (America/Lima), no con la del navegador.
═══════════════════════════════════════════════════════════════════════════ */

const DAY_NAMES_ES = Object.freeze(['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']);
const WEEKDAY_INDEX = Object.freeze({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
const TELE_REFRESH_MS = 60 * 1000;
const TELE_LOOKAHEAD_DAYS = 14;

const LimaTime = (() => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SITE.horario.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });

  /** @param {string} hhmm "19:30" @returns {number|null} minutos desde 00:00 */
  const toMinutes = hhmm => {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(hhmm));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };

  /** @param {number} minutes @returns {string} "7:00 pm" */
  const formatMinutes = minutes => {
    const h24 = Math.floor(minutes / 60);
    const h12 = h24 % 12 || 12;
    return `${h12}:${String(minutes % 60).padStart(2, '0')} ${h24 < 12 ? 'am' : 'pm'}`;
  };

  /** Fecha y hora actuales en Lima: { iso: 'YYYY-MM-DD', weekday: 0-6, minutes } */
  const now = (date = new Date()) => {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return {
      iso: `${parts.year}-${parts.month}-${parts.day}`,
      weekday: WEEKDAY_INDEX[parts.weekday],
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
  };

  /** Suma días de calendario a una fecha ISO (independiente de la zona horaria) */
  const addDays = (iso, days) => {
    const date = new Date(`${iso}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const weekdayOf = iso => new Date(`${iso}T12:00:00Z`).getUTCDay();

  /** Día con atención: día de la semana habilitado y que no sea feriado */
  const isOpenDay = iso => SITE.horario.dias.includes(weekdayOf(iso)) && !SITE.agenda.feriados.includes(iso);

  return Object.freeze({ toMinutes, formatMinutes, now, addDays, weekdayOf, isOpenDay });
})();

/**
 * Estado de la teleconsulta en un momento dado (hora de Lima).
 * @returns {{ open: boolean, next: { iso: string, offset: number } | null }}
 */
const getTeleStatus = (now = LimaTime.now()) => {
  const start = LimaTime.toMinutes(SITE.horario.desde);
  const end = LimaTime.toMinutes(SITE.horario.hasta);
  const openToday = LimaTime.isOpenDay(now.iso);

  if (openToday && now.minutes >= start && now.minutes < end) return { open: true, next: null };

  const firstOffset = openToday && now.minutes < start ? 0 : 1;
  for (let offset = firstOffset; offset <= TELE_LOOKAHEAD_DAYS; offset++) {
    const iso = LimaTime.addDays(now.iso, offset);
    if (LimaTime.isOpenDay(iso)) return { open: false, next: { iso, offset } };
  }
  return { open: false, next: null };
};

/** "hoy" · "mañana" · "el lunes" */
const describeDay = ({ iso, offset }) => {
  if (offset === 0) return 'hoy';
  if (offset === 1) return 'mañana';
  return `el ${DAY_NAMES_ES[LimaTime.weekdayOf(iso)]}`;
};

const describeTeleStatus = status => {
  const desde = LimaTime.formatMinutes(LimaTime.toMinutes(SITE.horario.desde));
  const hasta = LimaTime.formatMinutes(LimaTime.toMinutes(SITE.horario.hasta));
  if (status.open) {
    return { state: 'open', pill: 'Atendiendo ahora', main: 'Atendiendo ahora', next: `Hasta las ${hasta}, hora de Lima` };
  }
  return {
    state: 'closed',
    pill: `Teleconsulta · ${SITE.horario.corto}`,
    main: `Horario de atención: ${desde} – ${hasta} (Déjanos tu mensaje para agendar)`,
    next: status.next ? `Próxima atención: ${describeDay(status.next)} a las ${desde}` : '',
  };
};

const renderTeleStatus = () => {
  const view = describeTeleStatus(getTeleStatus());

  document.querySelectorAll('[data-tele-status]').forEach(box => {
    box.dataset.state = view.state;
    const main = box.querySelector('[data-tele-status-text]');
    const next = box.querySelector('[data-tele-status-next]');
    if (main && main.textContent !== view.main) main.textContent = view.main;
    if (next) {
      next.textContent = view.next;
      next.hidden = !view.next;
    }
  });

  document.querySelectorAll('[data-tele-pill]').forEach(pill => {
    pill.dataset.state = view.state;
    const label = pill.querySelector('[data-tele-pill-text]');
    if (label) label.textContent = view.pill;
  });
};

const initTeleStatus = () => {
  if (!document.querySelector('[data-tele-status], [data-tele-pill]')) return;
  renderTeleStatus();

  let timer = setInterval(renderTeleStatus, TELE_REFRESH_MS);
  // Sin trabajo en segundo plano: se pausa con la pestaña oculta y se actualiza al volver
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (document.hidden) return;
    renderTeleStatus();
    timer = setInterval(renderTeleStatus, TELE_REFRESH_MS);
  });
};

document.addEventListener('DOMContentLoaded', initTeleStatus);
