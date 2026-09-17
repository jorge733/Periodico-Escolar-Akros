;/* =========================================================
   PERIÓDICO ESCOLAR AKROS
   Página reutilizable de publicaciones
   Las ediciones se obtienen desde ediciones.js
========================================================= */


/* =========================================================
   IDENTIDAD VISUAL DE CADA PUBLICACIÓN
========================================================= */

const identidadesPublicaciones = {

  desayunito: {

    color: "#e98b2a",
    colorOscuro: "#c66b13",
    colorSuave: "rgba(233, 139, 42, 0.10)",

    tituloHTML:
      `El <span>Desayunito</span>`

  },


  desayuno: {

    color: "#148c46",
    colorOscuro: "#0d7137",
    colorSuave: "rgba(20, 140, 70, 0.10)",

    tituloHTML:
      `El <span>Desayuno</span>`

  },


  english: {

    color: "#3278a8",
    colorOscuro: "#245b82",
    colorSuave: "rgba(50, 120, 168, 0.10)",

    tituloHTML:
      `El Desayuno <span>English Edition</span>`

  }

};



/* =========================================================
   LEER PUBLICACIÓN DESDE LA URL
========================================================= */

const parametros =
  new URLSearchParams(window.location.search);


let publicacionActual =
  parametros.get("publicacion") || "desayuno";


if (!AKROS_EDICIONES[publicacionActual]) {

  publicacionActual = "desayuno";

}


const datos =
  obtenerPublicacion(publicacionActual);


const identidad =
  identidadesPublicaciones[publicacionActual];


const ediciones =
  obtenerEdiciones(publicacionActual);


const ultimaEdicion =
  obtenerUltimaEdicion(publicacionActual);



/* =========================================================
   IDENTIDAD VISUAL
========================================================= */

document.documentElement.style.setProperty(
  "--publication-color",
  identidad.color
);


document.documentElement.style.setProperty(
  "--publication-dark",
  identidad.colorOscuro
);


document.documentElement.style.setProperty(
  "--publication-soft",
  identidad.colorSuave
);


document.body.classList.add(
  `publication-${publicacionActual}`
);



/* =========================================================
   TÍTULO DEL NAVEGADOR
========================================================= */

document.title =
  `${datos.nombre} | Periódico Escolar Akros`;



/* =========================================================
   NÚMERO DE PUBLICACIÓN
========================================================= */

const numeroPublicacion =
  document.querySelector(".publication-number");


if (numeroPublicacion) {

  numeroPublicacion.textContent =
    `PUBLICACIÓN ${datos.numeroPublicacion}`;

}



/* =========================================================
   TÍTULO PRINCIPAL
========================================================= */

const titulo =
  document.querySelector(".publication-intro h1");


if (titulo) {

  titulo.innerHTML =
    identidad.tituloHTML;

}



/* =========================================================
   DESCRIPCIÓN
========================================================= */

const descripcion =
  document.querySelector(".publication-description");


if (descripcion) {

  descripcion.textContent =
    datos.descripcion;

}



/* =========================================================
   INFORMACIÓN DEL NIVEL Y ÚLTIMA EDICIÓN
========================================================= */

const bloquesMeta =
  document.querySelectorAll(
    ".publication-meta div"
  );


if (bloquesMeta.length >= 2) {

  const nivel =
    bloquesMeta[0].querySelector("strong");


  if (nivel) {

    nivel.textContent =
      datos.nivel;

  }


  const ultima =
    bloquesMeta[1].querySelector("strong");


  if (ultima) {

    if (ultimaEdicion) {

      ultima.textContent =
        `N.º ${ultimaEdicion.numero} · ${ultimaEdicion.fecha}`;

    } else {

      ultima.textContent =
        publicacionActual === "english"
          ? "Coming soon"
          : "Próximamente";

    }

  }

}



/* =========================================================
   PORTADA PRINCIPAL
========================================================= */

const visual =
  document.querySelector(".publication-visual");


if (visual) {

  if (ultimaEdicion) {

    const urlLector =
      obtenerUrlLector(
        publicacionActual,
        ultimaEdicion
      );


    visual.innerHTML = `

      <div class="publication-word">
        ${datos.nombre.toUpperCase()}
      </div>


      <a
        href="${urlLector}"
        class="publication-cover"
        aria-label="Leer ${datos.nombre} edición número ${ultimaEdicion.numero} del año ${ultimaEdicion.anio}"
      >

        <img
          src="${ultimaEdicion.portada}"
          alt="Portada ${datos.nombre} edición número ${ultimaEdicion.numero} del año ${ultimaEdicion.anio}"
        >

      </a>

    `;

  }


  else {

    let mensaje =
      "Estamos preparando este espacio.";

    let etiqueta =
      "PRÓXIMAMENTE";


    if (publicacionActual === "english") {

      mensaje =
        "We are preparing this publication space.";

      etiqueta =
        "COMING SOON";

    }


    visual.innerHTML = `

      <div class="publication-coming">

        <div class="coming-decoration"></div>


        <span>
          ${etiqueta}
        </span>


        <strong>
          ${datos.nombre}
        </strong>


        <p>
          ${mensaje}
        </p>

      </div>

    `;

  }

}



/* =========================================================
   TEXTO DEL ARCHIVO
========================================================= */

const textoArchivo =
  document.querySelector(
    ".section-heading > p"
  );


if (textoArchivo) {

  if (publicacionActual === "english") {

    textoArchivo.textContent =
      `Browse the published editions of ${datos.nombre}. This archive will grow with every new publication.`;

  }

  else {

    textoArchivo.textContent =
      `Revisa las ediciones publicadas de ${datos.nombre}. Este archivo irá creciendo con cada nueva publicación.`;

  }

}



/* =========================================================
   TÍTULO ARCHIVO PARA ENGLISH EDITION
========================================================= */

const kickerArchivo =
  document.querySelector(
    ".section-heading .section-kicker"
  );


const tituloArchivo =
  document.querySelector(
    ".section-heading h2"
  );


if (publicacionActual === "english") {

  if (kickerArchivo) {

    kickerArchivo.textContent =
      "ARCHIVE";

  }


  if (tituloArchivo) {

    tituloArchivo.innerHTML =
      `All <em>editions.</em>`;

  }

}



/* =========================================================
   GENERAR ARCHIVO DE EDICIONES AGRUPADO POR AÑO
========================================================= */

const contenedorEdiciones =
  document.querySelector(
    ".publication-editions-container"
  );

if (contenedorEdiciones) {

  const elementos =
    Array.from(
      contenedorEdiciones.children
    );

  elementos.forEach((elemento) => {

    if (
      !elemento.classList.contains(
        "section-heading"
      )
    ) {

      elemento.remove();

    }

  });


  /* =======================================================
     EDICIONES AGRUPADAS POR AÑO
  ======================================================= */

  if (ediciones.length > 0) {

    const edicionesPorAnio = {};

    ediciones.forEach((edicion) => {

      const anio =
        String(edicion.anio);

      if (!edicionesPorAnio[anio]) {

        edicionesPorAnio[anio] = [];

      }

      edicionesPorAnio[anio].push(
        edicion
      );

    });


    const anios =
      Object.keys(edicionesPorAnio)
        .map(Number)
        .sort((a, b) => b - a);


    anios.forEach((anio) => {

      const grupoAnio =
        document.createElement("section");

      grupoAnio.className =
        "edition-year-group";


      const encabezadoAnio =
        document.createElement("div");

      encabezadoAnio.className =
        "edition-year-heading";

      encabezadoAnio.innerHTML = `
        <span class="edition-year-label">
          ${
            publicacionActual === "english"
              ? "YEAR"
              : "AÑO"
          }
        </span>

        <h3>${anio}</h3>

        <span class="edition-year-line"></span>
      `;


      grupoAnio.appendChild(
        encabezadoAnio
      );


      const grillaAnio =
        document.createElement("div");

      grillaAnio.className =
        "edition-year-grid";


      edicionesPorAnio[anio].forEach(
        (edicion) => {

          const tarjeta =
            document.createElement(
              "article"
            );

          tarjeta.className =
            "edition-card";


          const urlLector =
            obtenerUrlLector(
              publicacionActual,
              edicion
            );


          tarjeta.innerHTML = `

            <a
              href="${urlLector}"
              class="edition-cover"
              data-edition-number="${edicion.numero}"
              aria-label="Leer ${datos.nombre} edición número ${edicion.numero} del año ${edicion.anio}"
            >

              <img
                src="${edicion.portada}"
                alt="${datos.nombre} edición número ${edicion.numero} del año ${edicion.anio}"
              >

            </a>


            <div class="edition-content">

              <span class="edition-publication">
                ${datos.nombre.toUpperCase()}
              </span>


              <div class="edition-date">
                ${edicion.fecha.toUpperCase()}
              </div>


              <h3>
                Edición N.º ${edicion.numero}
              </h3>


              <p>
                ${edicion.descripcion}
              </p>


              <div class="edition-actions">

                <a
                  href="${urlLector}"
                  class="edition-read"
                >
                  ${
                    publicacionActual === "english"
                      ? "Read edition"
                      : "Leer edición"
                  }

                  <span>→</span>
                </a>


                <a
                  href="${edicion.pdf}"
                  class="edition-download"
                  download
                >
                  ${
                    publicacionActual === "english"
                      ? "Download PDF ↓"
                      : "Descargar PDF ↓"
                  }
                </a>

              </div>

            </div>

          `;


          grillaAnio.appendChild(
            tarjeta
          );

        }
      );


      grupoAnio.appendChild(
        grillaAnio
      );

      contenedorEdiciones.appendChild(
        grupoAnio
      );

    });

  }


  /* =======================================================
     BLOQUE DE PRÓXIMAS EDICIONES
  ======================================================= */

  const proximas =
    document.createElement("div");

  proximas.className =
    "future-editions";


  if (ediciones.length === 0) {

    if (publicacionActual === "english") {

      proximas.innerHTML = `

        <div class="future-icon">+</div>

        <strong>
          Coming soon
        </strong>

        <p>
          There are no editions available yet.
        </p>

      `;

    }

    else {

      proximas.innerHTML = `

        <div class="future-icon">+</div>

        <strong>
          Próximamente
        </strong>

        <p>
          Aún no hay ediciones disponibles de ${datos.nombre}.
        </p>

      `;

    }

  }

  else {

    proximas.innerHTML = `

      <div class="future-icon">+</div>

      <strong>
        ${
          publicacionActual === "english"
            ? "Future editions"
            : "Próximas ediciones"
        }
      </strong>

      <p>
        ${
          publicacionActual === "english"
            ? "New editions will appear here."
            : "Las nuevas publicaciones aparecerán aquí."
        }
      </p>

    `;

  }


  contenedorEdiciones.appendChild(
    proximas
  );

}


/* =========================================================
   ESTILOS DINÁMICOS DE IDENTIDAD
========================================================= */

const estiloIdentidad =
  document.createElement("style");


estiloIdentidad.textContent = `


  /* -------------------------------------------------------
     COLOR PRINCIPAL
  ------------------------------------------------------- */

  .publication-number,
  .section-kicker,
  .edition-publication,
  .future-icon,
  .publication-coming > span {

    color: var(--publication-color);

  }


  .publication-intro h1 span,
  .section-heading h2 em {

    color: var(--publication-color);

  }


  .back-link:hover {

    color: var(--publication-color);

  }



  /* -------------------------------------------------------
     BOTONES
  ------------------------------------------------------- */

  .edition-read {

    background:
      var(--publication-color);

    border-color:
      var(--publication-color);

  }


  .edition-read:hover {

    background:
      var(--publication-dark);

  }



  /* -------------------------------------------------------
     DECORACIÓN DEL HERO
  ------------------------------------------------------- */

  .publication-hero::before {

    background:
      var(--publication-soft);

  }


  .publication-word {

    color:
      var(--publication-soft);

  }



  /* -------------------------------------------------------
   ARCHIVO AGRUPADO POR AÑO
------------------------------------------------------- */

.edition-year-group {

  width: 100%;

  margin-top: 38px;

}


.section-heading + .edition-year-group {

  margin-top: 0;

}


.edition-year-heading {

  display: flex;

  align-items: center;

  gap: 14px;

  margin-bottom: 18px;

}


.edition-year-label {

  color:
    var(--publication-color);

  font-size:
    0.58rem;

  font-weight:
    700;

  letter-spacing:
    0.16em;

}


.edition-year-heading h3 {

  margin: 0;

  color:
    #171b18;

  font-family:
    "Libre Caslon Display",
    Georgia,
    serif;

  font-size:
    1.8rem;

  font-weight:
    400;

  line-height:
    1;

}


.edition-year-line {

  flex: 1;

  height: 1px;

  background:
    rgba(20, 25, 21, 0.14);

}


.edition-year-grid {

  display: grid;

  grid-template-columns:
    1fr;

  gap:
    24px;

}


.edition-year-grid .edition-card {

  width: 100%;

}


/* Número gigante de cada edición */

.edition-cover::before {

  content:
    attr(data-edition-number);

  color:
    var(--publication-soft);

}


@media (max-width: 820px) {

  .edition-year-group {

    margin-top:
      30px;

  }


  .edition-year-heading h3 {

    font-size:
      1.55rem;

  }

}



  /* =======================================================
     TARJETA "PRÓXIMAMENTE"
  ======================================================= */

  .publication-coming {

    position: relative;

    overflow: hidden;

    width:
      min(390px, 90%);

    min-height:
      470px;

    padding:
      55px;

    border:
      1px solid rgba(20, 25, 21, 0.15);

    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,0.88),
        rgba(255,255,255,0.52)
      );

    display:
      flex;

    flex-direction:
      column;

    justify-content:
      flex-end;

    box-shadow:
      0 25px 60px rgba(0,0,0,0.08);

  }


  .publication-coming::before {

    content:
      "";

    position:
      absolute;

    width:
      280px;

    height:
      280px;

    right:
      -120px;

    top:
      -100px;

    border-radius:
      50%;

    background:
      var(--publication-soft);

  }


  .coming-decoration {

    position:
      absolute;

    width:
      120px;

    height:
      120px;

    right:
      35px;

    top:
      40px;

    border:
      1px solid var(--publication-color);

    transform:
      rotate(45deg);

    opacity:
      0.28;

  }


  .publication-coming > span,
  .publication-coming > strong,
  .publication-coming > p {

    position:
      relative;

    z-index:
      2;

  }


  .publication-coming > span {

    margin-bottom:
      18px;

    font-size:
      0.58rem;

    font-weight:
      700;

    letter-spacing:
      0.15em;

  }


  .publication-coming > strong {

    max-width:
      300px;

    font-family:
      "Libre Caslon Display",
      Georgia,
      serif;

    font-size:
      3rem;

    font-weight:
      400;

    line-height:
      1.02;

  }


  .publication-coming > p {

    margin:
      18px 0 0;

    color:
      #6c716b;

    font-size:
      0.8rem;

  }



  /* =======================================================
     EL DESAYUNITO
  ======================================================= */

  body.publication-desayunito
  .publication-hero {

    background:
      #f8f0df;

  }


  body.publication-desayunito
  .publication-hero::after {

    background:
      rgba(233, 139, 42, 0.08);

  }



  /* =======================================================
     EL DESAYUNO
  ======================================================= */

  body.publication-desayuno
  .publication-hero {

    background:
      #f3eedf;

  }



  /* =======================================================
     ENGLISH EDITION
  ======================================================= */

  body.publication-english
  .publication-hero {

    background:
      #edf3f5;

  }


  body.publication-english
  .publication-hero::after {

    background:
      rgba(50, 120, 168, 0.08);

  }



  /* =======================================================
     RESPONSIVE
  ======================================================= */

  @media (max-width: 520px) {

    .publication-coming {

      min-height:
        390px;

      padding:
        38px;

    }


    .publication-coming > strong {

      font-size:
        2.35rem;

    }

  }

`;


document.head.appendChild(
  estiloIdentidad
);