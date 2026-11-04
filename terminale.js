// =====================================================
// terminale.js – il Terminale (CMD) e gli effetti speciali del sistema
//   1. il Terminale: finestra con i comandi
//   2. pioggia Matrix
//   3. raggi X
//   4. il crollo del sistema
// =====================================================


// 1. IL TERMINALE (CMD)
//    Si apre dall'icona "Terminale", con Ctrl + Alt + R oppure scrivendo "apri terminale" nel menu start.
//    Pioggia Matrix: Ctrl + Alt + M, oppure il comando "matrix".

let righeCmd = null;    // la parte dove compaiono le risposte
let inputCmd = null;    // la riga dove si scrivono i comandi
const cronologia = [];  // i comandi già scritti (si scorrono con le frecce)
let posizioneCronologia = 0;

// Costruisce il contenuto del Terminale dentro il corpo della finestra
function costruisciTerminale(corpo) {
  const app = crea("div", "terminale-app");
  const schermo = crea("div", "cmd-schermo");

  righeCmd = document.createElement("div");

  const modulo = document.createElement("form");
  modulo.className = "cmd-input";

  const prompt = document.createElement("label");
  prompt.htmlFor = "comando";
  prompt.textContent = "C:\\Brian>";

  inputCmd = document.createElement("input");
  inputCmd.id = "comando";
  inputCmd.autocomplete = "off";
  inputCmd.spellcheck = false;
  inputCmd.setAttribute("aria-label", "Comando");

  modulo.append(prompt, inputCmd);

  // Invio: eseguo il comando scritto
  modulo.addEventListener("submit", function (evento) {
    evento.preventDefault();
    const testo = inputCmd.value;
    if (testo.trim() !== "") cronologia.push(testo);
    posizioneCronologia = cronologia.length;
    eseguiComando(testo);
    inputCmd.value = "";
  });

  // Frecce su e giù: i comandi di prima
  inputCmd.addEventListener("keydown", function (evento) {
    if (evento.key === "ArrowUp" && posizioneCronologia > 0) {
      evento.preventDefault();
      posizioneCronologia--;
      inputCmd.value = cronologia[posizioneCronologia];
    } else if (evento.key === "ArrowDown") {
      evento.preventDefault();
      posizioneCronologia = Math.min(cronologia.length, posizioneCronologia + 1);
      inputCmd.value = cronologia[posizioneCronologia] || "";
    }
  });

  schermo.append(righeCmd, modulo);
  // clic sullo schermo nero (ma non per selezionare del testo): il cursore torna nella riga dei comandi
  schermo.addEventListener("click", function () {
    if (!String(window.getSelection())) inputCmd.focus();
  });

  app.appendChild(schermo);
  corpo.appendChild(app);

  scriviCmd("BrainOS [Versione 2.0]");
  scriviCmd("(c) Brian Ortega. Tutti i diritti riservati.");
  scriviCmd(" ");
  scriviCmd("Scrivi help per vedere i comandi.", "cmd-verde");
  setTimeout(function () {
    inputCmd.focus();
  }, 50);
}

// Scrive una riga nel Terminale e scorre in fondo, così si vede sempre l'ultima
function scriviCmd(testo, classe) {
  if (!righeCmd) return;
  const riga = crea("p", classe || "", testo);
  righeCmd.appendChild(riga);
  const schermo = righeCmd.parentElement;
  schermo.scrollTop = schermo.scrollHeight;
}

// Sul telefono le righe "comando    descrizione" sono troppo larghe: la descrizione va sotto, rientrata
function adattaATelefono(testo) {
  if (window.innerWidth >= 700) return testo;
  return testo.replace(/^(  \S.*?) {2,}(\S.*)$/gm, "$1\n      $2");
}

// Legge il comando scritto e risponde
function eseguiComando(testo) {
  const comando = testo.trim().toLowerCase();
  scriviCmd("C:\\Brian>" + testo);   // ripeto il comando, come fa il vero CMD
  if (comando === "") return;

  const parole = comando.split(/\s+/);
  const primo = parole[0];
  const resto = parole.slice(1).join(" ");

  // il nome di un'app da solo la apre (home, cv, stage, extra, colonia, contatti...)
  const appDaSola = trovaApp(comando);

  if (comando === "help") {
    scriviCmd(adattaATelefono(
      "Comandi disponibili:\n" +
      "  apps                    elenco dei programmi\n" +
      "  apri <programma>        apre un programma (es. apri cv)\n" +
      "  chi, cv, stage, extra   apre direttamente la pagina\n" +
      "  diagnostica             controllo completo del sistema\n" +
      "  systeminfo              informazioni sul tuo dispositivo\n" +
      "  whoami, ver, date       utente, versione, data e ora\n" +
      "  ping                    test di connessione al foglio Google\n" +
      "  sfondo <nome>           formicaio, griglia, notte, nero\n" +
      "  raggix                  accende e spegne i raggi X\n" +
      "  salvaschermo            avvia subito il salvaschermo\n" +
      "  suoni on|off            accende o spegne i suoni\n" +
      "  notifica <testo>        manda una notifica di prova\n" +
      "  matrix                  ...provalo\n" +
      "  colonia                 stato della colonia di formiche\n" +
      "  colonia veloce          1 giorno = 5 secondi (colonia normale per tornare)\n" +
      "  colonia demo            carica una colonia già grande\n" +
      "  colonia nuova           ricomincia da capo\n" +
      "  ragno, pioggia, nemiche, volo   fa succedere subito l'evento\n" +
      "  disconnetti, riavvia, arresta   gestione del sistema\n" +
      "  crash                   non scriverlo\n" +
      "  cls                     pulisce lo schermo\n" +
      "  exit                    chiude il Terminale"),
      "cmd-verde"
    );
  } else if (comando === "apps") {
    scriviCmd(APPS.filter(function (app) { return !app.nascosta; }).map(function (app) {
      return "  " + app.id.padEnd(14) + app.titolo;
    }).join("\n"));
  } else if ((primo === "apri" || primo === "open" || primo === "start") && resto) {
    const app = trovaApp(resto);
    if (app) {
      scriviCmd("Apertura di " + app.titolo + "...", "cmd-verde");
      apriApp(app.id);
    } else {
      scriviCmd("Programma non trovato: " + resto + ". Scrivi apps per l'elenco.");
    }
  } else if (appDaSola && appDaSola.id !== "terminale" && comando !== "colonia") {
    scriviCmd("Apertura di " + appDaSola.titolo + "...", "cmd-verde");
    apriApp(appDaSola.id);
  } else if (comando === "diagnostica") {
    diagnostica();
  } else if (comando === "systeminfo") {
    infoSistema();
  } else if (comando === "ping") {
    ping();
  } else if (comando === "matrix") {
    scriviCmd("Avvio pioggia Matrix...", "cmd-verde");
    pioggiaMatrix();
  } else if (comando === "salvaschermo") {
    scriviCmd("Il salvaschermo parte tra un attimo. Muovi il mouse per chiuderlo.", "cmd-verde");
    setTimeout(avviaSalvaschermo, 800);
  } else if (primo === "suoni") {
    if (resto === "on" || resto === "off") {
      impostaSuoni(resto === "on");
      scriviCmd("Suoni " + (resto === "on" ? "attivi." : "disattivati."), "cmd-verde");
    } else {
      scriviCmd("Suoni: " + (suoniAttivi ? "attivi" : "disattivati") + ". Scrivi: suoni on  oppure  suoni off");
    }
  } else if (primo === "notifica") {
    notifica("Terminale", testo.trim().slice(8) || "Notifica di prova.");
    scriviCmd("Notifica inviata.", "cmd-verde");
  } else if (comando === "raggix") {
    cambiaRaggiX();
  } else if (primo === "sfondo") {
    if (cambiaSfondo(resto)) {
      scriviCmd("Sfondo cambiato.", "cmd-verde");
    } else {
      scriviCmd("Sfondi disponibili: " + SFONDI.map(function (s) { return s.id; }).join(", "));
    }
  } else if (comando === "whoami") {
    scriviCmd("brainos\\brian");
  } else if (comando === "ver") {
    scriviCmd("BrainOS [Versione 2.0]");
  } else if (comando === "date") {
    scriviCmd("Data e ora: " + new Date().toLocaleString("it-IT"));
  } else if (comando === "disconnetti" || comando === "logout") {
    scriviCmd("Disconnessione...", "cmd-verde");
    setTimeout(disconnetti, 500);
  } else if (comando === "riavvia" || comando === "restart") {
    scriviCmd("Riavvio...", "cmd-verde");
    setTimeout(riavvia, 500);
  } else if (comando === "arresta" || comando === "shutdown") {
    scriviCmd("Arresto del sistema...", "cmd-verde");
    setTimeout(arresta, 500);
  } else if (comando === "crash") {
    scriviCmd("Te l'avevo detto.", "cmd-verde");
    setTimeout(crollaSistema, 600);
  } else if (comando === "cls") {
    righeCmd.textContent = "";
  } else if (comando === "exit") {
    chiudiApp("terminale");
  } else if (comandoColonia(comando)) {
    // era un comando della colonia: ha già risposto colonia.js
  } else {
    // stesso messaggio d'errore del CMD di Windows
    scriviCmd("'" + testo.trim() + "' non è riconosciuto come comando interno o esterno,\nun programma eseguibile o un file batch.");
  }
}

// Finta diagnostica: i controlli compaiono uno alla volta
async function diagnostica() {
  const controlli = ["Controllo hardware", "Controllo software", "Controllo rete", "Controllo caffè"];
  for (const nome of controlli) {
    await aspetta(400);
    scriviCmd(nome + " ......... OK", "cmd-verde");
  }
  scriviCmd("Nessun guasto trovato. Il sistema funziona.");
}

// Test vero: legge dal browser le informazioni sul dispositivo di chi guarda il sito
function infoSistema() {
  scriviCmd(
    "Schermo:       " + screen.width + " x " + screen.height + " pixel\n" +
    "Finestra:      " + window.innerWidth + " x " + window.innerHeight + " pixel\n" +
    "Processori:    " + (navigator.hardwareConcurrency || "non disponibile") + "\n" +
    "Lingua:        " + navigator.language + "\n" +
    "Connessione:   " + (navigator.onLine ? "online" : "offline")
  );
}

// Test vero: misura quanto ci mette Google a mandare i dati del foglio (3 tentativi, come il vero ping)
async function ping() {
  scriviCmd("Esecuzione di Ping docs.google.com:");
  for (let i = 1; i <= 3; i++) {
    const inizio = performance.now();
    try {
      await fetch(FOGLI.home, { cache: "no-store" });   // no-store: niente copia salvata, scarica davvero
      const tempo = Math.round(performance.now() - inizio);
      scriviCmd("Risposta da docs.google.com: tempo=" + tempo + "ms", "cmd-verde");
    } catch (errore) {
      scriviCmd("Richiesta scaduta.");
    }
  }
}


// 2. PIOGGIA MATRIX
//    Lettere verdi su tutto lo schermo per 10 secondi, poi sparisce da sola

function pioggiaMatrix() {
  if (document.querySelector(".pioggia")) return;   // se sta già piovendo, non ne parte un'altra

  const tela = document.createElement("canvas");
  tela.className = "pioggia";
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  document.body.appendChild(tela);

  const pennello = tela.getContext("2d");
  const lettere = "アイウエオカキクケコサシスセソタチツテト0123456789";
  const grandezza = 16;
  const colonne = Math.floor(tela.width / grandezza);

  // Per ogni colonna mi segno a che altezza è arrivata la "goccia"
  const gocce = [];
  for (let i = 0; i < colonne; i++) {
    gocce[i] = Math.floor(Math.random() * -40);
  }

  const animazione = setInterval(function () {
    pennello.fillStyle = "rgba(0, 0, 0, 0.08)";          // velo nero: le lettere vecchie sfumano
    pennello.fillRect(0, 0, tela.width, tela.height);

    pennello.fillStyle = "#00ff41";
    pennello.font = grandezza + "px monospace";

    for (let i = 0; i < colonne; i++) {
      const lettera = lettere[Math.floor(Math.random() * lettere.length)];
      pennello.fillText(lettera, i * grandezza, gocce[i] * grandezza);
      gocce[i]++;

      if (gocce[i] * grandezza > tela.height && Math.random() > 0.975) {
        gocce[i] = 0;
      }
    }
  }, 50);

  // Dopo 10 secondi la pioggia sfuma (1 secondo) e poi la tolgo dalla pagina
  setTimeout(function () {
    tela.classList.add("sfuma");
    setTimeout(function () {
      clearInterval(animazione);
      tela.remove();
    }, 1000);
  }, 10000);
}


// 3. RAGGI X
//    Mostra come è costruito il sistema: per ogni elemento HTML visibile misuro dove si trova
//    e ci disegno sopra un rettangolo con il suo nome (come gli strumenti da sviluppatore)

const ELEMENTI_RAGGI_X = "header, nav, main, section, article, footer, h1, h2, h3, p, img, dl, button, input, canvas, .finestra, #sistema > div[id]";
let raggiAttivi = false;
let timerRaggiX = null;

// Il nome da scrivere sul rettangolo: il tag, più l'id (#) o la prima classe (.)
function nomeElemento(elemento) {
  let nome = elemento.tagName.toLowerCase();
  if (elemento.id) {
    nome += "#" + elemento.id;
  } else if (elemento.classList.length > 0) {
    nome += "." + elemento.classList[0];
  }
  return nome;
}

// Disegna (o ridisegna) tutti i rettangoli
function disegnaRaggiX() {
  let strato = document.getElementById("strato-raggi-x");
  if (!strato) {
    strato = document.createElement("div");
    strato.id = "strato-raggi-x";
    document.body.appendChild(strato);
  }
  strato.textContent = "";

  let contati = 0;
  document.querySelectorAll(ELEMENTI_RAGGI_X).forEach(function (elemento) {
    if (contati >= 450 || strato.contains(elemento) || elemento.closest(".sfondo, .mondo, template")) return;
    const misure = elemento.getBoundingClientRect();
    if (misure.width === 0 || misure.height === 0) return;
    if (misure.bottom < 0 || misure.top > window.innerHeight || misure.right < 0 || misure.left > window.innerWidth) return;
    if (getComputedStyle(elemento).visibility === "hidden") return;

    const rettangolo = document.createElement("div");
    rettangolo.className = "rettangolo-raggi-x";
    const contenitore = ["HEADER", "NAV", "MAIN", "SECTION", "ARTICLE", "FOOTER", "DIV"].includes(elemento.tagName);
    if (contenitore && misure.top > 20) rettangolo.classList.add("contenitore");
    rettangolo.style.left = misure.left + "px";
    rettangolo.style.top = misure.top + "px";
    rettangolo.style.width = misure.width + "px";
    rettangolo.style.height = misure.height + "px";

    rettangolo.appendChild(crea("span", "", nomeElemento(elemento)));
    strato.appendChild(rettangolo);
    contati++;
  });

  const barra = crea("div", "barra-raggi-x", "RAGGI X ATTIVI · " + contati + " elementi HTML · premi Esc o scrivi raggix per uscire");
  strato.appendChild(barra);
}

function attivaRaggiX() {
  disegnaRaggiX();
  timerRaggiX = setInterval(disegnaRaggiX, 600);   // le finestre si muovono: ridisegno ogni tanto
  raggiAttivi = true;
}

function disattivaRaggiX() {
  clearInterval(timerRaggiX);
  const strato = document.getElementById("strato-raggi-x");
  if (strato) strato.remove();
  raggiAttivi = false;
}

function cambiaRaggiX() {
  if (raggiAttivi) {
    disattivaRaggiX();
  } else {
    attivaRaggiX();
  }
}


// 4. IL SISTEMA CROLLA
//    Una finta rottura in 4 tempi:
//    1) compare BrainOS arrabbiato  2) il testo si corrompe e diventa tutto verde
//    3) lo schermo si spegne come un vecchio monitor  4) schermata d'errore con BrainOS triste
//    → riavvio (ricarico la pagina: si riparte dall'avvio)

let staCrollando = false;   // se si clicca più volte, il crollo parte una volta sola
const CODICE = "アイウエオカキクケコサシスセソ0123456789#$%&@";

// Gli strati sopra al sistema li attacco a <html>: durante lo spegnimento il sistema viene schiacciato e loro devono restare interi
function aggiungiStrato(elemento) {
  document.documentElement.appendChild(elemento);
}

async function crollaSistema() {
  if (staCrollando) return;
  staCrollando = true;
  if (raggiAttivi) disattivaRaggiX();

  const pocoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!pocoMovimento) {
    await mostraArrabbiato();
    await corrompiTesto();
    await spegniSchermo();
  }
  await schermataErrore();
  riavviaPagina();
}

async function mostraArrabbiato() {
  const strato = document.createElement("div");
  strato.className = "strato-arrabbiato";

  const faccia = document.createElement("img");
  faccia.src = "img/brainos-arrabbiato.svg";
  faccia.alt = "";

  strato.append(faccia, crea("p", "errore-critico", "ERRORE CRITICO"), crea("p", "", "utente perso"));
  aggiungiStrato(strato);
  await aspetta(1800);
  strato.remove();
}

// Tutti i testi del sistema si trasformano, poco alla volta, in caratteri di codice
async function corrompiTesto() {
  const testi = [];
  const giro = document.createTreeWalker(document.getElementById("sistema"), NodeFilter.SHOW_TEXT);
  while (giro.nextNode()) {
    if (giro.currentNode.textContent.trim() !== "" && !giro.currentNode.parentElement.closest("script, style, template")) {
      testi.push({ nodo: giro.currentNode, originale: giro.currentNode.textContent });
    }
  }

  document.getElementById("sistema").classList.add("corrotto");

  const durata = 1400;
  const inizio = performance.now();
  while (performance.now() - inizio < durata) {
    const quanto = (performance.now() - inizio) / durata;   // da 0 a 1
    testi.forEach(function (t) {
      t.nodo.textContent = t.originale.replace(/\S/g, function (lettera) {
        return Math.random() < quanto ? CODICE[Math.floor(Math.random() * CODICE.length)] : lettera;
      });
    });
    await aspetta(70);
  }
}

// Spegnimento da vecchio monitor: lo schermo si schiaccia in una riga, la riga diventa un puntino, il puntino si spegne
async function spegniSchermo() {
  const sistema = document.getElementById("sistema");
  sistema.style.transformOrigin = "50% 50%";
  sistema.classList.add("si-spegne");
  await aspetta(450);

  sistema.classList.add("spento");
  const linea = document.createElement("div");
  linea.className = "linea-crt";
  aggiungiStrato(linea);
  await aspetta(450);

  linea.remove();
  const punto = document.createElement("div");
  punto.className = "punto-crt";
  aggiungiStrato(punto);
  await aspetta(700);
  punto.remove();
}

// Schermata d'errore chiara, con BrainOS triste e la barra che si riempie
async function schermataErrore() {
  const schermata = document.createElement("div");
  schermata.className = "schermata-errore";

  const faccia = document.createElement("img");
  faccia.src = "img/brainos-triste.svg";
  faccia.alt = "";

  const barra = crea("div", "barra-errore");
  const riempimento = document.createElement("div");
  barra.appendChild(riempimento);

  const percentuale = crea("p", "percentuale-errore", "0% completato");

  schermata.append(
    faccia,
    crea("p", "titolo-errore", "BrainOS si è bloccato e sta per ripartire."),
    crea("p", "spiegazione-errore", "Stiamo raccogliendo alcune informazioni sull'errore. Non spegnere il computer."),
    barra,
    percentuale,
    crea("p", "dettagli-errore", "Codice di arresto: UTENTE_NON_TROVATO\nPer assistenza contatta l'amministratore di sistema: Brian")
  );
  aggiungiStrato(schermata);

  // la percentuale sale a scatti, come nei veri sistemi operativi
  let valore = 0;
  while (valore < 100) {
    await aspetta(300 + Math.random() * 400);
    valore = Math.min(100, valore + 5 + Math.floor(Math.random() * 20));
    riempimento.style.width = valore + "%";
    percentuale.textContent = valore + "% completato";
  }
  await aspetta(700);

  // Riavvio: schermo nero con il cursore che lampeggia
  schermata.className = "schermata-riavvio";
  schermata.textContent = "Riavvio in corso";
  await aspetta(1500);
}
