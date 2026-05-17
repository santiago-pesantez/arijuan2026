"""
Convierte y optimiza fotos para la web.

Lee de fotos/ y escribe a assets/img/galeria/ con:
- HEIC convertido a JPG
- Redimensionado a max 1600px en el lado largo
- Calidad JPG 82 (buena calidad, archivos chicos)
- Rotacion EXIF aplicada

Uso: python scripts/optimizar-fotos.py
"""

from pathlib import Path
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ENTRADA = Path("fotos")
SALIDA = Path("assets/img/galeria")
MAX_LADO = 1600
CALIDAD = 82

EXTENSIONES = {".heic", ".jpg", ".jpeg", ".png"}
SKIP_PATTERNS = (".mov",)


def slug(nombre):
    return nombre.lower().replace(".jpg.jpeg", ".jpg").replace(" ", "-")


def procesar(archivo, salida_dir):
    nombre_base = archivo.stem
    if nombre_base.lower().endswith(".jpg"):
        nombre_base = nombre_base[:-4]

    destino = salida_dir / f"{slug(nombre_base)}.jpg"

    try:
        im = Image.open(archivo)
        im = ImageOps.exif_transpose(im)
        if im.mode != "RGB":
            im = im.convert("RGB")

        w, h = im.size
        lado_max = max(w, h)
        if lado_max > MAX_LADO:
            ratio = MAX_LADO / lado_max
            im = im.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

        im.save(destino, "JPEG", quality=CALIDAD, optimize=True, progressive=True)
        return destino, archivo.stat().st_size, destino.stat().st_size
    except Exception as e:
        return None, 0, str(e)


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    total_in = total_out = 0
    procesadas = errores = 0

    for archivo in sorted(ENTRADA.iterdir()):
        if not archivo.is_file():
            continue
        ext = archivo.suffix.lower()
        if any(archivo.name.lower().endswith(p) for p in SKIP_PATTERNS):
            print(f"  SKIP video: {archivo.name}")
            continue
        if ext not in EXTENSIONES:
            print(f"  SKIP {ext}: {archivo.name}")
            continue

        destino, tam_in, tam_out_o_err = procesar(archivo, SALIDA)
        if destino is None:
            print(f"  ERROR {archivo.name}: {tam_out_o_err}")
            errores += 1
        else:
            kb_in = tam_in / 1024
            kb_out = tam_out_o_err / 1024
            total_in += tam_in
            total_out += tam_out_o_err
            procesadas += 1
            print(f"  OK {archivo.name:30s} -> {destino.name:30s} {kb_in:8.0f}KB -> {kb_out:7.0f}KB")

    print(f"\n{procesadas} procesadas, {errores} errores")
    print(f"Total: {total_in/1024/1024:.1f}MB -> {total_out/1024/1024:.1f}MB")


if __name__ == "__main__":
    main()
