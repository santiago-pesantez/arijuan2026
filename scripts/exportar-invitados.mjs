// Exporta la lista pública de invitados desde el backend (Google Apps Script)
// a data/invitados.json, para que el sitio la lea de forma estática (rápida).
//
// El endpoint público NO incluye teléfonos, así que el JSON resultante es seguro
// para publicar en el repositorio.
//
// Uso: node scripts/exportar-invitados.mjs
// Hazlo cada vez que cambie la lista de invitados en la Google Sheet, y luego
// commitea data/invitados.json.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const configPath = resolve('data/config.json');
const salida = resolve('data/invitados.json');

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const base = config.backend && config.backend.url;
if (!base) {
  console.error('No hay backend.url en data/config.json');
  process.exit(1);
}

const url = `${base}?action=invitados`;
console.log(`Consultando ${url} ...`);

const resp = await fetch(url);
if (!resp.ok) {
  console.error(`El backend respondió ${resp.status}`);
  process.exit(1);
}

const data = await resp.json();
const invitados = Array.isArray(data.invitados) ? data.invitados : [];

// Seguridad: nunca publicar teléfonos en el JSON estático.
const limpios = invitados.map(({ telefono, ...resto }) => resto);

writeFileSync(salida, JSON.stringify({ invitados: limpios }, null, 2) + '\n');
console.log(`OK: ${limpios.length} invitados exportados a ${salida} (sin teléfonos).`);
