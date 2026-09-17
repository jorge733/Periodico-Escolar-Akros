/* =========================================================

   PERIÓDICO ESCOLAR DIGITAL · COLEGIO AKROS

   Lector de publicaciones

   revista.js

========================================================= */



"use strict";





/* =========================================================

   CONFIGURACIÓN

========================================================= */



const params =
  new URLSearchParams(
    window.location.search
  );

const requestedPublication =
  params.get("publicacion") || "desayuno";

const publicationKey =
  AKROS_EDICIONES[requestedPublication]
    ? requestedPublication
    : "desayuno";

const requestedYear =
  params.get("anio");

const requestedEdition =
  params.get("edicion");

const publication =
  obtenerPublicacion(publicationKey);

let editionData = null;

if (requestedYear && requestedEdition) {
  editionData =
    obtenerEdicion(
      publicationKey,
      requestedYear,
      requestedEdition
    );
}

/*
   Compatibilidad con enlaces antiguos:
   ?publicacion=desayuno&edicion=25
*/
if (!editionData && requestedEdition) {
  const editions =
    obtenerEdiciones(publicationKey);

  editionData =
    editions.find(
      edition =>
        Number(edition.numero) ===
        Number(requestedEdition)
    ) || null;
}

/*
   Si no se indicó una edición válida,
   abrimos la más reciente.
*/
if (!editionData) {
  editionData =
    obtenerUltimaEdicion(publicationKey);
}

/*
   Si la publicación todavía no tiene ediciones,
   regresamos a su página.
*/
if (!editionData) {
  window.location.href =
    `publicacion.html?publicacion=${encodeURIComponent(publicationKey)}`;

  throw new Error(
    "No hay ediciones disponibles para esta publicación."
  );
}

const EDITION = {
  title: publication.nombre,
  folder: publicationKey,
  date: editionData.fecha,
  year: editionData.anio,
  number: editionData.numero,
  totalPages: editionData.paginas,
  basePath: editionData.carpeta + "/",
  pdf: editionData.pdf
};


/* =========================================================
   ELEMENTOS
========================================================= */

const reader =

  document.getElementById("reader");



const magazineStage =

  document.getElementById(

    "magazineStage"

  );



const magazineBook =

  document.getElementById(

    "magazineBook"

  );



const mobileMagazine =

  document.getElementById(

    "mobileMagazine"

  );



const mobilePageContainer =

  document.getElementById(

    "mobilePageContainer"

  );



const mobilePageImage =

  document.getElementById(

    "mobilePageImage"

  );



const previousButton =

  document.getElementById(

    "previousButton"

  );



const nextButton =

  document.getElementById(

    "nextButton"

  );



const bottomPreviousButton =

  document.getElementById(

    "bottomPreviousButton"

  );



const bottomNextButton =

  document.getElementById(

    "bottomNextButton"

  );



const currentPageLabel =

  document.getElementById(

    "currentPageLabel"

  );



const totalPagesLabel =

  document.getElementById(

    "totalPagesLabel"

  );



const pageDots =

  document.getElementById(

    "pageDots"

  );



const publicationTitle =

  document.getElementById(

    "publicationTitle"

  );



const publicationEdition =

  document.getElementById(

    "publicationEdition"

  );



const downloadButton =

  document.getElementById(

    "downloadButton"

  );



const zoomOutButton =

  document.getElementById(

    "zoomOutButton"

  );



const zoomInButton =

  document.getElementById(

    "zoomInButton"

  );



const zoomValue =

  document.getElementById(

    "zoomValue"

  );



const fullscreenButton =

  document.getElementById(

    "fullscreenButton"

  );



const readerLoader =

  document.getElementById(

    "readerLoader"

  );





/* =========================================================

   MODO LECTURA

========================================================= */



const readingMode =

  document.getElementById(

    "readingMode"

  );



const readingCloseButton =

  document.getElementById(

    "readingCloseButton"

  );



const readingPublicationTitle =

  document.getElementById(

    "readingPublicationTitle"

  );



const readingPageLabel =

  document.getElementById(

    "readingPageLabel"

  );



const readingPageImage =

  document.getElementById(

    "readingPageImage"

  );



const readingPageWrapper =

  document.getElementById(

    "readingPageWrapper"

  );



const readingScroll =

  document.getElementById(

    "readingScroll"

  );



const readingZoomOutButton =

  document.getElementById(

    "readingZoomOutButton"

  );



const readingZoomInButton =

  document.getElementById(

    "readingZoomInButton"

  );



const readingZoomValue =

  document.getElementById(

    "readingZoomValue"

  );



const readingPreviousButton =

  document.getElementById(

    "readingPreviousButton"

  );



const readingNextButton =

  document.getElementById(

    "readingNextButton"

  );



const readingBottomLabel =

  document.getElementById(

    "readingBottomLabel"

  );





/* =========================================================

   ESTADO

========================================================= */



let currentPage = 1;



let bookZoom = 1;



let readingZoom = 1;



let readingPage = 1;



let isAnimating = false;



let touchStartX = 0;



let touchStartY = 0;



let touchCurrentX = 0;





/* =========================================================

   UTILIDADES

========================================================= */



function isMobile() {

  return window.matchMedia(

    "(max-width: 700px)"

  ).matches;

}





function getPagePath(pageNumber) {

  return (

    EDITION.basePath +

    `pagina-${String(pageNumber).padStart(2, "0")}.webp`

  );

}





function getPdfPath() {

  return EDITION.pdf;

}


/* =========================================================

   PRECARGA

========================================================= */



function preloadPages() {

  const promises = [];



  for (

    let page = 1;

    page <= EDITION.totalPages;

    page++

  ) {

    promises.push(

      new Promise(resolve => {

        const image = new Image();



        image.onload =

          () => resolve(true);



        image.onerror =

          () => {

            console.warn(

              `No se pudo cargar ${getPagePath(page)}`

            );



            resolve(false);

          };



        image.src =

          getPagePath(page);

      })

    );

  }



  return Promise.all(promises);

}





/* =========================================================

   INFORMACIÓN DE EDICIÓN

========================================================= */



function configureEdition() {

  document.title =

    `${EDITION.title} N.º ${EDITION.number} | Colegio Akros`;



  publicationTitle.textContent =

    EDITION.title;



  publicationEdition.textContent =

    `Edición N.º ${EDITION.number}` +

    (

      EDITION.date

        ? ` · ${EDITION.date}`

        : ""

    );



  readingPublicationTitle.textContent =

    EDITION.title;



  totalPagesLabel.textContent =

    String(EDITION.totalPages);



  downloadButton.href =

    getPdfPath();

}





/* =========================================================

   CREAR IMAGEN DE PÁGINA

========================================================= */



function createPageElement(

  pageNumber,

  side = ""

) {

  const page =

    document.createElement("div");



  page.className =

    "magazine-page";



  if (side) {

    page.classList.add(

      `magazine-page-${side}`

    );

  }



  page.dataset.page =

    String(pageNumber);



  const image =

    document.createElement("img");



  image.src =

    getPagePath(pageNumber);



  image.alt =

    `${EDITION.title} · Página ${pageNumber}`;



  image.draggable =

    false;



  image.decoding =

    "async";



  page.appendChild(image);



  page.addEventListener(

    "click",

    () => {

      if (!isAnimating) {

        openReadingMode(

          pageNumber

        );

      }

    }

  );



  return page;

}





/* =========================================================

   SPREAD ACTUAL

========================================================= */



function getDesktopSpread() {

  if (currentPage <= 1) {

    return [1];

  }



  let leftPage =

    currentPage;



  if (leftPage % 2 !== 0) {

    leftPage -= 1;

  }



  leftPage =

    Math.max(

      2,

      leftPage

    );



  const result =

    [leftPage];



  if (

    leftPage + 1 <=

    EDITION.totalPages

  ) {

    result.push(

      leftPage + 1

    );

  }



  return result;

}





/* =========================================================

   RENDER ESCRITORIO

========================================================= */



function renderDesktop() {

  magazineBook.innerHTML =

    "";



  const spread =

    getDesktopSpread();



  if (

    spread.length === 1 &&

    spread[0] === 1

  ) {

    magazineBook.className =

      "magazine-book cover-view";



    magazineBook.appendChild(

      createPageElement(1)

    );



    return;

  }



  magazineBook.className =

    "magazine-book spread-view";



  magazineBook.appendChild(

    createPageElement(

      spread[0],

      "left"

    )

  );



  if (

    spread.length > 1

  ) {

    magazineBook.appendChild(

      createPageElement(

        spread[1],

        "right"

      )

    );

  }

}





/* =========================================================

   RENDER MÓVIL

========================================================= */



function renderMobile() {

  mobilePageImage.src =

    getPagePath(currentPage);



  mobilePageImage.alt =

    `${EDITION.title} · Página ${currentPage}`;

}





/* =========================================================

   RENDER GENERAL

========================================================= */



function render() {

  renderDesktop();

  renderMobile();

  updateInterface();

}





/* =========================================================

   ETIQUETA ACTUAL

========================================================= */



function getCurrentLabel() {

  if (isMobile()) {

    return (

      currentPage === 1

        ? "Portada"

        : `Página ${currentPage}`

    );

  }



  const spread =

    getDesktopSpread();



  if (

    spread.length === 1 &&

    spread[0] === 1

  ) {

    return "Portada";

  }



  if (spread.length === 1) {

    return `Página ${spread[0]}`;

  }



  return (

    `${spread[0]} — ${spread[1]}`

  );

}





/* =========================================================

   DOTS

========================================================= */



function createDots() {

  pageDots.innerHTML =

    "";



  for (

    let page = 1;

    page <= EDITION.totalPages;

    page++

  ) {

    const dot =

      document.createElement(

        "button"

      );



    dot.type =

      "button";



    dot.className =

      "page-dot";



    dot.dataset.page =

      String(page);



    dot.setAttribute(

      "aria-label",

      `Ir a página ${page}`

    );



    dot.addEventListener(

      "click",

      () => goToPage(page)

    );



    pageDots.appendChild(dot);

  }

}





function updateDots() {

  let visiblePages;



  if (isMobile()) {

    visiblePages =

      [currentPage];

  } else {

    visiblePages =

      getDesktopSpread();

  }



  pageDots

    .querySelectorAll(

      ".page-dot"

    )

    .forEach(dot => {

      const page =

        Number(

          dot.dataset.page

        );



      dot.classList.toggle(

        "active",

        visiblePages.includes(page)

      );

    });

}





/* =========================================================

   INTERFAZ

========================================================= */



function updateInterface() {

  currentPageLabel.textContent =

    getCurrentLabel();



  updateDots();



  const atStart =

    currentPage <= 1;



  let atEnd;



  if (isMobile()) {

    atEnd =

      currentPage >=

      EDITION.totalPages;

  } else {

    const spread =

      getDesktopSpread();



    atEnd =

      spread[

        spread.length - 1

      ] >= EDITION.totalPages;

  }



  previousButton.disabled =

    atStart;



  bottomPreviousButton.disabled =

    atStart;



  nextButton.disabled =

    atEnd;



  bottomNextButton.disabled =

    atEnd;

}





/* =========================================================

   ANIMACIÓN ESCRITORIO

========================================================= */



function animateDesktopChange(

  direction,

  callback

) {

  if (

    isAnimating ||

    isMobile()

  ) {

    callback();

    return;

  }



  const pages =

    magazineBook.querySelectorAll(

      ".magazine-page"

    );



  if (!pages.length) {

    callback();

    return;

  }



  isAnimating = true;



  let animatedPage;



  if (direction === "next") {

    animatedPage =

      pages[

        pages.length - 1

      ];



    animatedPage.classList.add(

      "turning-next"

    );

  } else {

    animatedPage =

      pages[0];



    animatedPage.classList.add(

      "turning-prev"

    );

  }



  window.setTimeout(

    () => {

      callback();



      isAnimating =

        false;

    },

    500

  );

}





/* =========================================================

   ANIMACIÓN MÓVIL

========================================================= */



function animateMobileChange(

  direction,

  callback

) {

  if (

    isAnimating ||

    !isMobile()

  ) {

    callback();

    return;

  }



  isAnimating =

    true;



  const className =

    direction === "next"

      ? "slide-left"

      : "slide-right";



  mobilePageContainer

    .classList

    .add(className);



  window.setTimeout(

    () => {

      callback();



      mobilePageContainer

        .classList

        .remove(className);



      isAnimating =

        false;

    },

    190

  );

}





/* =========================================================

   SIGUIENTE

========================================================= */



function nextPage() {

  if (isAnimating) {

    return;

  }



  if (isMobile()) {

    if (

      currentPage >=

      EDITION.totalPages

    ) {

      return;

    }



    animateMobileChange(

      "next",

      () => {

        currentPage += 1;

        render();

      }

    );



    return;

  }



  const spread =

    getDesktopSpread();



  const last =

    spread[

      spread.length - 1

    ];



  if (

    last >=

    EDITION.totalPages

  ) {

    return;

  }



  animateDesktopChange(

    "next",

    () => {

      if (

        currentPage === 1

      ) {

        currentPage = 2;

      } else {

        currentPage += 2;

      }



      render();

    }

  );

}





/* =========================================================

   ANTERIOR

========================================================= */



function previousPage() {

  if (isAnimating) {

    return;

  }



  if (isMobile()) {

    if (

      currentPage <= 1

    ) {

      return;

    }



    animateMobileChange(

      "previous",

      () => {

        currentPage -= 1;

        render();

      }

    );



    return;

  }



  if (

    currentPage <= 1

  ) {

    return;

  }



  animateDesktopChange(

    "previous",

    () => {

      if (

        currentPage <= 2

      ) {

        currentPage = 1;

      } else {

        currentPage -= 2;

      }



      render();

    }

  );

}





/* =========================================================

   IR A PÁGINA

========================================================= */



function goToPage(pageNumber) {

  if (

    pageNumber < 1 ||

    pageNumber >

      EDITION.totalPages ||

    isAnimating

  ) {

    return;

  }



  if (isMobile()) {

    const direction =

      pageNumber >

      currentPage

        ? "next"

        : "previous";



    animateMobileChange(

      direction,

      () => {

        currentPage =

          pageNumber;



        render();

      }

    );



    return;

  }



  let target;



  if (pageNumber === 1) {

    target = 1;

  } else {

    target =

      pageNumber % 2 === 0

        ? pageNumber

        : pageNumber - 1;

  }



  if (

    target ===

    currentPage

  ) {

    return;

  }



  const direction =

    target > currentPage

      ? "next"

      : "previous";



  animateDesktopChange(

    direction,

    () => {

      currentPage =

        target;



      render();

    }

  );

}





/* =========================================================

   ZOOM DEL LIBRO

========================================================= */



function applyBookZoom() {

  document.documentElement

    .style

    .setProperty(

      "--book-zoom",

      bookZoom

    );



  zoomValue.textContent =

    `${Math.round(

      bookZoom * 100

    )}%`;

}





function zoomBookIn() {

  bookZoom =

    Math.min(

      1.25,

      Number(

        (

          bookZoom + .05

        ).toFixed(2)

      )

    );



  applyBookZoom();

}





function zoomBookOut() {

  bookZoom =

    Math.max(

      .75,

      Number(

        (

          bookZoom - .05

        ).toFixed(2)

      )

    );



  applyBookZoom();

}





/* =========================================================

   MODO LECTURA

========================================================= */



function openReadingMode(

  pageNumber

) {

  readingPage =

    pageNumber;



  readingZoom =

    1;



  updateReadingMode();



  readingMode.classList.add(

    "open"

  );



  readingMode.setAttribute(

    "aria-hidden",

    "false"

  );



  readingScroll.scrollTop =

    0;



  readingScroll.scrollLeft =

    0;

}





function closeReadingMode() {

  readingMode.classList.remove(

    "open"

  );



  readingMode.setAttribute(

    "aria-hidden",

    "true"

  );

}





/* =========================================================

   ACTUALIZAR MODO LECTURA

========================================================= */



function updateReadingMode() {

  readingPageImage.src =

    getPagePath(

      readingPage

    );



  readingPageImage.alt =

    `${EDITION.title} · Página ${readingPage}`;



  readingPageLabel.textContent =

    readingPage === 1

      ? "Portada"

      : `Página ${readingPage}`;



  readingBottomLabel.textContent =

    `${readingPage === 1 ? "Portada" : `Página ${readingPage}`} de ${EDITION.totalPages}`;



  readingZoomValue.textContent =

    `${Math.round(

      readingZoom * 100

    )}%`;



  document.documentElement

    .style

    .setProperty(

      "--reading-zoom",

      readingZoom

    );



  readingPreviousButton.disabled =

    readingPage <= 1;



  readingNextButton.disabled =

    readingPage >=

    EDITION.totalPages;

}





/* =========================================================

   ZOOM LECTURA

========================================================= */



function readingZoomIn() {

  readingZoom =

    Math.min(

      2,

      Number(

        (

          readingZoom + .15

        ).toFixed(2)

      )

    );



  updateReadingMode();

}





function readingZoomOut() {

  readingZoom =

    Math.max(

      .65,

      Number(

        (

          readingZoom - .15

        ).toFixed(2)

      )

    );



  updateReadingMode();

}





/* =========================================================

   CAMBIAR PÁGINA EN LECTURA

========================================================= */



function readingPrevious() {

  if (

    readingPage <= 1

  ) {

    return;

  }



  readingPage -= 1;



  updateReadingMode();



  readingScroll.scrollTop =

    0;



  readingScroll.scrollLeft =

    0;

}





function readingNext() {

  if (

    readingPage >=

    EDITION.totalPages

  ) {

    return;

  }



  readingPage += 1;



  updateReadingMode();



  readingScroll.scrollTop =

    0;



  readingScroll.scrollLeft =

    0;

}





/* =========================================================

   CLIC EN PÁGINA MÓVIL

========================================================= */



mobilePageImage.addEventListener(

  "click",

  () => {

    if (!isAnimating) {

      openReadingMode(

        currentPage

      );

    }

  }

);





/* =========================================================

   SWIPE MÓVIL

========================================================= */



mobileMagazine.addEventListener(

  "touchstart",

  event => {

    if (

      event.touches.length !== 1

    ) {

      return;

    }



    touchStartX =

      event.touches[0].clientX;



    touchStartY =

      event.touches[0].clientY;



    touchCurrentX =

      touchStartX;

  },

  {

    passive: true

  }

);





mobileMagazine.addEventListener(

  "touchmove",

  event => {

    if (

      event.touches.length !== 1

    ) {

      return;

    }



    touchCurrentX =

      event.touches[0].clientX;

  },

  {

    passive: true

  }

);





mobileMagazine.addEventListener(

  "touchend",

  event => {

    if (

      !event.changedTouches.length

    ) {

      return;

    }



    const endX =

      event.changedTouches[0]

        .clientX;



    const endY =

      event.changedTouches[0]

        .clientY;



    const deltaX =

      endX - touchStartX;



    const deltaY =

      endY - touchStartY;



    /*

      Solo interpretamos swipe

      cuando el movimiento horizontal

      es claramente mayor al vertical.

    */



    if (

      Math.abs(deltaX) < 45 ||

      Math.abs(deltaX) <=

        Math.abs(deltaY)

    ) {

      return;

    }



    if (deltaX < 0) {

      nextPage();

    } else {

      previousPage();

    }

  },

  {

    passive: true

  }

);





/* =========================================================

   FULLSCREEN

========================================================= */



async function toggleFullscreen() {

  try {

    if (

      !document.fullscreenElement

    ) {

      await reader

        .requestFullscreen();

    } else {

      await document

        .exitFullscreen();

    }

  } catch (error) {

    console.warn(

      "No se pudo cambiar a pantalla completa.",

      error

    );

  }

}





/* =========================================================

   TECLADO

========================================================= */



function handleKeyboard(event) {

  const readingOpen =

    readingMode

      .classList

      .contains("open");



  if (readingOpen) {

    if (

      event.key === "Escape"

    ) {

      closeReadingMode();

      return;

    }



    if (

      event.key ===

      "ArrowRight"

    ) {

      readingNext();

      return;

    }



    if (

      event.key ===

      "ArrowLeft"

    ) {

      readingPrevious();

      return;

    }



    if (

      event.key === "+" ||

      event.key === "="

    ) {

      readingZoomIn();

      return;

    }



    if (

      event.key === "-"

    ) {

      readingZoomOut();

      return;

    }



    return;

  }



  if (

    event.key ===

    "ArrowRight"

  ) {

    nextPage();

    return;

  }



  if (

    event.key ===

    "ArrowLeft"

  ) {

    previousPage();

    return;

  }



  if (

    event.key === "+" ||

    event.key === "="

  ) {

    zoomBookIn();

    return;

  }



  if (

    event.key === "-"

  ) {

    zoomBookOut();

  }

}





/* =========================================================

   EVENTOS

========================================================= */



previousButton.addEventListener(

  "click",

  previousPage

);



nextButton.addEventListener(

  "click",

  nextPage

);



bottomPreviousButton.addEventListener(

  "click",

  previousPage

);



bottomNextButton.addEventListener(

  "click",

  nextPage

);



zoomInButton.addEventListener(

  "click",

  zoomBookIn

);



zoomOutButton.addEventListener(

  "click",

  zoomBookOut

);



fullscreenButton.addEventListener(

  "click",

  toggleFullscreen

);



readingCloseButton.addEventListener(

  "click",

  closeReadingMode

);



readingZoomInButton.addEventListener(

  "click",

  readingZoomIn

);



readingZoomOutButton.addEventListener(

  "click",

  readingZoomOut

);



readingPreviousButton.addEventListener(

  "click",

  readingPrevious

);



readingNextButton.addEventListener(

  "click",

  readingNext

);



document.addEventListener(

  "keydown",

  handleKeyboard

);





/* =========================================================

   CAMBIO ESCRITORIO ↔ MÓVIL

========================================================= */



let lastMobileState =

  isMobile();



window.addEventListener(

  "resize",

  () => {

    const newMobileState =

      isMobile();



    if (

      newMobileState !==

      lastMobileState

    ) {

      lastMobileState =

        newMobileState;



      /*

        Conservamos la página actual

        al cambiar de orientación.

      */



      if (

        !newMobileState &&

        currentPage > 1 &&

        currentPage % 2 !== 0

      ) {

        currentPage -= 1;

      }



      render();

    }

  }

);





/* =========================================================

   INICIAR

========================================================= */



async function initialize() {

  configureEdition();



  createDots();



  applyBookZoom();



  /*

    Mostramos la portada inmediatamente.

  */



  currentPage = 1;



  render();



  /*

    Esperamos que todas las páginas

    queden disponibles en caché.

  */



  await preloadPages();



  if (readerLoader) {

    readerLoader.classList.add(

      "hidden"

    );

  }

}





initialize();