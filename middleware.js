/* =========================================================
   PERIÓDICO ESCOLAR DIGITAL AKROS
   VISTA PREVIA PARA REDES SOCIALES POR EDICIÓN

   WhatsApp, Facebook y X no ejecutan JavaScript, así que
   revista.html siempre mostraba la misma vista previa.

   Este middleware de Vercel recibe los enlaces del tipo
   revista.html?publicacion=desayunito&anio=2026&edicion=26
   y entrega la página con el título y la imagen (og.jpg)
   de esa edición. Si algo falla, se sirve la página normal.

   Las imágenes og.jpg se crean con herramientas/generar_og.py
========================================================= */

export const config = {
  matcher: "/revista.html"
};

const SITIO = "Periódico Escolar Akros";

const PUBLICACIONES = {
  desayunito: "El Desayunito",
  desayuno: "El Desayuno",
  english: "El Desayuno English Edition"
};

/*
   Cabecera que marca la petición interna con la que este
   middleware obtiene revista.html, para no procesarla dos veces.
*/
const PETICION_INTERNA = "x-akros-og";


function escaparAtributo(texto) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}


function cambiarMeta(html, clave, valor) {
  const patron = new RegExp(
    `(<meta (?:property|name)="${clave}" content=")[^"]*(")`
  );

  return html.replace(
    patron,
    (_, inicio, fin) => inicio + escaparAtributo(valor) + fin
  );
}


export default async function middleware(request) {
  if (request.headers.get(PETICION_INTERNA)) {
    return;
  }

  const url = new URL(request.url);

  const publicacion = url.searchParams.get("publicacion") || "";
  const anio = url.searchParams.get("anio") || "";
  const numero = url.searchParams.get("edicion") || "";

  const nombre = PUBLICACIONES[publicacion];

  if (
    !nombre ||
    !/^\d{4}$/.test(anio) ||
    !/^\d{1,4}$/.test(numero)
  ) {
    return;
  }

  const imagen =
    `${url.origin}/assets/ediciones/${publicacion}/${anio}/${numero}/og.jpg`;

  const enlace =
    `${url.origin}/revista.html?publicacion=${publicacion}` +
    `&anio=${anio}&edicion=${numero}`;

  try {
    const [pagina, existeImagen] = await Promise.all([
      fetch(`${url.origin}/revista.html`, {
        headers: { [PETICION_INTERNA]: "1" }
      }),
      fetch(imagen, { method: "HEAD" })
    ]);

    if (!pagina.ok || !existeImagen.ok) {
      return;
    }

    const titulo = `${nombre} · Edición N.º ${numero} (${anio})`;

    const descripcion =
      `Lee en línea la edición N.º ${numero} de ${nombre}, ` +
      `del Periódico Escolar Digital del Colegio Akros. ` +
      `Hojéala como una revista o descárgala en PDF.`;

    let html = await pagina.text();

    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${titulo} | ${SITIO}</title>`
    );

    html = cambiarMeta(html, "description", descripcion);
    html = cambiarMeta(html, "og:title", titulo);
    html = cambiarMeta(html, "og:description", descripcion);
    html = cambiarMeta(html, "og:image", imagen);
    html = cambiarMeta(html, "og:image:alt", `Portada de ${nombre} N.º ${numero}`);
    html = cambiarMeta(html, "twitter:title", titulo);
    html = cambiarMeta(html, "twitter:description", descripcion);
    html = cambiarMeta(html, "twitter:image", imagen);

    html = html.replace(
      /(<meta property="og:title"[^>]*>)/,
      `$1\n  <meta property="og:url" content="${escaparAtributo(enlace)}">`
    );

    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate"
      }
    });
  } catch (error) {
    return;
  }
}
