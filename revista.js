/* =========================================================
   PERIÓDICO ESCOLAR DIGITAL · COLEGIO AKROS
   Lector universal de publicaciones

   Motor: StPageFlip 2.0.7
========================================================= */

"use strict";

/* =========================================================
   PUBLICACIONES DISPONIBLES
========================================================= */

const PUBLICATIONS = {

  desayuno: {
    name: "El Desayuno",
    folder: "desayuno"
  },

  desayunito: {
    name: "El Desayunito",
    folder: "desayunito"
  },

  english: {
    name: "El Desayuno English Edition",
    folder: "english"
  }

};


/* =========================================================
   LEER URL
========================================================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const publicationKey =
  urlParams.get("publicacion") ||
  "desayuno";

const editionNumber =
  urlParams.get("edicion") ||
  "25";

const publication =
  PUBLICATIONS[publicationKey] ||
  PUBLICATIONS.desayuno;


/* =========================================================
   CONFIGURACIÓN DE ESTA EDICIÓN
========================================================= */

const EDITION = {

  publication:
    publicationKey,

  title:
    publication.name,

  number:
    editionNumber,

  date:
    "Septiembre 2026",

  totalPages:
    7,

  basePath:
    `assets/ediciones/${publication.folder}/${editionNumber}/`

};


/* =========================================================
   PROPORCIÓN ORIGINAL
========================================================= */

const ORIGINAL_PAGE_WIDTH =
  1530;

const ORIGINAL_PAGE_HEIGHT =
  2339;

const PAGE_RATIO =
  ORIGINAL_PAGE_WIDTH /
  ORIGINAL_PAGE_HEIGHT;


/* =========================================================
   ELEMENTOS
========================================================= */

const reader =
  document.getElementById("reader");

const magazineStage =
  document.getElementById(
    "magazineStage"
  );

const flipbookElement =
  document.getElementById(
    "flipbook"
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

const dragHint =
  document.getElementById(
    "dragHint"
  );

const zoomOverlay =
  document.getElementById(
    "zoomOverlay"
  );

const zoomCloseButton =
  document.getElementById(
    "zoomCloseButton"
  );

const zoomImage =
  document.getElementById(
    "zoomImage"
  );


/* =========================================================
   ESTADO
========================================================= */

let pageFlip = null;

let readerZoom = 1;

let resizeTimer = null;

let hasInteracted = false;

let currentLogicalPage = 1;

let currentOrientation = "";


/* =========================================================
   RUTA DE PÁGINA
========================================================= */

function getPagePath(
  pageNumber
) {

  const number =
    String(pageNumber)
      .padStart(2, "0");

  return (
    `${EDITION.basePath}` +
    `pagina-${number}.webp`
  );
}


/* =========================================================
   MÓVIL
========================================================= */

function isMobile() {

  return window.matchMedia(
    "(max-width: 700px)"
  ).matches;
}


/* =========================================================
   PRECARGA
========================================================= */

function preloadImages() {

  const jobs = [];

  for (
    let page = 1;
    page <= EDITION.totalPages;
    page++
  ) {

    jobs.push(

      new Promise(resolve => {

        const image =
          new Image();

        image.onload =
          () => resolve(true);

        image.onerror =
          () => {

            console.warn(
              "No se pudo cargar:",
              getPagePath(page)
            );

            resolve(false);
          };

        image.src =
          getPagePath(page);

      })

    );
  }

  return Promise.all(jobs);
}


/* =========================================================
   CALCULAR TAMAÑO DEL LIBRO
========================================================= */

function calculateBookSize() {

  const rect =
    magazineStage
      .getBoundingClientRect();

  const mobile =
    isMobile();

  /*
    Dejamos aire arriba y abajo.
  */

  const verticalMargin =
    mobile
      ? 24
      : 34;

  /*
    Dejamos espacio para
    las flechas laterales.
  */

  const horizontalMargin =
    mobile
      ? 20
      : 170;

  const availableHeight =
    Math.max(
      320,
      rect.height -
      verticalMargin
    );

  const availableWidth =
    Math.max(
      280,
      rect.width -
      horizontalMargin
    );

  /*
    En escritorio calculamos
    espacio para dos páginas.

    En móvil para una.
  */

  const pagesAcross =
    mobile ? 1 : 2;

  /*
    Primero calculamos usando
    la altura disponible.
  */

  let pageHeight =
    availableHeight;

  let pageWidth =
    pageHeight *
    PAGE_RATIO;

  /*
    Si el libro completo supera
    el ancho, reducimos.
  */

  if (
    pageWidth *
    pagesAcross >
    availableWidth
  ) {

    pageWidth =
      availableWidth /
      pagesAcross;

    pageHeight =
      pageWidth /
      PAGE_RATIO;
  }

  return {

    width:
      Math.floor(
        pageWidth
      ),

    height:
      Math.floor(
        pageHeight
      )

  };
}


/* =========================================================
   CREAR PÁGINAS HTML
========================================================= */

function createHTMLPages() {

  flipbookElement.innerHTML =
    "";

  for (
    let pageNumber = 1;
    pageNumber <= EDITION.totalPages;
    pageNumber++
  ) {

    const page =
      document.createElement(
        "div"
      );

    page.className =
      "akros-flip-page";

    page.dataset.page =
      String(pageNumber);

    /*
      Portada y contraportada
      se comportan como papel más rígido.
    */

    if (
      pageNumber === 1 ||
      pageNumber ===
        EDITION.totalPages
    ) {

      page.setAttribute(
        "data-density",
        "hard"
      );
    }

    const image =
      document.createElement(
        "img"
      );

    image.src =
      getPagePath(
        pageNumber
      );

    image.alt =
      `${EDITION.title} · ` +
      `Página ${pageNumber}`;

    image.draggable =
      false;

    image.decoding =
      "async";

    /*
      El navegador puede conservar
      la imagen a resolución completa.
    */

    image.style.width =
      "100%";

    image.style.height =
      "100%";

    image.style.objectFit =
      "cover";

    image.style.display =
      "block";

    image.style.imageRendering =
      "auto";

    page.appendChild(
      image
    );

    flipbookElement.appendChild(
      page
    );
  }
}


/* =========================================================
   ESTILOS CRÍTICOS DEL FLIPBOOK
========================================================= */

function installFlipbookFixes() {

  if (
    document.getElementById(
      "akrosFlipbookFixes"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "akrosFlipbookFixes";

  style.textContent = `

    /*
      Evita que el espacio reservado
      para la página izquierda de la
      portada aparezca blanco.
    */

    .stf__parent,
    .stf__wrapper,
    .stf__block {
      background: transparent !important;
    }

    /*
      Página HTML real.
    */

    .akros-flip-page {
      position: relative;

      overflow: hidden;

      background: #ffffff;

      box-shadow:
        0 2px 8px
        rgba(0, 0, 0, 0.12);

      backface-visibility: hidden;

      -webkit-backface-visibility:
        hidden;
    }

    .akros-flip-page img {
      display: block;

      width: 100%;
      height: 100%;

      object-fit: cover;

      image-rendering: auto;

      backface-visibility: hidden;

      -webkit-backface-visibility:
        hidden;

      transform: translateZ(0);

      -webkit-transform:
        translateZ(0);

      user-select: none;

      -webkit-user-select: none;

      pointer-events: none;
    }

    /*
      Evita fondos blancos artificiales
      del contenedor de StPageFlip.
    */

    #flipbook,
    #flipbook > div {
      background-color:
        transparent;
    }

  `;

  document.head.appendChild(
    style
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

    pageDots.appendChild(
      dot
    );
  }
}


/* =========================================================
   ÍNDICE ACTUAL
========================================================= */

function getCurrentIndex() {

  if (!pageFlip) {
    return 0;
  }

  const index =
    pageFlip
      .getCurrentPageIndex();

  if (
    typeof index !== "number" ||
    Number.isNaN(index)
  ) {

    return 0;
  }

  return index;
}


/* =========================================================
   PÁGINAS VISIBLES
========================================================= */

function getVisiblePages() {

  const current =
    getCurrentIndex() + 1;

  /*
    Móvil:
    una página.
  */

  if (isMobile()) {

    return [
      Math.min(
        EDITION.totalPages,
        Math.max(
          1,
          current
        )
      )
    ];
  }

  /*
    Portada.
  */

  if (current <= 1) {

    return [1];
  }

  /*
    Interior:
    2–3
    4–5
    6–7
  */

  let leftPage =
    current;

  if (
    leftPage % 2 !== 0
  ) {

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
   LABEL
========================================================= */

function getPageLabel() {

  const pages =
    getVisiblePages();

  if (
    pages.length === 1 &&
    pages[0] === 1
  ) {

    return "Portada";
  }

  if (
    pages.length === 1
  ) {

    return (
      `Página ${pages[0]}`
    );
  }

  return (
    `${pages[0]} — ${pages[1]}`
  );
}


/* =========================================================
   ACTUALIZAR DOTS
========================================================= */

function updateDots() {

  const visible =
    getVisiblePages();

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
        visible.includes(page)
      );

    });
}


/* =========================================================
   BOTONES
========================================================= */

function updateButtons() {

  const visible =
    getVisiblePages();

  const first =
    visible[0];

  const last =
    visible[
      visible.length - 1
    ];

  const beginning =
    first <= 1;

  const end =
    last >=
    EDITION.totalPages;

  previousButton.disabled =
    beginning;

  bottomPreviousButton.disabled =
    beginning;

  nextButton.disabled =
    end;

  bottomNextButton.disabled =
    end;
}


/* =========================================================
   INTERFAZ
========================================================= */

function updateInterface() {

  currentPageLabel.textContent =
    getPageLabel();

  totalPagesLabel.textContent =
    String(
      EDITION.totalPages
    );

  updateDots();

  updateButtons();
}


/* =========================================================
   PRIMERA INTERACCIÓN
========================================================= */

function registerInteraction() {

  if (hasInteracted) {
    return;
  }

  hasInteracted =
    true;

  if (dragHint) {

    dragHint.style.opacity =
      "0";

    dragHint.style.visibility =
      "hidden";
  }
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function nextPage() {

  if (!pageFlip) {
    return;
  }

  registerInteraction();

  pageFlip.flipNext();
}


function previousPage() {

  if (!pageFlip) {
    return;
  }

  registerInteraction();

  pageFlip.flipPrev();
}


function goToPage(
  pageNumber
) {

  if (!pageFlip) {
    return;
  }

  if (
    pageNumber < 1 ||
    pageNumber >
      EDITION.totalPages
  ) {

    return;
  }

  registerInteraction();

  pageFlip.flip(
    pageNumber - 1
  );
}


/* =========================================================
   ZOOM GENERAL
========================================================= */

function applyZoom() {

  reader.style.setProperty(
    "--reader-zoom",
    readerZoom
  );

  zoomValue.textContent =
    `${Math.round(
      readerZoom * 100
    )}%`;
}


function zoomIn() {

  readerZoom =
    Math.min(
      1.3,
      Number(
        (
          readerZoom + 0.1
        ).toFixed(1)
      )
    );

  applyZoom();
}


function zoomOut() {

  readerZoom =
    Math.max(
      0.7,
      Number(
        (
          readerZoom - 0.1
        ).toFixed(1)
      )
    );

  applyZoom();
}


/* =========================================================
   AMPLIAR PÁGINA
========================================================= */

function openZoomPage(
  pageNumber
) {

  zoomImage.src =
    getPagePath(
      pageNumber
    );

  zoomImage.alt =
    `${EDITION.title} · ` +
    `Página ${pageNumber}`;

  zoomOverlay.classList.add(
    "open"
  );

  zoomOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeZoomPage() {

  zoomOverlay.classList.remove(
    "open"
  );

  zoomOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  zoomImage.src =
    "";
}


/* =========================================================
   DOBLE CLIC
========================================================= */

function handleDoubleClick(
  event
) {

  if (
    !pageFlip ||
    isMobile()
  ) {
    return;
  }

  const visible =
    getVisiblePages();

  if (
    visible.length === 1
  ) {

    openZoomPage(
      visible[0]
    );

    return;
  }

  const bookRect =
    flipbookElement
      .getBoundingClientRect();

  const center =
    bookRect.left +
    bookRect.width / 2;

  const selected =
    event.clientX < center
      ? visible[0]
      : visible[
          visible.length - 1
        ];

  openZoomPage(
    selected
  );
}


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
      "No fue posible cambiar " +
      "el modo de pantalla completa.",
      error
    );
  }
}


/* =========================================================
   TECLADO
========================================================= */

function handleKeyboard(
  event
) {

  if (
    zoomOverlay
      .classList
      .contains("open")
  ) {

    if (
      event.key === "Escape"
    ) {

      closeZoomPage();
    }

    return;
  }

  switch (event.key) {

    case "ArrowRight":

      event.preventDefault();

      nextPage();

      break;


    case "ArrowLeft":

      event.preventDefault();

      previousPage();

      break;


    case "+":
    case "=":

      zoomIn();

      break;


    case "-":

      zoomOut();

      break;


    case "Escape":

      if (
        document.fullscreenElement
      ) {

        document
          .exitFullscreen();
      }

      break;
  }
}


/* =========================================================
   EVENTO FLIP
========================================================= */

function handleFlip(
  event
) {

  if (
    event &&
    typeof event.data ===
      "number"
  ) {

    currentLogicalPage =
      event.data + 1;
  }

  registerInteraction();

  window.setTimeout(
    updateInterface,
    40
  );
}


/* =========================================================
   CREAR LECTOR
========================================================= */

function createPageFlip(
  startPage = 1
) {

  if (
    typeof St === "undefined" ||
    !St.PageFlip
  ) {

    console.error(
      "StPageFlip no está disponible."
    );

    return false;
  }

  /*
    Destruir lector anterior.
  */

  if (pageFlip) {

    try {

      pageFlip.destroy();

    } catch (error) {

      console.warn(
        error
      );
    }

    pageFlip =
      null;
  }

  /*
    Crear las páginas HTML
    de alta definición.
  */

  createHTMLPages();

  const size =
    calculateBookSize();

  /*
    Crear motor.
  */

  pageFlip =
    new St.PageFlip(
      flipbookElement,
      {

        width:
          size.width,

        height:
          size.height,

        /*
          Nosotros calculamos exactamente
          el tamaño que cabe.
        */

        size:
          "fixed",

        /*
          MUY IMPORTANTE:
          primera página = portada.
        */

        showCover:
          true,

        /*
          En teléfono pasa automáticamente
          a página individual.
        */

        usePortrait:
          true,

        autoSize:
          true,

        /*
          Física visual.
        */

        drawShadow:
          true,

        maxShadowOpacity:
          0.46,

        flippingTime:
          900,

        showPageCorners:
          true,

        useMouseEvents:
          true,

        swipeDistance:
          30,

        disableFlipByClick:
          false,

        mobileScrollSupport:
          true,

        startPage:
          Math.max(
            0,
            startPage - 1
          )

      }
    );


  /* =======================================================
     EVENTOS
  ======================================================= */

  pageFlip.on(
    "flip",
    handleFlip
  );


  pageFlip.on(
    "changeState",
    event => {

      if (
        event &&
        (
          event.data ===
            "user_fold" ||
          event.data ===
            "flipping"
        )
      ) {

        registerInteraction();
      }

    }
  );


  pageFlip.on(
    "changeOrientation",
    event => {

      if (
        event &&
        event.data
      ) {

        currentOrientation =
          event.data;
      }

      window.setTimeout(
        updateInterface,
        60
      );

    }
  );


  /*
    IMPORTANTE:

    Ya NO usamos loadFromImages().

    Entregamos las páginas HTML reales.
  */

  const htmlPages =
    flipbookElement
      .querySelectorAll(
        ".akros-flip-page"
      );

  pageFlip.loadFromHTML(
    htmlPages
  );

  currentLogicalPage =
    startPage;

  return true;
}


/* =========================================================
   RECONSTRUIR
========================================================= */

function rebuildReader() {

  let pageToRestore =
    currentLogicalPage;

  if (pageFlip) {

    pageToRestore =
      getCurrentIndex() + 1;
  }

  /*
    En escritorio regresamos al
    comienzo correcto del spread.
  */

  if (
    !isMobile() &&
    pageToRestore > 1 &&
    pageToRestore % 2 !== 0
  ) {

    pageToRestore -= 1;
  }

  createPageFlip(
    pageToRestore
  );

  window.setTimeout(
    updateInterface,
    150
  );
}


/* =========================================================
   RESIZE
========================================================= */

function handleResize() {

  clearTimeout(
    resizeTimer
  );

  resizeTimer =
    window.setTimeout(
      rebuildReader,
      300
    );
}


/* =========================================================
   EVENTOS DE INTERFAZ
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
  zoomIn
);

zoomOutButton.addEventListener(
  "click",
  zoomOut
);

fullscreenButton.addEventListener(
  "click",
  toggleFullscreen
);

zoomCloseButton.addEventListener(
  "click",
  closeZoomPage
);

zoomOverlay.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      zoomOverlay
    ) {

      closeZoomPage();
    }

  }
);

magazineStage.addEventListener(
  "dblclick",
  handleDoubleClick
);

flipbookElement.addEventListener(
  "pointerdown",
  registerInteraction
);

document.addEventListener(
  "keydown",
  handleKeyboard
);

window.addEventListener(
  "resize",
  handleResize
);

document.addEventListener(
  "fullscreenchange",
  () => {

    window.setTimeout(
      rebuildReader,
      180
    );

  }
);


/* =========================================================
   ACTUALIZAR TÍTULOS
========================================================= */

function updateEditionInformation() {

  document.title =
    `${EDITION.title} N.º ${EDITION.number} | Colegio Akros`;

  const titleElement =
    document.querySelector(
      ".reader-title strong"
    );

  const subtitleElement =
    document.querySelector(
      ".reader-title span"
    );

  if (titleElement) {

    titleElement.textContent =
      EDITION.title;
  }

  if (subtitleElement) {

    subtitleElement.textContent =
      `Edición N.º ${EDITION.number}` +
      ` · ${EDITION.date}`;
  }
}


/* =========================================================
   INICIO
========================================================= */

async function initializeReader() {

  installFlipbookFixes();

  updateEditionInformation();

  totalPagesLabel.textContent =
    String(
      EDITION.totalPages
    );

  createDots();

  applyZoom();

  await preloadImages();

  /*
    Dos frames garantizan que el
    navegador haya calculado el
    espacio disponible.
  */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          const created =
            createPageFlip(1);

          if (!created) {

            if (
              readerLoader
            ) {

              readerLoader.innerHTML = `
                <span>
                  No fue posible abrir
                  la revista.
                </span>
              `;
            }

            return;
          }

          window.setTimeout(
            () => {

              updateInterface();

              if (
                readerLoader
              ) {

                readerLoader
                  .classList
                  .add(
                    "hidden"
                  );
              }

            },
            350
          );

        }
      );

    }
  );
}


/* =========================================================
   ARRANCAR
========================================================= */

initializeReader();