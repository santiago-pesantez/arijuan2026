async function renderInvitacion() {
  const errorEl = document.getElementById('error');
  const contenidoEl = document.getElementById('contenido');

  try {
    const id = obtenerIdInvitado();
    const [config, invitado] = await Promise.all([
      cargarConfig(),
      obtenerInvitado(id)
    ]);

    if (!invitado) {
      errorEl.textContent = id
        ? 'No encontramos tu invitación. Verifica el enlace recibido.'
        : 'Falta el identificador del invitado en el enlace.';
      errorEl.hidden = false;
      return;
    }

    document.getElementById('saludo').textContent = invitado.saludo || invitado.nombre;
    document.getElementById('fecha').textContent = config.ceremonia.fecha;
    document.getElementById('hora').textContent = config.ceremonia.hora;
    document.getElementById('lugar').textContent = `${config.ceremonia.lugar}, ${config.ceremonia.direccion}`;
    const hashtagEl = document.getElementById('hashtag');
    if (hashtagEl) hashtagEl.textContent = config.hashtag;

    const cocktail = document.getElementById('cocktail-msg');
    if (invitado.incluyeCocktail) {
      cocktail.textContent = 'Acompáñanos también al cocktail posterior.';
    } else {
      cocktail.hidden = true;
    }

    const rsvpLink = document.getElementById('rsvp-link');
    rsvpLink.href = `/rsvp/?id=${encodeURIComponent(invitado.id)}`;

    const sitioLink = document.getElementById('sitio-link');
    sitioLink.href = `/boda/`;

    contenidoEl.hidden = false;

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
