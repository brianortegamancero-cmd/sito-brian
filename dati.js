// =====================================================
// dati.js – i dati arrivano da un foglio Google (un tab per ogni app)
// =====================================================

// 1. LINK DEI FOGLI (ogni app ha il suo link CSV)
const FOGLI = {
  home: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=0&single=true&output=csv",
  cv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=495881978&single=true&output=csv",
  stage: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=1518556426&single=true&output=csv",
  extra: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=607733622&single=true&output=csv"
};


// 2. STRUMENTI

// Trasforma il testo CSV in una lista di righe.
// Ogni riga diventa un oggetto, ad esempio: { sezione: "passione", titolo: "Videogiochi", ... }
function leggiCSV(testo) {
  const righe = [];
  let riga = [];
  let campo = "";
  let traVirgolette = false;

  for (let i = 0; i < testo.length; i++) {
    const c = testo[i];

    if (traVirgolette) {
      if (c === '"' && testo[i + 1] === '"') { campo += '"'; i++; } // "" = una virgoletta vera
      else if (c === '"') traVirgolette = false;                     // fine del testo tra virgolette
      else campo += c;                                               // dentro le virgolette va bene tutto, anche la virgola
    } else if (c === '"') {
      traVirgolette = true;
    } else if (c === ",") {
      riga.push(campo);            // la virgola chiude una cella
      campo = "";
    } else if (c === "\n") {
      riga.push(campo);            // "a capo" chiude la riga
      righe.push(riga);
      riga = [];
      campo = "";
    } else if (c !== "\r") {
      campo += c;
    }
  }
  // ultima riga (se il file non finisce con "a capo")
  if (campo !== "" || riga.length > 0) {
    riga.push(campo);
    righe.push(riga);
  }

  // La prima riga contiene i nomi delle colonne
  const intestazioni = righe[0];
  return righe.slice(1).map(function (valori) {
    const oggetto = {};
    intestazioni.forEach(function (nome, i) {
      oggetto[nome.trim()] = (valori[i] || "").trim();
    });
    return oggetto;
  });
}

// Scarica un foglio da Google e lo trasforma in righe
async function caricaFoglio(link) {
  const risposta = await fetch(link);
  if (!risposta.ok) throw new Error("Foglio non trovato");
  const testo = await risposta.text();
  return leggiCSV(testo);
}

// I fogli li scarico una volta sola: se riapri un'app (o li ho già scaricati all'avvio) sono pronti subito.
// Se il download fallisce, la prossima apertura riprova.
const fogliScaricati = {};

function prendiFoglio(nome) {
  if (!fogliScaricati[nome]) {
    fogliScaricati[nome] = caricaFoglio(FOGLI[nome]).catch(function (errore) {
      delete fogliScaricati[nome];
      throw errore;
    });
  }
  return fogliScaricati[nome];
}

// Prende solo le righe di una sezione (es. tutte le "passione")
function prendiSezione(righe, nome) {
  return righe.filter(function (riga) {
    return riga.sezione === nome;
  });
}

// Aspetta un certo numero di millisecondi (serve per le animazioni)
function aspetta(ms) {
  return new Promise(function (fine) {
    setTimeout(fine, ms);
  });
}

// Crea un elemento HTML in una riga: crea("p", "classe", "testo")
function crea(tag, classe, testo) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  if (testo !== undefined) elemento.textContent = testo;
  return elemento;
}

// Il foglio dice il nome di un'immagine con una certa estensione (es. justfix.png), ma il file può essere in un altro formato.
// Se l'immagine non si carica provo gli altri formati uno alla volta; se non ce n'è nessuno la tolgo (niente icona rotta).
function provaEstensioni(img) {
  const formati = ["webp", "jpg", "png", "jpeg"];
  const provati = [];
  img.addEventListener("error", function () {
    const attuale = img.getAttribute("src").split(".").pop().toLowerCase();
    provati.push(attuale);
    const prossimo = formati.find(function (formato) {
      return !provati.includes(formato);
    });
    if (prossimo) {
      img.src = img.getAttribute("src").replace(/\.[a-z]+$/i, "." + prossimo);
    } else {
      img.remove();
    }
  });
}
