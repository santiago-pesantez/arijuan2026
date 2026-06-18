async function renderInvitacion() {
  const errorEl = document.getElementById('error');

  const id = obtenerIdInvitado();
  if (!id) {
    window.location.replace('/boda/');
    return;
  }

  let config;
  try {
    config = await cargarConfig();
  } catch (e) {
    console.error(e);
    errorEl.textContent = 'Hubo un problema cargando la invitación.';
    errorEl.hidden = false;
    return;
  }

  // 1. Mostrar al instante desde el cache local si ya se abrió antes.
  const cacheado = leerInvitadoCache(id);
  if (cacheado) pintarInvitacion(config, cacheado);

  // 2. Revalidar contra el backend y actualizar (stale-while-revalidate).
  try {
    const invitado = await obtenerInvitado(id);
    if (invitado) {
      pintarInvitacion(config, invitado);
      registrarApertura(invitado.id);
    } else if (!cacheado) {
      errorEl.textContent = 'No encontramos tu invitación. Verifica el enlace recibido por WhatsApp.';
      errorEl.hidden = false;
    }
  } catch (e) {
    console.error(e);
    if (!cacheado) {
      errorEl.textContent = 'Hubo un problema cargando la invitación.';
      errorEl.hidden = false;
    }
  }
}

function pintarInvitacion(config, invitado) {
  const errorEl = document.getElementById('error');
  errorEl.hidden = true;

  document.getElementById('saludo').textContent = nombreParaInvitacion(invitado);
  document.getElementById('fecha').textContent = config.ceremonia.fecha;
  const hashtagEl = document.getElementById('hashtag');
  if (hashtagEl) hashtagEl.textContent = config.hashtag;

  // El lugar es el mismo para ceremonia y recepción: se muestra una sola vez.
  document.getElementById('lugar').textContent =
    `${config.ceremonia.lugar}, ${config.ceremonia.direccion}`.replace(/, $/, '');

  if (config.padres) {
    const novia = document.getElementById('padres-novia');
    const novio = document.getElementById('padres-novio');
    if (novia) novia.textContent = config.padres.novia || '';
    if (novio) novio.textContent = config.padres.novio || '';
  }

  const bloqueCeremonia = document.getElementById('bloque-ceremonia');
  if (invitado.incluyeCeremonia) {
    document.getElementById('ceremonia-hora').textContent = config.ceremonia.hora;
    bloqueCeremonia.hidden = false;
  } else {
    bloqueCeremonia.hidden = true;
  }

  const recepcion = config.recepcion || config.cocktail || config.comida;
  if (recepcion) {
    document.getElementById('recepcion-hora').textContent = recepcion.hora;
  }

  const rsvpLink = document.getElementById('rsvp-link');
  rsvpLink.href = `/rsvp/?id=${encodeURIComponent(invitado.id)}`;

  const sitioLink = document.getElementById('sitio-link');
  sitioLink.href = `/boda/`;

  document.getElementById('contenido').classList.add('cargada');
}

function registrarApertura(idInvitado) {
  if (typeof gtag === 'function') {
    gtag('event', 'invitation_opened', { invitado_id: idInvitado });
  }
}

document.addEventListener('DOMContentLoaded', renderInvitacion);
