"""
Genera la imagen para redes sociales (Open Graph) de cada edición.

Crea un archivo og.jpg de 1200x630 en la carpeta de cada edición,
con su portada, el nombre de la publicación, el número y la fecha.
El middleware (middleware.js) usa esa imagen cuando alguien comparte
el enlace de la edición.

Uso, desde la raíz del proyecto:

    python3 herramientas/generar_og.py            # solo ediciones sin og.jpg
    python3 herramientas/generar_og.py --todas    # regenera todas

Requiere Node.js (para leer ediciones.js) y Pillow.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = Path(__file__).resolve().parent / "fuentes"

ANCHO, ALTO = 1200, 630

PAPEL = (248, 247, 242)
TINTA = (23, 26, 24)
GRIS = (105, 110, 105)
MAGENTA = (192, 0, 91)
NARANJA = (240, 91, 36)
FRANJA = [
    (22, 136, 60),
    (192, 0, 91),
    (35, 68, 161),
    (240, 91, 36),
    (244, 195, 28),
]


def leer_ediciones():
    codigo = (
        "const fs = require('fs');"
        "eval(fs.readFileSync(process.argv[1], 'utf8') +"
        "  ';process.stdout.write(JSON.stringify(AKROS_EDICIONES))');"
    )
    salida = subprocess.run(
        ["node", "-e", codigo, str(RAIZ / "ediciones.js")],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(salida.stdout)


def sans(tamano, peso):
    fuente = ImageFont.truetype(str(FUENTES / "DMSans.ttf"), tamano)
    try:
        fuente.set_variation_by_axes([14, peso])
    except (OSError, AttributeError):
        pass
    return fuente


def serif(tamano):
    return ImageFont.truetype(
        str(FUENTES / "LibreCaslonDisplay-Regular.ttf"), tamano
    )


def partir_lineas(dibujo, texto, fuente, ancho_maximo):
    lineas, actual = [], ""
    for palabra in texto.split():
        prueba = f"{actual} {palabra}".strip()
        if dibujo.textlength(prueba, font=fuente) <= ancho_maximo:
            actual = prueba
        else:
            lineas.append(actual)
            actual = palabra
    lineas.append(actual)
    return lineas


def generar(publicacion, edicion, destino):
    imagen = Image.new("RGB", (ANCHO, ALTO), PAPEL)
    dibujo = ImageDraw.Draw(imagen)

    for i, color in enumerate(FRANJA):
        x0, x1 = i * ANCHO // 5, (i + 1) * ANCHO // 5
        dibujo.rectangle([x0, 0, x1, 12], fill=color)
        dibujo.rectangle([x0, ALTO - 12, x1, ALTO], fill=color)

    # Portada con sombra, como una revista apoyada sobre la mesa.
    portada = Image.open(RAIZ / edicion["portada"]).convert("RGB")
    alto_portada = 520
    ancho_portada = round(portada.width * alto_portada / portada.height)
    portada = portada.resize((ancho_portada, alto_portada), Image.LANCZOS)
    x_portada, y_portada = 80, (ALTO - alto_portada) // 2

    sombra = Image.new("L", (ANCHO, ALTO), 0)
    ImageDraw.Draw(sombra).rectangle(
        [
            x_portada + 6,
            y_portada + 14,
            x_portada + ancho_portada + 6,
            y_portada + alto_portada + 14,
        ],
        fill=110,
    )
    sombra = sombra.filter(ImageFilter.GaussianBlur(16))
    imagen.paste(Image.new("RGB", (ANCHO, ALTO), (40, 40, 40)), (0, 0), sombra)
    imagen.paste(portada, (x_portada, y_portada))

    x = x_portada + ancho_portada + 70
    ancho_texto = ANCHO - x - 60

    dibujo.text(
        (x, 150), "COLEGIO AKROS", font=sans(24, 700), fill=MAGENTA
    )

    fuente_titulo = serif(78)
    lineas = partir_lineas(
        dibujo, publicacion["nombre"], fuente_titulo, ancho_texto
    )
    if len(lineas) > 2:
        fuente_titulo = serif(58)
        lineas = partir_lineas(
            dibujo, publicacion["nombre"], fuente_titulo, ancho_texto
        )

    y = 190
    for linea in lineas:
        dibujo.text((x, y), linea, font=fuente_titulo, fill=TINTA)
        y += round(fuente_titulo.size * 1.12)

    y += 22
    dibujo.line([x, y, x + 90, y], fill=NARANJA, width=5)
    y += 26

    numero = f"Edición N.º {edicion['numero']}"
    dibujo.text((x, y), numero, font=sans(36, 700), fill=TINTA)
    y += 50

    fecha = edicion.get("fecha") or str(edicion["anio"])
    dibujo.text((x, y), fecha, font=sans(30, 500), fill=GRIS)

    imagen.save(destino, "JPEG", quality=86, optimize=True, progressive=True)


def main():
    todas = "--todas" in sys.argv
    generadas = 0

    for publicacion in leer_ediciones().values():
        for edicion in publicacion["ediciones"]:
            destino = RAIZ / edicion["carpeta"] / "og.jpg"
            if destino.exists() and not todas:
                continue
            generar(publicacion, edicion, destino)
            print(f"Generada {destino.relative_to(RAIZ)}")
            generadas += 1

    if not generadas:
        print("Todas las ediciones ya tienen su imagen og.jpg.")


if __name__ == "__main__":
    main()
