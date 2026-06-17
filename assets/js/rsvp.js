let configActual = null;
let invitadoActual = null;

async function inicializar() {
  const errorEl = document.getElementById('error');
  const formEl = document.getElementById('form-rsvp');
  const saludoEl = document.getElementById('saludo');
  const limiteEl = document.getElementById('fecha-limite');
  const introEl = document.getElementById('intro');

  try {
    const id = obtenerIdInvitado();
    const [config, invitado] = await Promise.all([
      cargarConfig(),
      obtenerInvitado(id)
    ]);

    if (!invitado) {
      if (introEl) introEl.hidden = true;
      errorEl.innerHTML = id
        ? 'No encontramos tu invitación. Verifica el enlace recibido por WhatsApp.'
        : 'Para confirmar tu asistencia necesitamos identificarte. Por favor abre el enlace personalizado que recibiste por WhatsApp.';
      errorEl.hidden = false;
      return;
    }

    configActual = config;
    invitadoActual = invitado;

    saludoEl.textContent = formatearSaludo(invitado);
    if (limiteEl) limiteEl.textContent = config.rsvp.fechaLimite;

    if (invitado.incluyeCeremonia) {
      const seccionCeremonia = document.getElementById('seccion-ceremonia');
      seccionCeremonia.hidden = false;
      seccionCeremonia.querySelectorAll('input[name="asistencia_ceremonia"]').forEach(i => i.required = true);
    }

    construirSeccionCantidad(invitado.cantidadInvitaciones);
    // El menú es parte de la ceremonia. Solo se pregunta a quien va a la ceremonia.
    const fuenteMenu = config.recepcion || config.comida || config.cocktail || {};
    const opcionesMenu = invitado.incluyeCeremonia ? (fuenteMenu.menu || []) : [];
    const ayuda = document.getElementById('asistentes-ayuda');
    if (ayuda) {
      ayuda.textContent = opcionesMenu.length
        ? 'Por favor confirma el nombre completo y la preferencia de menú de cada persona que asistirá.'
        : 'Por favor confirma el nombre completo de cada persona que asistirá.';
    }
    construirInputsAsistentes(invitado.cantidadInvitaciones, opcionesMenu, invitado.nombre);

    formEl.hidden = false;
    formEl.addEventListener('submit', enviarRSVP);
  } catch (e) {
    console.error(e);
    errorEl.textContent = 'Hubo un problema cargando el formulario.';
    errorEl.hidden = false;
  }
}

function construirSeccionCantidad(maxCupos) {
  const seccion = document.getElementById('seccion-cantidad');
  const select = document.getElementById('select-cantidad');
  const info = document.getElementById('cupos-info');

  info.textContent = maxCupos === 1
    ? 'Hemos reservado esta invitación para 1 persona.'
    : `Hemos reservado esta invitación para ${maxCupos} personas. Por favor, confirma cuántas asistirán.`;

  for (let i = 1; i <= maxCupos; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = i === 1 ? '1 persona' : `${i} personas`;
    select.appendChild(opt);
  }
  select.value = String(maxCupos);

  if (maxCupos > 1) seccion.hidden = false;

  select.addEventListener('change', () => actualizarVisibilidadAsistentes(Number(select.value)));
}

function construirInputsAsistentes(cantidad, opcionesMenu, nombreInvitado) {
  const cont = document.getElementById('asistentes');
  const tieneMenu = Array.isArray(opcionesMenu) && opcionesMenu.length > 0;
  const opcionesHtml = (opcionesMenu || [])
    .map(o => `<option value="${o}">${o}</option>`)
    .join('');

  // Los nombres en la lista vienen separados por comas; cada uno prepobla un asistente.
  const nombres = String(nombreInvitado || '')
    .split(',')
    .map(n => n.trim())
    .filter(Boolean);

  for (let i = 1; i <= cantidad; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'asistente';
    wrap.dataset.indice = String(i);
    const valorNombre = nombres[i - 1] || '';
    wrap.innerHTML = `
      <h4>Asistente ${i}</h4>
      <label>Nombre completo
        <input type="text" name="nombre_${i}" value="${escAttr(valorNombre)}" required>
      </label>
      ${tieneMenu ? `
      <label>Preferencia de menú
        <select name="menu_${i}" required>
          <option value="">Selecciona</option>
          ${opcionesHtml}
        </select>
      </label>` : ''}
    `;
    cont.appendChild(wrap);
  }
}

function actualizarVisibilidadAsistentes(cantidad) {
  document.querySelectorAll('.asistente').forEach(el => {
    const idx = Number(el.dataset.indice);
    const visible = idx <= cantidad;
    el.hidden = !visible;
    el.querySelectorAll('input, select, textarea').forEach(c => {
      if (c.dataset.required === undefined && c.required) c.dataset.required = '1';
      c.required = visible && c.dataset.required === '1';
    });
  });
}

function escAttr(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function enviarRSVP(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const btn = ev.target.querySelector('button[type="submit"]');
  const estadoEl = document.getElementById('estado-envio');

  const asistenciaCeremonia = invitadoActual.incluyeCeremonia ? (fd.get('asistencia_ceremonia') || 'no') : 'no aplica';
  const asistenciaRecepcion = fd.get('asistencia_recepcion') || 'no';
  const mensaje = fd.get('mensaje') || '';
  const cancion = fd.get('cancion') || '';
  const cantidad = Number(fd.get('cantidad_asistentes') || invitadoActual.cantidadInvitaciones);

  const asistentes = [];
  for (let i = 1; i <= cantidad; i++) {
    asistentes.push({
      nombre: fd.get(`nombre_${i}`) || '',
      menu: fd.get(`menu_${i}`) || ''
    });
  }

  const payload = {
    id_invitado: invitadoActual.id,
    nombre_invitado: invitadoActual.nombre,
    asistencia: asistenciaCeremonia,
    cocktail: asistenciaRecepcion,
    asistencia_ceremonia: asistenciaCeremonia,
    asistencia_recepcion: asistenciaRecepcion,
    acompanante: asistentes.length > 1 ? 'si' : 'no',
    asistentes,
    cancion,
    mensaje
  };

  const lineas = [
    `*RSVP - ${configActual.novios.ellaCorto} & ${configActual.novios.elCorto}*`,
    ``,
    `Invitado: ${invitadoActual.nombre}`,
    `ID: ${invitadoActual.id}`
  ];
  if (invitadoActual.incluyeCeremonia) lineas.push(`Asistirá a la ceremonia: ${asistenciaCeremonia}`);
  lineas.push(`Asistirá a la recepción: ${asistenciaRecepcion}`);
  lineas.push(`Cantidad de asistentes: ${asistentes.length}`);
  lineas.push('');
  lineas.push(`*Asistentes:*`);

  asistentes.forEach((a, idx) => {
    const partes = [`${idx + 1}. ${a.nombre}`];
    if (a.menu) partes.push(`Menú: ${a.menu}`);
    lineas.push(partes.join(' | '));
  });
  if (cancion.trim()) {
    lineas.push('');
    lineas.push(`Canción para la fiesta: ${cancion}`);
  }
  if (mensaje.trim()) {
    lineas.push('');
    lineas.push(`Mensaje: ${mensaje}`);
  }
  const texto = lineas.join('\n');
  const numero = configActual.rsvp.telefonoWhatsapp;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
  if (estadoEl) { estadoEl.textContent = 'Guardando tu respuesta...'; estadoEl.hidden = false; }

  const resultado = await enviarRSVPBackend(payload);
  if (!resultado.ok) {
    console.warn('No se pudo guardar en backend:', resultado.motivo);
  }

  registrarRSVP(invitadoActual.id, asistenciaRecepcion);

  window.location.href = url;
}

function registrarRSVP(idInvitado, asistencia) {
  if (typeof gtag === 'function') {
    gtag('event', 'rsvp_submitted', { invitado_id: idInvitado, asistencia });
  }
}

document.addEventListener('DOMContentLoaded', inicializar);
