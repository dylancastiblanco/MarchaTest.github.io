
// Buscamos la mejor voz en español que tenga el navegador 
var vozEspanolElegida = null;
 
function cargarVoces() {
  if (!("speechSynthesis" in window)) {
    return;
  }
  var todasLasVoces = window.speechSynthesis.getVoices();
 
  // Nos quedamos solo con las voces que sean en español 
  var vocesEnEspanol = todasLasVoces.filter(function (voz) {
    return voz.lang.toLowerCase().indexOf("es") === 0;
  });
 
  if (vocesEnEspanol.length === 0) {
    return;
  }
 
  
  var vozPreferida =
    vocesEnEspanol.find(function (voz) { return voz.name.indexOf("Google") !== -1 && voz.lang.indexOf("ES") !== -1; }) ||
    vocesEnEspanol.find(function (voz) { return voz.name.indexOf("Google") !== -1; }) ||
    vocesEnEspanol.find(function (voz) { return voz.name.indexOf("Microsoft") !== -1; }) ||
    vocesEnEspanol[0];
 
  vozEspanolElegida = vozPreferida;
}
 
// Las voces a veces tardan un poco en cargar, por eso escuchamos este evento
if ("speechSynthesis" in window) {
  cargarVoces();
  window.speechSynthesis.onvoiceschanged = cargarVoces;
}
 
//  Función para hablar en español 
function hablar(texto) {
  // Si el navegador no soporta voz, no pasa nada, solo no habla
  if (!("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel(); // paramos si estaba hablando algo
  var mensaje = new SpeechSynthesisUtterance(texto);
 
  if (vozEspanolElegida) {
    mensaje.voice = vozEspanolElegida;
    mensaje.lang = vozEspanolElegida.lang;
  } else {
    mensaje.lang = "es-ES";
  }
 
  mensaje.rate = 0.9;   // un poco más lento, para que se entienda mejor
  mensaje.pitch = 1;    // tono normal, ni muy agudo ni muy grave
  mensaje.volume = 1;   // volumen al máximo
 
  window.speechSynthesis.speak(mensaje);
}
 
// Cambiar de sección (menú de arriba) 
function mostrarSeccion(id) {
  var todas = document.querySelectorAll(".seccion");
  for (var i = 0; i < todas.length; i++) {
    todas[i].classList.remove("activa");
  }
  document.getElementById(id).classList.add("activa");
}
 
// COORDENADAS DE CADA POSICION EN LA CAJA (para mover la palanca)
// Estos numeros son el "left" y "top" en pixeles dentro de la caja
var coordenadas = {
  "1": { left: 42, top: 24 },
  "2": { left: 42, top: 197 },
  "3": { left: 142, top: 24 },
  "4": { left: 142, top: 197 },
  "5": { left: 242, top: 24 },
  "n": { left: 142, top: 108 }
};
 
function moverPalanca(idPalanca, marcha) {
  var palanca = document.getElementById(idPalanca);
  var coord = coordenadas[marcha];
  palanca.style.left = coord.left + "px";
  palanca.style.top = coord.top + "px";
}
 
// =========================================================
// MODO TUTORIAL
// =========================================================
var pasosTutorial = [
  {
    marcha: "n",
    texto: "Primero, siempre debes empezar en el NEUTRO. La palanca queda en el centro, sin tocar ninguna marcha."
  },
  {
    marcha: "1",
    texto: "Para meter PRIMERA, mueve la palanca hacia arriba y a la izquierda."
  },
  {
    marcha: "2",
    texto: "Para meter SEGUNDA, mueve la palanca hacia abajo, en la misma columna de la primera."
  },
  {
    marcha: "3",
    texto: "Para meter TERCERA, regresa al centro y luego sube en la columna del medio."
  },
  {
    marcha: "4",
    texto: "Para meter CUARTA, desde tercera, baja en la misma columna del medio."
  },
  {
    marcha: "5",
    texto: "Por último, para meter QUINTA, mueve la palanca a la derecha y hacia arriba."
  }
];
 
var pasoActual = 0;
 
function iniciarTutorial() {
  pasoActual = 0;
  mostrarPaso();
}
 
function mostrarPaso() {
  var paso = pasosTutorial[pasoActual];
  document.getElementById("titulo-paso").innerText =
    "Paso " + (pasoActual + 1) + " de " + pasosTutorial.length;
  document.getElementById("texto-paso").innerText = paso.texto;
  moverPalanca("palanca-tutorial", paso.marcha);
  hablar(paso.texto);
}
 
function siguientePaso() {
  if (pasoActual < pasosTutorial.length - 1) {
    pasoActual = pasoActual + 1;
    mostrarPaso();
  } else {
    document.getElementById("texto-paso").innerText =
      "¡Felicidades! Terminaste el tutorial. Ahora ve al modo de dificultad para practicar por sonido.";
    hablar("Felicidades, terminaste el tutorial. Ahora ve al modo de dificultad.");
  }
}
 
function escucharPasoActual() {
  hablar(pasosTutorial[pasoActual].texto);
}
 
// MODO DE DIFICULTAD Y JUEGO
 
// Cada nivel tiene: nombre, segundos por cambio y cuantas rondas tiene
var nivelesJuego = {
  amateur:          { nombre: "Amateur",          tiempo: 8, rondas: 6 },
  principiante:     { nombre: "Principiante",     tiempo: 6, rondas: 6 },
  semiprofesional:  { nombre: "Semiprofesional",  tiempo: 4, rondas: 8 },
  profesional:      { nombre: "Profesional",      tiempo: 3, rondas: 8 },
  mundial:          { nombre: "Clase Mundial",    tiempo: 2, rondas: 10 }
};
 
var nivelElegido = null;   // aqui guardamos el nivel que el usuario escogio
var marchaObjetivo = null; // la marcha que el usuario tiene que meter ahora
var rondaActual = 0;
var aciertos = 0;
var tiempoRestante = 0;
var contadorIntervalo = null;
 
// Nombres para hablar cada marcha
var frasesMarcha = {
  "n": "Pon el neutro",
  "1": "Mete primera",
  "2": "Mete segunda",
  "3": "Mete tercera",
  "4": "Mete cuarta",
  "5": "Mete quinta"
};
 
function elegirNivel(nivel) {
  nivelElegido = nivelesJuego[nivel];
  mostrarSeccion("simulador");
  document.getElementById("texto-nivel-actual").innerText =
    "Nivel elegido: " + nivelElegido.nombre + " - Tienes " + nivelElegido.tiempo +
    " segundos para reaccionar en cada cambio.";
  empezarJuego();
}
 
function empezarJuego() {
  if (nivelElegido === null) {
    document.getElementById("mensaje-juego").innerText =
      "Primero elige un nivel en la sección 'Modos de juego'.";
    return;
  }
 
  rondaActual = 0;
  aciertos = 0;
  document.getElementById("ronda-total").innerText = nivelElegido.rondas;
  document.getElementById("aciertos").innerText = aciertos;
  moverPalanca("palanca-juego", "n");
 
  siguienteRonda();
}
 
function siguienteRonda() {
  clearInterval(contadorIntervalo);
 
  if (rondaActual >= nivelElegido.rondas) {
    terminarJuego();
    return;
  }
 
  rondaActual = rondaActual + 1;
  document.getElementById("ronda-actual").innerText = rondaActual;
 
  // Escogemos una marcha al azar entre neutro, 1, 2, 3, 4 y 5
  var opciones = ["n", "1", "2", "3", "4", "5"];
  var indiceAzar = Math.floor(Math.random() * opciones.length);
  marchaObjetivo = opciones[indiceAzar];
 
  document.getElementById("mensaje-juego").innerText = "Escucha con atención...";
 
  // Hablamos la instruccion despues de un pequeño segundo
  setTimeout(function () {
    hablar(frasesMarcha[marchaObjetivo]);
  }, 400);
 
  iniciarContador();
}
 
function iniciarContador() {
  tiempoRestante = nivelElegido.tiempo;
  actualizarBarraTiempo();
 
  contadorIntervalo = setInterval(function () {
    tiempoRestante = tiempoRestante - 0.1;
    actualizarBarraTiempo();
 
    if (tiempoRestante <= 0) {
      clearInterval(contadorIntervalo);
      document.getElementById("mensaje-juego").innerText =
        "⏱ Se acabó el tiempo. Era: " + frasesMarcha[marchaObjetivo];
      hablar("Se acabó el tiempo");
      setTimeout(siguienteRonda, 1500);
    }
  }, 100);
}
 
function actualizarBarraTiempo() {
  var porcentaje = (tiempoRestante / nivelElegido.tiempo) * 100;
  if (porcentaje < 0) {
    porcentaje = 0;
  }
  var barra = document.getElementById("barra-relleno");
  barra.style.width = porcentaje + "%";
 
  if (porcentaje < 30) {
    barra.style.backgroundColor = "#ff4d4d";
  } else {
    barra.style.backgroundColor = "#1657d0";
  }
 
  document.getElementById("tiempo-restante").innerText = tiempoRestante.toFixed(1);
}
 
function responder(valor) {
  if (nivelElegido === null || marchaObjetivo === null) {
    return;
  }
 
  clearInterval(contadorIntervalo);
  moverPalanca("palanca-juego", valor.toString());
 
  if (valor.toString() === marchaObjetivo) {
    aciertos = aciertos + 1;
    document.getElementById("aciertos").innerText = aciertos;
    document.getElementById("mensaje-juego").innerText = "✅ ¡Correcto!";
    hablar("Correcto");
  } else {
    document.getElementById("mensaje-juego").innerText =
      "❌ Fallaste. Era: " + frasesMarcha[marchaObjetivo];
    hablar("Fallaste");
  }
 
  setTimeout(siguienteRonda, 1200);
}
 
function terminarJuego() {
  document.getElementById("mensaje-juego").innerText =
    "🏁 Terminaste el nivel " + nivelElegido.nombre + ". Aciertos: " +
    aciertos + " de " + nivelElegido.rondas;
  hablar("Terminaste el nivel con " + aciertos + " aciertos de " + nivelElegido.rondas);
  document.getElementById("tiempo-restante").innerText = "--";
  document.getElementById("barra-relleno").style.width = "0%";
}
 
// Cuando carga la pagina, dejamos la palanca en neutro
window.onload = function () {
  moverPalanca("palanca-tutorial", "n");
  moverPalanca("palanca-juego", "n");
};
