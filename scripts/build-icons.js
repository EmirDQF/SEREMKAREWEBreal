// ═══ ÍCONOS PHOSPHOR (subset) ═══
// Genera assets/fonts/phosphor/*.woff2 solo con los íconos que usa el sitio y su CSS.
// Busca clases "ph-<nombre>" en los archivos de SOURCES. Se ejecuta en `npm run build`.
// Para agregar un ícono: úsalo en el HTML/JS (p. ej. class="ph-bold ph-heart") y recompila.
'use strict';

const fs = require('fs');
const path = require('path');
const subsetFont = require('subset-font');

const ROOT = path.resolve(__dirname, '..');
const SOURCES = ['index.html', 'main.js', 'anatomia.js', 'tele.js', 'booking.js', 'site-config.js'];
const PKG = path.join(ROOT, 'node_modules', '@phosphor-icons', 'web', 'src');
const OUT_DIR = path.join(ROOT, 'assets', 'fonts', 'phosphor');
// Ruta de las fuentes vista desde dist/output.css (postcss-import no reescribe url())
const URL_PREFIX = '../assets/fonts/phosphor/';

const WEIGHTS = [
  { dir: 'regular', base: 'ph',      family: 'Phosphor',      file: 'Phosphor' },
  { dir: 'bold',    base: 'ph-bold', family: 'Phosphor-Bold', file: 'Phosphor-Bold' },
  { dir: 'fill',    base: 'ph-fill', family: 'Phosphor-Fill', file: 'Phosphor-Fill' },
];
const NOT_ICONS = new Set(['bold', 'fill', 'light', 'thin', 'duotone']);

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const collectIconNames = () => {
  const names = new Set();
  for (const file of SOURCES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const [, name] of text.matchAll(/(?<![\w-])ph-([a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
      if (!NOT_ICONS.has(name)) names.add(name);
    }
  }
  return [...names].sort();
};

const buildWeight = async (weight, names) => {
  const css = fs.readFileSync(path.join(PKG, weight.dir, 'style.css'), 'utf8');
  const baseRule = css.match(new RegExp(`\\n\\.${escapeRe(weight.base)} \\{[\\s\\S]*?\\n\\}`));
  if (!baseRule) throw new Error(`No se encontró la regla base .${weight.base}`);

  const rules = [];
  const codepoints = [];
  const missing = [];
  for (const name of names) {
    const re = new RegExp(`\\.${escapeRe(weight.base)}\\.ph-${escapeRe(name)}:before \\{\\s*content: "\\\\([0-9a-f]+)";\\s*\\}`);
    const m = css.match(re);
    if (!m) { missing.push(name); continue; }
    codepoints.push(parseInt(m[1], 16));
    rules.push(`.${weight.base}.ph-${name}:before { content: "\\${m[1]}"; }`);
  }

  const font = fs.readFileSync(path.join(PKG, weight.dir, `${weight.file}.woff2`));
  const subset = await subsetFont(font, String.fromCodePoint(...codepoints), { targetFormat: 'woff2' });
  const outName = `${weight.file}.subset.woff2`;
  fs.writeFileSync(path.join(OUT_DIR, outName), subset);

  const fontFace = `@font-face {\n  font-family: "${weight.family}";\n  src: url("${URL_PREFIX}${outName}") format("woff2");\n`
    + '  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}';
  return { css: `${fontFace}\n${baseRule[0].trim()}\n${rules.join('\n')}`, missing, bytes: subset.length };
};

const main = async () => {
  const names = collectIconNames();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const parts = ['/* Generado por scripts/build-icons.js — no editar a mano. Phosphor Icons (MIT). */'];
  const missingAll = new Set(names);
  for (const weight of WEIGHTS) {
    const { css, missing, bytes } = await buildWeight(weight, names);
    parts.push(css);
    names.filter(n => !missing.includes(n)).forEach(n => missingAll.delete(n));
    process.stdout.write(`  ${weight.file}: ${names.length - missing.length} íconos, ${(bytes / 1024).toFixed(1)} KB\n`);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'phosphor.css'), parts.join('\n\n') + '\n');
  if (missingAll.size) {
    process.stderr.write(`  Aviso: clases ph-* que no son íconos de Phosphor: ${[...missingAll].join(', ')}\n`);
  }
};

main().catch(err => {
  process.stderr.write(`build-icons: ${err.message}\n`);
  process.exit(1);
});
