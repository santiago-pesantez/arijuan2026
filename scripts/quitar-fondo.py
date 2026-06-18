"""
Quita el fondo claro (blanco/crema) de una imagen y la guarda como WebP
transparente, optimizada para el sitio.

Pensado para ilustraciones tipo acuarela sobre fondo blanco/crema (como las que
genera ChatGPT). Detecta el fondo como los píxeles claros y poco saturados, así
que conserva el dibujo (que está teñido de color) y elimina el papel de fondo,
incluso los huecos encerrados entre adornos.

Uso:
  python scripts/quitar-fondo.py entrada.png salida.webp
  python scripts/quitar-fondo.py entrada.png salida.webp --light 210 --sat 22 --size 700

Parámetros:
  --light  brillo mínimo para considerar un píxel "fondo" (default 210).
  --sat    saturación máxima (max-min de RGB) para considerar "fondo" (default 22).
  --size   lado máximo de la imagen final en píxeles (default 700).

Si quedan recortes en el dibujo, sube --light o baja --sat.
Si queda fondo sin quitar, baja --light o sube --sat.
"""

import sys
import argparse
import numpy as np
from PIL import Image


def quitar_fondo(entrada, salida, light=210, sat=22, size=700):
    im = Image.open(entrada).convert('RGBA')
    arr = np.array(im).astype(int)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    fondo = (mx >= light) & ((mx - mn) <= sat)
    arr[:, :, 3][fondo] = 0

    out = Image.fromarray(arr.astype('uint8'), 'RGBA')
    w, h = out.size
    if max(w, h) > size:
        ratio = size / max(w, h)
        out = out.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
    out.save(salida, 'WEBP', quality=85, method=6)
    print(f'OK: {salida} ({out.size[0]}x{out.size[1]})')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('entrada')
    p.add_argument('salida')
    p.add_argument('--light', type=int, default=210)
    p.add_argument('--sat', type=int, default=22)
    p.add_argument('--size', type=int, default=700)
    args = p.parse_args()
    quitar_fondo(args.entrada, args.salida, args.light, args.sat, args.size)
