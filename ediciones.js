/* =========================================================
   PERIÓDICO ESCOLAR DIGITAL AKROS
   REGISTRO CENTRAL DE PUBLICACIONES Y EDICIONES

   Cada edición se identifica por:
   PUBLICACIÓN + AÑO + NÚMERO

   Ejemplo:
   El Desayuno / 2026 / N.º 25
========================================================= */

const AKROS_EDICIONES = {

  /* =======================================================
     EL DESAYUNITO
  ======================================================= */

  desayunito: {

    nombre: "El Desayunito",

    numeroPublicacion: "01",

    nivel: "Kinder — 4.º básico",

    descripcion:
      "Historias, aprendizajes y experiencias de nuestros estudiantes más pequeños.",

    ediciones: []

  },


  /* =======================================================
     EL DESAYUNO
  ======================================================= */

  desayuno: {

    nombre: "El Desayuno",

    numeroPublicacion: "02",

    nivel: "5.º básico — IV.º medio",

    descripcion:
      "Entrevistas, protagonistas, opinión, cultura y temas que conectan con nuestros estudiantes.",

    ediciones: [

      /* ---------------------------------------------------
         2026 · EDICIÓN N.º 25
      --------------------------------------------------- */

      {

        anio: 2026,

        numero: 25,

        fecha: "Septiembre 2026",

        paginas: 7,

        carpeta:
          "assets/ediciones/desayuno/2026/25",

        portada:
          "assets/ediciones/desayuno/2026/25/pagina-01.webp",

        pdf:
          "assets/ediciones/desayuno/2026/25/el-desayuno-25.pdf",

        descripcion:
          "Una nueva edición con entrevistas, protagonistas, recomendaciones y temas para descubrir."

      },


      /* ---------------------------------------------------
         2025 · EDICIÓN N.º 28
      --------------------------------------------------- */

      {

        anio: 2025,

        numero: 28,

        fecha: "Octubre 2025",

        paginas: 4,

        carpeta:
          "assets/ediciones/desayuno/2025/28",

        portada:
          "assets/ediciones/desayuno/2025/28/pagina-01.webp",

        pdf:
          "assets/ediciones/desayuno/2025/28/el-desayuno-28.pdf",

        descripcion:
          "Edición de octubre de 2025 con curso destacado, despedida de IV° medio, entrevistas, curiosidades, experimentos y desafíos."

      }

    ]

  },


  /* =======================================================
     EL DESAYUNO ENGLISH EDITION
  ======================================================= */

  english: {

    nombre: "El Desayuno English Edition",

    numeroPublicacion: "03",

    nivel: "English Edition",

    descripcion:
      "Stories, ideas and voices from our school community, shared in English.",

    ediciones: []

  }

};



/* =========================================================
   FUNCIONES DEL REGISTRO
========================================================= */


/*
   Obtener los datos generales de una publicación.
*/

function obtenerPublicacion(idPublicacion) {

  return AKROS_EDICIONES[idPublicacion] || null;

}



/*
   Obtener todas las ediciones de una publicación,
   ordenadas desde la más reciente a la más antigua.
*/

function obtenerEdiciones(idPublicacion) {

  const publicacion =
    obtenerPublicacion(idPublicacion);


  if (!publicacion) {

    return [];

  }


  return [...publicacion.ediciones].sort(

    (a, b) => {

      if (b.anio !== a.anio) {

        return b.anio - a.anio;

      }

      return b.numero - a.numero;

    }

  );

}



/*
   Buscar una edición determinada utilizando:

   publicación + año + número
*/

function obtenerEdicion(
  idPublicacion,
  anio,
  numero
) {

  const publicacion =
    obtenerPublicacion(idPublicacion);


  if (!publicacion) {

    return null;

  }


  return publicacion.ediciones.find(

    (edicion) =>

      Number(edicion.anio) === Number(anio) &&

      Number(edicion.numero) === Number(numero)

  ) || null;

}



/*
   Obtener automáticamente la edición más reciente
   de una publicación.
*/

function obtenerUltimaEdicion(idPublicacion) {

  const ediciones =
    obtenerEdiciones(idPublicacion);


  if (ediciones.length === 0) {

    return null;

  }


  return ediciones[0];

}



/*
   Generar la URL del lector para una edición.
*/

function obtenerUrlLector(
  idPublicacion,
  edicion
) {

  if (!edicion) {

    return "#";

  }


  return (

    "revista.html" +

    "?publicacion=" +
    encodeURIComponent(idPublicacion) +

    "&anio=" +
    encodeURIComponent(edicion.anio) +

    "&edicion=" +
    encodeURIComponent(edicion.numero)

  );

}



/*
   Generar automáticamente la ruta de una página WEBP.

   Ejemplo:
   pagina-01.webp
   pagina-02.webp
   pagina-03.webp
*/

function obtenerPagina(
  edicion,
  numeroPagina
) {

  if (!edicion) {

    return "";

  }


  const numero =
    String(numeroPagina).padStart(2, "0");


  return (
    edicion.carpeta +
    "/pagina-" +
    numero +
    ".webp"
  );

}