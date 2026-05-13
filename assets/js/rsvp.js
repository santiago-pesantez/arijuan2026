let configActual = null;
let invitadoActual = null;

async function inicializar() {
  const errorEl = document.getElementById('error');
  const formEl = document.getElementById('form-rsvp');
  const saludoEl = document.getElementById('saludo');
  const limiteEl = document.getElementById('fecha-limite');

  try {
    const id = obtenerIdInvitado();
    const [config, invitado] = await Promise.all([
      cargarConfig('../'),
      obtenerInvitado(id, '../')
    ]);

    if (!invitado) {
      errorEl.textContent = id
        ? 'No encontramos tu invitación. Verifica el enlace recibido.'
        : 'Falta el identificador del invitado en el enlace.';
      errorEl.hidden = false;
      return;
    }

    configActual = config;
    invitadoActual = invitado;

    saludoEl.textContent = invitado.saludo || invitado.nombre;
    if (limiteEl) limiteEl.textContent = config.rsvp.fechaLimite;

    const seccionCocktail = document.getElementById('seccion-cocktail');
    if (!invitado.incluyeCocktail) seccionCocktail.hidden = true;

    construirInputsAsistentes(invitado.cantidadInvitaciones, config.cocktail.menu);

    formEl.hidden = false;
    formEl.addEventListener('submit', enviarRSVP);
  } catch (e) {
    console.error(e);
    errorEl.textContent = 'Hubo un problema cargando el formulario.';
    errorEl.hidden = false;
  }
}

function construirInputsAsistentes(cantidad, opcionesMenu) {
  const cont = document.getElementById('asistentes');
  const opcionesHtml = opcionesMenu
    .map(o => `<option value="${o}">${o}</option>`)
    .join('');

  for (let i = 1; i <= cantidad; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'asistente';
    wrap.innerHTML = `
      <h4>Asistente ${i}</h4>
      <label>Nombre completo
        <input type="text" name="nombre_${i}" required>
      </label>
      <label>Preferencia de menú
        <select name="menu_${i}" required>
          <option value="">Selecciona</option>
          ${opcionesHtml}
        </select>
      </label>
      <label>Restricciones alimentarias o alergias (opcional)
        <input type="text" name="restricciones_${i}">
      </label>
    `;
    cont.appendChild(wrap);
  }
}

async function enviarRSVP(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const btn = ev.target.querySelector('button[type="submit"]');
  const estadoEl = document.getElementById('estado-envio');

  const asistencia = fd.get('asistencia');
  const cocktail = fd.get('cocktail') || 'no aplica';
  const traeAcompanante = fd.get('acompanante') || 'no';
  const mensaje = fd.get('mensaje') || '';

  const asistentes = [];
  for (let i = 1; i <= invitadoActual.cantidadInvitaciones; i++) {
    asistentes.push({
      nombre: fd.get(`nombre_${i}`) || '',
      menu: fd.get(`menu_${i}`) || '',
      restricciones: fd.get(`restricciones_${i}`) || ''
    });
  }

  const payload = {
    id_invitado: invitadoActual.id,
    nombre_invitado: invitadoActual.nombre,
    asistencia,
    cocktail,
    acompanante: traeAcompanante,
    asistentes,
    mensaje
  };

  const lineas = [
    `*RSVP - ${configActual.novios.ellaCorto} & ${configActual.novios.elCorto}*`,
    ``,
    `Invitado: ${invitadoActual.nombre}`,
    `ID: ${invitadoActual.id}`,
    `Asistirá a la ceremonia: ${asistencia}`,
    `Asistirá al cocktail: ${cocktail}`,
    `Trae acompañante (+1): ${traeAcompanante}`,
    ``,
    `*Asistentes:*`
  ];
  asistentes.forEach((a, idx) => {
    lineas.push(`${idx + 1}. ${a.nombre} | Menú: ${a.menu}${a.restricciones ? ` | Alergias: ${a.restricciones}` : ''}`);
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

  const resultado = await enviarRSVPBackend(payload, '../');
  if (!resultado.ok) {
    console.warn('No se pudo guardar en backend:', resultado.motivo);
  }

  registrarRSVP(invitadoActual.id, asistencia);

  window.location.href = url;
}

function registrarRSVP(idInvitado, asistencia) {
  if (typeof gtag === 'function') {
    gtag('event', 'rsvp_submitted', { invitado_id: idInvitado, asistencia });
  }
}

document.addEventListener('DOMContentLoaded', inicializar);
