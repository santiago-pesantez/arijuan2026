async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`No se pudo cargar ${ruta} (${resp.status})`);
  return resp.json();
}

async function cargarConfig(prefijo = '') {
  return cargarJSON(`${prefijo}data/config.json`);
}

async function cargarInvitados(prefijo = '') {
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
