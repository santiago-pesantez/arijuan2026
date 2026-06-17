let _configCache = null;

async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`No se pudo cargar ${ruta} (${resp.status})`);
  return resp.json();
}

async function cargarConfig() {
  if (!_configCache) _configCache = await cargarJSON('/data/config.json');
  return _configCache;
}

function backendActivo(config) {
  return config && config.backend && config.backend.habilitado && config.backend.url;
}

async function cargarInvitados({ token } = {}) {
  const config = await cargarConfig();
  if (backendActivo(config)) {
    const url = new URL(config.backend.url);
    url.searchParams.set('action', 'invitados');
    if (token) url.searchParams.set('token', token);
    try {
      const resp = await fetch(url.toString());
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.invitados)) {
          return { invitados: data.invitados.map(normalizarInvitado) };
        }
      }
      console.warn('Backend devolvió respuesta inesperada, usando JSON local');
    } catch (e) {
      console.warn('Falla al consultar backend, usando JSON local:', e);
    }
  }
  const local = await cargarJSON('/data/invitados.json');
  return { invitados: (local.invitados || []).map(normalizarInvitado) };
}

// Garantiza incluyeCeremonia con default true (todos invitados a la ceremonia)
// para no romper invitados existentes cuando aun no se agrega la columna.
function normalizarInvitado(inv) {
  const out = Object.assign({}, inv);
  if (out.incluyeCeremonia === undefined || out.incluyeCeremonia === null || out.incluyeCeremonia === '') {
    out.incluyeCeremonia = true;
  }
  return out;
}

const ID_INVITADO_KEY = 'arijuan_invitado_id';

function obtenerIdInvitado() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    try { localStorage.setItem(ID_INVITADO_KEY, id); } catch (_) {}
    return id;
  }
  try { return localStorage.getItem(ID_INVITADO_KEY); } catch (_) { return null; }
}

async function obtenerInvitado(id) {
  if (!id) return null;
  const data = await cargarInvitados();
  return data.invitados.find(i => i.id === id) || null;
}

function formatearSaludo(invitado) {
  const saludo = (invitado.saludo || '').trim();
  const nombre = (invitado.nombre || '').trim();
  if (!saludo) return nombre;
  // Si el saludo es solo un titulo corto (Sr, Sra, Srta, etc), combinarlo con el nombre
  if (saludo.length <= 6 && !saludo.includes(' ')) {
    const conPunto = /[.,]$/.test(saludo) ? saludo : saludo + '.';
    return nombre ? `${conPunto} ${nombre}` : conPunto;
  }
  return saludo;
}

async function enviarRSVPBackend(payload) {
  const config = await cargarConfig();
  if (!backendActivo(config)) return { ok: false, motivo: 'backend no configurado' };
  try {
    const resp = await fetch(config.backend.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'rsvp', ...payload })
    });
    if (!resp.ok) return { ok: false, motivo: `HTTP ${resp.status}` };
    return await resp.json();
  } catch (e) {
    return { ok: false, motivo: String(e) };
  }
}
