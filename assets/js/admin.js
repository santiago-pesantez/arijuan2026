const TOKEN_KEY = 'arijuan_admin_token';

let configActual = null;
let invitadosActuales = [];

async function inicializar() {
  document.getElementById('btn-guardar-token').addEventListener('click', guardarToken);
  document.getElementById('btn-refrescar').addEventListener('click', refrescar);

  const tokenInput = document.getElementById('input-token');
  tokenInput.value = localStorage.getItem(TOKEN_KEY) || '';

  try {
    configActual = await cargarConfig('../');
    document.getElementById('estado-backend').textContent = backendActivo(configActual)
      ? `Backend: ${configActual.backend.url}`
      : 'Backend no configurado: usando datos locales (data/invitados.json)';
  } catch (e) {
    document.getElementById('error').textContent = 'No se pudo cargar config.json: ' + e.message;
  }

  await refrescar();
}

function guardarToken() {
  const t = document.getElementById('input-token').value.trim();
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
  refrescar();
}

async function refrescar() {
  const errorEl = document.getElementById('error');
  errorEl.hidden = true;
  try {
    const token = localStorage.getItem(TOKEN_KEY) || undefined;
    const data = await cargarInvitados('../', { token });
    invitadosActuales = data.invitados;
    renderTabla();
  } catch (e) {
    errorEl.textContent = 'No se pudo cargar la lista: ' + e.message;
    errorEl.hidden = false;
  }
}

function linkInvitacion(id) {
  return `${configActual.sitio.url}/?id=${encodeURIComponent(id)}`;
}

function mensajeInvitacion(invitado) {
  const link = linkInvitacion(invitado.id);
  const novios = `${configActual.novios.ellaCorto} y ${configActual.novios.elCorto}`;
  return `Hola ${invitado.nombre}, te invitamos a celebrar nuestra boda. Aquí tu invitación digital: ${link}`
    .replace('nuestra boda', `la boda de ${novios}`);
}

function linkWhatsApp(invitado) {
  const txt = encodeURIComponent(mensajeInvitacion(invitado));
  const numero = (invitado.telefono || '').replace(/[^\d]/g, '');
  return numero
    ? `https://wa.me/${numero}?text=${txt}`
    : `https://wa.me/?text=${txt}`;
}

function copiarAlPortapapeles(texto) {
  navigator.clipboard.writeText(texto).then(
    () => alert('Copiado'),
    err => alert('No se pudo copiar: ' + err)
  );
}

function renderTabla() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';
  document.getElementById('contador').textContent = `${invitadosActuales.length} invitados`;

  invitadosActuales.forEach(inv => {
    const tr = document.createElement('tr');
    const tieneTel = Boolean(inv.telefono);
    const link = inv.id ? linkInvitacion(inv.id) : '';
    const wa = inv.id ? linkWhatsApp(inv) : '';

    tr.innerHTML = `
      <td>${escapar(inv.nombre)}</td>
      <td><code>${escapar(inv.id || '')}</code></td>
      <td style="text-align:center">${inv.cantidadInvitaciones || 1}</td>
      <td>${escapar(inv.telefono || '(falta)')}</td>
      <td><a href="${link}" target="_blank">abrir</a> · <button type="button" class="btn-link" data-copiar="${escapar(link)}">copiar</button></td>
      <td><a href="${wa}" target="_blank">${tieneTel ? 'al teléfono' : 'sin teléfono'}</a></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-copiar]').forEach(btn => {
    btn.addEventListener('click', () => copiarAlPortapapeles(btn.dataset.copiar));
  });
}

function escapar(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

document.addEventListener('DOMContentLoaded', inicializar);
