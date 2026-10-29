// =========================================================
// CONEXIÓN CON EL ARDUINO (Web Serial API)
// Funciona en Chrome y Edge. Se carga DESPUÉS de script.js
// =========================================================

var puertoSerial = null;
var lectorSerial = null;

async function conectarArduino() {
  if (!("serial" in navigator)) {
    alert("Tu navegador no soporta Web Serial. Usa Google Chrome o Microsoft Edge.");
    return;
  }

  try {
    // El navegador muestra una ventana para elegir el puerto del Arduino
    puertoSerial = await navigator.serial.requestPort();
    await puertoSerial.open({ baudRate: 9600 });

    document.getElementById("estado-arduino").innerText = "🟢 Arduino conectado";
    document.getElementById("btn-conectar").disabled = true;

    leerDelArduino();
  } catch (error) {
    document.getElementById("estado-arduino").innerText = "🔴 No se pudo conectar";
    console.log("Error al conectar:", error);
  }
}

async function leerDelArduino() {
  var decodificador = new TextDecoderStream();
  puertoSerial.readable.pipeTo(decodificador.writable);
  lectorSerial = decodificador.readable.getReader();

  var buffer = "";

  try {
    while (true) {
      var resultado = await lectorSerial.read();
      if (resultado.done) {
        break;
      }

      buffer += resultado.value;

      // Cada marcha llega como una línea: "1", "2", "N", etc.
      var lineas = buffer.split("\n");
      buffer = lineas.pop(); // lo que quedó incompleto se guarda

      for (var i = 0; i < lineas.length; i++) {
        var marcha = lineas[i].trim().toLowerCase();
        if (marcha !== "") {
          recibirMarcha(marcha);
        }
      }
    }
  } catch (error) {
    document.getElementById("estado-arduino").innerText = "🔴 Arduino desconectado";
    document.getElementById("btn-conectar").disabled = false;
  }
}

// Qué hacer cuando el Arduino avisa que la palanca está en una marcha
function recibirMarcha(marcha) {
  var valores = ["1", "2", "3", "4", "5", "n"];
  if (valores.indexOf(marcha) === -1) {
    return;
  }

  var enJuego = document.getElementById("simulador").classList.contains("activa");
  var enTutorial = document.getElementById("tutorial").classList.contains("activa");

  if (enJuego) {
    // Es como si hubieras hecho clic en esa posición
    responder(marcha);
  } else if (enTutorial) {
    // En el tutorial solo movemos la palanca dibujada
    moverPalanca("palanca-tutorial", marcha);
  }
}
