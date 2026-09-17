/* =========================================================
   PERIÓDICO ESCOLAR DIGITAL AKROS
   APP GENERAL DEL SITIO
========================================================= */


/* =========================================================
   MENÚ RESPONSIVE
========================================================= */

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");

if (menuButton && mainNav) {

  menuButton.addEventListener("click", () => {

    const isOpen = mainNav.classList.toggle("open");

    menuButton.setAttribute(
      "aria-expanded",
      isOpen ? "true" : "false"
    );

  });


  mainNav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      mainNav.classList.remove("open");

      menuButton.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}



/* =========================================================
   INICIO · ÚLTIMA EDICIÓN DE EL DESAYUNO
========================================================= */

function actualizarInicioElDesayuno() {

  /*
     Verificamos que el registro central de ediciones
     esté disponible.
  */

  if (
    typeof obtenerUltimaEdicion !== "function" ||
    typeof obtenerUrlLector !== "function"
  ) {
    return;
  }


  const ultimaEdicion =
    obtenerUltimaEdicion("desayuno");


  if (!ultimaEdicion) {
    return;
  }


  const urlLector =
    obtenerUrlLector("desayuno", ultimaEdicion);


  const portada =
    ultimaEdicion.portada;


  const numero =
    ultimaEdicion.numero;


  const fecha =
    ultimaEdicion.fecha;


  const pdf =
    ultimaEdicion.pdf;



  /* =======================================================
     HERO · BOTÓN "LEER ÚLTIMA EDICIÓN"
  ======================================================= */

  const heroReadButton =
    document.querySelector(
      '.hero-actions .primary-button'
    );

  if (heroReadButton) {

    heroReadButton.href = urlLector;

  }



  /* =======================================================
     HERO · PORTADA
  ======================================================= */

  const heroCoverLink =
    document.querySelector(
      '.hero-magazine-cover'
    );

  if (heroCoverLink) {

    heroCoverLink.href = urlLector;

    heroCoverLink.setAttribute(
      "aria-label",
      `Leer El Desayuno edición número ${numero}`
    );

  }


  const heroCoverImage =
    document.querySelector(
      '.hero-magazine-cover img'
    );

  if (heroCoverImage) {

    heroCoverImage.src = portada;

    heroCoverImage.alt =
      `Portada de El Desayuno edición número ${numero}`;

  }



  /* =======================================================
     HERO · INFORMACIÓN DE LA EDICIÓN
  ======================================================= */

  const heroEditionTitle =
    document.querySelector(
      '.hero-magazine-info strong'
    );

  if (heroEditionTitle) {

    heroEditionTitle.textContent =
      `El Desayuno · N.º ${numero}`;

  }


  const heroEditionDate =
    document.querySelector(
      '.hero-magazine-info small'
    );

  if (heroEditionDate) {

    heroEditionDate.textContent =
      `${fecha} · Clic para leer`;

  }



  /* =======================================================
     TARJETA "EL DESAYUNO"
  ======================================================= */

  const desayunoCard =
    document.querySelector(
      '.desayuno-card'
    );

  if (desayunoCard) {

    const desayunoCardLink =
      desayunoCard.querySelector(
        '.publication-card-footer a'
      );

    if (desayunoCardLink) {

      desayunoCardLink.textContent =
        `Leer edición ${numero}`;

    }

  }



  /* =======================================================
     SECCIÓN "ÚLTIMA EDICIÓN" · PORTADA
  ======================================================= */

  const featuredCoverLink =
    document.querySelector(
      '.featured-cover'
    );

  if (featuredCoverLink) {

    featuredCoverLink.href = urlLector;

    featuredCoverLink.setAttribute(
      "aria-label",
      `Leer El Desayuno edición número ${numero}`
    );

  }


  const featuredCoverImage =
    document.querySelector(
      '.featured-cover img'
    );

  if (featuredCoverImage) {

    featuredCoverImage.src = portada;

    featuredCoverImage.alt =
      `Portada El Desayuno, edición número ${numero}`;

  }


  const featuredCaption =
    document.querySelector(
      '.cover-caption'
    );

  if (featuredCaption) {

    featuredCaption.textContent =
      `EL DESAYUNO · N.º ${numero}`;

  }



  /* =======================================================
     SECCIÓN "ÚLTIMA EDICIÓN" · METADATOS
  ======================================================= */

  const metaItems =
    document.querySelectorAll(
      '.edition-meta > span:not(.meta-dot)'
    );

  if (metaItems.length >= 3) {

    metaItems[0].textContent =
      "EL DESAYUNO";

    metaItems[1].textContent =
      `N.º ${numero}`;

    metaItems[2].textContent =
      fecha.toUpperCase();

  }



  /* =======================================================
     SECCIÓN "ÚLTIMA EDICIÓN" · DESCRIPCIÓN
  ======================================================= */

  const featuredDescription =
    document.querySelector(
      '.featured-description'
    );

  if (featuredDescription) {

    featuredDescription.textContent =
      ultimaEdicion.descripcion;

  }



  /* =======================================================
     SECCIÓN "ÚLTIMA EDICIÓN" · BOTONES
  ======================================================= */

  const featuredReadButton =
    document.querySelector(
      '.featured-actions .primary-button'
    );

  if (featuredReadButton) {

    featuredReadButton.href = urlLector;

  }


  const featuredDownloadButton =
    document.querySelector(
      '.featured-actions .text-button'
    );

  if (featuredDownloadButton) {

    featuredDownloadButton.href = pdf;

  }



  /* =======================================================
     ARCHIVO DEL INICIO
  ======================================================= */

  actualizarArchivoInicio();

}



/* =========================================================
   ARCHIVO AUTOMÁTICO DEL INICIO
========================================================= */

function actualizarArchivoInicio() {

  if (
    typeof obtenerEdiciones !== "function" ||
    typeof obtenerUrlLector !== "function"
  ) {
    return;
  }


  const archiveGrid =
    document.querySelector(
      '.archive-grid'
    );


  if (!archiveGrid) {
    return;
  }


  const ediciones =
    obtenerEdiciones("desayuno");


  if (ediciones.length === 0) {
    return;
  }


  /*
     Eliminamos únicamente las tarjetas antiguas
     construidas manualmente en index.html.
  */

  archiveGrid
    .querySelectorAll(
      '.archive-card, .archive-placeholder'
    )
    .forEach(element => {

      element.remove();

    });



  /*
     Creamos automáticamente una tarjeta
     por cada edición registrada.
  */

  ediciones.forEach(edicion => {

    const urlLector =
      obtenerUrlLector(
        "desayuno",
        edicion
      );


    const article =
      document.createElement("article");

    article.className =
      "archive-card";


    article.innerHTML = `

      <a
        href="${urlLector}"
        class="archive-cover"
        aria-label="Leer El Desayuno edición número ${edicion.numero} de ${edicion.anio}"
      >

        <img
          src="${edicion.portada}"
          alt="El Desayuno edición número ${edicion.numero}"
        >

      </a>


      <div class="archive-info">

        <span class="archive-publication">
          EL DESAYUNO
        </span>

        <h3>
          Edición N.º ${edicion.numero}
        </h3>

        <p>
          ${edicion.fecha}
        </p>


        <a
          href="${urlLector}"
          class="archive-read"
        >
          Leer edición
          <span>→</span>
        </a>

      </div>

    `;


    archiveGrid.appendChild(article);

  });



  /*
     Dejamos al final la tarjeta que indica
     que vendrán nuevas ediciones.
  */

  const placeholder =
    document.createElement("article");

  placeholder.className =
    "archive-placeholder";


  placeholder.innerHTML = `

    <span>
      +
    </span>

    <strong>
      Próximas ediciones
    </strong>

    <p>
      El archivo crecerá a medida que
      publiquemos nuevas ediciones.
    </p>

  `;


  archiveGrid.appendChild(placeholder);

}



/* =========================================================
   INICIAR AUTOMATIZACIÓN
========================================================= */

actualizarInicioElDesayuno();