let configActual = null;
let invitadoActual = null;

async function inicializar() {
  const errorEl = document.getElementById('error');
  const formEl = document.getElementById('form-rsvp');
  const saludoEl = document.getElementById('saludo');

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

    saludoEl.textContent = `${invitado.saludo || invitado.nombre}`;

    const seccionCocktail = document.getElementById('seccion-cocktail');
    if (!invitado.incluyeCocktail) seccionCocktail.hidden = true;

    construirInputsAsistentes(invitado.cantidadInvitaciones);

    formEl.hidden = false;
    formEl.addEventListener('submit', enviarRSVP);
  } catch (e) {
    console.error(e);
    errorEl.textContent = 'Hubo un problema cargando el formulario.';
    errorEl.hidden = false;
  }
}

function construirInputsAsistentes(cantidad) {
  const cont = document.getElementById('asistentes');
  for (let i = 1; i <= cantidad; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'asistente';
    wrap.innerHTML = `
      <h4>Invitado ${i}</h4>
      <label>Nombre <input type="text" name="nombre_${i}" required></label>
      <label>Preferencia de menú
        <select name="menu_${i}" required>
          <option value="">Selecciona</option>
          <option value="carne">Carne</option>
          <option value="pollo">Pollo</option>
          <option value="pescado">Pescado</option>
          <option value="vegetariano">Vegetariano</option>
        </select>
      </label>
      <label>Restricciones o alergias <input type="text" name="restricciones_${i}"></label>
    `;
    cont.appendChild(wrap);
  }
}

function enviarRSVP(ev) {
  ev.preventDefault();
  const fd = new FormData(ev.target);

  const asistencia = fd.get('asistencia');
  const cocktail = fd.get('cocktail') || 'no aplica';
  const mensaje = fd.get('mensaje') || '';

  const asistentes = [];
  for (let i = 1; i <= invitadoActual.cantidadInvitaciones; i++) {
    asistentes.push({
      nombre: fd.get(`nombre_${i}`) || '',
      menu: fd.get(`menu_${i}`) || '',
      restricciones: fd.get(`restricciones_${i}`) || ''
    });
  }

  const lineas = [
    `*RSVP - ${configActual.novios.ella} & ${configActual.novios.el}*`,
    ``,
    `Invitado: ${invitadoActual.nombre}`,
    `ID: ${invitadoActual.id}`,
    `Asistirá: ${asistencia}`,
    `Cocktail: ${cocktail}`,
    ``,
    `*Asistentes:*`
  ];

  asistentes.forEach((a, idx) => {
    lineas.push(`${idx + 1}. ${a.nombre} | Menú: ${a.menu}${a.restricciones ? ` | Restricciones: ${a.restricciones}` : ''}`);
  });

  if (mensaje.trim()) {
    lineas.push('');
    lineas.push(`Mensaje: ${mensaje}`);
  }

  const texto = lineas.join('\n');
  const numero = configActual.rsvp.telefonoWhatsapp;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

  registrarRSVP(invitadoActual.id, asistencia);

  window.location.href = url;
}

function registrarRSVP(idInvitado, asistencia) {
  if (typeof gtag === 'function') {
    gtag('event', 'rsvp_submitted', { invitado_id: idInvitado, asistencia });
  }
}

document.addEventListener('DOMContentLoaded', inicializar);
