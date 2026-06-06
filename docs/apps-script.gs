/**
 * Backend de AriJuan2026 sobre Google Sheets.
 *
 * Pasos rápidos de configuración (ver docs/google-sheets-setup.md para detalle):
 *   1. Crear una Google Sheet con dos pestañas: "Invitados" y "RSVPs".
 *   2. Encabezados de Invitados: id, nombre, saludo, cantidadInvitaciones, incluyeCeremonia, incluyeFiesta, incluyeCocktail, mensaje, telefono
 *      Nota: incluyeCocktail es legacy. Si solo existe esa columna, se usa como fallback de incluyeFiesta.
 *   3. Encabezados de RSVPs: timestamp, id_invitado, nombre_invitado, asistira, asistira_cocktail, acompanante, cantidad_asistentes, detalles_asistentes, mensaje, raw_json
 *   4. Reemplazar SHEET_ID abajo con el ID de tu hoja (lo sacas de la URL).
 *   5. Extensiones > Apps Script, pegar este archivo completo.
 *   6. Definir el token de admin en Project Settings > Script Properties:
 *        clave: ADMIN_TOKEN, valor: una cadena larga y aleatoria
 *   7. Deploy > New deployment > tipo Web app, Execute as: Me, Who has access: Anyone.
 *   8. Copiar la URL del Web App (termina en /exec) y pegarla en data/config.json -> backend.url
 *
 * Notas de seguridad:
 *   - El endpoint público devuelve nombre/saludo/etc pero NO el teléfono.
 *   - El endpoint de admin (?token=...) devuelve también el teléfono. El token vive solo
 *     en Script Properties y en el localStorage del admin; nunca en el repo público.
 */

const SHEET_ID = '1RJjiIvz608SNTp-SgNsVVnzb93fDn4mGGwVaxUuLiIY';
const INVITADOS_TAB = 'Invitados';
const RSVPS_TAB = 'RSVPs';

function doGet(e) {
  try {
    const accion = (e.parameter.action || 'invitados').toLowerCase();
    const esAdmin = tokenValido(e.parameter.token);

    if (accion === 'invitados') return responder(obtenerInvitados(esAdmin));
    if (accion === 'invitado' && e.parameter.id) return responder(obtenerInvitado(e.parameter.id, esAdmin));
    return responder({ error: 'accion desconocida' });
  } catch (err) {
    return responder({ error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'rsvp') {
      guardarRSVP(body);
      return responder({ ok: true });
    }
    return responder({ error: 'accion desconocida' });
  } catch (err) {
    return responder({ error: String(err) });
  }
}

function tokenValido(token) {
  if (!token) return false;
  const esperado = PropertiesService.getScriptProperties().getProperty('ADMIN_TOKEN');
  return Boolean(esperado) && token === esperado;
}

function responder(obj) {
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function leerHoja(nombrePestana) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(nombrePestana);
  if (!sheet) throw new Error(`No existe la pestaña ${nombrePestana}`);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { sheet, headers: data[0] || [], filas: [] };
  const headers = data[0];
  const filas = data.slice(1)
    .filter(r => r.some(c => c !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return { sheet, headers, filas };
}

function obtenerInvitados(incluirPrivado) {
  const { filas } = leerHoja(INVITADOS_TAB);
  const invitados = filas
    .filter(inv => inv.id)
    .map(inv => {
      const cocktailLegacy = parseBool(inv.incluyeCocktail);
      // Si las columnas nuevas no existen en la Sheet, asumir defaults compatibles con el modelo viejo:
      // - todos invitados a la ceremonia (true por defecto)
      // - invitados a fiesta = lo que decia incluyeCocktail
      const incluyeCeremonia = inv.incluyeCeremonia === undefined || inv.incluyeCeremonia === ''
        ? true
        : parseBool(inv.incluyeCeremonia);
      const incluyeFiesta = inv.incluyeFiesta === undefined || inv.incluyeFiesta === ''
        ? cocktailLegacy
        : parseBool(inv.incluyeFiesta);
      const base = {
        id: String(inv.id).trim(),
        nombre: String(inv.nombre || '').trim(),
        saludo: String(inv.saludo || '').trim(),
        cantidadInvitaciones: Number(inv.cantidadInvitaciones) || 1,
        incluyeCeremonia: incluyeCeremonia,
        incluyeFiesta: incluyeFiesta,
        incluyeCocktail: cocktailLegacy,
        mensaje: String(inv.mensaje || '').trim()
      };
      if (incluirPrivado) {
        base.telefono = String(inv.telefono || '').trim();
      }
      return base;
    });
  return { invitados };
}

function obtenerInvitado(id, incluirPrivado) {
  const data = obtenerInvitados(incluirPrivado);
  const invitado = data.invitados.find(i => i.id === id);
  return invitado ? { invitado } : { error: 'no encontrado' };
}

function parseBool(v) {
  if (typeof v === 'boolean') return v;
  if (v === 1 || v === '1') return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 'si' || s === 'sí' || s === 'x' || s === 'y';
  }
  return Boolean(v);
}

function guardarRSVP(payload) {
  const { sheet } = leerHoja(RSVPS_TAB);
  const asistentes = Array.isArray(payload.asistentes) ? payload.asistentes : [];
  const detalles = asistentes
    .map(a => `${a.nombre || ''} | ${a.menu || ''}${a.restricciones ? ` | ${a.restricciones}` : ''}`)
    .join('\n');

  sheet.appendRow([
    new Date(),
    payload.id_invitado || '',
    payload.nombre_invitado || '',
    payload.asistencia || '',
    payload.cocktail || '',
    payload.acompanante || '',
    asistentes.length,
    detalles,
    payload.mensaje || '',
    JSON.stringify(payload)
  ]);
}

/**
 * Llena GUIDs faltantes en la pestaña Invitados.
 * Para usar: en el editor de Apps Script, seleccionar la función `generarGuidsFaltantes`
 * y pulsar Run. La primera vez te pedirá autorización.
 */
function generarGuidsFaltantes() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(INVITADOS_TAB);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf('id');
  const idxNombre = headers.indexOf('nombre');
  if (idxId < 0 || idxNombre < 0) throw new Error('Faltan columnas id o nombre');

  const usados = new Set(data.slice(1).map(r => r[idxId]).filter(Boolean));
  let nuevos = 0;

  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    if (fila[idxId] || !fila[idxNombre]) continue;
    let candidato;
    do {
      candidato = guidDesdeNombre(String(fila[idxNombre]));
    } while (usados.has(candidato));
    sheet.getRange(i + 1, idxId + 1).setValue(candidato);
    usados.add(candidato);
    nuevos++;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(`${nuevos} GUIDs asignados`);
}

function guidDesdeNombre(nombre) {
  const slug = nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
  const sufijo = Math.random().toString(36).slice(2, 6);
  return `${slug}-${sufijo}`;
}
