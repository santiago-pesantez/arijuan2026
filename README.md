# AriJuan2026

> Invitación digital y sitio web oficial de la boda de **Ari & Juan**, Ecuador 2026.

Sitio web estático hosteado en **GitHub Pages** bajo el dominio `AriJuan2026.com`. Reemplaza la invitación impresa con una experiencia digital personalizada por invitado, e incluye el sitio oficial de la boda con información, galería e RSVP.

---

## Objetivos

- Reemplazar invitaciones impresas con una invitación digital elegante.
- Replicar el *look & feel* del sitio que los novios están construyendo en [zola.com](https://zola.com), pero con **traducción completa al español** (Zola no la ofrece).
- Permitir confirmar asistencia (RSVP) desde el navegador, con las respuestas llegando por WhatsApp a los novios.
- Hacer **seguimiento** de quién abre la invitación y quién confirma asistencia.
- Mantenerlo **liviano, funcional y de hosting gratuito**.

---

## Cómo lo experimenta el invitado

1. Recibe por WhatsApp un mensaje con un enlace personalizado:
   `https://arijuan2026.com/?id={GUID-del-invitado}`
2. Abre el enlace → ve su **invitación digital personalizada** (su nombre, mensaje, datos de la boda).
3. Desde la invitación accede al **sitio oficial de la boda** (información del evento, galería, etc.).
4. Hace click en **"Confirmar Asistencia"** (RSVP).
5. Llena el formulario (asistencia, menú, etc.).
6. Al enviar, el formulario abre **WhatsApp** con un mensaje pre-llenado dirigido al número de los novios; el invitado lo envía.
7. Las respuestas quedan registradas (mecanismo a definir, ver *Decisiones abiertas*).

---

## Funcionalidades

### 1. Invitación digital personalizada
- A cada invitado se le asigna un **GUID** único.
- La página lee el `id` del query string, lo busca en el archivo de invitados, y muestra los datos personalizados.
- Si el GUID no existe → mensaje de error / invitación genérica.

### 2. Sitio oficial de la boda
- Información del evento (fecha, hora, lugar de ceremonia y de cocktail).
- **Galería de fotos** optimizada para web (pocas fotos, formato moderno, lazy loading).
- Diseño replicado del sitio Zola de los novios, traducido completamente al español.
- *(Por decidir)* protección con contraseña.

### 3. RSVP ("Confirmar Asistencia")
- Formulario en español con preguntas estándar:
  - ¿Asistirás a la ceremonia?
  - ¿Asistirás al cocktail posterior?
  - Preferencia de menú
  - *(Más preguntas a definir)*
- El RSVP recibe el `id` del invitado por query string para asociar la respuesta.
- Al enviar:
  - Se abre WhatsApp con un mensaje pre-llenado al número de los novios.
  - La respuesta se guarda (mecanismo a definir).

### 4. Gestión de invitados (admin)
- Subir una **lista de invitados en JSON**.
- El sistema asigna un GUID a cada invitado.
- Generar links personalizados listos para enviar por WhatsApp.

### 5. Envío de invitaciones
- Proceso para enviar a cada invitado un mensaje de WhatsApp con su link personalizado.
- *(Mecanismo exacto por decidir: manual con copy/paste, deep link `wa.me`, o WhatsApp Cloud API)*.

### 6. Seguimiento (analytics)
- Quiénes **abrieron** su invitación (registro por GUID).
- Quiénes **confirmaron asistencia** y quiénes **no**.
- Reporte simple para los novios.

---

## Stack técnico (propuesta inicial)

| Área | Propuesta |
|---|---|
| Frontend | HTML + CSS + JavaScript vanilla |
| Hosting | GitHub Pages (gratis) |
| Dominio | AriJuan2026.com |
| Datos de invitados | Archivo JSON |
| Mensajería | WhatsApp (mecanismo por definir) |
| Almacenamiento de RSVPs | Por definir (ver *Decisiones abiertas*) |
| Analytics | Por definir (ver *Decisiones abiertas*) |

---

## Plan de trabajo

### Iteración 1: Estructura y funcionalidad
- Estructura del repo y del sitio.
- Sistema de carga de invitados desde JSON + asignación de GUIDs.
- Página de invitación personalizada.
- Formulario de RSVP funcional.
- Integración con WhatsApp (mecanismo elegido).
- Pruebas locales y en GitHub Pages.

### Iteración 2: Diseño
- Replicar estructura, contenido y estilos del sitio Zola de los novios.
- Traducción completa al español.
- Galería de fotos optimizada.
- Ajustes responsive.

### Iteración 3: Entrega
- Revisión de contenido con los novios.
- Conexión del dominio `AriJuan2026.com`.
- Pruebas finales y entrega.

---

## Decisiones abiertas

Estas decisiones afectan el diseño técnico y necesitan resolverse antes o durante la Iteración 1 (ver discusión en el chat / issues):

1. **Mecanismo de WhatsApp**: `wa.me` deep links (gratis, manual) vs WhatsApp Cloud API (automático, requiere setup).
2. **Almacenamiento de RSVPs**: GitHub Pages no puede escribir archivos. Opciones: solo WhatsApp, Google Sheets vía Apps Script, Firebase, Supabase, Formspree.
3. **Privacidad**: repo público vs privado (GitHub Pages gratis requiere público).
4. **Protección con contraseña**: sí/no, todo el sitio o solo el RSVP.
5. **Analytics**: Google Analytics, Plausible, o tracking custom por GUID.
6. **Idioma**: solo español, o también inglés para algunos invitados.
