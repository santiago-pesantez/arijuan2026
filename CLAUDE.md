# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma y estilo

- Toda la comunicación con el usuario y todo el contenido del proyecto va en **español** (UI, README, comentarios user-facing, mensajes de commit). Nombres de variables, funciones y filenames técnicos pueden quedar en inglés cuando es la convención.
- **No usar el carácter em-dash (`—`) ni en-dash (`–`)** en ningún archivo ni respuesta. Sustituir con dos puntos, guion normal, paréntesis o reescritura.
- **No usar emojis** en ningún archivo ni respuesta.
- Mensajes de commit cortos, descriptivos, en una línea cuando sea posible. **No incluir** la línea `Co-Authored-By: Claude...`.

## Comandos

Sitio 100% estático sin build step. No hay `package.json`.

```bash
# Servir localmente (cualquier servidor estático sirve; la raíz debe ser la del repo)
python -m http.server 8000
# o
npx serve .

# Asignar GUIDs faltantes (modo CLI sobre el JSON local; NO sobre la Sheet)
node scripts/generar-guids.mjs
node scripts/generar-guids.mjs data/invitados.json data/invitados.json

# Publicar la lista de invitados como JSON estático (descarga del backend público, sin teléfonos)
node scripts/exportar-invitados.mjs
```

Para asignar GUIDs sobre la Sheet de producción, usar la función `generarGuidsFaltantes()` desde el editor de Apps Script (ver `docs/google-sheets-setup.md`).

No hay tests automatizados. Las pruebas se hacen abriendo las páginas en el navegador.

## Arquitectura

Sitio web estático hosteado en GitHub Pages bajo el dominio `arijuan2026.com` (ver `CNAME`). Frontend en HTML/CSS/JS vanilla. La fuente de verdad de los datos vive en una Google Sheet, accesible vía un Google Apps Script desplegado como Web App.

### Flujo de datos

Lecturas (invitación/RSVP) son **estáticas** para que carguen rápido; las escrituras y los datos privados pasan por el backend.

1. **Lectura pública (invitación, RSVP):** se lee la lista estática `data/invitados.json` (publicada en GitHub Pages, sin teléfonos). `obtenerInvitado(id)` busca ahí primero; si no encuentra el id, hace fallback al backend `GET {backend.url}?action=invitado&id=...` (para invitados agregados a la Sheet pero aún no exportados). Además hay cache local del invitado en localStorage (stale-while-revalidate) para que las reaperturas sean instantáneas.
2. **Admin:** `cargarInvitados({token})` consulta el backend con `&token={ADMIN_TOKEN}` para obtener la lista con teléfonos en vivo.
3. **RSVP:** `POST {backend.url}` con `{action: 'rsvp', ...}` ANTES de redirigir a `wa.me/{numero}?text=...`. Las respuestas se escriben en la pestaña `RSVPs`.
4. `data/invitados.json` se regenera desde la Sheet con `node scripts/exportar-invitados.mjs` (descarga el endpoint público, quita teléfonos) y se commitea.

### Estructura de páginas

- `/index.html`: invitación digital personalizada. Lee `?id={GUID}` del query string, busca al invitado y muestra su saludo y datos.
- `/boda/index.html`: sitio oficial de la boda (info, galería). Diseño definitivo viene en Iteración 2.
- `/rsvp/index.html`: formulario de confirmación. Requiere `?id={GUID}`. POST a backend + redirect a `wa.me`.
- `/admin/index.html`: página oculta (no linkeada, `noindex`). Pide token al usuario, muestra lista con teléfonos, genera links wa.me al teléfono específico de cada invitado.

### Datos

- `data/config.json`: configuración del evento (novios, fechas, lugares, número de WhatsApp para RSVP, dominio, URL del backend). **Toda la data configurable de la boda vive aquí.**
- `data/invitados.json`: **lista pública publicada** (copia de la Sheet sin teléfonos). Es la fuente de lectura del sitio para las invitaciones. Se regenera con `scripts/exportar-invitados.mjs`. La fuente de verdad sigue siendo la Google Sheet; este archivo es una copia para servir rápido.
- `docs/apps-script.gs`: código completo del Apps Script que se pega en el editor de Google. NO se ejecuta desde el repo; es referencia.
- `docs/google-sheets-setup.md`: instrucciones paso a paso para crear la Sheet, configurar el script y desplegar.

### Esquema de la Google Sheet

Pestaña `Invitados`: `id, nombre, saludo, cantidadInvitaciones, incluyeCeremonia, mensaje, telefono`. `incluyeCeremonia` TRUE = ceremonia + recepción; FALSE = solo recepción; vacío = TRUE. Todos van a la recepción. `nombre` admite varios nombres separados por coma.

Pestaña `RSVPs` (solo escritura desde Apps Script): `timestamp, id_invitado, nombre_invitado, asistira_ceremonia, asistira_recepcion, acompanante, cantidad_asistentes, detalles_asistentes, cancion, mensaje, raw_json`.

### Capa de datos en frontend

`assets/js/data.js` centraliza:
- `cargarConfig(prefijo)`: cachea `config.json` en memoria.
- `cargarInvitados({token})`: con token consulta el backend (admin, con teléfonos); sin token lee la lista estática `data/invitados.json`.
- `obtenerInvitado(id)`: busca en la lista estática; si no está, fallback a `obtenerInvitadoBackend(id)`. Cachea el invitado en localStorage.
- `enviarRSVPBackend(payload, prefijo)`: POST al endpoint con `Content-Type: text/plain` (evita preflight CORS de Apps Script).
- `obtenerInvitado(id, prefijo)`, `obtenerIdInvitado()`: helpers.

Las páginas en subcarpetas (`/rsvp/`, `/admin/`, `/boda/`) pasan `prefijo = '../'` para resolver rutas relativas a archivos en `data/`.

### Token de admin

Se almacena solo en localStorage del navegador (`arijuan_admin_token`). Nunca en el repo. El valor se configura como `ADMIN_TOKEN` en Script Properties del Apps Script. El endpoint público no requiere token y oculta los teléfonos.

### Tracking

Hooks listos para Google Analytics 4 vía `gtag` en `invitacion.js` (`invitation_opened`) y `rsvp.js` (`rsvp_submitted`). Solo se disparan si `gtag` existe globalmente. El snippet de GA4 se agrega cuando esté el dominio activo.

## Restricciones del hosting

GitHub Pages sirve archivos estáticos. Toda escritura pasa por Apps Script. Implicaciones:
- El JSON de invitados de fallback (`data/invitados.json`) es público; mantenerlo con datos ficticios.
- Los datos reales (incluyendo teléfonos) viven solo en la Sheet privada; no se commitean.
- El admin no tiene autenticación de identidad: el ADMIN_TOKEN es la única barrera para ver teléfonos. La URL `/admin/` no se publica.

## Convenciones de mensajes WhatsApp

- Formato del número: solo dígitos, código de país incluido, sin `+` ni espacios. Ejemplo Ecuador: `593987654321`.
- Mensaje del invitado al RSVP: usa `wa.me/{numero}?text=...` apuntando al número de los novios (`config.rsvp.telefonoWhatsapp`).
- Mensaje desde el admin para enviar la invitación: usa `wa.me/{telefono-del-invitado}?text=...`. Si el invitado no tiene teléfono, cae a `wa.me/?text=...` (el sender elige destinatario en WhatsApp).
