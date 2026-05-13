let _configCache = null;

async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`No se pudo cargar ${ruta} (${resp.status})`);
  return resp.json();
}

async function cargarConfig(prefijo = '') {
  if (!_configCache) _configCache = await cargarJSON(`${prefijo}data/config.json`);
  return _configCache;
}

function backendActivo(config) {
  return config && config.backend && config.backend.habilitado && config.backend.url;
}

async function cargarInvitados(prefijo = '', { token } = {}) {
  const config = await cargarConfig(prefijo);
  if (backendActivo(config)) {
    const url = new URL(config.backend.url);
    url.searchParams.set('action', 'invitados');
    if (token) url.searchParams.set('token', token);
    try {
      const resp = await fetch(url.toString());
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.invitados)) return data;
      }
      console.warn('Backend devolvió respuesta inesperada, usando JSON local');
    } catch (e) {
      console.warn('Falla al consultar backend, usando JSON local:', e);
    }
  }
  return cargarJSON(`${prefijo}data/invitados.json`);
}

function obtenerIdInvitado() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function obtenerInvitado(id, prefijo = '') {
  if (!id) return null;
  const data = await cargarInvitados(prefijo);
  return data.invitados.find(i => i.id === id) || null;
}

async function enviarRSVPBackend(payload, prefijo = '') {
  const config = await cargarConfig(prefijo);
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
