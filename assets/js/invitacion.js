async function renderInvitacion() {
  const errorEl = document.getElementById('error');
  const contenidoEl = document.getElementById('contenido');

  const id = obtenerIdInvitado();
  if (!id) {
    window.location.replace('/boda/');
    return;
  }

  try {
    const [config, invitado] = await Promise.all([
      cargarConfig(),
      obtenerInvitado(id)
    ]);

    if (!invitado) {
      errorEl.textContent = 'No encontramos tu invitación. Verifica el enlace recibido por WhatsApp.';
      errorEl.hidden = false;
      return;
    }

    document.getElementById('saludo').textContent = nombreParaInvitacion(invitado);
    document.getElementById('fecha').textContent = config.ceremonia.fecha;
    const hashtagEl = document.getElementById('hashtag');
    if (hashtagEl) hashtagEl.textContent = config.hashtag;

    if (config.padres) {
      const novia = document.getElementById('padres-novia');
      const novio = document.getElementById('padres-novio');
      if (novia) novia.textContent = config.padres.novia || '';
      if (novio) novio.textContent = config.padres.novio || '';
    }

    if (invitado.incluyeCeremonia) {
      const bloque = document.getElementById('bloque-ceremonia');
      document.getElementById('ceremonia-hora').textContent = config.ceremonia.hora;
      document.getElementById('ceremonia-lugar').textContent = `${config.ceremonia.lugar}, ${config.ceremonia.direccion}`;
      bloque.hidden = false;
    }

    const recepcion = config.recepcion || config.cocktail || config.comida;
    if (recepcion) {
      document.getElementById('recepcion-hora').textContent = recepcion.hora;
      document.getElementById('recepcion-lugar').textContent = `${recepcion.lugar}, ${recepcion.direccion || ''}`.replace(/, $/, '');
    }

    const rsvpLink = document.getElementById('rsvp-link');
    rsvpLink.href = `/rsvp/?id=${encodeURIComponent(invitado.id)}`;

    const sitioLink = document.getElementById('sitio-link');
    sitioLink.href = `/boda/`;

    contenidoEl.classList.add('cargada');

    registrarApertura(invitado.id);
  } catch (e) {
    console.error(e);
    errorEl.textContent = 'Hubo un problema cargando la invitación.';
    errorEl.hidden = false;
  }
}

function registrarApertura(idInvitado) {
  if (typeof gtag === 'function') {
    gtag('event', 'invitation_opened', { invitado_id: idInvitado });
  }
}

document.addEventListener('DOMContentLoaded', renderInvitacion);
