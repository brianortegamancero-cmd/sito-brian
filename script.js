// =====================================================
// script.js – un solo file JavaScript per tutto il sito
// =====================================================

// 1. LINK DEI FOGLI (ogni pagina ha il suo link CSV)
const FOGLI = {
  home: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=0&single=true&output=csv",
  cv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=495881978&single=true&output=csv",
  stage: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=1518556426&single=true&output=csv"
};


// 2. STRUMENTI CHE SERVONO A TUTTE LE PAGINE

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

// Prende solo le righe di una sezione (es. tutte le "passione")
function prendiSezione(righe, nome) {
  return righe.filter(function (riga) {
    return riga.sezione === nome;
  });
}

// Nasconde il messaggio "Caricamento dati in corso" quando i dati sono arrivati
function nascondiCaricamento() {
  const caricamento = document.getElementById("caricamento");
  if (caricamento) caricamento.hidden = true;
}

// Mostra il messaggio d'errore se il foglio non si carica
function mostraErrore() {
  nascondiCaricamento();
  const errore = document.getElementById("errore");
  if (errore) errore.hidden = false;
}

// Aspetta un certo numero di millisecondi (serve per le animazioni)
function aspetta(ms) {
  return new Promise(function (fine) {
    setTimeout(fine, ms);
  });
}

// Menu con gli interruttori stile iPhone:
// quando clicchi una voce, prima l'interruttore si accende e poi si apre la pagina
function preparaMenu() {
  const voci = document.querySelectorAll(".menu nav a");
  voci.forEach(function (voce) {
    voce.addEventListener("click", function (evento) {
      // Ctrl+clic (o la voce già accesa): lascio fare al browser come sempre
      if (evento.ctrlKey || evento.metaKey || voce.classList.contains("attivo")) return;

      evento.preventDefault();
      voci.forEach(function (altra) {
        altra.classList.remove("attivo");   // spengo tutti gli interruttori
      });
      voce.classList.add("attivo");          // accendo quello cliccato

      setTimeout(function () {
        window.location.href = voce.href;    // dopo l'animazione apro la pagina
      }, 300);
    });
  });
}


// 3. PAGINA HOME

// Fa comparire le righe del terminale una alla volta
async function mostraRigheAvvio(lista) {
  const box = document.getElementById("righe-avvio");
  for (const riga of lista) {
    const p = document.createElement("p");
    p.textContent = "> " + riga.testo;
    box.appendChild(p);
    await aspetta(600);
  }
}

// Scrive una parola lettera per lettera
async function scriviLettere(elemento, parola) {
  for (const lettera of parola) {
    elemento.textContent += lettera;
    await aspetta(120);
  }
}

// Inserisce foto e testo di presentazione
function riempiPresentazione(dati) {
  document.getElementById("testo-presentazione").textContent = dati.testo;
  document.getElementById("foto").src = "img/" + dati.immagine;
}

// Crea una card per ogni passione
function creaPassioni(lista) {
  const box = document.getElementById("passioni");
  lista.forEach(function (passione) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.src = "img/" + passione.immagine;
    img.alt = passione.titolo;

    const titolo = document.createElement("h3");
    titolo.textContent = passione.titolo;

    const testo = document.createElement("p");
    testo.textContent = passione.testo;

    card.append(img, titolo, testo);
    box.appendChild(card);
  });
}

// Crea una batteria per ogni competenza (livello = carica da 0 a 100)
function creaCompetenze(lista) {
  const box = document.getElementById("competenze");
  lista.forEach(function (competenza) {
    const livello = Number(competenza.livello) || 0;

    const riga = document.createElement("div");
    riga.className = "competenza";

    const nome = document.createElement("span");
    nome.className = "nome-competenza";
    nome.textContent = competenza.titolo;

    const batteria = document.createElement("div");
    batteria.className = "batteria";

    const carica = document.createElement("div");
    carica.className = "carica";
    carica.style.width = livello + "%";

    const percentuale = document.createElement("span");
    percentuale.className = "percentuale";
    percentuale.textContent = livello + "%";

    batteria.appendChild(carica);
    riga.append(nome, batteria, percentuale);
    box.appendChild(riga);
  });
}

// I tre pulsanti della finestra del terminale:
// rosso = il sistema crolla (sezione 8), giallo = riduci, verde = vista a raggi X (sezione 7)
function preparaFinestraTerminale() {
  const terminale = document.getElementById("terminale");

  // ROSSO: fa crollare tutto il sito
  document.getElementById("crollo").addEventListener("click", crollaSistema);

  // GIALLO: riduce il terminale alla sola barra in alto (premuto di nuovo, lo riapre)
  document.getElementById("riduci-terminale").addEventListener("click", function () {
    terminale.classList.toggle("ridotto");
  });

  // VERDE: accende e spegne la vista a raggi X
  document.getElementById("raggi-x").addEventListener("click", cambiaRaggiX);
}

// Avvia tutta la Home
async function avviaHome() {
  try {
    const righe = await caricaFoglio(FOGLI.home);
    nascondiCaricamento();

    const avvio = prendiSezione(righe, "avvio");
    const presentazione = prendiSezione(righe, "presentazione")[0];
    const passioni = prendiSezione(righe, "passione");
    const competenze = prendiSezione(righe, "competenza");

    // Animazione del terminale: prima le righe, poi il nome, poi il ruolo
    await mostraRigheAvvio(avvio);
    await scriviLettere(document.getElementById("nome"), presentazione.titolo);
    document.getElementById("ruolo").textContent = presentazione.sottotitolo;
    await aspetta(400);

    // "Utente trovato": solo adesso riempio il resto della pagina...
    riempiPresentazione(presentazione);
    creaPassioni(passioni);
    creaCompetenze(competenze);

    // ...e lo faccio comparire (le parti con la classe "dopo-avvio" escono una alla volta)
    document.body.classList.add("avviato");
  } catch (errore) {
    console.error(errore);
    mostraErrore();
  }
}


// 4. PAGINA CV

// Crea una "linea del tempo": una tappa per ogni riga del foglio.
// La uso due volte: per il lavoro e per l'istruzione.
function creaTimeline(idBox, lista) {
  const box = document.getElementById(idBox);
  lista.forEach(function (voce) {
    const tappa = document.createElement("article");
    tappa.className = "tappa";

    // se il periodo è "in corso", il pallino diventa verde e pulsa
    if (voce.periodo.toLowerCase() === "in corso") {
      tappa.classList.add("in-corso");
    }

    const periodo = document.createElement("p");
    periodo.className = "periodo";
    periodo.textContent = voce.periodo;

    const titolo = document.createElement("h3");
    titolo.textContent = voce.titolo;

    const luogo = document.createElement("p");
    luogo.className = "luogo";
    luogo.textContent = voce.luogo;

    tappa.append(periodo, titolo, luogo);

    // la descrizione la aggiungo solo se nel foglio è scritta
    if (voce.testo) {
      const testo = document.createElement("p");
      testo.className = "descrizione";
      testo.textContent = voce.testo;
      tappa.appendChild(testo);
    }

    box.appendChild(tappa);
  });
}

// Crea un'etichetta (con la lucina verde) per ogni competenza trasversale
function creaEtichette(idBox, lista) {
  const box = document.getElementById(idBox);
  lista.forEach(function (voce) {
    const etichetta = document.createElement("span");
    etichetta.className = "etichetta";
    etichetta.textContent = voce.titolo;
    box.appendChild(etichetta);
  });
}

// Crea un riquadro per ogni lingua: nome a sinistra, livello a destra
function creaLingue(lista) {
  const box = document.getElementById("lingue");
  lista.forEach(function (voce) {
    const riga = document.createElement("div");
    riga.className = "lingua";

    const nome = document.createElement("span");
    nome.className = "nome-lingua";
    nome.textContent = voce.titolo;

    const livello = document.createElement("span");
    livello.className = "livello";
    livello.textContent = voce.testo;

    riga.append(nome, livello);
    box.appendChild(riga);
  });
}

// Avvia tutta la pagina CV
async function avviaCV() {
  try {
    const righe = await caricaFoglio(FOGLI.cv);
    nascondiCaricamento();

    creaTimeline("lavoro", prendiSezione(righe, "lavoro"));
    creaTimeline("istruzione", prendiSezione(righe, "istruzione"));
    creaEtichette("trasversali", prendiSezione(righe, "competenza"));
    creaLingue(prendiSezione(righe, "lingua"));
  } catch (errore) {
    console.error(errore);
    mostraErrore();
  }
}


// 5. PAGINA STAGE

// Aggiunge una riga "etichetta → valore" ai dettagli del ticket
function aggiungiRiga(dettagli, etichetta, valore) {
  const nome = document.createElement("dt");
  nome.textContent = etichetta;

  const dato = document.createElement("dd");
  dato.textContent = valore;

  dettagli.append(nome, dato);
}

// Crea un "ticket di assistenza" per ogni stage
function creaTicket(lista) {
  const box = document.getElementById("ticket");
  lista.forEach(function (stage) {
    const ticket = document.createElement("article");
    ticket.className = "ticket";

    // Parte alta (scura): numero del ticket e stato
    const testa = document.createElement("div");
    testa.className = "ticket-testa";

    const numero = document.createElement("span");
    numero.className = "numero-ticket";
    numero.textContent = "Ticket " + stage.ticket;

    const stato = document.createElement("span");
    stato.className = "stato";
    stato.textContent = stage.stato;

    testa.append(numero, stato);

    // Parte bassa: ruolo e dettagli dell'intervento
    const corpo = document.createElement("div");
    corpo.className = "ticket-corpo";

    const ruolo = document.createElement("h3");
    ruolo.textContent = stage.ruolo;

    const dettagli = document.createElement("dl");
    aggiungiRiga(dettagli, "Azienda", stage.azienda);
    aggiungiRiga(dettagli, "Periodo", stage.periodo);
    aggiungiRiga(dettagli, "Intervento", stage.testo);

    corpo.append(ruolo, dettagli);
    ticket.append(testa, corpo);
    box.appendChild(ticket);
  });
}

// Avvia tutta la pagina Stage
async function avviaStage() {
  try {
    const righe = await caricaFoglio(FOGLI.stage);
    nascondiCaricamento();
    const stage = prendiSezione(righe, "stage");

    // riga sotto il titolo, come un messaggio del sistema
    document.getElementById("riepilogo").textContent = "Ticket trovati: " + stage.length;
    creaTicket(stage);
  } catch (errore) {
    console.error(errore);
    mostraErrore();
  }
}


// 6. EASTER EGG
//    CMD segreto: Ctrl + Alt + R (R di "Run", come Win+R) oppure 4 clic sul logo (da telefono)
//    Pioggia Matrix: Ctrl + Alt + M, oppure il comando "matrix" nel CMD

let cmd = null;       // la finestra del CMD (la creo solo la prima volta che serve)
let righeCmd = null;  // la parte dove compaiono le risposte
let inputCmd = null;  // la riga dove si scrivono i comandi

// Conta i clic sul logo: 4 clic veloci aprono il CMD, 1 clic porta alla Home come sempre
function preparaEasterEgg() {
  const logo = document.querySelector(".logo");
  let clic = 0;
  let timer = null;

  logo.addEventListener("click", function (evento) {
    evento.preventDefault();   // fermo il link: prima conto i clic
    clic++;
    clearTimeout(timer);

    if (clic === 4) {
      clic = 0;
      apriCmd();
    } else {
      // se entro mezzo secondo non arrivano altri clic, il logo apre la Home come al solito
      timer = setTimeout(function () {
        clic = 0;
        window.location.href = logo.href;
      }, 500);
    }
  });

  // Combinazioni di tasti (il tasto Win non si può usare: lo prende Windows prima del browser)
  document.addEventListener("keydown", function (evento) {
    // Ctrl + Alt + R: apre il CMD
    if (evento.ctrlKey && evento.altKey && evento.code === "KeyR") {
      evento.preventDefault();
      apriCmd();
    }

    // Ctrl + Alt + M: parte subito la pioggia Matrix
    if (evento.ctrlKey && evento.altKey && evento.code === "KeyM") {
      evento.preventDefault();
      pioggiaMatrix();
    }

    // Esc: chiude il CMD
    if (evento.key === "Escape" && cmd && !cmd.hidden) {
      chiudiCmd();
    }
  });
}

// Costruisce la finestra del CMD (barra in alto, schermo nero, riga dei comandi)
function creaCmd() {
  cmd = document.createElement("div");
  cmd.className = "cmd-sfondo";

  const finestra = document.createElement("div");
  finestra.className = "cmd-finestra";

  // Barra in alto con il titolo e la X per chiudere
  const barra = document.createElement("div");
  barra.className = "cmd-barra";

  const titolo = document.createElement("span");
  titolo.textContent = "C:\\BrainOS\\cmd.exe";   // BrainOS: Brian con due lettere scambiate = "cervello"

  const chiudi = document.createElement("button");
  chiudi.className = "cmd-chiudi";
  chiudi.textContent = "✕";
  chiudi.setAttribute("aria-label", "Chiudi");
  chiudi.addEventListener("click", chiudiCmd);

  barra.append(titolo, chiudi);

  // Schermo nero con le risposte e, in fondo, la riga per scrivere
  const schermo = document.createElement("div");
  schermo.className = "cmd-schermo";

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

  modulo.append(prompt, inputCmd);

  // Quando premi Invio, eseguo il comando scritto
  modulo.addEventListener("submit", function (evento) {
    evento.preventDefault();
    eseguiComando(inputCmd.value);
    inputCmd.value = "";
  });

  schermo.append(righeCmd, modulo);

  // Clic sullo schermo nero: il cursore torna nella riga dei comandi
  schermo.addEventListener("click", function () {
    inputCmd.focus();
  });

  finestra.append(barra, schermo);
  cmd.appendChild(finestra);

  // Clic fuori dalla finestra: il CMD si chiude
  cmd.addEventListener("click", function (evento) {
    if (evento.target === cmd) chiudiCmd();
  });

  document.body.appendChild(cmd);

  // Messaggio di benvenuto, come quello del vero CMD di Windows
  scriviCmd("BrainOS [Versione 1.0]");
  scriviCmd("(c) Brian Ortega. Tutti i diritti riservati.");
  scriviCmd(" ");
  scriviCmd("Scrivi help per vedere i comandi.", "cmd-verde");
}

function apriCmd() {
  if (!cmd) creaCmd();
  cmd.hidden = false;
  inputCmd.focus();
}

function chiudiCmd() {
  cmd.hidden = true;
}

// Scrive una riga nel CMD e scorre in fondo, così si vede sempre l'ultima
function scriviCmd(testo, classe) {
  const riga = document.createElement("p");
  riga.textContent = testo;
  if (classe) riga.className = classe;
  righeCmd.appendChild(riga);

  const schermo = righeCmd.parentElement;
  schermo.scrollTop = schermo.scrollHeight;
}

// Legge il comando scritto e risponde
function eseguiComando(testo) {
  const comando = testo.trim().toLowerCase();
  const pagine = { home: "index.html", cv: "cv.html", stage: "stage.html" };

  scriviCmd("C:\\Brian>" + testo);   // ripeto il comando, come fa il vero CMD
  if (comando === "") return;

  if (comando === "help") {
    scriviCmd(
      "Comandi disponibili:\n" +
      "  home, cv, stage   apre la pagina\n" +
      "  diagnostica       controllo completo del sistema\n" +
      "  systeminfo        informazioni sul tuo dispositivo\n" +
      "  ping              test di connessione al foglio Google\n" +
      "  matrix            ...provalo\n" +
      "  date              data e ora di oggi\n" +
      "  cls               pulisce lo schermo\n" +
      "  exit              chiude il CMD",
      "cmd-verde"
    );
  } else if (pagine[comando]) {
    scriviCmd("Apertura di " + pagine[comando] + "...");
    setTimeout(function () {
      window.location.href = pagine[comando];
    }, 600);
  } else if (comando === "diagnostica") {
    diagnostica();
  } else if (comando === "systeminfo") {
    infoSistema();
  } else if (comando === "ping") {
    ping();
  } else if (comando === "matrix") {
    scriviCmd("Avvio pioggia Matrix...", "cmd-verde");
    pioggiaMatrix();
  } else if (comando === "date") {
    scriviCmd("Data e ora: " + new Date().toLocaleString("it-IT"));
  } else if (comando === "cls") {
    righeCmd.textContent = "";
  } else if (comando === "exit") {
    chiudiCmd();
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
    const inizio = performance.now();      // segno l'ora di partenza
    try {
      await fetch(FOGLI.home, { cache: "no-store" });   // no-store: niente copia salvata, scarica davvero
      const tempo = Math.round(performance.now() - inizio);
      scriviCmd("Risposta da docs.google.com: tempo=" + tempo + "ms", "cmd-verde");
    } catch (errore) {
      scriviCmd("Richiesta scaduta.");
    }
  }
}

// Pioggia di lettere verdi su tutto lo schermo per 10 secondi, poi sparisce da sola
function pioggiaMatrix() {
  if (document.querySelector(".pioggia")) return;   // se sta già piovendo, non ne parte un'altra

  const tela = document.createElement("canvas");
  tela.className = "pioggia";
  tela.width = window.innerWidth;
  tela.height = window.innerHeight;
  document.body.appendChild(tela);

  const pennello = tela.getContext("2d");
  const lettere = "アイウエオカキクケコサシスセソタチツテト0123456789";
  const grandezza = 16;                                  // grandezza delle lettere in pixel
  const colonne = Math.floor(tela.width / grandezza);

  // Per ogni colonna mi segno a che altezza è arrivata la "goccia"
  const gocce = [];
  for (let i = 0; i < colonne; i++) {
    gocce[i] = Math.floor(Math.random() * -40);          // partono sfalsate, sopra lo schermo
  }

  // Ogni 50 millisecondi disegno un nuovo fotogramma
  const animazione = setInterval(function () {
    pennello.fillStyle = "rgba(0, 0, 0, 0.08)";          // velo nero: le lettere vecchie sfumano
    pennello.fillRect(0, 0, tela.width, tela.height);

    pennello.fillStyle = "#00ff41";
    pennello.font = grandezza + "px monospace";

    for (let i = 0; i < colonne; i++) {
      const lettera = lettere[Math.floor(Math.random() * lettere.length)];
      pennello.fillText(lettera, i * grandezza, gocce[i] * grandezza);
      gocce[i]++;

      // quando la goccia esce in basso, ogni tanto ricomincia dall'alto
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


// 7. PULSANTE VERDE: VISTA A RAGGI X
//    Mostra come è costruita la pagina: per ogni elemento HTML misuro dove si trova
//    e ci disegno sopra un rettangolo con il suo nome (come gli strumenti da sviluppatore)

// Gli elementi da mostrare (quelli che danno la struttura alla pagina)
const ELEMENTI_RAGGI_X = "header, nav, main, section, article, footer, h1, h2, h3, p, img, dl, div[id]";
let raggiAttivi = false;

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

function attivaRaggiX() {
  // Uno "strato" trasparente sopra la pagina, dove disegno i rettangoli
  const strato = document.createElement("div");
  strato.id = "strato-raggi-x";

  let contati = 0;
  document.querySelectorAll(ELEMENTI_RAGGI_X).forEach(function (elemento) {
    const misure = elemento.getBoundingClientRect();   // posizione e grandezza dell'elemento
    const nascosto = getComputedStyle(elemento).visibility === "hidden";
    if (misure.width === 0 || misure.height === 0 || nascosto) return;   // salto quelli che non si vedono

    const rettangolo = document.createElement("div");
    rettangolo.className = "rettangolo-raggi-x";

    // I contenitori (section, div, article...) hanno l'etichetta SOPRA il rettangolo,
    // i contenuti (titoli, paragrafi, immagini) DENTRO: così le etichette non si sovrappongono.
    // (se il contenitore è proprio in cima alla pagina, l'etichetta resta dentro per non uscire)
    const contenitore = ["HEADER", "NAV", "MAIN", "SECTION", "ARTICLE", "FOOTER", "DIV"].includes(elemento.tagName);
    if (contenitore && misure.top + window.scrollY > 20) {
      rettangolo.classList.add("contenitore");
    }
    // aggiungo lo scroll, così il rettangolo resta sopra l'elemento anche scorrendo la pagina
    rettangolo.style.left = (misure.left + window.scrollX) + "px";
    rettangolo.style.top = (misure.top + window.scrollY) + "px";
    rettangolo.style.width = misure.width + "px";
    rettangolo.style.height = misure.height + "px";

    const nome = document.createElement("span");
    nome.textContent = nomeElemento(elemento);

    rettangolo.appendChild(nome);
    strato.appendChild(rettangolo);
    contati++;
  });

  // Barra in basso che spiega cosa sta succedendo
  const barra = document.createElement("div");
  barra.className = "barra-raggi-x";
  barra.textContent = "RAGGI X ATTIVI · " + contati + " elementi HTML · premi il pulsante verde o Esc per uscire";
  strato.appendChild(barra);

  document.body.appendChild(strato);
  document.body.classList.add("raggi-x");
  raggiAttivi = true;
}

function disattivaRaggiX() {
  const strato = document.getElementById("strato-raggi-x");
  if (strato) strato.remove();
  document.body.classList.remove("raggi-x");
  raggiAttivi = false;
}

// Il pulsante verde accende i raggi X se sono spenti, e li spegne se sono accesi
function cambiaRaggiX() {
  if (raggiAttivi) {
    disattivaRaggiX();
  } else {
    attivaRaggiX();
  }
}

// Esc spegne i raggi X; se la finestra cambia grandezza, ridisegno i rettangoli
document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && raggiAttivi) disattivaRaggiX();
});

window.addEventListener("resize", function () {
  if (raggiAttivi) {
    disattivaRaggiX();
    attivaRaggiX();
  }
});


// 8. PULSANTE ROSSO: IL SISTEMA CROLLA
//    Una finta rottura in 4 tempi: errore nel terminale → glitch → la pagina cade a pezzi
//    → schermata di errore di BrainOS → riavvio (ricarico la pagina e riparte l'animazione)

let staCrollando = false;   // se si clicca più volte, il crollo parte una volta sola

async function crollaSistema() {
  if (staCrollando) return;
  staCrollando = true;

  // tolgo le altre cose eventualmente aperte
  if (raggiAttivi) disattivaRaggiX();
  if (cmd) chiudiCmd();
  const terminale = document.getElementById("terminale");
  terminale.classList.remove("ridotto");

  // 1. Il terminale scrive l'errore in rosso, una riga alla volta
  const messaggi = [
    "ERRORE CRITICO: utente perso",
    "Tentativo di recupero ......... FALLITO",
    "Il sistema non risponde"
  ];
  const contenuto = terminale.querySelector(".contenuto-terminale");
  for (const testo of messaggi) {
    const riga = document.createElement("p");
    riga.className = "riga-errore";
    riga.textContent = "> " + testo;
    contenuto.appendChild(riga);
    await aspetta(600);
  }

  // 2. Glitch: la pagina trema e i colori impazziscono
  document.body.classList.add("glitch");
  await aspetta(1200);
  document.body.classList.remove("glitch");

  // 3. I pezzi della pagina cadono, ognuno con una rotazione e un ritardo diversi
  document.body.classList.add("crollo");   // niente barre di scorrimento mentre cadono
  const pezzi = document.querySelectorAll("body > header, main > *, body > footer");
  pezzi.forEach(function (pezzo) {
    pezzo.style.setProperty("--rotazione", (Math.random() * 60 - 30) + "deg");   // da -30° a +30°
    pezzo.style.setProperty("--ritardo", (Math.random() * 0.5) + "s");            // da 0 a 0,5 secondi
    pezzo.classList.add("cade");
  });
  await aspetta(2200);

  // 4. Schermata di errore, poi riavvio
  await schermataErrore();
  location.reload();
}

// La schermata blu di BrainOS, come quella di Windows, con la percentuale che sale
async function schermataErrore() {
  const schermata = document.createElement("div");
  schermata.className = "schermata-errore";

  const faccina = document.createElement("p");
  faccina.className = "faccina";
  faccina.textContent = ":(";

  const testo = document.createElement("p");
  testo.className = "testo-errore";
  testo.textContent = "BrainOS ha riscontrato un problema e deve essere riavviato. " +
                      "Stiamo raccogliendo alcune informazioni sull'errore, poi il sistema ripartirà da solo.";

  const percentuale = document.createElement("p");
  percentuale.className = "testo-errore";
  percentuale.textContent = "0% completato";

  // in basso: la formica al posto del codice QR di Windows, e il codice dell'errore
  const dettagli = document.createElement("div");
  dettagli.className = "dettagli-errore";

  const formica = document.createElement("img");
  formica.src = "img/icona.svg";
  formica.alt = "";

  const info = document.createElement("p");
  info.textContent = "Per maggiori informazioni contatta l'amministratore di sistema: Brian\n" +
                     "Codice di arresto: UTENTE_NON_TROVATO";

  dettagli.append(formica, info);
  schermata.append(faccina, testo, percentuale, dettagli);
  document.body.appendChild(schermata);

  // la percentuale sale a scatti, come in Windows
  let valore = 0;
  while (valore < 100) {
    await aspetta(300 + Math.random() * 400);
    valore = Math.min(100, valore + 5 + Math.floor(Math.random() * 20));
    percentuale.textContent = valore + "% completato";
  }
  await aspetta(700);

  // Riavvio: schermo nero con il cursore che lampeggia
  schermata.className = "schermata-riavvio";
  schermata.textContent = "Riavvio in corso";
  await aspetta(1500);
}


// 9. PARTENZA: preparo menu ed easter egg (ci sono in tutte le pagine),
//    poi capisco in che pagina sono e avvio quella giusta
preparaMenu();
preparaEasterEgg();

if (document.body.classList.contains("pagina-home")) {
  preparaFinestraTerminale();
  avviaHome();
} else if (document.body.classList.contains("pagina-cv")) {
  avviaCV();
} else if (document.body.classList.contains("pagina-stage")) {
  avviaStage();
}
