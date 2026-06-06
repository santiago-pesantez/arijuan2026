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

    const seccionCeremonia = document.getElementById('seccion-ceremonia');
    if (invitado.incluyeCeremonia) {
      seccionCeremonia.hidden = false;
      seccionCeremonia.querySelectorAll('input[name="asistencia_ceremonia"]').forEach(i => i.required = true);
    }

    const seccionFiesta = document.getElementById('seccion-fiesta');
    if (invitado.incluyeFiesta) {
      seccionFiesta.hidden = false;
      seccionFiesta.querySelectorAll('input[name="asistencia_fiesta"]').forEach(i => i.required = true);
    }

    construirSeccionCantidad(invitado.cantidadInvitaciones);
    construirInputsAsistentes(invitado.cantidadInvitaciones, config.comida ? config.comida.menu : (config.cocktail ? config.cocktail.menu : []), invitado.nombre, invitado.incluyeCeremonia);

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
    ? 'Tu invitación es individual.'
    : `Tu invitación incluye hasta ${maxCupos} personas. Indica cuántas asistirán.`;

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

function construirInputsAsistentes(cantidad, opcionesMenu, primerNombre, incluyeMenu) {
  const cont = document.getElementById('asistentes');
  const opcionesHtml = (opcionesMenu || [])
    .map(o => `<option value="${o}">${o}</option>`)
    .join('');

  const camposMenu = incluyeMenu && opcionesMenu && opcionesMenu.length;

  for (let i = 1; i <= cantidad; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'asistente';
    wrap.dataset.indice = String(i);
    const valorNombre = i === 1 && primerNombre ? primerNombre : '';
    wrap.innerHTML = `
      <h4>Asistente ${i}</h4>
      <label>Nombre completo
        <input type="text" name="nombre_${i}" value="${escAttr(valorNombre)}" required>
      </label>
      ${camposMenu ? `
      <label>Preferencia de menú
        <select name="menu_${i}" required>
          <option value="">Selecciona</option>
          ${opcionesHtml}
        </select>
      </label>` : ''}
      <label>Restricciones alimentarias o alergias (opcional)
        <input type="text" name="restricciones_${i}">
      </label>
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
  const asistenciaFiesta = invitadoActual.incluyeFiesta ? (fd.get('asistencia_fiesta') || 'no') : 'no aplica';
  const mensaje = fd.get('mensaje') || '';
  const cantidad = Number(fd.get('cantidad_asistentes') || invitadoActual.cantidadInvitaciones);

  const asistentes = [];
  for (let i = 1; i <= cantidad; i++) {
    asistentes.push({
      nombre: fd.get(`nombre_${i}`) || '',
      menu: fd.get(`menu_${i}`) || '',
      restricciones: fd.get(`restricciones_${i}`) || ''
    });
  }

  const payload = {
    id_invitado: invitadoActual.id,
    nombre_invitado: invitadoActual.nombre,
    asistencia: asistenciaCeremonia,
    cocktail: asistenciaFiesta,
    asistencia_ceremonia: asistenciaCeremonia,
    asistencia_fiesta: asistenciaFiesta,
    acompanante: asistentes.length > 1 ? 'si' : 'no',
    asistentes,
    mensaje
  };

  const lineas = [
    `*RSVP - ${configActual.novios.ellaCorto} & ${configActual.novios.elCorto}*`,
    ``,
    `Invitado: ${invitadoActual.nombre}`,
    `ID: ${invitadoActual.id}`
  ];
  if (invitadoActual.incluyeCeremonia) lineas.push(`Asistirá a ceremonia y comida: ${asistenciaCeremonia}`);
  if (invitadoActual.incluyeFiesta) lineas.push(`Asistirá a la fiesta: ${asistenciaFiesta}`);
  lineas.push(`Cantidad de asistentes: ${asistentes.length}`);
  lineas.push('');
  lineas.push(`*Asistentes:*`);

  asistentes.forEach((a, idx) => {
    const partes = [`${idx + 1}. ${a.nombre}`];
    if (a.menu) partes.push(`Menú: ${a.menu}`);
    if (a.restricciones) partes.push(`Alergias: ${a.restricciones}`);
    lineas.push(partes.join(' | '));
  });
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

  registrarRSVP(invitadoActual.id, asistenciaCeremonia);

  window.location.href = url;
}

function registrarRSVP(idInvitado, asistencia) {
  if (typeof gtag === 'function') {
    gtag('event', 'rsvp_submitted', { invitado_id: idInvitado, asistencia });
  }
}

document.addEventListener('DOMContentLoaded', inicializar);
