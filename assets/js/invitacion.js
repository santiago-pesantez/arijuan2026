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

  if (config.padres) {
    const novia = document.getElementById('padres-novia');
    const novio = document.getElementById('padres-novio');
    if (novia) novia.textContent = config.padres.novia || '';
    if (novio) novio.textContent = config.padres.novio || '';
  }

  const bloqueCeremonia = document.getElementById('bloque-ceremonia');
  if (invitado.incluyeCeremonia) {
    document.getElementById('ceremonia-hora').textContent = config.ceremonia.hora;
    document.getElementById('ceremonia-lugar').textContent = config.ceremonia.lugar;
    document.getElementById('ceremonia-direccion').textContent = config.ceremonia.direccion;
    // El almuerzo solo se muestra dentro del bloque de la ceremonia (solo invitados a ella).
    const bloqueAlmuerzo = document.getElementById('bloque-almuerzo');
    if (config.almuerzo && bloqueAlmuerzo) {
      document.getElementById('almuerzo-hora').textContent = config.almuerzo.hora;
      // El almuerzo es en el mismo lugar que la ceremonia.
      document.getElementById('almuerzo-lugar').textContent = config.almuerzo.lugar || config.ceremonia.lugar;
      document.getElementById('almuerzo-direccion').textContent = config.almuerzo.direccion || config.ceremonia.direccion;
      bloqueAlmuerzo.hidden = false;
    } else if (bloqueAlmuerzo) {
      bloqueAlmuerzo.hidden = true;
    }
    bloqueCeremonia.hidden = false;
  } else {
    bloqueCeremonia.hidden = true;
  }

  const recepcion = config.recepcion || config.cocktail || config.comida;
  if (recepcion) {
    document.getElementById('recepcion-hora').textContent = recepcion.hora;
    document.getElementById('recepcion-lugar').textContent = recepcion.lugar || '';
    document.getElementById('recepcion-direccion').textContent = recepcion.direccion || '';
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
