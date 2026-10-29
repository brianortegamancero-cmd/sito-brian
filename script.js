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
// rosso = il sistema crolla (sezione 8), giallo = desktop di BrainOS (sezione 9), verde = raggi X (sezione 7)
function preparaFinestraTerminale() {
  // ROSSO: fa crollare tutto il sito
  document.getElementById("crollo").addEventListener("click", crollaSistema);

  // GIALLO: apre il desktop di BrainOS
  document.getElementById("apri-desktop").addEventListener("click", apriDesktop);

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

    // Esc: chiude il CMD; se il CMD è già chiuso, chiude il desktop di BrainOS (sezione 9)
    if (evento.key === "Escape") {
      if (cmd && !cmd.hidden) {
        chiudiCmd();
      } else if (desktopAperto) {
        chiudiDesktop();
      }
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
//    Una finta rottura in 4 tempi:
//    1) compare BrainOS arrabbiato  2) il testo si corrompe e diventa tutto verde
//    3) lo schermo si spegne come un vecchio monitor  4) schermata d'errore con BrainOS triste
//    → riavvio (ricarico la pagina e riparte l'animazione)

let staCrollando = false;   // se si clicca più volte, il crollo parte una volta sola
const CODICE = "アイウエオカキクケコサシスセソ0123456789#$%&@";

// Gli strati sopra la pagina li attacco a <html> e non al <body>,
// perché durante lo spegnimento il body viene schiacciato e loro devono restare interi
function aggiungiStrato(elemento) {
  document.documentElement.appendChild(elemento);
}

async function crollaSistema() {
  if (staCrollando) return;
  staCrollando = true;

  // tolgo le altre cose eventualmente aperte
  if (raggiAttivi) disattivaRaggiX();
  if (cmd) chiudiCmd();
  if (desktopAperto) chiudiDesktop();

  // Per chi ha chiesto al computer di ridurre le animazioni: subito la schermata d'errore
  const pocoMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!pocoMovimento) {
    await mostraArrabbiato();
    await corrompiTesto();
    await spegniSchermo();
  }
  await schermataErrore();
  location.reload();
}

// 1. BrainOS arrabbiato al centro dello schermo, che trema
async function mostraArrabbiato() {
  const strato = document.createElement("div");
  strato.className = "strato-arrabbiato";

  const faccia = document.createElement("img");
  faccia.src = "img/brainos-arrabbiato.svg";
  faccia.alt = "";

  const titolo = document.createElement("p");
  titolo.className = "errore-critico";
  titolo.textContent = "ERRORE CRITICO";

  const sotto = document.createElement("p");
  sotto.textContent = "utente perso";

  strato.append(faccia, titolo, sotto);
  aggiungiStrato(strato);
  await aspetta(1800);
  strato.remove();
}

// 2. Tutti i testi della pagina si trasformano, poco alla volta, in caratteri di codice
async function corrompiTesto() {
  // raccolgo tutti i pezzi di testo dentro il body (salto quelli vuoti)
  const testi = [];
  const giro = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (giro.nextNode()) {
    if (giro.currentNode.textContent.trim() !== "") {
      testi.push({ nodo: giro.currentNode, originale: giro.currentNode.textContent });
    }
  }

  document.body.classList.add("corrotto");   // il CSS colora tutto di verde e fa tremare la pagina

  const durata = 1400;
  const inizio = performance.now();
  while (performance.now() - inizio < durata) {
    // più passa il tempo, più lettere vengono sostituite (da 0% a 100%)
    const quanto = (performance.now() - inizio) / durata;
    testi.forEach(function (t) {
      t.nodo.textContent = t.originale.replace(/\S/g, function (lettera) {
        return Math.random() < quanto ? CODICE[Math.floor(Math.random() * CODICE.length)] : lettera;
      });
    });
    await aspetta(70);
  }
}

// 3. Spegnimento da vecchio monitor: la pagina si schiaccia in una riga,
//    la riga si accorcia fino a un puntino, il puntino si spegne
async function spegniSchermo() {
  // schiaccio il body verso il centro di quello che si vede adesso sullo schermo
  const centro = window.scrollY + window.innerHeight / 2;
  document.body.style.transformOrigin = "50% " + centro + "px";
  document.body.classList.add("si-spegne");
  await aspetta(450);

  document.body.classList.add("spento");      // nascondo la pagina schiacciata
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

// 4. Schermata d'errore chiara, con BrainOS triste e la barra che si riempie
async function schermataErrore() {
  const schermata = document.createElement("div");
  schermata.className = "schermata-errore";

  const faccia = document.createElement("img");
  faccia.src = "img/brainos-triste.svg";
  faccia.alt = "";

  const titolo = document.createElement("p");
  titolo.className = "titolo-errore";
  titolo.textContent = "BrainOS si è bloccato e sta per ripartire.";

  const spiegazione = document.createElement("p");
  spiegazione.className = "spiegazione-errore";
  spiegazione.textContent = "Stiamo raccogliendo alcune informazioni sull'errore. Non spegnere il computer.";

  // barra di avanzamento: un contenitore grigio con dentro la parte verde che si allunga
  const barra = document.createElement("div");
  barra.className = "barra-errore";
  const riempimento = document.createElement("div");
  barra.appendChild(riempimento);

  const percentuale = document.createElement("p");
  percentuale.className = "percentuale-errore";
  percentuale.textContent = "0% completato";

  const dettagli = document.createElement("p");
  dettagli.className = "dettagli-errore";
  dettagli.textContent = "Codice di arresto: UTENTE_NON_TROVATO\n" +
                         "Per assistenza contatta l'amministratore di sistema: Brian";

  schermata.append(faccia, titolo, spiegazione, barra, percentuale, dettagli);
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


// 9. PULSANTE GIALLO: IL DESKTOP DI BRAINOS
//    Il terminale si "riduce" e compare il desktop del sistema operativo del sito.
//    Il desktop è già scritto in index.html (div #desktop, nascosto):
//    qui lo apro, lo chiudo e faccio funzionare icone, menu start, orologio e batteria.
//    La colonia di formiche è nella sezione 10.

let desktopAperto = false;
let orologio = null;   // il timer che aggiorna l'ora ogni secondo

// Prepara il desktop una volta sola, quando si apre la Home
function preparaDesktop() {
  preparaColonia();

  // Ogni icona (e ogni voce del menu start) ha scritto in data-app il programma da aprire
  document.querySelectorAll("#desktop [data-app]").forEach(function (pulsante) {
    pulsante.addEventListener("click", function () {
      apriApp(pulsante.dataset.app);
    });
  });

  // Start: apre e chiude il menu
  document.getElementById("start").addEventListener("click", cambiaMenuStart);

  // OK e ✕ chiudono la finestra dei messaggi
  document.getElementById("finestra-ok").addEventListener("click", chiudiFinestra);
  document.getElementById("finestra-chiudi").addEventListener("click", chiudiFinestra);

  // Clic in un punto vuoto del desktop: il menu start si chiude
  document.getElementById("desktop").addEventListener("click", function (evento) {
    if (!evento.target.closest("#menu-start, #start")) chiudiMenuStart();
  });
}

function apriDesktop() {
  // Da telefono il desktop non ci sta: scrivo un avviso nel terminale e mi fermo
  if (window.innerWidth < 700) {
    avvisoSoloPC();
    return;
  }
  if (raggiAttivi) disattivaRaggiX();

  document.getElementById("desktop").hidden = false;
  document.documentElement.classList.add("desktop-aperto");   // la pagina sotto non scorre
  desktopAperto = true;

  aggiornaOra();
  orologio = setInterval(aggiornaOra, 1000);   // l'ora si aggiorna ogni secondo
  leggiBatteria();
  leggiConnessione();
  avviaColonia();                              // la colonia riparte (sezione 10)
}

function chiudiDesktop() {
  document.getElementById("desktop").hidden = true;
  document.documentElement.classList.remove("desktop-aperto");
  desktopAperto = false;
  clearInterval(orologio);
  fermaColonia();
  chiudiMenuStart();
  chiudiFinestra();
}

// Avviso per il telefono: una riga in più nel terminale (una volta sola)
function avvisoSoloPC() {
  if (document.getElementById("solo-pc")) return;
  const riga = document.createElement("p");
  riga.id = "solo-pc";
  riga.textContent = "> Il desktop di BrainOS si apre solo da PC";
  document.getElementById("righe-avvio").appendChild(riga);
}

// Orologio vero: ora e data del computer di chi guarda il sito
function aggiornaOra() {
  const adesso = new Date();
  document.getElementById("ora").textContent = adesso.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("data").textContent = adesso.toLocaleDateString("it-IT");
}

// Batteria vera (funziona in Chrome ed Edge; negli altri browser resta il disegno pieno)
function leggiBatteria() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then(function (batteria) {
    const livello = Math.round(batteria.level * 100);
    document.getElementById("batteria-testo").textContent = livello + "%";
    document.getElementById("batteria-carica").setAttribute("width", 13 * batteria.level);   // 13 = batteria piena
  });
}

// Wi-Fi vero: se il dispositivo non è connesso, l'icona diventa grigia
function leggiConnessione() {
  const wifi = document.getElementById("wifi");
  wifi.classList.toggle("offline", !navigator.onLine);
  wifi.setAttribute("aria-label", navigator.onLine ? "Connesso a Internet" : "Nessuna connessione");
}

// Apre il "programma" scritto in data-app
function apriApp(nome) {
  chiudiMenuStart();
  if (nome === "cmd") {
    apriCmd();                       // il CMD della sezione 6, che si apre sopra al desktop
  } else if (nome === "terminale" || nome === "spegni") {
    chiudiDesktop();                 // si torna al terminale della Home
    window.scrollTo(0, 0);
  } else if (nome === "colonia") {
    apriFinestraColonia();
  } else if (nome === "cv") {
    window.location.href = "cv.html";
  } else if (nome === "phonix") {
    mostraFinestra("phonix.exe", "> PHONIX", "La mia attività di riparazioni. Phone + Fenix: come la fenice, ogni dispositivo rinasce.");
  } else {
    // tutte le altre icone sono bloccate
    mostraFinestra("sicurezza.exe", "> ACCESSO NEGATO", "Serve il permesso dell'amministratore (Brian).");
  }
}

// La finestra dei messaggi al centro (e il suo nome nella barra delle applicazioni)
function mostraFinestra(programma, intestazione, testo) {
  document.getElementById("finestra-titolo").textContent = "C:\\BrainOS\\" + programma;
  document.getElementById("finestra-intestazione").textContent = intestazione;
  document.getElementById("finestra-testo").textContent = testo;
  document.getElementById("finestra").hidden = false;

  const appAperta = document.getElementById("app-aperta");
  appAperta.textContent = programma;
  appAperta.hidden = false;
}

function chiudiFinestra() {
  document.getElementById("finestra").hidden = true;
  document.getElementById("app-aperta").hidden = true;
}

// Il pulsante start apre il menu se è chiuso, e lo chiude se è aperto
function cambiaMenuStart() {
  const menu = document.getElementById("menu-start");
  menu.hidden = !menu.hidden;
  document.getElementById("start").setAttribute("aria-expanded", !menu.hidden);
}

function chiudiMenuStart() {
  document.getElementById("menu-start").hidden = true;
  document.getElementById("start").setAttribute("aria-expanded", "false");
}


// 10. LA COLONIA DI FORMICHE
//     Una colonia vera: cresce col tempo, scava camere nuove e affronta pericoli.
//     Tutto lo stato sta in un oggetto ("colonia") che si salva nel browser (localStorage):
//     ogni visitatore ha la sua colonia, e quando torna la ritrova cresciuta.

const CHIAVE_COLONIA = "brainos-colonia";   // il nome con cui la salvo nel browser
const DURATA_GIORNO = 60000;                // 1 giorno della colonia = 60 secondi
const NOMI_CAMERE = ["", "\\regina", "\\uova", "\\cibo", "\\scorte", "\\caserma"];

// I tunnel dove camminano le formiche (gli stessi disegnati in index.html).
// camera = da quante camere scavate in su esiste il tunnel, durata = secondi per percorrerlo
const PERCORSI = [
  { camera: 1, durata: 14, d: "M1400 84 H560 Q522 52 480 58" },
  { camera: 1, durata: 10, d: "M-440 84 H400 Q438 52 480 58" },
  { camera: 1, durata: 12, d: "M480 58 C470 130 530 170 510 230 C590 250 650 290 700 320 S780 370 800 392" },
  { camera: 2, durata: 7,  d: "M510 230 C490 290 430 310 400 350 C370 390 330 410 300 456" },
  { camera: 3, durata: 5,  d: "M400 350 C360 335 300 325 270 304" },
  { camera: 4, durata: 4,  d: "M492 150 C540 160 590 170 630 178" },
  { camera: 5, durata: 5,  d: "M700 320 C690 380 660 420 645 462" }
];

// I pericoli che arrivano a caso (la fame invece arriva da sola, quando finisce il cibo)
const PERICOLI = {
  ragno:   { inizio: "un ragno è entrato!",         fine: "il ragno è scappato" },
  pioggia: { inizio: "piove: il tunnel si allaga!", fine: "l'acqua è stata tolta" },
  nemiche: { inizio: "formiche nemiche in arrivo!", fine: "le nemiche sono scappate" }
};

let colonia = null;        // lo stato della colonia
let pericolo = null;       // il pericolo in corso, ad esempio { tipo: "ragno", vita: 5, turni: 0 }
let timerGiorno = null;    // fa passare i giorni
let timerPericolo = null;  // ogni 3 secondi fa "muovere" il pericolo

// Una colonia appena nata: la regina e 6 operaie
function nuovaColonia() {
  return {
    giorno: 1,
    operaie: 6,
    soldate: 0,
    cibo: 50,          // da 0 a 100
    camere: 1,         // da 1 a 5
    diario: ["> G1 nasce la colonia"],
    ultimoGiorno: Date.now()   // quando è passato l'ultimo giorno (serve per contare i giorni a sito chiuso)
  };
}

// Salva e carica la colonia nel browser.
// try/catch: in alcuni browser (es. navigazione in incognito) il salvataggio non funziona, e va bene lo stesso
function salvaColonia() {
  try {
    localStorage.setItem(CHIAVE_COLONIA, JSON.stringify(colonia));   // l'oggetto diventa testo
  } catch (errore) {}
}

function caricaColonia() {
  try {
    colonia = JSON.parse(localStorage.getItem(CHIAVE_COLONIA));      // il testo torna oggetto
  } catch (errore) {
    colonia = null;
  }
  if (!colonia) colonia = nuovaColonia();   // prima visita: nasce una colonia nuova
}

// Tiene un numero tra un minimo e un massimo (es. il cibo resta tra 0 e 100)
function limita(numero, minimo, massimo) {
  return Math.max(minimo, Math.min(massimo, numero));
}

function estinta() {
  return colonia.operaie + colonia.soldate === 0;
}

// Aggiunge una riga al diario (tengo solo le ultime 5)
function scriviDiario(testo) {
  colonia.diario.push("> G" + colonia.giorno + " " + testo);
  if (colonia.diario.length > 5) colonia.diario.shift();
}

// Collega i pulsanti della colonia (una volta sola)
function preparaColonia() {
  document.querySelectorAll(".colpisci").forEach(function (bottone) {
    bottone.addEventListener("click", colpisci);
  });
  document.getElementById("zona-briciole").addEventListener("click", lasciaBriciole);
  document.getElementById("colonia-chiudi").addEventListener("click", chiudiFinestraColonia);
  document.getElementById("tab-colonia").addEventListener("click", cambiaFinestraColonia);

  // Colonia estinta: si ricomincia da capo
  document.getElementById("nuova-colonia").addEventListener("click", function () {
    document.querySelectorAll(".mondo .operaia, .mondo .soldata").forEach(function (formica) {
      formica.remove();
    });
    colonia = nuovaColonia();
    aggiornaColonia();
  });

  creaNemiche();
}

// Quando si apre il desktop: carico la colonia, recupero i giorni passati e faccio partire il tempo
function avviaColonia() {
  caricaColonia();
  recuperaGiorniPassati();
  apriFinestraColonia();
  aggiornaColonia();

  timerGiorno = setInterval(function () {
    nuovoGiorno(false);
    aggiornaColonia();
  }, DURATA_GIORNO);
  timerPericolo = setInterval(turnoPericolo, 3000);
}

// Quando si chiude il desktop: fermo il tempo e salvo
function fermaColonia() {
  clearInterval(timerGiorno);
  clearInterval(timerPericolo);
  if (pericolo) togliPericolo();
  salvaColonia();
}

// Mentre il sito era chiuso: conto quanti giorni sono passati e li faccio passare "tranquilli"
function recuperaGiorniPassati() {
  const passati = Math.floor((Date.now() - colonia.ultimoGiorno) / DURATA_GIORNO);
  const giorni = Math.min(passati, 500);   // al massimo 500, così il calcolo è veloce
  if (giorni < 1) return;

  const prima = colonia.operaie + colonia.soldate;
  for (let i = 0; i < giorni; i++) {
    nuovoGiorno(true);
  }
  const dopo = colonia.operaie + colonia.soldate;
  scriviDiario("mentre eri via: " + giorni + " giorni, formiche " + prima + " → " + dopo);
}

// UN GIORNO DELLA COLONIA: cibo, nascite, scavo e (ogni tanto) un pericolo.
// tranquillo = true quando il sito è chiuso: niente morti e niente pericoli
function nuovoGiorno(tranquillo) {
  colonia.ultimoGiorno = Date.now();
  if (estinta()) return;          // colonia estinta: non succede più niente
  colonia.giorno++;

  // 1. Cibo: le operaie lo raccolgono (un po' a caso), tutte lo mangiano (le soldate il doppio)
  const raccolto = Math.round(colonia.operaie * (0.3 + Math.random() * 0.4));
  const mangiato = Math.round((colonia.operaie + colonia.soldate * 2) / 3);
  colonia.cibo = limita(colonia.cibo + raccolto - mangiato, 0, 100);

  // 2. Fame: se il cibo è finito muore un'operaia
  if (colonia.cibo === 0 && !tranquillo && colonia.operaie > 0) {
    colonia.operaie--;
    scriviDiario("fame: è morta un'operaia");
    if (estinta()) scriviDiario("la colonia è estinta");
  }

  // 3. Nascite: la regina depone se c'è cibo e c'è spazio (12 formiche per camera).
  //    Ogni nuova formica costa 3 di cibo; nasce una soldata ogni 4 operaie
  const posto = colonia.camere * 12 - (colonia.operaie + colonia.soldate);
  const nascite = Math.min(1 + Math.floor(colonia.camere / 2), posto);
  for (let i = 0; i < nascite && colonia.cibo >= 10; i++) {
    colonia.cibo -= 3;
    if (colonia.soldate < Math.floor(colonia.operaie / 4)) {
      colonia.soldate++;
    } else {
      colonia.operaie++;
    }
  }

  // 4. Scavo: con abbastanza operaie si apre una camera nuova (al massimo 5)
  if (colonia.camere < 5 && colonia.operaie >= colonia.camere * 8) {
    colonia.camere++;
    scriviDiario("nuova camera: " + NOMI_CAMERE[colonia.camere]);
  }

  // 5. Pericoli: solo mentre guardi, dal giorno 3, 3 volte su 10
  if (!tranquillo && !pericolo && colonia.giorno >= 3 && Math.random() < 0.3) {
    const tipi = Object.keys(PERICOLI);                          // ["ragno", "pioggia", "nemiche"]
    iniziaPericolo(tipi[Math.floor(Math.random() * tipi.length)]);
  }
}

// I PERICOLI
function iniziaPericolo(tipo) {
  pericolo = { tipo: tipo, vita: 5, turni: 0 };
  document.getElementById("pericolo-" + tipo).hidden = false;
  scriviDiario(PERICOLI[tipo].inizio);
}

// Il pericolo è stato sconfitto (o se n'è andato)
function finisciPericolo() {
  scriviDiario(PERICOLI[pericolo.tipo].fine);
  togliPericolo();
  aggiornaColonia();
}

// Nasconde il pericolo senza scrivere niente nel diario
function togliPericolo() {
  document.getElementById("pericolo-" + pericolo.tipo).hidden = true;
  pericolo = null;
}

// Ogni 3 secondi: la colonia si difende e il pericolo fa danni
function turnoPericolo() {
  if (!pericolo) return;
  pericolo.turni++;

  // Difesa: le soldate combattono ragno e nemiche, le operaie scavano contro l'acqua.
  // Più difensori ci sono, più è facile colpire (al massimo 6 volte su 10)
  const difensori = pericolo.tipo === "pioggia" ? colonia.operaie / 3 : colonia.soldate;
  if (Math.random() < Math.min(0.6, difensori / 10)) pericolo.vita--;

  // Danni (una volta su due)
  if (Math.random() < 0.5) {
    if (pericolo.tipo === "ragno") {
      colonia.operaie = Math.max(0, colonia.operaie - 1);         // il ragno mangia un'operaia
    } else if (pericolo.tipo === "pioggia") {
      colonia.cibo = Math.max(0, colonia.cibo - 4);               // l'acqua rovina il cibo
    } else if (colonia.soldate > 0) {
      colonia.soldate--;                                          // le nemiche battono una soldata...
    } else {
      colonia.operaie = Math.max(0, colonia.operaie - 1);         // ...o un'operaia, se le soldate non ci sono
    }
  }

  if (estinta()) {
    togliPericolo();
    scriviDiario("la colonia è estinta");
    aggiornaColonia();
  } else if (pericolo.vita <= 0 || pericolo.turni >= 10) {
    finisciPericolo();            // sconfitto, oppure dopo 10 turni (30 secondi) se ne va da solo
  } else {
    aggiornaColonia();
  }
}

// Clic sul pericolo: gli togli un punto di vita
function colpisci(evento) {
  if (!pericolo) return;
  pericolo.vita--;

  const bottone = evento.currentTarget;
  bottone.classList.add("colpito");                                 // piccolo lampo verde
  setTimeout(function () {
    bottone.classList.remove("colpito");
  }, 150);

  if (pericolo.vita <= 0) {
    finisciPericolo();
  } else {
    aggiornaColonia();
  }
}

// FAME: ogni clic in superficie lascia un po' di briciole
function lasciaBriciole() {
  colonia.cibo = Math.min(100, colonia.cibo + 4);
  aggiornaColonia();
}

// Le formiche nemiche: 3 copie bianche della formica modello, che partono in momenti diversi
function creaNemiche() {
  const modello = document.getElementById("modello-formica");
  const box = document.getElementById("pericolo-nemiche");
  for (let i = 0; i < 3; i++) {
    const nemica = modello.cloneNode(true);
    nemica.removeAttribute("id");                 // l'id deve essere unico: alle copie lo tolgo
    nemica.hidden = false;
    nemica.classList.add("nemica");
    nemica.style.animationDelay = (-i * 1.6) + "s";
    box.appendChild(nemica);
  }
}

// MOSTRA LA COLONIA SULLO SCHERMO (numeri, stato, diario, camere, formiche) E LA SALVA
function aggiornaColonia() {
  const fame = colonia.cibo < 10 && !estinta();

  // I numeri nella finestra colonia.exe
  document.getElementById("colonia-giorno").textContent = colonia.giorno;
  document.getElementById("colonia-operaie").textContent = colonia.operaie;
  document.getElementById("colonia-soldate").textContent = colonia.soldate;
  document.getElementById("colonia-cibo").textContent = colonia.cibo;
  document.getElementById("colonia-cibo-barra").style.width = colonia.cibo + "%";
  // le camere come quadratini: ■ = scavata, □ = ancora da scavare
  document.getElementById("colonia-camere").textContent =
    "■".repeat(colonia.camere) + "□".repeat(5 - colonia.camere) + "  " + colonia.camere + "/5";

  // Lo stato (l'ultimo che vale vince: estinta è il più importante)
  let stato = "TRANQUILLA";
  if (fame) stato = "FAME";
  if (pericolo) stato = "IN PERICOLO";
  if (estinta()) stato = "ESTINTA";
  const rigaStato = document.getElementById("colonia-stato");
  rigaStato.textContent = "STATO: " + stato;
  rigaStato.classList.toggle("allarme", stato !== "TRANQUILLA");

  // La vita che resta al pericolo, come quadratini
  if (pericolo) {
    document.querySelector("#pericolo-" + pericolo.tipo + " .vita").textContent =
      "■".repeat(pericolo.vita) + "□".repeat(5 - pericolo.vita);
  }

  // Il diario: una riga <p> per ogni evento
  const diario = document.getElementById("colonia-diario");
  diario.textContent = "";
  colonia.diario.forEach(function (testo) {
    const riga = document.createElement("p");
    riga.textContent = testo;
    diario.appendChild(riga);
  });

  // Fame: compare la zona per le briciole. Estinta: compare "Nuova colonia"
  document.getElementById("zona-briciole").hidden = !fame;
  document.getElementById("nuova-colonia").hidden = !estinta();

  // Camere: si vedono solo i tunnel già scavati (data-camera in index.html)
  document.querySelectorAll("#desktop [data-camera]").forEach(function (pezzo) {
    pezzo.style.display = Number(pezzo.dataset.camera) <= colonia.camere ? "" : "none";
  });

  aggiornaFormiche();
  salvaColonia();
}

// Le formiche che camminano: ne disegno 1 ogni 3 operaie (massimo 14) e 1 per ogni soldata (massimo 4)
function aggiornaFormiche() {
  sistemaFormiche("operaia", Math.min(14, Math.ceil(colonia.operaie / 3)));
  sistemaFormiche("soldata", Math.min(4, colonia.soldate));
}

// Aggiunge o toglie formiche di un tipo finché sono il numero giusto
function sistemaFormiche(tipo, quante) {
  const mondo = document.querySelector(".mondo");
  const presenti = mondo.querySelectorAll(".formica." + tipo);

  for (let i = presenti.length; i > quante; i--) {
    presenti[i - 1].remove();                       // troppe: tolgo le ultime
  }
  for (let i = presenti.length; i < quante; i++) {
    mondo.appendChild(creaFormica(tipo));            // poche: ne aggiungo di nuove
  }
}

// Crea una formica che cammina in un tunnel a caso, tra quelli già scavati
function creaFormica(tipo) {
  const formica = document.getElementById("modello-formica").cloneNode(true);
  formica.removeAttribute("id");
  formica.hidden = false;
  formica.classList.add(tipo);

  const scavati = PERCORSI.filter(function (percorso) {
    return percorso.camera <= colonia.camere;
  });
  const percorso = scavati[Math.floor(Math.random() * scavati.length)];
  formica.style.offsetPath = "path('" + percorso.d + "')";                  // il tunnel da seguire
  formica.style.animationDuration = percorso.durata + "s";
  formica.style.animationDelay = (-Math.random() * percorso.durata) + "s";   // negativo = è già in cammino

  if (Math.random() < 0.5) formica.classList.add("indietro");               // metà vanno al contrario
  if (tipo === "operaia") {
    const caso = Math.random();
    if (caso < 0.2) formica.classList.add("porta-briciola");
    else if (caso < 0.35) formica.classList.add("porta-foglia");
  }
  return formica;
}

// La finestra colonia.exe: si apre, si chiude e si riapre dalla barra delle applicazioni
function apriFinestraColonia() {
  document.getElementById("finestra-colonia").hidden = false;
  document.getElementById("tab-colonia").classList.add("attiva");
}

function chiudiFinestraColonia() {
  document.getElementById("finestra-colonia").hidden = true;
  document.getElementById("tab-colonia").classList.remove("attiva");
}

function cambiaFinestraColonia() {
  if (document.getElementById("finestra-colonia").hidden) {
    apriFinestraColonia();
  } else {
    chiudiFinestraColonia();
  }
}


// 11. PARTENZA: preparo menu ed easter egg (ci sono in tutte le pagine),
//     poi capisco in che pagina sono e avvio quella giusta
preparaMenu();
preparaEasterEgg();

if (document.body.classList.contains("pagina-home")) {
  preparaFinestraTerminale();
  preparaDesktop();
  avviaHome();
} else if (document.body.classList.contains("pagina-cv")) {
  avviaCV();
} else if (document.body.classList.contains("pagina-stage")) {
  avviaStage();
}
