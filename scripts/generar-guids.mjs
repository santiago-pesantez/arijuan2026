// Asigna GUIDs a los invitados que no tengan uno.
// Uso: node scripts/generar-guids.mjs [ruta-entrada] [ruta-salida]
// Por defecto: lee y reescribe data/invitados.json

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const entrada = resolve(process.argv[2] || 'data/invitados.json');
const salida = resolve(process.argv[3] || entrada);

const slug = nombre =>
  nombre.toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 20);

const sufijo = () => Math.random().toString(36).slice(2, 6);

const data = JSON.parse(readFileSync(entrada, 'utf8'));
const invitados = data.invitados || data;

let nuevos = 0;
const usados = new Set(invitados.filter(i => i.id).map(i => i.id));

for (const inv of invitados) {
  if (inv.id) continue;
  let candidato;
  do {
    candidato = `${slug(inv.nombre || 'invitado')}-${sufijo()}`;
  } while (usados.has(candidato));
  inv.id = candidato;
  usados.add(candidato);
  nuevos++;
}

writeFileSync(salida, JSON.stringify({ invitados }, null, 2) + '\n');
console.log(`OK: ${nuevos} GUID(s) nuevo(s) asignado(s). Guardado en ${salida}`);
