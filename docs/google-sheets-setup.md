# Setup de Google Sheets + Apps Script

El sitio usa una Google Sheet como fuente de verdad para la lista de invitados y para guardar los RSVPs. Un Google Apps Script desplegado como Web App expone el GET (leer) y el POST (grabar).

## 1. Crear la Sheet

1. Ir a [sheets.new](https://sheets.new) y crear una hoja nueva. Nombrarla, por ejemplo, `AriJuan2026 - Invitados y RSVPs`.
2. Crear dos pestañas (renombrar la primera y agregar la segunda):
   - `Invitados`
   - `RSVPs`

### Encabezados de la pestaña `Invitados` (fila 1, exactos, en este orden):

| id | nombre | saludo | cantidadInvitaciones | incluyeCocktail | mensaje | telefono |
|---|---|---|---|---|---|---|

Notas:
- `id` se llena automáticamente con la función del Apps Script (paso 6) o se puede dejar para que el sitio falle si no existe.
- `incluyeCocktail` admite `TRUE`/`FALSE`, `si`/`no`, `1`/`0`.
- `cantidadInvitaciones` es un número (cuántos asientos cubre la invitación).
- `telefono` en formato internacional sin `+` ni espacios. Ejemplo Ecuador: `593987654321`.

### Encabezados de la pestaña `RSVPs` (fila 1, exactos, en este orden):

| timestamp | id_invitado | nombre_invitado | asistira | asistira_cocktail | acompanante | cantidad_asistentes | detalles_asistentes | mensaje | raw_json |
|---|---|---|---|---|---|---|---|---|---|

El Apps Script solo escribe, no lee de aquí.

## 2. Apuntar el Apps Script a la Sheet

1. Copiar el ID de la Sheet de la URL del navegador. Es la parte entre `/d/` y `/edit`. Ejemplo: en `https://docs.google.com/spreadsheets/d/1AbCdEfGh.../edit`, el ID es `1AbCdEfGh...`.
2. En la Sheet, ir a **Extensiones > Apps Script**.
3. Borrar el código que viene por defecto. Pegar el contenido completo de [`docs/apps-script.gs`](apps-script.gs).
4. En la línea `const SHEET_ID = 'PEGAR_AQUI_EL_ID_DE_LA_HOJA';`, reemplazar el placeholder con el ID que copiaste.
5. Guardar (icono de disquete o `Ctrl+S`). Asignarle un nombre al proyecto, por ejemplo `AriJuan2026 Backend`.

## 3. Configurar el token de admin

El token protege los datos privados (los teléfonos): el endpoint público no los devuelve, solo el admin con token sí.

1. En el editor de Apps Script, ir a **Project Settings** (icono de engranaje en la barra lateral izquierda).
2. Bajar a **Script Properties** y hacer click en **Add script property**.
3. Property: `ADMIN_TOKEN`. Value: una cadena larga y aleatoria (puede ser un UUID, lo que sea difícil de adivinar).
4. Guardar.

Anotar este token: lo vas a pegar en la página `/admin/` del sitio.

## 4. Desplegar como Web App

1. Arriba a la derecha en el editor de Apps Script: **Deploy > New deployment**.
2. Tipo: **Web app**.
3. Description: `v1` (o lo que quieras).
4. Execute as: **Me** (tu cuenta).
5. Who has access: **Anyone** (incluye cuentas no autenticadas, necesario para que los invitados puedan acceder).
6. **Deploy**.
7. La primera vez Google pide autorización. Aceptar todos los permisos (acceso a esta Sheet y a hacer fetches externos).
8. Copiar la **Web app URL**. Termina en `/exec`.

## 5. Pegar la URL en el sitio

Editar `data/config.json` y poner la URL en `backend.url` y `backend.habilitado: true`:

```json
"backend": {
  "url": "https://script.google.com/macros/s/AKfycby.../exec",
  "habilitado": true
}
```

Hacer commit y push. GitHub Pages se actualiza solo en uno o dos minutos.

## 6. Generar GUIDs para invitados nuevos

Cuando agregues una fila nueva en la pestaña `Invitados` con `nombre` pero sin `id`:

1. En la Sheet, **Extensiones > Apps Script**.
2. En el dropdown arriba (donde dice una función), seleccionar `generarGuidsFaltantes`.
3. **Run**. Se llenarán los `id` faltantes automáticamente.

Alternativa: dejar `id` vacío y rellenarlo manualmente con el formato `slug-XXXX`.

## 7. Probar

- **Listar invitados (público):**
  `https://script.google.com/macros/s/.../exec?action=invitados`

  Debe devolver `{ invitados: [...] }` sin teléfonos.

- **Listar invitados (admin):**
  `https://script.google.com/macros/s/.../exec?action=invitados&token=TU_TOKEN`

  Debe devolver lo mismo pero con `telefono` en cada fila.

- **Probar el RSVP** desde `/rsvp/?id={algun-id-real}` y verificar que aparezca una fila nueva en la pestaña `RSVPs`.

## Cuando actualices el código del Apps Script

Cada vez que cambies `apps-script.gs` y lo pegues en el editor de Apps Script, hay que **redesplegar** para que la URL `/exec` use la nueva versión:

1. **Deploy > Manage deployments**.
2. Editar el deployment activo (icono de lápiz).
3. En **Version**, elegir **New version**.
4. **Deploy**.

La URL se mantiene; no hay que actualizar `config.json`.
