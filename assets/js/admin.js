const TOKEN_KEY = 'arijuan_admin_token';

let configActual = null;
let invitadosActuales = [];
let filtro = '';
let orden = { campo: null, dir: 1 };

async function inicializar() {
  document.getElementById('btn-guardar-token').addEventListener('click', guardarToken);
  document.getElementById('btn-refrescar').addEventListener('click', refrescar);

  const buscar = document.getElementById('buscar');
  buscar.addEventListener('input', e => { filtro = e.target.value; renderTabla(); });
  document.getElementById('btn-limpiar').addEventListener('click', () => {
    filtro = '';
    buscar.value = '';
    renderTabla();
  });
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => ordenarPor(th.dataset.campo));
  });

  const tokenInput = document.getElementById('input-token');
  tokenInput.value = localStorage.getItem(TOKEN_KEY) || '';

  try {
    configActual = await cargarConfig();
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

function mostrarBloqueo(mensaje) {
  invitadosActuales = [];
  const tabla = document.getElementById('tabla-invitados');
  const bloqueo = document.getElementById('bloqueo');
  if (tabla) tabla.hidden = true;
  if (bloqueo) { bloqueo.textContent = mensaje; bloqueo.hidden = false; }
  document.getElementById('contador').textContent = '';
}

async function refrescar() {
  const errorEl = document.getElementById('error');
  errorEl.hidden = true;

  const token = localStorage.getItem(TOKEN_KEY) || undefined;
  if (!token) {
    mostrarBloqueo('Ingresa tu token de admin arriba para ver la lista de invitados.');
    return;
  }

  try {
    const data = await cargarInvitados({ token });
    const invitados = data.invitados || [];

    // El backend solo incluye el campo `telefono` cuando el token es válido.
    // Si hay invitados pero ninguno trae datos privados, el token no es correcto.
    const tokenValido = invitados.length === 0 || invitados.some(i => 'telefono' in i);
    if (!tokenValido) {
      mostrarBloqueo('Token inválido. Verifica el ADMIN_TOKEN e inténtalo de nuevo.');
      return;
    }

    document.getElementById('bloqueo').hidden = true;
    document.getElementById('tabla-invitados').hidden = false;
    invitadosActuales = invitados;
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

function ordenarPor(campo) {
  if (orden.campo === campo) orden.dir *= -1;
  else { orden.campo = campo; orden.dir = 1; }
  renderTabla();
}

function valorCampo(inv, campo) {
  switch (campo) {
    case 'nombre': return (inv.nombre || '').toLowerCase();
    case 'id': return (inv.id || '').toLowerCase();
    case 'cupos': return Number(inv.cantidadInvitaciones) || 0;
    case 'ceremonia': return inv.incluyeCeremonia ? 1 : 0;
    case 'telefono': return String(inv.telefono || '');
    default: return '';
  }
}

function vistaInvitados() {
  let lista = invitadosActuales.slice();

  const q = filtro.trim().toLowerCase();
  if (q) {
    lista = lista.filter(inv =>
      (inv.nombre || '').toLowerCase().includes(q) ||
      (inv.id || '').toLowerCase().includes(q) ||
      String(inv.telefono || '').toLowerCase().includes(q)
    );
  }

  if (orden.campo) {
    lista.sort((a, b) => {
      const va = valorCampo(a, orden.campo);
      const vb = valorCampo(b, orden.campo);
      if (va < vb) return -orden.dir;
      if (va > vb) return orden.dir;
      return 0;
    });
  }

  return lista;
}

function renderTabla() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  const lista = vistaInvitados();
  const total = invitadosActuales.length;
  document.getElementById('contador').textContent = lista.length === total
    ? `${total} invitados`
    : `${lista.length} de ${total} invitados`;

  document.querySelectorAll('th.sortable').forEach(th => {
    const span = th.querySelector('.orden');
    if (span) span.textContent = th.dataset.campo === orden.campo ? (orden.dir === 1 ? '▲' : '▼') : '';
  });

  lista.forEach(inv => {
    const tr = document.createElement('tr');
    const tieneTel = Boolean(inv.telefono);
    const link = inv.id ? linkInvitacion(inv.id) : '';
    const wa = inv.id ? linkWhatsApp(inv) : '';
    const ceremonia = inv.incluyeCeremonia ? 'Sí' : 'No';

    tr.innerHTML = `
      <td>${escapar(inv.nombre)}</td>
      <td><code>${escapar(inv.id || '')}</code></td>
      <td style="text-align:center">${inv.cantidadInvitaciones || 1}</td>
      <td style="text-align:center">${ceremonia}</td>
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
