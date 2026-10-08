// ═══ DATOS ESTRUCTURADOS (JSON-LD) ═══
// Genera el bloque <script type="application/ld+json"> de index.html a partir de:
//   · site-config.js (SITE): doctor, horario, contacto, dirección, redes
//   · el FAQ visible (#faq-teleconsulta): el FAQPage queda con el MISMO texto
// Los datos pendientes ('[CMP]', '[TELEFONO]'…) se omiten en vez de publicarse.
// Se ejecuta en `npm run build`. Reemplaza lo que haya entre <!-- JSONLD:START --> y <!-- JSONLD:END -->.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const HTML_FILE = path.join(ROOT, 'index.html');
const START = '<!-- JSONLD:START -->';
const END = '<!-- JSONLD:END -->';
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const loadSite = () => {
  const code = fs.readFileSync(path.join(ROOT, 'site-config.js'), 'utf8');
  const context = vm.createContext({});
  vm.runInContext(`${code}\nthis.SITE = SITE; this.isPending = isPending;`, context);
  return { SITE: context.SITE, isPending: context.isPending };
};

const decodeEntities = text => text
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

const stripTags = html => decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

/** Preguntas y respuestas tal como se ven en #faq-teleconsulta */
const readFaq = html => {
  const block = html.slice(html.indexOf('id="faq-teleconsulta"'));
  const items = [...block.matchAll(/<details class="tele-details tele-faq">\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)];
  if (!items.length) throw new Error('No se encontró el FAQ (#faq-teleconsulta)');
  return items.map(([, question, answer]) => ({
    '@type': 'Question',
    name: stripTags(question),
    acceptedAnswer: { '@type': 'Answer', text: stripTags(answer) },
  }));
};

const buildGraph = ({ SITE, isPending }, faq) => {
  const base = SITE.dominio.replace(/\/$/, '');
  const id = hash => `${base}/#${hash}`;
  const known = value => (isPending(value) ? undefined : value);
  const hours = {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: SITE.horario.dias.map(day => DAY_NAMES_EN[day]),
    opens: SITE.horario.desde,
    closes: SITE.horario.hasta,
  };
  const { calle, distrito, ciudad, mapa } = SITE.direccion;
  const sameAs = Object.values(SITE.redes).filter(Boolean);

  return [
    {
      '@type': 'MedicalClinic',
      '@id': id('clinica'),
      name: `${SITE.marca} | ${SITE.razonSocial}`,
      description: `Consulta reumatológica presencial en Lima y teleconsulta en todo el Perú con el ${SITE.doctor.nombre}. Densitometría ósea, ecografía articular e infiltraciones ecoguiadas.`,
      url: `${base}/`,
      image: `${base}/assets/img/og-sermekare.jpg`,
      telephone: known(SITE.telefono),
      email: known(SITE.email),
      address: {
        '@type': 'PostalAddress',
        streetAddress: known(calle),
        addressLocality: known(distrito) || ciudad,
        addressRegion: 'Lima',
        addressCountry: 'PE',
      },
      hasMap: mapa || undefined,
      openingHoursSpecification: [hours],
      medicalSpecialty: 'Rheumatologic',
      areaServed: { '@type': 'Country', name: 'Perú' },
      availableService: [
        { '@type': 'MedicalTest', name: 'Densitometría ósea' },
        { '@type': 'MedicalTest', name: 'Ecografía articular' },
        { '@type': 'MedicalProcedure', name: 'Infiltraciones guiadas por ecografía' },
      ],
      employee: { '@id': id('dr-collcca') },
      sameAs: sameAs.length ? sameAs : undefined,
    },
    {
      '@type': ['Person', 'Physician'],
      '@id': id('dr-collcca'),
      name: SITE.doctor.nombre,
      jobTitle: SITE.doctor.especialidad,
      medicalSpecialty: 'Rheumatologic',
      image: `${base}/${SITE.doctor.foto}`,
      url: `${base}/#medicos`,
      identifier: [
        known(SITE.doctor.cmp) && { '@type': 'PropertyValue', propertyID: 'CMP', value: SITE.doctor.cmp },
        known(SITE.doctor.rne) && { '@type': 'PropertyValue', propertyID: 'RNE', value: SITE.doctor.rne },
      ].filter(Boolean),
      worksFor: { '@id': id('clinica') },
    },
    {
      '@type': 'Service',
      '@id': id('teleconsulta-servicio'),
      name: 'Teleconsulta reumatológica',
      serviceType: 'Teleconsulta reumatológica',
      description: `Consulta reumatológica por videollamada con el ${SITE.doctor.nombre}, ${SITE.horario.largo} (hora de Lima), para pacientes de todo el Perú.`,
      url: `${base}/#teleconsulta`,
      provider: [{ '@id': id('dr-collcca') }, { '@id': id('clinica') }],
      areaServed: { '@type': 'Country', name: 'Perú' },
      hoursAvailable: hours,
      availableChannel: [
        { '@type': 'ServiceChannel', name: 'WhatsApp Videollamada', serviceUrl: known(SITE.whatsapp) && `https://wa.me/${SITE.whatsapp}` },
        { '@type': 'ServiceChannel', name: 'Zoom' },
        { '@type': 'ServiceChannel', name: 'Google Meet' },
      ],
    },
    { '@type': 'FAQPage', '@id': id('faq-teleconsulta'), mainEntity: faq },
    { '@type': 'WebSite', '@id': id('website'), url: `${base}/`, name: SITE.marca, inLanguage: 'es-PE', publisher: { '@id': id('clinica') } },
  ];
};

const main = () => {
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx < 0 || endIdx < startIdx) throw new Error(`Faltan los marcadores ${START} / ${END} en index.html`);

  const graph = buildGraph(loadSite(), readFaq(html));
  // JSON.stringify descarta las claves undefined (datos pendientes)
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2)
    .replace(/</g, '\\u003c') // evita cerrar el <script> desde un texto
    .split('\n').map(line => `    ${line}`).join(eol);
  const block = `${START}${eol}    <script type="application/ld+json">${eol}${json}${eol}    </script>${eol}    `;

  fs.writeFileSync(HTML_FILE, html.slice(0, startIdx) + block + html.slice(endIdx));
  console.log(`JSON-LD: ${graph.length} nodos, ${graph.find(n => n['@type'] === 'FAQPage').mainEntity.length} preguntas`);
};

main();
