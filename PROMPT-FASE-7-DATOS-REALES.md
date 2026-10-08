# SUPER PROMPT DEFINITIVO — SERMEKARE · Fase 7: datos reales de KARE SAC, 3 sedes y densitometría ósea

> **Cómo usarlo:** llena el bloque «DATOS QUE FALTAN» (lo que no sepas, déjalo en blanco),
> abre Claude Code **dentro del repo** `SEREMKAREWEB` y pega todo desde «ROL» hasta el final.

---

## DATOS QUE FALTAN (si quedan en blanco, Claude usa `// PROVISIONAL` y te pregunta)

| Dato | Respuesta |
|---|---|
| WhatsApp principal (botones genéricos) | |
| WhatsApp de cada sede (o «los 3 atienden todas») | Los Olivos: · Callao: · Puente Piedra: |
| Horario de cada sede | Los Olivos: · Callao: · Puente Piedra: |
| Densitómetro: marca y modelo exactos (por sede si difiere) | |
| ¿Hace VFA, composición corporal, cadera con prótesis, antebrazo? | |
| N.° de puerta en Puente Piedra (Jr. Faustino Sarmiento N.° ___) | |
| Distrito exacto de la sede Callao (¿Callao Cercado o Bellavista?) | |
| RUC (obligatorio para el Libro de Reclamaciones) | |
| Correo, dominio y redes sociales reales | |
| Precio de la densitometría (o «no publicar») | |
| ¿Solo densitometría, o también reumatología, ecografía, infiltraciones, terapia física…? | |
| Nombre comercial en la web: «SERMEKARE» o «KARE SAC» | |
| Logo en vector (SVG/AI/PDF) → copiar en `public/images/brand/` | |

---

## ROL

Eres el desarrollador principal del proyecto Next.js **«Sermekare Web»**: Senior Frontend
Engineer (Next.js / React 19 / TypeScript estricto), especialista en SEO local para salud
(YMYL, E-E-A-T, schema.org) y accesibilidad WCAG 2.2 AA. Escribes en español de Perú, con
tono cálido y claro para pacientes adultos mayores y sus hijos, y profesional para médicos.

## CONTEXTO DEL PROYECTO

- Repo: https://github.com/EmirDQF/SEREMKAREWEB (rama `main`). Si no estás dentro, clónalo.
  **No** trabajes en la carpeta local `SERMEKARE SAC WEB` (es un sitio estático antiguo).
- Stack: Next.js 16.3.8 (App Router), React 19.2, TypeScript, Tailwind CSS 4,
  @react-three/fiber + drei, motion, lenis, radix-ui, lucide-react, Vitest.
- **Antes de escribir código lee `AGENTS.md` y las guías de `node_modules/next/dist/docs/`:**
  esta versión de Next.js tiene cambios incompatibles con lo que conoces.
- Fases 1-6 terminadas (ver `git log`): Home con 3D, `/densitometria-osea`, `/servicios`,
  `/tratamientos`, `/especialidades`, `/staff`, `/blog`, `/contacto`, legales, Libro de
  Reclamaciones, sitemap de 42 rutas, Lighthouse 100 en Accesibilidad, Buenas prácticas y SEO.
- Los datos de negocio viven en `data/` (sobre todo `data/site.ts`) marcados `// PROVISIONAL`
  (hoy: Av. Aviación 2450 San Borja, `(01) 640 0000`, WhatsApp `51999000000`, correo y redes
  de prueba, estadísticas inventadas).
- Comandos: `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`.

### Archivos clave (ya existen)

- Datos y tipos: `data/site.ts`, `data/densitometry.ts`, `data/services.ts`, `data/doctors.ts`,
  `data/navigation.ts`, `data/faq.ts`, `data/legal.ts`, `types/medical.ts`
- Lógica: `lib/whatsapp.ts` (enlaces y mensaje de cita), `lib/schedule.ts` (abierto/cerrado),
  `lib/schema.ts` (JSON-LD), `lib/seo.ts`, `lib/complaints.ts`, `lib/use-open-status.ts`
- Contacto: `components/shared/WhatsAppFloat.tsx`, `components/layout/Footer.tsx`,
  `components/layout/TopBar.tsx`, `components/layout/MobileActionBar.tsx`,
  `components/sections/LocationCTA.tsx`, `components/sections/AppointmentForm.tsx`,
  `app/contacto/page.tsx`
- Densitometría: `app/densitometria-osea/page.tsx`, `components/sections/BoneDensitySection.tsx`,
  `components/densitometry/*` (`BookDensitometryButton`, `DensitometrySteps`, `TScoreGauge`…)
- Marca: `components/layout/Logo.tsx`, `lib/theme.ts`, `app/globals.css`, `app/icon.svg`
- SEO: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`, `app/layout.tsx`
- Tests: `tests/*.test.ts` (whatsapp, schedule, schema, densitometry, content-coverage…)

## DATOS OFICIALES (de las tarjetas de presentación de la empresa)

**Empresa:** KARE SAC — Servicios Médicos. **«Especialistas en Densitometría Ósea.»**
Logo: columna vertebral estilizada en degradado verde → azul sobre hojas/manos verdes.
Colores: azul marino (títulos), azul medio, verde y blanco.

**Propuesta de valor (base del copy, textual de la tarjeta):**
- «Evaluación precisa para la detección oportuna de osteoporosis.»
- Áreas evaluadas: **Columna** y **Caderas**.
- «Resultados claros y confiables.» · «Atención con cita previa.» ·
  «Apoyo al diagnóstico médico.» · «Servicio orientado a médicos y pacientes.»
- CTA: «Agenda tu evaluación.»
- Ya confirmado en `data/densitometry.ts`: no exige orden médica; resultados el mismo día o en 24 h.

**WhatsApp (la tarjeta no tiene teléfono fijo ni correo):**

| Visible | Para `wa.me` |
|---|---|
| +51 994 931 540 | `51994931540` |
| +51 945 553 676 | `51945553676` |
| +51 922 281 624 | `51922281624` |

Si no se indicó otro, el principal es `51994931540`. Elimina el fijo `(01) 640 0000`; no
inventes otro (si la UI necesita `tel:`, usa el WhatsApp principal).

**Sedes.** Entre corchetes van las correcciones de errores de imprenta de la tarjeta
(«Lafredo», «Sermiento», «Lanfrranco»): márcalas `// CONFIRMAR` hasta que el cliente las valide.

| id | Sede | Dirección normalizada | Referencia (mostrar destacada) |
|---|---|---|---|
| `los-olivos` | Los Olivos | Av. [Alfredo] Mendiola 5875, Urb. Villasol, Los Olivos, Lima | — |
| `callao` | Callao | Av. Guardia Chalaca con [Jr./Calle Los] Topacios, [Bellavista], Callao | Frente al Hospital Nacional Daniel Alcides Carrión |
| `puente-piedra` | Puente Piedra | Jr. Faustino [Sarmiento] N.° ___, Puente Piedra, Lima | Frente al Hospital Carlos [Lanfranco] La Hoz |

La referencia del hospital es lo que más ayuda al paciente a llegar y al SEO local: úsala en la
UI, en `howToArrive`, en la búsqueda de Google Maps y en el JSON-LD.

## REGLAS NO NEGOCIABLES

1. **No inventes datos médicos ni de negocio**: marca del equipo, precios, horarios, médicos,
   CMP/RNE, estadísticas, reseñas, años, seguros, coordenadas. Lo que falte va con
   `// PROVISIONAL` o `// CONFIRMAR` y a la lista de pendientes.
2. **No borres contenido existente de golpe.** Si algo no encaja con la empresa real (8
   especialistas, sala de infusión, `InsuranceMarquee`, «+15 000 consultas», testimonios,
   staff), lístalo y **pregúntame** antes de retirarlo u ocultarlo.
3. Sin `aggregateRating` ni testimonios falsos. Sin promesas de curación.
4. Lighthouse sigue en 100 (A11y, Buenas prácticas, SEO), CLS 0 y LCP «bueno». Los mapas de
   Google **no** se cargan de entrada: fachada que carga el iframe solo al hacer clic.
5. Accesibilidad: el nombre accesible de cada enlace de WhatsApp empieza por el texto visible y
   avisa que abre en otra pestaña; contraste AA; foco visible; `prefers-reduced-motion`;
   selectores operables con teclado y cerrables con Esc.
6. Respeta la Ley 29733 ya implementada (consentimiento del formulario).
7. TDD: primero el test que falla, luego el código. Cobertura ≥ 80 % en `lib/`.
8. Respeta la arquitectura: datos en `data/`, tipos en `types/medical.ts`, lógica pura en
   `lib/`, Tailwind 4. Funciones < 50 líneas, archivos < 800, inmutabilidad, constantes con
   nombre, sin `console.log`, comentarios en español como el resto del código.
9. Git: rama `feat/fase-7-datos-reales`, commits convencionales en español como los
   anteriores. **No hagas push ni merge sin mi aprobación.**

## PASO 0 — DIAGNÓSTICO (sin tocar código)

1. Lee `AGENTS.md` y los archivos clave de arriba.
2. Busca todos los usos de `site.address`, `site.phone`, `site.whatsapp`, `site.hours`,
   `site.email`, `site.stats`, `PROVISIONAL`, `San Borja`, `Aviación`, `999000000`, `6400000`.
3. Entrégame:
   - **Mapa de impacto:** archivo → qué cambia.
   - **Contenido actual vs. empresa real:** servicios, páginas, médicos, estadísticas y seguros
     que la tarjeta no respalda, con tu recomendación (mantener / ocultar / retirar).
   - **Preguntas en un solo bloque** (máx. 8), cada una con tu recomendación.
4. Empieza el Paso 1 de inmediato. Espera mi respuesta antes del Paso 4 (cambio de enfoque)
   y antes de retirar cualquier página.

## PASO 1 — MODELO DE DATOS MULTISEDE (TDD) · `types/medical.ts`, `data/site.ts`, `lib/`

- Crea el tipo `ClinicLocation`: `id`, `name`, `street`, `district`, `city`, `region`,
  `reference`, `whatsapp: { display, number }`, `hours: OpeningHours`, `mapsUrl`,
  `mapsEmbedUrl`, `geo?: { lat, lng }` (solo si se confirma), `howToArrive`, `services`
  (estudios disponibles en esa sede), `provisional: boolean`.
- En `SiteConfig`: agrega `legalName` («KARE SAC»), `taxId?` (RUC), `locations`,
  `primaryLocationId` y `whatsappLines` (las 3 líneas con su etiqueta). Reemplaza `address`
  y `phone`. Helpers en `lib/`: `getLocation(id)`, `primaryLocation()`, `allWhatsAppLines()`.
  Migra **todos** los consumidores y elimina los campos viejos (sin código muerto).
- `mapsUrl`: `https://www.google.com/maps/search/?api=1&query=` + dirección + referencia del
  hospital, codificado con `encodeURIComponent`.
- Tests: helpers de sede, enlaces `wa.me` de las 3 líneas, horario por sede en
  `getOpenStatus`, y un test de contenido que falle si queda `999000000`, `6400000`,
  `San Borja` o `Aviación` en `data/`, `lib/`, `components/` o `app/`.

## PASO 2 — WHATSAPP Y AGENDA · `lib/whatsapp.ts`, `WhatsAppFloat.tsx`, `AppointmentForm.tsx`, `MobileActionBar.tsx`, `TopBar.tsx`

- `WhatsAppFloat`: al tocarlo despliega un selector con las 3 sedes (nombre, referencia y
  número) y abre el WhatsApp de la sede elegida; incluye «No sé cuál me queda cerca» →
  línea principal. Accesible (botón con `aria-expanded`, lista navegable, Esc cierra, foco
  devuelto al botón).
- `AppointmentForm`: nuevo campo obligatorio **«Sede»** (radio cards con distrito + referencia
  del hospital, más «La más cercana / no sé»). Validación en `validateAppointment`.
- `buildAppointmentMessage`: agrega «• Sede: Callao (frente al Hosp. Daniel A. Carrión)» y
  envía al número de esa sede. Deja de usar `site.address.district`.
- Mensajes prellenados por estudio: «Hola KARE, quisiera agendar una densitometría de columna
  y cadera en la sede de Los Olivos.» (`BookDensitometryButton` incluido).
- `TopBar` y `MobileActionBar`: línea principal + acceso al selector de sede.
- «Abierto ahora / Abrimos mañana a las…» solo si el horario está confirmado; si es
  provisional, ocúltalo en lugar de mostrar un dato falso.

## PASO 3 — SEDES EN TODO EL SITIO · `LocationCTA.tsx`, `app/contacto/page.tsx`, `Footer.tsx`, nuevas `/sedes`

- `LocationCTA`: tarjetas interactivas (`TiltCard`/`SpotlightCard` existentes) para Los
  Olivos, Callao y Puente Piedra: dirección, referencia destacada, horario, botón de WhatsApp
  de la sede y «Cómo llegar» (Google Maps en pestaña nueva).
- `app/contacto/page.tsx`: las 3 sedes con dirección, referencia, horario, WhatsApp directo
  (`https://wa.me/51…`) y mapa con fachada clic-para-cargar.
- `Footer.tsx`: las 3 sedes y los 3 WhatsApp. El NAP (nombre, dirección, teléfono) debe ser
  **idéntico** en todo el sitio porque sale de los mismos datos.
- Nuevas `/sedes` y `/sedes/[slug]` (SSG con `generateStaticParams`), títulos
  «Densitometría ósea en Los Olivos», «… en el Callao», «… en Puente Piedra», con contenido
  propio por sede (referencias, accesos, transporte cercano marcado `CONFIRMAR`), no el
  mismo texto con el nombre cambiado. Enlázalas desde `data/navigation.ts`, migas de pan y
  `app/sitemap.ts`.
- Paleta: propón tokens `brand-navy` y `brand-green` (colores de la tarjeta) en
  `lib/theme.ts` / `app/globals.css` y muéstrame un antes/después antes de cambiarlos de forma global.

## PASO 4 — ENFOQUE «ESPECIALISTAS EN DENSITOMETRÍA ÓSEA» (tras mi confirmación)

- `data/densitometry.ts` + `app/densitometria-osea/page.tsx` + `BoneDensitySection.tsx`:
  - Áreas evaluadas explícitas: **Columna lumbar** y **Caderas (fémur proximal)**, con qué
    detecta cada una, y la evaluación preventiva y diagnóstica de osteoporosis.
  - Estudios adicionales (VFA, cadera con prótesis, composición corporal) **solo si el equipo
    los hace**; si no está confirmado, quítalos de `relatedServices` o márcalos `CONFIRMAR`.
  - Ficha del equipo con marca y modelo **solo** si están confirmados; si no, «densitómetro DXA».
  - Franja de confianza con los 4 sellos de la tarjeta e iconos de lucide.
- Home (`Hero`, `HeroHeadline`, metadatos de `app/layout.tsx`): mensaje principal = detección
  oportuna de osteoporosis con densitometría ósea + CTA «Agenda tu evaluación».
- Nueva página **`/para-medicos`**: cómo derivar pacientes por WhatsApp, qué incluye el
  informe (T-score, Z-score, imágenes, comparación con estudios previos → `CONFIRMAR`),
  entrega el mismo día o en 24 h, sedes cercanas a hospitales. Tono profesional y breve.

## PASO 5 — SEO LOCAL Y DATOS ESTRUCTURADOS · `lib/schema.ts`, `lib/seo.ts`

- Una `MedicalOrganization` (KARE SAC, `legalName`, `taxID` si hay RUC) + un `MedicalClinic`
  (o `DiagnosticLab`) **por sede** con `@id` propio (`/sedes/<slug>#clinic`),
  `parentOrganization`, `address`, `telephone` (WhatsApp de la sede),
  `openingHoursSpecification` (solo si está confirmado), `hasMap`, `description` con la
  referencia del hospital, `areaServed` (Los Olivos, Comas, Independencia, San Martín de
  Porres, Callao, Bellavista, Ventanilla, Puente Piedra, Carabayllo, Ancón) y
  `availableService` → `DiagnosticProcedure` «Densitometría ósea (DXA)». Sin `geo` sin
  coordenadas confirmadas.
- Metadatos, `canonical` y Open Graph únicos por página de sede.
- Tests de cada JSON-LD y lista de URLs para probar en el Rich Results Test de Google.
- Checklist para el cliente: 3 fichas de Google Business Profile (una por sede), NAP idéntico
  al sitio, categoría de centro de diagnóstico / densitometría, fotos reales de fachada y equipo.

## PASO 6 — VERIFICACIÓN

1. `npm run lint && npm run typecheck && npm test && npm run build` en verde.
2. Enlaces internos: 0 rotos. Todo `wa.me` apunta a uno de los 3 números oficiales.
3. Búsqueda final: 0 apariciones de `999000000`, `6400000`, `San Borja`, `Aviación`.
4. Prueba en navegador (1440 px y 375 px): selector de `WhatsAppFloat` con teclado,
   formulario → WhatsApp de la sede correcta, fachada del mapa, «Reducir animaciones».
5. Lighthouse (escritorio y móvil) en Home, `/densitometria-osea`, `/contacto`,
   `/sedes/los-olivos` y `/para-medicos`. Si algo baja de 100 en A11y/BP/SEO, corrígelo.
6. Revisión con los agentes `code-reviewer` y `security-reviewer`; corrige CRITICAL y HIGH.

## ENTREGA FINAL

- Resumen de cambios por archivo y capturas antes/después (Home, contacto, una sede, para médicos).
- Resultados de tests, typecheck, build y Lighthouse con cifras.
- **Pendientes del cliente** (todo lo `PROVISIONAL`/`CONFIRMAR`) por prioridad, redactados
  para enviarlos por WhatsApp.
- Commits propuestos. No hagas push hasta que yo lo apruebe.
