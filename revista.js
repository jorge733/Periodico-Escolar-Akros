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

const $ = id => document.getElementById(id);

const reader = $("reader");

const desktopMagazine = $("desktopMagazine");
const magazineBook = $("magazineBook");

const mobileMagazine = $("mobileMagazine");
const mobilePageContainer = $("mobilePageContainer");

const previousButton = $("previousButton");
const nextButton = $("nextButton");
const bottomPreviousButton = $("bottomPreviousButton");
const bottomNextButton = $("bottomNextButton");

const currentPageLabel = $("currentPageLabel");
const totalPagesLabel = $("totalPagesLabel");
const pageDots = $("pageDots");

const publicationTitle = $("publicationTitle");
const publicationEdition = $("publicationEdition");
const downloadButton = $("downloadButton");

const zoomOutButton = $("zoomOutButton");
const zoomInButton = $("zoomInButton");
const zoomValue = $("zoomValue");
const fullscreenButton = $("fullscreenButton");

const readerLoader = $("readerLoader");


/* ---------------------------------------------------------
   MODO LECTURA
--------------------------------------------------------- */

const readingMode = $("readingMode");
const readingCloseButton = $("readingCloseButton");
const readingPublicationTitle = $("readingPublicationTitle");
const readingPageLabel = $("readingPageLabel");
const readingPageImage = $("readingPageImage");
const readingScroll = $("readingScroll");
const readingZoomOutButton = $("readingZoomOutButton");
const readingZoomInButton = $("readingZoomInButton");
const readingZoomValue = $("readingZoomValue");
const readingPreviousButton = $("readingPreviousButton");
const readingNextButton = $("readingNextButton");
const readingBottomLabel = $("readingBottomLabel");


/* =========================================================
   ESTADO
========================================================= */

/*
   Proporción de las páginas (ancho / alto) de las ediciones.
*/
const PAGE_RATIO = 1530 / 2339;

let bookZoom = 1;
let readingZoom = 1;
let readingPage = 1;

let isAnimating = false;

/*
   La revista se arma como un libro de hojas.

   Escritorio (double): cada hoja tiene una página por cara
   y se ven dos páginas abiertas, con la portada sola.

   Celular (single): una página por hoja, que gira sobre
   su borde izquierdo y deja ver la siguiente debajo.
*/
const book = {
  mode: null,
  root: null,
  leaves: [],
  flipped: 0,
  pageW: 0,
  pageH: 0
};


/* =========================================================
   UTILIDADES
========================================================= */

function isMobile() {
  return window.matchMedia("(max-width: 700px)").matches;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeInOut(t) {
  return t < .5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}


/* =========================================================
   PRECARGA
========================================================= */

function preloadPages() {
  const promises = [];

  for (let page = 1; page <= EDITION.totalPages; page++) {
    promises.push(
      new Promise(resolve => {
        const image = new Image();

        image.onload = () => resolve(true);

        image.onerror = () => {
          console.warn(`No se pudo cargar ${getPagePath(page)}`);
          resolve(false);
        };

        image.src = getPagePath(page);
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

  publicationTitle.textContent = EDITION.title;

  publicationEdition.textContent =
    `Edición N.º ${EDITION.number}` +
    (EDITION.date ? ` · ${EDITION.date}` : "");

  readingPublicationTitle.textContent = EDITION.title;

  totalPagesLabel.textContent = String(EDITION.totalPages);

  downloadButton.href = getPdfPath();
}


/* =========================================================
   GEOMETRÍA DEL LIBRO
========================================================= */

function leafCount() {
  return book.mode === "double"
    ? Math.ceil(EDITION.totalPages / 2)
    : EDITION.totalPages;
}

/*
   Cantidad máxima de hojas que se pueden dar vuelta.
*/
function maxFlipped() {
  return book.mode === "double"
    ? Math.floor(EDITION.totalPages / 2)
    : EDITION.totalPages - 1;
}

/*
   Páginas de cada cara de una hoja (null = papel en blanco).
*/
function leafPages(index) {
  if (book.mode === "double") {
    const front = 2 * index + 1;
    const back = 2 * index + 2;

    return {
      front,
      back: back <= EDITION.totalPages ? back : null
    };
  }

  return {
    front: index + 1,
    back: null
  };
}

/*
   Páginas visibles con cierta cantidad de hojas dadas vuelta.
*/
function visiblePages(flipped = book.flipped) {
  if (book.mode === "double") {
    const pages = [];
    const left = 2 * flipped;
    const right = 2 * flipped + 1;

    if (flipped > 0 && left <= EDITION.totalPages) {
      pages.push(left);
    }

    if (right <= EDITION.totalPages) {
      pages.push(right);
    }

    return pages;
  }

  return [flipped + 1];
}

function flippedForPage(pageNumber) {
  const flipped = book.mode === "double"
    ? Math.floor(pageNumber / 2)
    : pageNumber - 1;

  return clamp(flipped, 0, maxFlipped());
}

/*
   Con la portada (o la contraportada) sola, el libro se
   desplaza media página para quedar centrado.
*/
function bookShift(flipped) {
  if (book.mode !== "double") {
    return 0;
  }

  if (flipped === 0) {
    return -book.pageW / 2;
  }

  if (2 * flipped + 1 > EDITION.totalPages) {
    return book.pageW / 2;
  }

  return 0;
}

function measureBook() {
  if (book.mode === "double") {
    const availableWidth = desktopMagazine.clientWidth;
    const availableHeight = desktopMagazine.clientHeight - 14;

    let pageH = Math.min(availableHeight, 810);
    let pageW = pageH * PAGE_RATIO;

    if (pageW * 2 > availableWidth) {
      pageW = availableWidth / 2;
      pageH = pageW / PAGE_RATIO;
    }

    book.pageW = Math.floor(pageW);
    book.pageH = Math.floor(pageH);
  } else {
    const availableWidth = Math.min(mobileMagazine.clientWidth * .94, 520);
    const availableHeight = mobileMagazine.clientHeight - 34;

    let pageW = availableWidth;
    let pageH = pageW / PAGE_RATIO;

    if (pageH > availableHeight) {
      pageH = availableHeight;
      pageW = pageH * PAGE_RATIO;
    }

    book.pageW = Math.floor(pageW);
    book.pageH = Math.floor(pageH);
  }

  const root = book.root;

  root.style.setProperty("--page-w", `${book.pageW}px`);
  root.style.setProperty("--page-h", `${book.pageH}px`);
  root.style.setProperty(
    "--book-w",
    `${book.mode === "double" ? book.pageW * 2 : book.pageW}px`
  );
  root.style.setProperty(
    "--leaf-left",
    `${book.mode === "double" ? book.pageW : 0}px`
  );
}


/* =========================================================
   CONSTRUIR EL LIBRO
========================================================= */

function createFace(side, pageNumber) {
  const face = document.createElement("div");

  face.className = `leaf-face leaf-${side}`;

  if (pageNumber) {
    const image = document.createElement("img");

    image.src = getPagePath(pageNumber);
    image.alt = `${EDITION.title} · Página ${pageNumber}`;
    image.draggable = false;
    image.decoding = "async";

    face.appendChild(image);
  } else {
    face.classList.add("leaf-blank");
  }

  return face;
}

function buildBook(mode, pageNumber) {
  if (book.root) {
    book.root.remove();
  }

  book.mode = mode;
  book.root = document.createElement("div");
  book.root.className = `flipbook flipbook-${mode}`;
  book.leaves = [];

  for (let index = 0; index < leafCount(); index++) {
    const pages = leafPages(index);
    const leaf = document.createElement("div");

    leaf.className = "leaf";
    leaf.appendChild(createFace("front", pages.front));
    leaf.appendChild(createFace("back", pages.back));

    book.leaves.push(leaf);
    book.root.appendChild(leaf);
  }

  const container =
    mode === "double" ? magazineBook : mobilePageContainer;

  container.appendChild(book.root);

  attachDragEvents(book.root);

  measureBook();

  book.flipped = flippedForPage(pageNumber);

  layoutLeaves();
}


/* =========================================================
   POSICIÓN DE LAS HOJAS
========================================================= */

function setLeafAngle(leaf, angle) {
  const progress = clamp(-angle / 180, 0, 1);
  const lift = Math.sin(progress * Math.PI);

  leaf.style.transform = `rotateY(${angle}deg)`;

  leaf.style.setProperty("--lift", lift.toFixed(3));
  leaf.style.setProperty(
    "--front-shade",
    (Math.min(progress, .5) * 1.1).toFixed(3)
  );
  leaf.style.setProperty(
    "--back-shade",
    (Math.min(1 - progress, .5) * 1.1).toFixed(3)
  );
}

function setBookShift(shift) {
  book.root.style.transform = `translateX(${shift}px)`;
}

/*
   Hojas dadas vuelta a la izquierda (la última arriba) y
   hojas pendientes a la derecha (la próxima arriba).
*/
function layoutLeaves() {
  const total = book.leaves.length;

  book.leaves.forEach((leaf, index) => {
    const isFlipped = index < book.flipped;

    setLeafAngle(leaf, isFlipped ? -180 : 0);

    leaf.style.zIndex = String(
      isFlipped ? index + 1 : 2 * total - index
    );

    leaf.classList.toggle(
      "is-gone",
      book.mode === "single" && isFlipped
    );

    leaf.classList.toggle(
      "has-shadow",
      index >= book.flipped - 2 && index <= book.flipped + 1
    );
  });

  setBookShift(bookShift(book.flipped));

  updateInterface();
}


/* =========================================================
   GIRO DE UNA HOJA
========================================================= */

let turn = null;

/*
   direction: 1 = siguiente, -1 = anterior.
*/
function beginTurn(direction) {
  if (direction === 1 && book.flipped >= maxFlipped()) {
    return null;
  }

  if (direction === -1 && book.flipped <= 0) {
    return null;
  }

  const index = direction === 1 ? book.flipped : book.flipped - 1;
  const leaf = book.leaves[index];

  leaf.classList.remove("is-gone");
  leaf.classList.add("has-shadow");
  leaf.style.zIndex = String(3 * book.leaves.length);

  turn = {
    leaf,
    direction,
    from: book.flipped,
    progress: 0
  };

  return turn;
}

function setTurnProgress(progress) {
  turn.progress = clamp(progress, 0, 1);

  const angle = turn.direction === 1
    ? -180 * turn.progress
    : -180 * (1 - turn.progress);

  setLeafAngle(turn.leaf, angle);

  const fromShift = bookShift(turn.from);
  const toShift = bookShift(turn.from + turn.direction);

  setBookShift(
    fromShift + (toShift - fromShift) * easeInOut(turn.progress)
  );
}

function animateTurnTo(target, duration, easing) {
  return new Promise(resolve => {
    const start = turn.progress;
    const startTime = performance.now();
    const totalDuration = prefersReducedMotion() ? 1 : duration;

    isAnimating = true;

    function step(now) {
      const t = clamp((now - startTime) / totalDuration, 0, 1);

      setTurnProgress(start + (target - start) * easing(t));

      if (t < 1) {
        requestAnimationFrame(step);
        return;
      }

      if (target === 1) {
        book.flipped = turn.from + turn.direction;
      }

      turn = null;
      isAnimating = false;

      layoutLeaves();
      resolve();
    }

    requestAnimationFrame(step);
  });
}

async function flip(direction, duration = 720) {
  if (isAnimating || turn) {
    return;
  }

  if (!beginTurn(direction)) {
    return;
  }

  await animateTurnTo(1, duration, easeInOut);
}


/* =========================================================
   ARRASTRAR LA HOJA
========================================================= */

let drag = null;

function dragProgress(deltaX) {
  const pageW = drag.pageW;

  if (book.mode === "double") {
    /*
       El borde de la hoja sigue al dedo o al mouse.
    */
    const edge = turn.direction === 1
      ? pageW + deltaX
      : -pageW + deltaX;

    const angle = Math.acos(clamp(edge / pageW, -1, 1));
    const progress = angle / Math.PI;

    return turn.direction === 1 ? progress : 1 - progress;
  }

  return turn.direction === 1
    ? -deltaX / (pageW * .9)
    : deltaX / (pageW * .9);
}

function pageAtPoint(clientX) {
  const pages = visiblePages();

  if (book.mode === "single") {
    return pages[0];
  }

  const rect = book.root.getBoundingClientRect();
  const isLeft = clientX < rect.left + rect.width / 2;
  const leftPage = book.flipped > 0 ? 2 * book.flipped : null;

  if (isLeft) {
    return leftPage;
  }

  return 2 * book.flipped + 1 <= EDITION.totalPages
    ? 2 * book.flipped + 1
    : null;
}

function attachDragEvents(root) {
  root.addEventListener("pointerdown", event => {
    if (isAnimating || turn || event.button > 0) {
      return;
    }

    if (event.pointerType === "mouse") {
      event.preventDefault();
    }

    const rect = root.getBoundingClientRect();

    drag = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pageW: rect.width / (book.mode === "double" ? 2 : 1),
      moved: false,
      samples: [{ x: event.clientX, time: event.timeStamp }]
    };
  });

  root.addEventListener("pointermove", event => {
    if (!drag || event.pointerId !== drag.id) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.moved) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY)) {
        if (Math.abs(deltaY) > 12) {
          drag = null;
        }
        return;
      }

      drag.moved = true;

      if (!beginTurn(deltaX < 0 ? 1 : -1)) {
        return;
      }

      root.classList.add("is-dragging");
      root.setPointerCapture(event.pointerId);
    }

    if (!turn) {
      return;
    }

    drag.samples.push({ x: event.clientX, time: event.timeStamp });

    if (drag.samples.length > 5) {
      drag.samples.shift();
    }

    setTurnProgress(dragProgress(deltaX));
  });

  function endDrag(event, cancelled) {
    if (!drag || event.pointerId !== drag.id) {
      return;
    }

    const current = drag;
    drag = null;

    root.classList.remove("is-dragging");

    if (!current.moved) {
      if (!cancelled) {
        const page = pageAtPoint(event.clientX);

        if (page) {
          openReadingMode(page);
        }
      }
      return;
    }

    if (!turn) {
      return;
    }

    const first = current.samples[0];
    const elapsed = Math.max(event.timeStamp - first.time, 1);
    const velocity = (event.clientX - first.x) / elapsed;
    const towardTurn = -velocity * turn.direction;

    const complete =
      !cancelled &&
      (turn.progress > .35 || (towardTurn > .35 && turn.progress > .03));

    const target = complete ? 1 : 0;
    const remaining = Math.abs(target - turn.progress);

    animateTurnTo(target, 160 + 420 * remaining, easeOut);
  }

  root.addEventListener("pointerup", event => endDrag(event, false));
  root.addEventListener("pointercancel", event => endDrag(event, true));
}


/* =========================================================
   ETIQUETA ACTUAL
========================================================= */

function getCurrentLabel() {
  const pages = visiblePages();

  if (pages.length === 1 && pages[0] === 1) {
    return "Portada";
  }

  if (pages.length === 1) {
    return `Página ${pages[0]}`;
  }

  return `${pages[0]} — ${pages[1]}`;
}


/* =========================================================
   DOTS
========================================================= */

function createDots() {
  pageDots.innerHTML = "";

  for (let page = 1; page <= EDITION.totalPages; page++) {
    const dot = document.createElement("button");

    dot.type = "button";
    dot.className = "page-dot";
    dot.dataset.page = String(page);
    dot.setAttribute("aria-label", `Ir a página ${page}`);

    dot.addEventListener("click", () => goToPage(page));

    pageDots.appendChild(dot);
  }
}

function updateDots() {
  const pages = visiblePages();

  pageDots.querySelectorAll(".page-dot").forEach(dot => {
    dot.classList.toggle(
      "active",
      pages.includes(Number(dot.dataset.page))
    );
  });
}


/* =========================================================
   INTERFAZ
========================================================= */

function updateInterface() {
  currentPageLabel.textContent = getCurrentLabel();

  updateDots();

  const atStart = book.flipped <= 0;
  const atEnd = book.flipped >= maxFlipped();

  previousButton.disabled = atStart;
  bottomPreviousButton.disabled = atStart;

  nextButton.disabled = atEnd;
  bottomNextButton.disabled = atEnd;
}


/* =========================================================
   NAVEGACIÓN
========================================================= */

function nextPage() {
  flip(1);
}

function previousPage() {
  flip(-1);
}

/*
   Para saltar varias páginas, las hojas pasan una tras otra.
*/
async function goToPage(pageNumber) {
  if (
    pageNumber < 1 ||
    pageNumber > EDITION.totalPages ||
    isAnimating ||
    turn
  ) {
    return;
  }

  const target = flippedForPage(pageNumber);
  const steps = Math.abs(target - book.flipped);

  if (!steps) {
    return;
  }

  const direction = target > book.flipped ? 1 : -1;
  const duration = steps > 1 ? 380 : 720;

  for (let i = 0; i < steps; i++) {
    if (!beginTurn(direction)) {
      break;
    }

    await animateTurnTo(1, duration, i === steps - 1 ? easeOut : easeInOut);
  }
}


/* =========================================================
   ZOOM DEL LIBRO
========================================================= */

function applyBookZoom() {
  document.documentElement.style.setProperty("--book-zoom", bookZoom);

  zoomValue.textContent = `${Math.round(bookZoom * 100)}%`;
}

function zoomBookIn() {
  bookZoom = Math.min(1.25, Number((bookZoom + .05).toFixed(2)));
  applyBookZoom();
}

function zoomBookOut() {
  bookZoom = Math.max(.75, Number((bookZoom - .05).toFixed(2)));
  applyBookZoom();
}


/* =========================================================
   MODO LECTURA
========================================================= */

function openReadingMode(pageNumber) {
  readingPage = pageNumber;
  readingZoom = 1;

  updateReadingMode();

  readingMode.classList.add("open");
  readingMode.setAttribute("aria-hidden", "false");

  readingScroll.scrollTop = 0;
  readingScroll.scrollLeft = 0;
}

function closeReadingMode() {
  readingMode.classList.remove("open");
  readingMode.setAttribute("aria-hidden", "true");

  /*
     Al volver, la revista queda abierta en la página leída.
  */
  if (book.root && !visiblePages().includes(readingPage)) {
    book.flipped = flippedForPage(readingPage);
    layoutLeaves();
  }
}

function updateReadingMode() {
  const label = readingPage === 1 ? "Portada" : `Página ${readingPage}`;

  readingPageImage.src = getPagePath(readingPage);
  readingPageImage.alt = `${EDITION.title} · Página ${readingPage}`;

  readingPageLabel.textContent = label;
  readingBottomLabel.textContent = `${label} de ${EDITION.totalPages}`;

  readingZoomValue.textContent = `${Math.round(readingZoom * 100)}%`;

  document.documentElement.style.setProperty("--reading-zoom", readingZoom);

  readingPreviousButton.disabled = readingPage <= 1;
  readingNextButton.disabled = readingPage >= EDITION.totalPages;
}

function readingZoomIn() {
  readingZoom = Math.min(2, Number((readingZoom + .15).toFixed(2)));
  updateReadingMode();
}

function readingZoomOut() {
  readingZoom = Math.max(.65, Number((readingZoom - .15).toFixed(2)));
  updateReadingMode();
}

function readingPrevious() {
  if (readingPage <= 1) {
    return;
  }

  readingPage -= 1;
  updateReadingMode();

  readingScroll.scrollTop = 0;
  readingScroll.scrollLeft = 0;
}

function readingNext() {
  if (readingPage >= EDITION.totalPages) {
    return;
  }

  readingPage += 1;
  updateReadingMode();

  readingScroll.scrollTop = 0;
  readingScroll.scrollLeft = 0;
}


/* =========================================================
   FULLSCREEN
========================================================= */

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await reader.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn("No se pudo cambiar a pantalla completa.", error);
  }
}


/* =========================================================
   TECLADO
========================================================= */

function handleKeyboard(event) {
  if (readingMode.classList.contains("open")) {
    if (event.key === "Escape") {
      closeReadingMode();
    } else if (event.key === "ArrowRight") {
      readingNext();
    } else if (event.key === "ArrowLeft") {
      readingPrevious();
    } else if (event.key === "+" || event.key === "=") {
      readingZoomIn();
    } else if (event.key === "-") {
      readingZoomOut();
    }

    return;
  }

  if (event.key === "ArrowRight") {
    nextPage();
  } else if (event.key === "ArrowLeft") {
    previousPage();
  } else if (event.key === "+" || event.key === "=") {
    zoomBookIn();
  } else if (event.key === "-") {
    zoomBookOut();
  }
}


/* =========================================================
   EVENTOS
========================================================= */

previousButton.addEventListener("click", previousPage);
nextButton.addEventListener("click", nextPage);
bottomPreviousButton.addEventListener("click", previousPage);
bottomNextButton.addEventListener("click", nextPage);

zoomInButton.addEventListener("click", zoomBookIn);
zoomOutButton.addEventListener("click", zoomBookOut);

fullscreenButton.addEventListener("click", toggleFullscreen);

readingCloseButton.addEventListener("click", closeReadingMode);
readingZoomInButton.addEventListener("click", readingZoomIn);
readingZoomOutButton.addEventListener("click", readingZoomOut);
readingPreviousButton.addEventListener("click", readingPrevious);
readingNextButton.addEventListener("click", readingNext);

document.addEventListener("keydown", handleKeyboard);


/* =========================================================
   CAMBIO DE TAMAÑO · ESCRITORIO ↔ MÓVIL
========================================================= */

let resizeFrame = 0;

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);

  resizeFrame = requestAnimationFrame(() => {
    if (isAnimating || turn) {
      return;
    }

    const mode = isMobile() ? "single" : "double";

    if (mode !== book.mode) {
      /*
         Conservamos la página que se estaba viendo.
      */
      const pages = visiblePages();
      buildBook(mode, pages[pages.length - 1]);
      return;
    }

    measureBook();
    layoutLeaves();
  });
});


/* =========================================================
   INICIAR
========================================================= */

async function initialize() {
  configureEdition();
  createDots();
  applyBookZoom();

  buildBook(isMobile() ? "single" : "double", 1);

  await preloadPages();

  if (readerLoader) {
    readerLoader.classList.add("hidden");
  }
}

initialize();
