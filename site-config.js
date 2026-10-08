'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   DATOS DEL SITIO — EDITA SOLO ESTE ARCHIVO
   Todo lo que cambia (teléfono, WhatsApp, horario, dirección, datos del doctor,
   agenda) vive aquí. tele.js, booking.js y main.js lo leen y actualizan la página.

   Los valores entre corchetes, p. ej. '[CMP]', son PENDIENTES: la web los muestra
   resaltados en amarillo hasta que pongas el dato real.
═══════════════════════════════════════════════════════════════════════════ */

const SITE = Object.freeze({
  marca: 'SERMEKARE',
  razonSocial: 'Servicios Médicos Kare SAC',
  ruc: '[RUC]',
  dominio: 'https://www.sermekare.pe', // PENDIENTE confirmar antes de publicar

  doctor: Object.freeze({
    nombre: 'Dr. Daniel Collcca',
    nombreCorto: 'Dr. Collcca',
    especialidad: 'Médico Reumatólogo',
    cmp: '[CMP]',
    rne: '[RNE]',
    foto: 'assets/img/dr-collcca.webp',
    // Mensaje de voz (mp3). Vacío = el reproductor queda oculto. Ej.: 'assets/audio/dr-collcca-presentacion.mp3'
    audio: '',
    // Ej.: ['Médico cirujano — Universidad …', 'Especialidad en Reumatología — …']
    formacion: Object.freeze([]),
  }),

  // Formato internacional sin "+" ni espacios: 51 + 9 dígitos. Ej.: '51987654321'
  whatsapp: '[NUMERO_WHATSAPP]',
  // Formato para llamar: '+51987654321'. telefonoVisible es como se lee en pantalla.
  telefono: '[TELEFONO]',
  telefonoVisible: '[TELEFONO]',
  email: 'citas@sermekare.pe', // PENDIENTE confirmar que el buzón existe

  direccion: Object.freeze({
    calle: '[DIRECCION]',
    distrito: '[DISTRITO]',
    ciudad: 'Lima',
    pais: 'Perú',
    // Enlace "Cómo llegar" de Google Maps (https://maps.app.goo.gl/…)
    mapa: '',
  }),

  // Horario único de teleconsulta y llamadas. Días: 0 = domingo … 6 = sábado.
  horario: Object.freeze({
    timezone: 'America/Lima',
    dias: Object.freeze([1, 2, 3, 4, 5, 6]),
    desde: '19:00',
    hasta: '21:00',
    corto: 'Lun–Sáb 7–9 pm',
    largo: 'Lunes a sábado, 7:00 pm – 9:00 pm',
  }),

  agenda: Object.freeze({
    duracionMin: 20,
    diasAdelante: 14,
    // Feriados nacionales del Perú (no se agenda). Revisa y amplía esta lista cada año.
    feriados: Object.freeze([
      '2026-10-08', '2026-11-01', '2026-12-08', '2026-12-09', '2026-12-25',
      '2027-01-01', '2027-03-25', '2027-03-26', '2027-05-01', '2027-06-07',
      '2027-06-29', '2027-07-23', '2027-07-28', '2027-07-29', '2027-08-06',
      '2027-08-30', '2027-10-08', '2027-11-01', '2027-12-08', '2027-12-09',
      '2027-12-25',
    ]),
    // Tipos de cita. "horario" opcional: si falta, se usa SITE.horario.
    // PENDIENTE: confirmar el horario de la atención presencial (hoy usa el mismo).
    tipos: Object.freeze([
      Object.freeze({ id: 'teleconsulta', nombre: 'Teleconsulta', detalle: 'Videollamada con el Dr. Collcca', icono: 'ph-video-camera', modalidad: 'virtual' }),
      Object.freeze({ id: 'presencial', nombre: 'Consulta presencial', detalle: 'En el consultorio de Lima', icono: 'ph-stethoscope', modalidad: 'presencial' }),
      Object.freeze({ id: 'seguimiento', nombre: 'Consulta de seguimiento', detalle: 'Control de tu tratamiento', icono: 'ph-arrows-clockwise', modalidad: 'virtual' }),
      Object.freeze({ id: 'densitometria', nombre: 'Densitometría ósea', detalle: 'Examen presencial', icono: 'ph-bone', modalidad: 'presencial' }),
      Object.freeze({ id: 'ecografia', nombre: 'Ecografía articular', detalle: 'Examen presencial', icono: 'ph-waves', modalidad: 'presencial' }),
    ]),
  }),

  redes: Object.freeze({
    facebook: '',  // PENDIENTE: URL real o dejar vacío para ocultar el ícono
    instagram: '',
    linkedin: '',
  }),

  mensajes: Object.freeze({
    teleconsulta: 'Hola Dr. Daniel Collcca, deseo agendar una teleconsulta (Horario: 7pm a 9pm).',
    general: 'Hola, vengo de la página web de SERMEKARE y deseo agendar una cita.',
  }),
});

/** true si el valor sigue siendo un marcador pendiente ('[ALGO]') o está vacío */
const isPending = value => !value || /^\[.*\]$/.test(String(value));

/** Enlace wa.me con mensaje. Sin número real abre WhatsApp para elegir el contacto. */
const waLink = (text = SITE.mensajes.general) => {
  const number = isPending(SITE.whatsapp) ? '' : SITE.whatsapp;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

/** Enlace tel: (null si el teléfono aún es un marcador) */
const telLink = () => (isPending(SITE.telefono) ? null : `tel:${SITE.telefono}`);
