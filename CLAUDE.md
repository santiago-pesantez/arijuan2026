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

# Asignar GUIDs faltantes a la lista de invitados
node scripts/generar-guids.mjs
node scripts/generar-guids.mjs data/invitados.json data/invitados.json
```

No hay tests automatizados todavía. Las pruebas se hacen abriendo las páginas en el navegador.

## Arquitectura

Sitio web estático hosteado en GitHub Pages bajo el dominio `arijuan2026.com` (ver `CNAME`). Todo el contenido dinámico vive en el cliente (JavaScript vanilla); no hay backend propio.

### Estructura de páginas

- `/index.html`: invitación digital personalizada. Lee `?id={GUID}` del query string, busca al invitado en `data/invitados.json` y muestra su saludo y datos. Si no hay `id` o no se encuentra, muestra error.
- `/boda/index.html`: sitio oficial de la boda (info, galería). Diseño definitivo viene en Iteración 2.
- `/rsvp/index.html`: formulario de confirmación de asistencia. También requiere `?id={GUID}`. Al enviar, construye un mensaje y abre `wa.me/{numero}?text={mensaje}` para que el invitado lo mande por WhatsApp.
- `/admin/index.html`: página oculta (no linkeada, `noindex`) para gestionar la lista de invitados. Carga JSON, asigna GUIDs, exporta el archivo actualizado, y genera links + mensajes de WhatsApp para enviar invitaciones.

### Datos

- `data/config.json`: configuración del evento (novios, fechas, lugares, número de WhatsApp para RSVP, dominio). Cualquier dato de la boda configurable vive aquí.
- `data/invitados.json`: lista pública de invitados con sus GUIDs. Estructura: `{ "invitados": [{ id, nombre, saludo, cantidadInvitaciones, incluyeCocktail, mensaje }] }`. **El JSON está en repo público; no incluir teléfonos, emails u otros datos sensibles.**

### Flujo de carga de datos

`assets/js/data.js` centraliza la carga vía `fetch`. Las páginas que viven en subcarpetas (`/rsvp/`, `/admin/`, `/boda/`) pasan `prefijo = '../'` a `cargarConfig()` y `cargarInvitados()` para resolver las rutas relativas correctamente. Si se mueve una página de nivel, hay que actualizar el prefijo.

### Flujo de RSVP

1. Invitado abre `/rsvp/?id={guid}`.
2. `rsvp.js` carga config + datos del invitado, construye dinámicamente un input por cada `cantidadInvitaciones`.
3. Al hacer submit, se arma un mensaje texto plano con todas las respuestas y el `id` del invitado.
4. Se redirige a `https://wa.me/{telefonoWhatsapp}?text={mensaje-encoded}`.
5. El invitado envía el mensaje desde WhatsApp; los novios lo reciben y consolidan manualmente.

No hay backend escribiendo respuestas en ningún lado por ahora. Si en el futuro se agrega persistencia (Google Apps Script + Sheets es la opción tentativa), sumar el `fetch` ANTES del redirect a `wa.me`.

### Tracking

Hooks listos para Google Analytics 4 vía `gtag` en `invitacion.js` (evento `invitation_opened`) y `rsvp.js` (evento `rsvp_submitted`). Solo se disparan si `gtag` existe globalmente. El snippet de GA4 todavía no está incluido en los HTML; se agrega cuando esté el dominio activo y la cuenta de GA.

### Asignación de GUIDs

Hay dos caminos equivalentes:
- `scripts/generar-guids.mjs` (Node CLI) para uso desde terminal.
- `/admin/` en el navegador, que hace lo mismo y permite descargar el JSON resultante.

Formato del GUID: `{slug-del-nombre-truncado-a-20}-{4-chars-aleatorios}`. Suficientemente no-adivinable para casual, no es secreto criptográfico.

## Restricciones del hosting

GitHub Pages es solo lectura desde el cliente. Implicaciones:

- Toda escritura (RSVPs, tracking de aperturas, edición de la lista de invitados) debe ir a un sistema externo o ser manual.
- No se puede ocultar nada del repo: el JSON de invitados es accesible públicamente. Diseñar bajo este supuesto.
- El admin no tiene autenticación real; su única protección es no estar linkeado (`noindex` + URL no publicada).
