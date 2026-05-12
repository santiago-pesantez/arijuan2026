let configActual = null;
let invitadosActuales = [];

async function inicializar() {
  try {
    configActual = await cargarConfig('../');
    const data = await cargarInvitados('../');
    invitadosActuales = data.invitados;
    renderTabla();
  } catch (e) {
    console.error(e);
    document.getElementById('error').textContent = 'No se pudo cargar la lista actual.';
  }

  document.getElementById('input-json').addEventListener('change', cargarArchivo);
  document.getElementById('btn-asignar-guids').addEventListener('click', asignarGuids);
  document.getElementById('btn-descargar').addEventListener('click', descargarJson);
}

function cargarArchivo(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const json = JSON.parse(e.target.result);
      invitadosActuales = json.invitados || json;
      renderTabla();
    } catch (err) {
      alert('JSON inválido: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function generarGuid(nombre) {
  const slug = nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);
  const sufijo = Math.random().toString(36).slice(2, 6);
  return `${slug}-${sufijo}`;
}

function asignarGuids() {
  invitadosActuales = invitadosActuales.map(inv => ({
    ...inv,
    id: inv.id || generarGuid(inv.nombre || 'invitado')
  }));
  renderTabla();
}

function descargarJson() {
  const blob = new Blob(
    [JSON.stringify({ invitados: invitadosActuales }, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invitados.json';
  a.click();
  URL.revokeObjectURL(url);
}

function linkInvitacion(id) {
  return `${configActual.sitio.url}/?id=${encodeURIComponent(id)}`;
}

function mensajeWhatsapp(invitado) {
  const link = linkInvitacion(invitado.id);
  const txt = `Hola ${invitado.nombre}, te invitamos a la boda de ${configActual.novios.ella} y ${configActual.novios.el}. Tu invitación: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(txt)}`;
}

function renderTabla() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  invitadosActuales.forEach(inv => {
    const tr = document.createElement('tr');
    const link = inv.id ? linkInvitacion(inv.id) : '(sin id)';
    const wa = inv.id ? `<a href="${mensajeWhatsapp(inv)}" target="_blank">enviar</a>` : '';
    tr.innerHTML = `
      <td>${inv.nombre || ''}</td>
      <td>${inv.id || ''}</td>
      <td>${inv.cantidadInvitaciones || 1}</td>
      <td><a href="${link}" target="_blank">link</a></td>
      <td>${wa}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', inicializar);
