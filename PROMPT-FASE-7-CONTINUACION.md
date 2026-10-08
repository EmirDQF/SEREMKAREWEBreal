# PROMPT — Fase 7 · Continuación: decisiones tomadas, Paso 4 y Paso 6

> Pégalo en la misma sesión de Claude Code (repo `Desktop\SEREMKAREWEB`, rama
> `feat/fase-7-datos-reales`). Si la empresa ya te dio algún dato, escríbelo en
> «DATOS NUEVOS» antes de pegar; si no, déjalo vacío y Claude sigue con lo marcado `CONFIRMAR`.

---

## DATOS NUEVOS (opcional)

- WhatsApp de cada sede:
- Horarios:
- Densitómetro (marca/modelo) y estudios extra que hace:
- N.° de puerta en Puente Piedra / distrito de la sede Callao:
- RUC, correo, dominio, redes:

---

Buen trabajo con los pasos 1-3 y 5. Respondo tus 8 preguntas. **Estas respuestas son mi
aprobación** para aplicarlas sin volver a preguntar. Lo que siga sin dato se queda con
`// CONFIRMAR` y va a la lista de pendientes.

## MIS RESPUESTAS

1. **Enfoque:** la densitometría ósea es la protagonista del sitio. Lo que la tarjeta no
   respalda (reumatología, ecografía, infiltraciones, terapias biológicas, viscosuplementación,
   terapia física, sala de infusión, teleconsulta) se **oculta sin borrarse**. Crea una sola
   fuente de verdad, por ejemplo `confirmed: boolean` en `data/` o un `data/visibility.ts`,
   para poder reactivarlo cambiando un valor.
   - Las páginas ocultas salen del menú, del footer, del sitemap y de todos los enlaces
     internos, y responden `notFound()` (o `noindex` si `notFound` rompe algo; explícame
     cuál elegiste).
   - Requisito: **0 enlaces internos rotos** al terminar.
2. **Contenido no respaldado: ocúltalo ya.** Esto incluye las cifras «+15 000 consultas»,
   «4.9», «+12 años», «8 especialistas» y `reviewsCount`, el `InsuranceMarquee`, y los
   testimonios y el staff de muestra (secciones de la Home, `/testimonios`, `/staff` y
   `/staff/[slug]`).
   - Que la Home no quede con huecos: reemplaza esas secciones con lo que sí es real (los 4
     sellos de la tarjeta, las 3 sedes, el proceso de 4 pasos, la entrega el mismo día o
     en 24 h y que no hace falta orden médica).
3. **Nombre:** marca visible **SERMEKARE**, nombre legal **KARE SAC — Servicios Médicos**
   (`legalName` en el JSON-LD, footer y legales). Muestra «KARE SAC» junto al logo donde
   tenga sentido para que coincida con la tarjeta física. Usa el mismo nombre que irá en las
   3 fichas de Google Business Profile.
4. **WhatsApp:** mientras no haya asignación por sede, las 3 sedes usan la línea principal
   `51994931540`. En `/contacto` y en el footer muestra las 3 líneas oficiales como
   «Líneas de atención», sin asociarlas a ninguna sede.
5. **Horario:** sigue oculto (ni indicador «Abierto ahora» ni `openingHoursSpecification`)
   hasta tener datos. Muestra «Atención con cita previa — escríbenos por WhatsApp».
6. **Direcciones:** se mantienen «Alfredo», «Sarmiento» y «Lanfranco» con `// CONFIRMAR`. No
   publiques número de puerta en Puente Piedra ni el distrito «Bellavista» hasta confirmarlos
   (usa «Callao» y la referencia del hospital).
7. **Correo y redes de prueba: sí, quítalos** del JSON-LD (`email`, `sameAs`) y también de la
   UI (footer, contacto, `TopBar`, compartir). No dejes íconos que lleven a perfiles que no
   existen. Que se puedan reactivar desde `data/site.ts` cuando lleguen los reales.
8. **`@vitest/coverage-v8`: sí, instálalo** como `devDependency`, con la misma versión mayor
   que `vitest`. Agrega el script `test:coverage` y un umbral del 80 % para `lib/` en
   `vitest.config.mts`. Si `lib/` no llega al 80 %, agrega los tests que falten.

## PASO 4 — ENFOQUE «ESPECIALISTAS EN DENSITOMETRÍA ÓSEA» (ya aprobado)

- **Home:** el mensaje principal pasa a ser la densitometría ósea.
  - Título SEO de la Home: algo como «Densitometría ósea en Lima Norte y Callao | SERMEKARE».
    Hoy dice «Reumatólogo en Lima Norte y Callao».
  - H1 basado en «Evaluación precisa para la detección oportuna de osteoporosis».
  - CTA principal «Agenda tu evaluación».
  - Revisa `Hero`, `HeroHeadline`, `HeroVisual`, `app/layout.tsx`, `lib/seo.ts` y
    `app/opengraph-image.tsx`.
  - Reutiliza las escenas 3D existentes que encajen (`BoneDensity3D`, `DxaScanFX`,
    `TScoreGauge`). No hagas escenas nuevas.
- **`data/densitometry.ts` y `/densitometria-osea`:**
  - Áreas evaluadas explícitas: **Columna lumbar** y **Caderas (fémur proximal)**, con qué
    aporta cada una.
  - `relatedServices` (VFA, cadera con prótesis, composición corporal) se ocultan con la
    misma bandera `confirmed` mientras no se confirme el equipo.
  - Equipo: «densitómetro DXA», sin marca.
- **Franja de confianza** con los 4 sellos de la tarjeta (iconos de lucide): Resultados claros
  y confiables · Atención con cita previa · Apoyo al diagnóstico médico · Orientado a médicos
  y pacientes.
- **Nueva página `/para-medicos`:**
  - Cómo derivar pacientes por WhatsApp (mensaje prellenado para médicos).
  - Qué incluye el informe: T-score y Z-score; imágenes y comparación con estudios previos
    marcados `CONFIRMAR`.
  - Entrega el mismo día o en 24 h, y 3 sedes frente a hospitales.
  - Tono profesional y breve; JSON-LD `MedicalWebPage` + `BreadcrumbList`.
  - Enlázala desde el menú, el footer y `/densitometria-osea`, y agrégala al sitemap.
- **Paleta:** propón los tokens `brand-navy` y `brand-green` (colores de la tarjeta).
  Muéstrame capturas antes/después de la Home. **No** los apliques de forma global hasta
  que yo responda; el resto del Paso 4 no espera por esto.
- **FAQ:** actualiza `data/faq.ts` y `data/faq-page.ts` para que solo respondan sobre lo que
  se confirmó (densitometría, sedes, cita previa, orden médica, resultados, preparación).

## PASO 6 — VERIFICACIÓN COMPLETA

1. `npm run lint && npm run typecheck && npm test && npm run test:coverage && npm run build`
   en verde, con la cobertura de `lib/` ≥ 80 %.
2. Rastreo de enlaces internos del build: 0 rotos. Todo `wa.me` apunta a uno de los 3
   números oficiales. 0 apariciones de `999000000`, `6400000`, `San Borja`, `Aviación`,
   `contacto@sermekare.com` ni de las URLs de redes de prueba.
3. Navegador con `npm run start` (producción) en 1440 px y en 375 px:
   - Home, `/densitometria-osea`, `/sedes`, `/sedes/callao`, `/contacto`, `/para-medicos`
     y una página oculta (debe dar 404).
   - El selector de `WhatsAppFloat` funciona con teclado y se cierra con Esc.
   - El formulario envía al WhatsApp correcto.
   - La fachada del mapa carga el iframe solo al hacer clic.
   - Modo «Reducir animaciones».
   - Si el navegador congela las animaciones a mitad (títulos borrosos), comprueba que
     `requestAnimationFrame` corra antes de reportarlo como error.
4. Lighthouse (móvil y escritorio) en Home, `/densitometria-osea`, `/sedes/callao` y
   `/para-medicos`: A11y, Buenas prácticas y SEO en 100, CLS 0 y LCP «bueno». Si algo baja,
   corrígelo.
5. Agentes `code-reviewer` y `security-reviewer` sobre todo el diff de la rama contra
   `main`. Corrige CRITICAL y HIGH, y dime qué MEDIUM dejaste y por qué.

## ENTREGA

- **Commits locales** separados (decisiones/ocultamiento, Paso 4, cobertura, correcciones de
  la revisión), convencionales y en español. **Sin push ni PR** hasta que yo lo diga.
- Capturas antes/después: Home (escritorio y móvil), `/para-medicos` y la propuesta de paleta.
- Cifras: tests, cobertura, build (n.° de páginas) y Lighthouse por página.
- Archivo **`PENDIENTES-CLIENTE.md`** en la raíz del repo: todo lo `CONFIRMAR`/`PROVISIONAL`,
  por prioridad y redactado como mensaje de WhatsApp listo para enviar a la empresa.
  Prioridades: WhatsApp por sede, horarios, equipo, direcciones, RUC, correo, dominio, redes,
  logo en vector y fotos reales.
- Una línea final con lo que falta para publicar el sitio.
