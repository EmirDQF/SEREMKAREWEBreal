# Cabeceras HTTP de seguridad — SERMEKARE

Estas cabeceras **no funcionan como `<meta>`** (salvo la CSP, y aun así sin `frame-ancestors`).
Configúralas en el hosting con **una** de las tres opciones de abajo.

## Qué hace cada cabecera

| Cabecera | Valor | Para qué |
|---|---|---|
| `X-Frame-Options` | `DENY` | Evita que otro sitio meta la web en un `<iframe>` (clickjacking). |
| `X-Content-Type-Options` | `nosniff` | El navegador respeta el tipo MIME declarado. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Fuerza HTTPS durante 1 año. Actívala **solo** cuando todo el dominio funcione con HTTPS. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No envía la URL completa a sitios externos. |
| `Permissions-Policy` | ver abajo | Desactiva APIs que el sitio no usa. `xr-spatial-tracking=(self)` deja activa la RA del visor 3D. |
| `Content-Security-Policy` | ver abajo | Limita de dónde se cargan scripts, estilos, imágenes, etc. |

### CSP — por qué cada origen

| Directiva | Orígenes | Motivo |
|---|---|---|
| `script-src` | `'self'` `https://cdn.jsdelivr.net` `https://www.gstatic.com` `'wasm-unsafe-eval'` | `main.js`, `anatomia.js`; **Fase 4**: `<model-viewer>` se carga desde jsdelivr solo al pedir el 3D; sus decodificadores Draco/Basis vienen de gstatic y usan WebAssembly. |
| `style-src` | `'self'` `'unsafe-inline'` | `dist/output.css` y atributos `style=""` del HTML / estilos internos de model-viewer. |
| `img-src` | `'self'` `data:` `blob:` `https://images.unsplash.com` | Fotos de Unsplash; texturas de los modelos 3D (blob:). |
| `font-src` | `'self'` | Inter, Poppins y Phosphor están alojadas en `assets/fonts/`. |
| `connect-src` | `'self'` `blob:` `data:` `https://cdn.jsdelivr.net` `https://www.gstatic.com` | Descarga de `.glb` y de los decodificadores del 3D. |
| `media-src` | `'self'` | Audio del Dr. Colcca. |
| `worker-src` | `'self'` `blob:` | Workers del decodificador Draco (Fase 4). |
| `frame-src` | `https://www.google.com` | Mapa de Google Maps en Contacto. |
| `frame-ancestors` | `'none'` | Igual que `X-Frame-Options: DENY` (solo funciona como cabecera). |

Si en el futuro agregas otro servicio externo (analítica, chat, etc.), añade su dominio a la directiva que corresponda **aquí y en la `<meta http-equiv="Content-Security-Policy">` de `index.html`**: si hay dos políticas, el navegador aplica ambas.

---

## Opción A — Netlify (`_headers` en la raíz del sitio)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), xr-spatial-tracking=(self)
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; connect-src 'self' blob: data: https://cdn.jsdelivr.net https://www.gstatic.com; media-src 'self'; worker-src 'self' blob:; frame-src https://www.google.com; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests

/dist/*
  Cache-Control: public, max-age=31536000, immutable

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

> `immutable` en `/dist/*` asume que cambias el nombre del archivo o subes con *cache busting* (p. ej. `output.css?v=2`). Si no, usa `max-age=86400`.

## Opción B — Vercel (`vercel.json` en la raíz)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), xr-spatial-tracking=(self)" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; connect-src 'self' blob: data: https://cdn.jsdelivr.net https://www.gstatic.com; media-src 'self'; worker-src 'self' blob:; frame-src https://www.google.com; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" }
      ]
    },
    {
      "source": "/(dist|assets/fonts)/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

## Opción C — Apache (`.htaccess` en la raíz; requiere `mod_headers`)

```apache
<IfModule mod_headers.c>
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), xr-spatial-tracking=(self)"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://www.gstatic.com 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com; font-src 'self'; connect-src 'self' blob: data: https://cdn.jsdelivr.net https://www.gstatic.com; media-src 'self'; worker-src 'self' blob:; frame-src https://www.google.com; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"

  <FilesMatch "\.(css|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

# Tipos MIME para los modelos 3D y el manifest
AddType model/gltf-binary .glb
AddType application/manifest+json .webmanifest
```

## Cómo verificar

1. Publica y abre `https://securityheaders.com/?q=https://www.sermekare.pe`.
2. En Chrome → DevTools → Console: no debe aparecer ningún error `Refused to … because it violates the Content Security Policy`.
3. Prueba el visor 3D (sección "Tu cuerpo") cuando subas los modelos `.glb`.
