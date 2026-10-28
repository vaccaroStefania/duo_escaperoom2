// ====== CONFIGURACIÓN DE MODOS ======
const modos_configuracion = {
  modo_1: {
    palabras: [
      { palabra: "QUESTIONS", pista: "Things you ask to get an answer" },
      { palabra: "WORDS", pista: "Letters put together that have meaning" },
      { palabra: "ADVENTURE", pista: "An exciting and unusual experience" },
      { palabra: "NOTEBOOK", pista: "A book with blank pages for writing notes" }
    ],
    codigo: "The"
  },
  modo_2: {
    palabras: [
      { palabra: "PENCIL", pista: "Used to write or draw" },
      { palabra: "WHITEBOARD", pista: "A large white surface in a classroom for writing" },
      { palabra: "SENTENCES", pista: "Groups of words that make a complete thought" },
      { palabra: "RESULTS", pista: "The final outcome of a test or exam" }
    ],
    codigo: "Students"
  },
  modo_3: {
    palabras: [
      { palabra: "MARKER", pista: "A pen used for writing on a whiteboard" },
      { palabra: "HISTORY", pista: "The study of past events" },
      { palabra: "DOOR", pista: "You open and close it to enter a room" },
      { palabra: "TABLE", pista: "Furniture with legs where you put books or food" }
    ],
    codigo: "Teachers"
  },
  modo_4: {
    palabras: [
      { palabra: "COMPUTER", pista: "An electronic device used for studying and work" },
      { palabra: "PASSWORD", pista: "A secret word to log into an account" },
      { palabra: "TEST", pista: "An exam to check what you learned" },
      { palabra: "STUDENT", pista: "A person who goes to school to learn" }
    ],
    codigo: "Education"
  }
};

const VIDAS_MAX = 3;
const IMG_VIDA = "img/VIDA.png";
const IMG_VIDA_PERDIDA = "img/V-PERDIDA.png";

// Variables del modo activo (cambian al seleccionar otro modo)
let modoClaveActual = "modo_1";
let modoActual = modos_configuracion[modoClaveActual];
let listaPalabras = modoActual.palabras;

// ====== ELEMENTOS DOM ======
const zonaBuho = document.getElementById("zonaBuho");
const contenedorLineas = document.getElementById("lineas");
const vidasEls = document.querySelectorAll("#vidas .vida");
const contador = document.getElementById("contador");
const progreso = document.getElementById("progreso");
const indicacion = document.getElementById("indicacion");
const palabraActual = document.getElementById("palabraActual");
const mensaje = document.getElementById("mensaje");

const overlayPausa = document.getElementById("overlayPausa");
const overlayModos = document.getElementById("overlayModos");
const btnPausa = document.getElementById("btnPausa");
const btnPista = document.getElementById("btnPista");
const btnJugarDeNuevo = document.getElementById("btnJugarDeNuevo");
const btnModos = document.getElementById("btnModos");
const btnVolverPausa = document.getElementById("btnVolverPausa");
const botonesModo = document.querySelectorAll(".btn-modo");

const premio = document.getElementById("premio");
const overlayPremio = document.getElementById("overlayPremio");
const btnPremioJugar = document.getElementById("btnPremioJugar");

// ====== ESTADO ======
let indiceActual = 0;
let aciertos = 0;
let vidas = VIDAS_MAX;
let pausado = false;
let juegoTerminado = false;
let timerBuho = null;
let timerPremio = null;

// ====== FUNCIONES PRINCIPALES ======

function iniciarJuego() {
  indiceActual = 0;
  aciertos = 0;
  vidas = VIDAS_MAX;
  pausado = false;
  juegoTerminado = false;

  overlayPausa.hidden = true;
  if (overlayModos) overlayModos.hidden = true;
  btnJugarDeNuevo.hidden = true;
  btnPista.hidden = false;

  ocultarPremio();
  actualizarVidas();
  actualizarProgreso();
  setBuho("pensando");

  indicacion.textContent = "Arrange the letters to form the word";
  palabraActual.textContent = "Click on Request a Hint to get a clue";
  mostrarMensaje("", "");

  armarLibreta();
}

function mezclarPalabra(palabra) {
  let arr = palabra.split("");
  let desordenada = "";
  do {
    arr.sort(() => Math.random() - 0.5);
    desordenada = arr.join("");
  } while (desordenada === palabra && palabra.length > 1);
  return arr;
}

function armarLibreta() {
  contenedorLineas.innerHTML = "";

  listaPalabras.forEach((item, i) => {
    const linea = document.createElement("div");
    // Si ya pasó, la mostramos correcta; si es la actual o futura, desordenada
    linea.className = "linea" + (i === indiceActual ? " activa" : "");
    linea.id = "linea_" + i;

    const contenedorLetras = document.createElement("div");
    contenedorLetras.className = "palabra-desordenada";
    contenedorLetras.dataset.indice = i;

    // CAMBIO: Si la línea ya fue completada (i < indiceActual), mostramos la palabra bien. 
    // Si es la actual o una futura (i >= indiceActual), ¡la mezclamos siempre!
    let letras;
    if (i < indiceActual) {
      letras = item.palabra.split("");
    } else {
      letras = mezclarPalabra(item.palabra);
    }

    letras.forEach((letra, idx) => {
      const ranura = document.createElement("div");
      ranura.className = "ficha-letra-linea";
      ranura.textContent = letra;
      ranura.draggable = (i === indiceActual); // Solo se puede arrastrar la de la línea activa
      ranura.dataset.pos = idx;

      ranura.addEventListener("dragstart", alIniciarArrastreLetra);
      ranura.addEventListener("dragover", (e) => {
        // Solo acepta la letra si viene de esta misma fila
        if (fichaArrastrada && fichaArrastrada.parentElement === contenedorLetras) e.preventDefault();
      });
      ranura.addEventListener("dragend", () => { fichaArrastrada = null; });
      ranura.addEventListener("drop", alSoltarLetra);

      contenedorLetras.appendChild(ranura);
    });

    linea.appendChild(contenedorLetras);

    // Botón de comprobación solo para la línea activa
    if (i === indiceActual) {
      const btnVerificar = document.createElement("button");
      btnVerificar.type = "button";
      btnVerificar.className = "btn-comprobar";
      btnVerificar.textContent = "✓";
      btnVerificar.title = "Comprobar palabra";
      btnVerificar.addEventListener("click", () => verificarPalabraActual(contenedorLetras));
      linea.appendChild(btnVerificar);
    }

    contenedorLineas.appendChild(linea);
  });
}

// ====== REORDENAMIENTO DRAG & DROP ======

let fichaArrastrada = null;

function alIniciarArrastreLetra(e) {
  if (pausado || juegoTerminado) {
    e.preventDefault();
    return;
  }
  fichaArrastrada = e.target;
  e.dataTransfer.setData("text/plain", e.target.dataset.pos);
}

function alSoltarLetra(e) {
  e.preventDefault();
  const destino = e.target;

  // Solo se permite intercambiar letras dentro de la misma fila
  if (
    fichaArrastrada &&
    destino.classList.contains("ficha-letra-linea") &&
    destino !== fichaArrastrada &&
    destino.parentElement === fichaArrastrada.parentElement
  ) {
    const textoDestino = destino.textContent;
    destino.textContent = fichaArrastrada.textContent;
    fichaArrastrada.textContent = textoDestino;
  }
  fichaArrastrada = null;
}

// ====== VERIFICACIÓN ======

function verificarPalabraActual(contenedorLetras) {
  if (pausado || juegoTerminado) return;

  const letras = Array.from(contenedorLetras.children).map(el => el.textContent).join("");
  const palabraCorrecta = listaPalabras[indiceActual].palabra;

  if (letras === palabraCorrecta) {
    aciertos++;
    mostrarMensaje("Excelent! \"" + palabraCorrecta + "\" is correct.", "ok");
    indiceActual++;
    actualizarProgreso();

    if (aciertos === listaPalabras.length) {
      finalizarJuego(true);
    } else {
      setBuho("pensando");
      palabraActual.textContent = "Click on Request a hint to get a clue";
      armarLibreta();
    }
  } else {
    vidas--;
    actualizarVidas();

    const lineaActual = document.getElementById("linea_" + indiceActual);
    if (lineaActual) {
      lineaActual.classList.add("incorrecta");
      setTimeout(() => lineaActual.classList.remove("incorrecta"), 400);
    }

    if (vidas <= 0) {
      finalizarJuego(false);
    } else {
      setBuho("error", 1100);
      mostrarMensaje("Wrong combination, try again", "error");
    }
  }
}

function pedirPista() {
  if (pausado || juegoTerminado) return;
  const objetoActual = listaPalabras[indiceActual];
  setBuho("pista", 3000);
  palabraActual.textContent = objetoActual.pista;
  //mostrarMensaje("Pista revelada.", "");
}

function finalizarJuego(gano) {
  juegoTerminado = true;
  setBuho(gano ? "ganar" : "perder");
  indicacion.textContent = gano ? "You completed the notebook!" : "You're out of hearts";
  palabraActual.textContent = gano ? "You won" : "You lost...";
  mostrarMensaje(
    gano ? "All words are completed" : "You can try again.",
    gano ? "ok" : "error"
  );
  btnPista.hidden = true;
  btnJugarDeNuevo.hidden = false;

  if (gano) mostrarPremio(modoClaveActual);
}

// ====== PREMIO ======

function ocultarPremio() {
  clearTimeout(timerPremio);
  if (premio) premio.classList.remove("revelado");
  if (overlayPremio) overlayPremio.hidden = true;
}

function mostrarPremio(modoClave) {
  clearTimeout(timerPremio);
  const codigo = modos_configuracion[modoClave].codigo;
  const textoCodigoEl = document.getElementById("texto_codigo_premio");

  if (textoCodigoEl) {
    textoCodigoEl.textContent = codigo;
  }

  timerPremio = setTimeout(function () {
    if (overlayPremio) overlayPremio.hidden = false;
    timerPremio = setTimeout(function () {
      if (premio) premio.classList.remove("revelado");
      if (premio) premio.classList.add("revelado");
    }, 1300);
  }, 2500);
}

function cerrarPremio() {
  ocultarPremio();
}

// ====== MENÚS Y MODOS ======

function pausarJuego() {
  if (juegoTerminado || pausado) return;
  pausado = true;
  overlayPausa.hidden = false;
}

function continuarJuego() {
  if (!pausado) return;
  pausado = false;
  overlayPausa.hidden = true;
}

function modosJuego() {
  overlayPausa.hidden = true;
  if (overlayModos) overlayModos.hidden = false;
}

function volverAPausa() {
  if (overlayModos) overlayModos.hidden = true;
  overlayPausa.hidden = false;
}

function cambiarModo(nuevoModoKey) {
  if (!modos_configuracion[nuevoModoKey]) return;

  modoClaveActual = nuevoModoKey;
  modoActual = modos_configuracion[modoClaveActual];
  listaPalabras = modoActual.palabras;

  if (overlayModos) overlayModos.hidden = true;
  reiniciarJuego();
}

function reiniciarJuego() {
  clearTimeout(timerBuho);
  clearTimeout(timerPremio);
  iniciarJuego();
}

// ====== UI HELPERS ======

function setBuho(estado, ms) {
  clearTimeout(timerBuho);
  if (zonaBuho) zonaBuho.dataset.estado = estado;
  if (ms) {
    timerBuho = setTimeout(function () {
      if (!juegoTerminado && zonaBuho) zonaBuho.dataset.estado = "pensando";
    }, ms);
  }
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "globo-mensaje" + (tipo ? " " + tipo : "");
}

function actualizarVidas() {
  vidasEls.forEach(function (el, i) {
    const perdida = i >= vidas;
    el.classList.toggle("perdida", perdida);
    el.querySelector("img").src = perdida ? IMG_VIDA_PERDIDA : IMG_VIDA;
  });
}

function actualizarProgreso() {
  contador.textContent = aciertos + "  out of " + listaPalabras.length;
  progreso.style.width = (aciertos / listaPalabras.length * 100) + "%";
}

// ====== EVENT LISTENERS ======

btnPausa.addEventListener("click", pausarJuego);
btnPista.addEventListener("click", pedirPista);
document.getElementById("btnContinuar").addEventListener("click", continuarJuego);
document.getElementById("btnReiniciar").addEventListener("click", reiniciarJuego);
btnJugarDeNuevo.addEventListener("click", reiniciarJuego);

if (btnModos) btnModos.addEventListener("click", modosJuego);
if (btnVolverPausa) btnVolverPausa.addEventListener("click", volverAPausa);

botonesModo.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const modoSeleccionado = e.currentTarget.dataset.modo;
    cambiarModo(modoSeleccionado);
  });
});

const btnPremioCerrar = document.getElementById("btnPremioCerrar");
if (btnPremioCerrar) btnPremioCerrar.addEventListener("click", cerrarPremio);
if (btnPremioJugar) btnPremioJugar.addEventListener("click", reiniciarJuego);

document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (overlayPremio && !overlayPremio.hidden) {
    cerrarPremio();
    return;
  }
  pausado ? continuarJuego() : pausarJuego();
});

// Arrancar el juego al cargar
iniciarJuego();
