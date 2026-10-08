# Modelos 3D — sección "Conoce tu cuerpo" (#anatomia)

Mientras esta carpeta no tenga modelos **y** no estén declarados en `#anatomia-config`
(dentro de `index.html`), el visor 3D queda oculto y solo se ve el mapa del dolor en SVG.
`model-viewer` (≈ 960 KB) **nunca** se descarga en la carga inicial: solo al pulsar
"Ver en 3D" o cuando el visor entra en pantalla con una conexión buena (no `saveData`, no 2G/3G).

## Archivos esperados

| Archivo | Contenido | Obligatorio |
|---|---|---|
| `rodilla.glb` | Rodilla sana: fémur distal, tibia, rótula, meniscos, cartílago, ligamentos | sí, para activar el 3D |
| `rodilla-artrosis.glb` | Misma rodilla con cartílago desgastado y osteofitos (mismo encuadre y escala) | opcional (activa "Sano / Con artrosis") |
| `cadera.glb` | Articulación de la cadera | opcional |
| `columna.glb` | Segmento de columna (sirve para "cuello" y "lumbar") | opcional |
| `mano.glb` | Mano y muñeca | opcional |
| `rodilla-poster.webp` … | Imagen estática del modelo (800×600) para el póster y el fallback sin WebGL | recomendado |

## Requisitos técnicos

- Formato **glTF binario (`.glb`)**, comprimido con **Draco** o **meshopt**, **< 2 MB** cada uno.
- Texturas en KTX2 o WebP, máximo 1024×1024. Origen del modelo centrado y escala en metros.
- Estilo limpio y amable (nada gore ni hiperrealista), coherente con la paleta de la marca.
- Comprimir, por ejemplo: `npx @gltf-transform/cli optimize entrada.glb rodilla.glb --compress draco --texture-compress webp`

## Licencias aceptables

- **CC0** (dominio público), o **CC-BY 4.0** citando al autor en la página (p. ej. en el pie del visor).
- Fuentes habituales: BodyParts3D (CC-BY-SA, revisar condiciones), Sketchfab filtrando por licencia CC0/CC-BY,
  o un modelo encargado a medida con cesión de derechos. **No** usar modelos "solo uso personal" ni con NC si la web es comercial.

## Cómo activarlos

Edita el JSON `#anatomia-config` en `index.html`:

```json
{
  "modelViewerSrc": "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js",
  "modelos": {
    "rodilla": {
      "nombre": "Rodilla",
      "sano": "assets/models/rodilla.glb",
      "artrosis": "assets/models/rodilla-artrosis.glb",
      "poster": "assets/models/rodilla-poster.webp",
      "alt": "Modelo 3D educativo de una rodilla con sus huesos, meniscos y cartílago",
      "hotspots": [
        { "etiqueta": "Cartílago", "texto": "Capa lisa que recubre los huesos y permite que se deslicen sin roce.", "posicion": "0 0.02 0.03", "normal": "0 0 1" },
        { "etiqueta": "Menisco", "texto": "Almohadilla en forma de media luna que reparte la carga entre fémur y tibia.", "posicion": "0.03 0 0.02", "normal": "1 0 0" },
        { "etiqueta": "Ligamento", "texto": "Banda que une los huesos y da estabilidad a la rodilla.", "posicion": "-0.03 0.01 0", "normal": "-1 0 0" },
        { "etiqueta": "Hueso subcondral", "texto": "Hueso justo debajo del cartílago; en la artrosis se endurece.", "posicion": "0 -0.02 0.02", "normal": "0 0 1" }
      ]
    },
    "cadera":  { "nombre": "Cadera",  "sano": "assets/models/cadera.glb" },
    "columna": { "nombre": "Columna", "sano": "assets/models/columna.glb" },
    "mano":    { "nombre": "Mano",    "sano": "assets/models/mano.glb" }
  }
}
```

- `posicion` y `normal` de cada hotspot están en metros dentro del modelo. Para obtenerlos, abre el `.glb`
  en https://modelviewer.dev/editor/ , haz clic sobre la pieza y copia los valores de *hotspot*.
- Las claves `rodilla`, `cadera`, `columna` y `mano` activan además el botón "Ver en 3D" de la zona
  correspondiente en el mapa del dolor (`columna` se usa para cuello y lumbar).
- La CSP ya permite jsdelivr, gstatic (decodificadores Draco/Basis), `blob:` y WebAssembly: ver `HOSTING-HEADERS.md`.
