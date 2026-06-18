# AriJuan2026

> Invitación digital y sitio web oficial de la boda de **Ariana Rojas & Juan Patiño**, Cuenca, Ecuador.

Sitio web estático hosteado en **GitHub Pages** bajo el dominio `arijuan2026.com`. Reemplaza la invitación impresa con una experiencia digital personalizada por invitado, e incluye el sitio oficial de la boda con información, galería y RSVP.

## Datos de la boda

| | |
|---|---|
| Novios | Ariana Rojas & Juan Patiño |
| Fecha | Sábado, 25 de julio de 2026 |
| Hora ceremonia | 10:30 |
| Hora recepción | 13:00 en adelante |
| Lugar | La Muralla, Baños de Cuenca |
| Hashtag | #AriAndJuan |
| Invitados estimados | ~130 |
| RSVP hasta | 5 de julio de 2026 |
| Estilo | Rústico, bohemio, elegante |
| Colores | Verde salvia, blanco marfil, terracota |
| Menú | Clásico o Vegetariano |
| Código de vestimenta | Elegante-casual para verano andino |

Todos estos datos viven en `data/config.json` y se renderizan dinámicamente.

## Cómo lo experimenta el invitado

1. Recibe por WhatsApp un mensaje con un enlace personalizado:
   `https://arijuan2026.com/?id={GUID-del-invitado}`
2. Abre el enlace y ve su **invitación digital personalizada** (su nombre, mensaje, datos de la boda).
3. Desde la invitación accede al **sitio oficial de la boda** (información del evento, galería, etc.).
4. Hace click en **"Confirmar asistencia"** (RSVP).
5. Llena el formulario: asistencia, cóctel, +1, menú por asistente, alergias, mensaje.
6. Al enviar, el formulario abre **WhatsApp** con un mensaje pre-llenado dirigido al número de los novios; el invitado lo envía.
7. Las respuestas se guardan también en **Google Sheets** (vía Google Apps Script).

## Arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla |
| Hosting | GitHub Pages (gratis) |
| Dominio | arijuan2026.com (ya comprado) |
| Lista de invitados | Google Sheets (fuente de verdad) |
| Almacenamiento de RSVPs | Google Sheets vía Google Apps Script |
| Mensajería | `wa.me` deep links (envío manual desde el WhatsApp de los novios) |
| Analytics | Google Analytics 4 (pendiente de configurar) |
| Idioma | Español únicamente |

La lista de invitados con sus GUIDs vive en una hoja de Google Sheets. El sitio la consulta vía un endpoint de Google Apps Script. Las respuestas del RSVP se escriben en la misma hoja por el mismo endpoint. El repo público solo contiene código, sin datos personales de invitados.

Durante desarrollo local, hay un `data/invitados.json` con datos ficticios que se usa como fallback cuando el endpoint de Apps Script no está configurado.

## Plan de trabajo

### Iteración 1: Estructura y funcionalidad
- Estructura del repo y del sitio.
- Carga de invitados desde Google Sheets (con fallback a JSON local).
- Página de invitación personalizada.
- Formulario de RSVP funcional con persistencia en Sheets.
- Integración con WhatsApp (`wa.me`).
- Pruebas locales y en GitHub Pages.

### Iteración 2: Diseño
- Replicar estructura, contenido y estilos del sitio Zola de los novios.
- Galería de fotos optimizada (hasta 20 fotos disponibles; ~5 mostradas).
- Ajustes responsive.

### Iteración 3: Entrega
- Revisión de contenido con los novios.
- Conexión final del dominio `arijuan2026.com`.
- Pruebas finales y entrega.

## Servir localmente

```bash
python -m http.server 8000
```

Luego abrir:
- `http://localhost:8000/?id=ari-juan-demo1` (invitación)
- `http://localhost:8000/boda/` (sitio oficial)
- `http://localhost:8000/rsvp/?id=ari-juan-demo1` (formulario RSVP)
- `http://localhost:8000/admin/` (admin, oculto)
