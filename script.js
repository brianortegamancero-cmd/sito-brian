// =====================================================
// script.js – un solo file JavaScript per tutto il sito
// =====================================================

// 1. LINK DEI FOGLI (ogni pagina ha il suo link CSV)
const FOGLI = {
  home: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=0&single=true&output=csv",
  cv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=495881978&single=true&output=csv",
  stage: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=1518556426&single=true&output=csv",
  extra: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-vhK4GHrokgWfCDUCur7msY8FUub8z6Ar7wVxegtIbOhAO5NlbvMs47VI_tp-33TJm8uP1BLz5P9U/pub?gid=607733622&single=true&output=csv"
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


// 5b. PAGINA EXTRA (i miei lavori)

// Crea una card per ogni lavoro: immagine, categoria, titolo, descrizione e (se c'è) il pulsante "Apri".
// Se una cella del foglio è vuota, quella parte non la mostro
function creaSchede(lista) {
  const box = document.getElementById("schede");
  lista.forEach(function (lavoro) {
    const card = document.createElement("article");
    card.className = "card card-extra";

    if (lavoro.immagine) {
      const img = document.createElement("img");
      img.src = "img/" + lavoro.immagine;
      img.alt = lavoro.titolo;
      // se il file non c'è (ad esempio non l'ho ancora caricato) tolgo l'immagine: niente icona rotta
      img.addEventListener("error", function () {
        img.remove();
      });
      card.appendChild(img);
    }

    const corpo = document.createElement("div");
    corpo.className = "card-corpo";

    if (lavoro.categoria) {
      const categoria = document.createElement("span");
      categoria.className = "categoria";
      categoria.textContent = lavoro.categoria;
      corpo.appendChild(categoria);
    }

    const titolo = document.createElement("h3");
    titolo.textContent = lavoro.titolo;
    corpo.appendChild(titolo);

    if (lavoro.descrizione) {
      const descrizione = document.createElement("p");
      descrizione.textContent = lavoro.descrizione;
      corpo.appendChild(descrizione);
    }

    // Il pulsante c'è solo se il link è un indirizzo web vero (comincia con https:// o http://)
    const link = lavoro.link || "";
    if (link.startsWith("https://") || link.startsWith("http://")) {
      const pulsante = document.createElement("a");
      pulsante.className = "pulsante-apri";
      pulsante.href = link;
      pulsante.target = "_blank";              // si apre in una nuova scheda
      pulsante.rel = "noopener noreferrer";    // sicurezza: la nuova scheda non può controllare il mio sito
      pulsante.textContent = "Apri";
      corpo.appendChild(pulsante);
    }

    card.appendChild(corpo);
    box.appendChild(card);
  });
}

// Avvia tutta la pagina Extra
async function avviaExtra() {
  try {
    const righe = await caricaFoglio(FOGLI.extra);
    nascondiCaricamento();

    // dalla riga "pagina": il titolo grande e l'introduzione
    const pagina = prendiSezione(righe, "pagina")[0];
    if (pagina) {
      document.getElementById("titolo-extra").textContent = pagina.titolo;
      document.getElementById("intro-extra").textContent = pagina.descrizione;
    }

    creaSchede(prendiSezione(righe, "scheda"));
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
  const pagine = { home: "index.html", cv: "cv.html", stage: "stage.html", extra: "extra.html" };

  scriviCmd("C:\\Brian>" + testo);   // ripeto il comando, come fa il vero CMD
  if (comando === "") return;

  if (comando === "help") {
    scriviCmd(
      "Comandi disponibili:\n" +
      "  home, cv, stage, extra   apre la pagina\n" +
      "  diagnostica       controllo completo del sistema\n" +
      "  systeminfo        informazioni sul tuo dispositivo\n" +
      "  ping              test di connessione al foglio Google\n" +
      "  matrix            ...provalo\n" +
      "  colonia           stato della colonia di formiche\n" +
      "  colonia veloce    1 giorno = 5 secondi (colonia normale per tornare)\n" +
      "  colonia demo      carica una colonia già grande\n" +
      "  colonia nuova     ricomincia da capo\n" +
      "  ragno, pioggia, nemiche, volo   fa succedere subito l'evento\n" +
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
  } else if (comandoColonia(comando)) {
    // era un comando della colonia: ha già risposto la sezione 10l
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
  } else if (nome === "extra") {
    window.location.href = "extra.html";
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
//     Una colonia che vive da sola, senza aiuto: cresce, scava camere nuove e affronta i pericoli.
//     Ogni formica è disegnata e fa il suo lavoro. Le parti:
//     10a. lo stato della colonia e il salvataggio nel browser
//     10b. i tunnel e la strada più corta
//     10c. le creature che si muovono (formiche, ragno, nemiche, alate)
//     10d. i lavori delle formiche
//     10e. un giorno della colonia (vecchiaia, cibo, uova, nascite, scavo)
//     10f. la regina e la seconda vita
//     10g. i pericoli e i combattimenti
//     10h. giorno, notte e stagioni
//     10i. il cimitero e il volo nuziale
//     10j. la scheda di una formica (si apre col clic)
//     10k. mostrare tutto sullo schermo
//     10l. i comandi del CMD per l'esame


// 10a. LO STATO DELLA COLONIA

const CHIAVE_COLONIA = "brainos-colonia-2";   // il nome con cui la salvo nel browser
const NOMI_CAMERE = ["", "\\regina", "\\uova", "\\cibo", "\\scorte", "\\caserma"];
const STAGIONI = ["primavera", "estate", "autunno", "inverno"];   // 10 giorni ciascuna: un anno = 40 giorni
const ARRIVI = ["arriva la primavera", "arriva l'estate", "arriva l'autunno", "arriva l'inverno"];
const SVG = "http://www.w3.org/2000/svg";     // serve per creare elementi SVG da JavaScript

let durataGiorno = 60000;   // 1 giorno della colonia = 60 secondi (col comando "colonia veloce": 5 secondi)
let colonia = null;         // lo stato della colonia (si salva nel browser)
let creature = [];          // le creature disegnate sullo schermo
let pericolo = null;        // il pericolo in corso, ad esempio { tipo: "ragno" }
let scelta = null;          // la creatura cliccata (la sua scheda è aperta)
let timerGiorno = null;     // fa passare i giorni
let timerTurno = null;      // ogni secondo: pericoli, cielo e schermo
let animazione = null;      // il ciclo che muove le creature
let ultimoFotogramma = 0;

// Piccoli strumenti
function casuale(minimo, massimo) {
  return minimo + Math.random() * (massimo - minimo);       // un numero a caso tra minimo e massimo
}

function aCaso(lista) {
  return lista[Math.floor(Math.random() * lista.length)];   // un elemento a caso della lista
}

function limita(numero, minimo, massimo) {
  return Math.max(minimo, Math.min(massimo, numero));        // tiene il numero tra minimo e massimo
}

function distanza(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);                   // distanza in pixel tra due creature
}

// Quante formiche ci sono di un tipo ("operaia" o "soldata")
function conta(tipo) {
  return colonia.formiche.filter(function (f) {
    return f.tipo === tipo;
  }).length;
}

// Una formica nuova: un numero (id), il tipo, l'età e quanti giorni vivrà (tra 60 e 100)
function nuovaFormica(tipo, eta) {
  colonia.prossimoId++;
  return { id: colonia.prossimoId, tipo: tipo, eta: eta || 0, vita: Math.round(casuale(60, 100)) };
}

// Una colonia appena nata: la regina, 6 operaie e 3 uova
function nuovaColonia() {
  colonia = {
    giorno: 1,
    regina: { stato: "viva", vita: 5, giorni: 0, nata: 1 },   // stato: viva, crescita o morta
    secondaVita: true,          // si può allevare una nuova regina una volta sola
    formiche: [],
    uova: [0, 1, 2],            // ogni numero è l'età di un uovo, in giorni
    uovaDeposte: 3,
    cibo: 50,
    camere: 1,                  // da 1 a 5
    cimitero: 0,                // quante formiche morte sono state portate al cimitero
    ultimoVolo: -1,             // l'anno dell'ultimo volo nuziale
    pericoloSospeso: null,      // il pericolo in corso quando si è chiuso il desktop
    prossimoId: 0,
    diario: [],
    finita: false,              // diventa true quando la colonia si estingue
    ultimoGiorno: Date.now()    // quando è passato l'ultimo giorno
  };
  for (let i = 0; i < 6; i++) {
    colonia.formiche.push(nuovaFormica("operaia"));
  }
  scriviDiario("nasce la colonia");
}

// Quanto cibo si può conservare: la camera delle scorte lo raddoppia
function ciboMassimo() {
  return colonia.camere >= 4 ? 200 : 100;
}

// La colonia è estinta se non ci sono più formiche e la regina non è viva
function estinta() {
  return colonia.formiche.length === 0 && colonia.regina.stato !== "viva";
}

function controllaFine() {
  if (!colonia.finita && estinta()) {
    colonia.finita = true;
    scriviDiario("la colonia è estinta");
  }
}

// Aggiunge una riga al diario (tengo solo le ultime 5)
function scriviDiario(testo) {
  colonia.diario.push("> G" + colonia.giorno + " " + testo);
  if (colonia.diario.length > 5) colonia.diario.shift();
}

// Salva e carica la colonia nel browser (localStorage).
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
  if (!colonia) nuovaColonia();   // prima visita: nasce una colonia nuova
}


// 10b. I TUNNEL E LA STRADA PIÙ CORTA

// I punti importanti del formicaio (x e y nel disegno di 960 x 552)
const NODI = {
  fuori_d:  { x: 1150, y: 84 },   // fuori a destra, dove si cerca il cibo
  erba:     { x: 760, y: 84 },    // in superficie vicino al formicaio (da qui arrivano i nemici)
  fuori_s:  { x: -260, y: 84 },   // fuori a sinistra
  cimitero: { x: 180, y: 84 },    // dove le formiche portano le morte
  buco:     { x: 480, y: 62 },    // l'ingresso
  j1: { x: 492, y: 150 },         // gli incroci dei tunnel
  j2: { x: 510, y: 230 },
  j3: { x: 400, y: 350 },
  j4: { x: 700, y: 320 },
  regina:  { x: 800, y: 398 },    // le camere
  uova:    { x: 310, y: 455 },
  cibo:    { x: 275, y: 303 },
  scorte:  { x: 630, y: 178 },
  caserma: { x: 645, y: 465 }
};

// I pezzi di tunnel: l'id del <path> in index.html, da quale punto a quale,
// e da quante camere scavate in su esiste
const TRATTI = [
  { id: "t-fuori-erba",      da: "fuori_d",  a: "erba",     camera: 1 },
  { id: "t-erba-buco",       da: "erba",     a: "buco",     camera: 1 },
  { id: "t-fuori-cimitero",  da: "fuori_s",  a: "cimitero", camera: 1 },
  { id: "t-cimitero-buco",   da: "cimitero", a: "buco",     camera: 1 },
  { id: "t-buco-j1",         da: "buco",     a: "j1",       camera: 1 },
  { id: "t-j1-j2",           da: "j1",       a: "j2",       camera: 1 },
  { id: "t-j2-j4",           da: "j2",       a: "j4",       camera: 1 },
  { id: "t-j4-regina",       da: "j4",       a: "regina",   camera: 1 },
  { id: "t-j2-j3",           da: "j2",       a: "j3",       camera: 2 },
  { id: "t-j3-uova",         da: "j3",       a: "uova",     camera: 2 },
  { id: "t-j3-cibo",         da: "j3",       a: "cibo",     camera: 3 },
  { id: "t-j1-scorte",       da: "j1",       a: "scorte",   camera: 4 },
  { id: "t-j4-caserma",      da: "j4",       a: "caserma",  camera: 5 }
];

// Cerca la strada più corta tra due punti.
// Metodo "in ampiezza": parto dalla partenza ed esploro i punti vicini a ondate,
// segnandomi da dove arrivo; quando trovo l'arrivo, ricostruisco la strada all'indietro.
function trovaStrada(partenza, arrivo) {
  const daDove = {};          // per ogni punto raggiunto: con quale pezzo di tunnel e da quale punto
  daDove[partenza] = null;
  const coda = [partenza];

  while (coda.length > 0) {
    const nodo = coda.shift();
    if (nodo === arrivo) break;

    TRATTI.forEach(function (tratto) {
      if (tratto.camera > colonia.camere) return;          // tunnel non ancora scavato
      let vicino = null;
      if (tratto.da === nodo) vicino = tratto.a;
      if (tratto.a === nodo) vicino = tratto.da;
      if (vicino && !(vicino in daDove)) {
        daDove[vicino] = { tratto: tratto, da: nodo };
        coda.push(vicino);
      }
    });
  }

  // Ricostruisco la strada partendo dall'arrivo e tornando indietro
  const strada = [];
  let nodo = arrivo;
  while (daDove[nodo]) {
    const passo = daDove[nodo];
    const percorso = document.getElementById(passo.tratto.id);
    strada.unshift({
      percorso: percorso,                            // il <path> da seguire
      lunghezza: percorso.getTotalLength(),          // quanto è lungo, in pixel
      avanti: passo.tratto.da === passo.da,          // true = lo percorro nel verso in cui è disegnato
      arrivo: nodo
    });
    nodo = passo.da;
  }
  return strada;
}


// 10c. LE CREATURE CHE SI MUOVONO

const VELOCITA = { operaia: 55, soldata: 60, nemica: 65, ragno: 35, alata: 0, morta: 0 };   // pixel al secondo
const MEZZA = {                                     // metà della larghezza e dell'altezza di ogni disegno
  operaia: [12, 7], soldata: [17, 10], nemica: [12, 7], alata: [12, 7], morta: [12, 7], ragno: [30, 32]
};

// Crea sullo schermo una creatura copiando un modello di index.html (la formica o il ragno)
function creaCreatura(tipo, nodo, id) {
  const modello = document.getElementById(tipo === "ragno" ? "modello-ragno" : "modello-formica");
  const el = modello.cloneNode(true);
  el.removeAttribute("id");                       // l'id deve essere unico: alle copie lo tolgo
  el.hidden = false;
  el.classList.add(tipo, "muore");                // parte trasparente...
  setTimeout(function () {
    el.classList.remove("muore");                 // ...e compare piano
  }, 30);
  document.querySelector(".mondo").appendChild(el);

  const creatura = {
    el: el,
    tipo: tipo,
    id: id,                                       // lo stesso id della formica in colonia.formiche
    x: NODI[nodo].x,
    y: NODI[nodo].y,
    angolo: 0,                                    // dove guarda (in radianti)
    nodo: nodo,                                   // l'ultimo punto raggiunto
    meta: nodo,                                   // il punto dove sta andando
    strada: [],                                   // i pezzi di tunnel ancora da fare
    pos: 0,                                       // quanti pixel ha già fatto nel primo pezzo
    stato: "libera",                              // libera, cammina o sosta
    sosta: 0,
    durataSosta: 0,
    spostamento: { x: 0, y: 0 },
    poi: null,                                    // cosa fare finita la sosta
    velocita: VELOCITA[tipo],
    vita: tipo === "ragno" ? 8 : 1,               // vita in combattimento (serve a ragno e nemiche)
    carico: null,
    lavoro: "",                                   // cosa sta facendo (si legge nella scheda)
    difesa: false                                 // true quando una soldata sta difendendo la colonia
  };

  // Clic sulla creatura: si apre la sua scheda (10j)
  el.addEventListener("click", function (evento) {
    evento.stopPropagation();
    scegli(creatura);
  });

  creature.push(creatura);
  disegnaCreatura(creatura);
  return creatura;
}

// Sposta e gira il disegno della creatura
function disegnaCreatura(c) {
  const mezza = MEZZA[c.tipo];
  let angolo = c.angolo;
  if (c.tipo === "ragno") angolo += Math.PI / 2;   // il ragno è disegnato con la testa in alto
  c.el.style.transform = "translate(" + (c.x - mezza[0]) + "px, " + (c.y - mezza[1]) + "px) rotate(" + angolo + "rad)";
}

// Toglie una creatura: prima sparisce piano, poi la cancello dalla pagina
function rimuoviCreatura(c) {
  creature = creature.filter(function (altra) {
    return altra !== c;
  });
  c.el.classList.add("muore");
  setTimeout(function () {
    c.el.remove();
  }, 500);
}

// Toglie subito tutte le creature (quando si chiude il desktop o si cambia colonia)
function togliTutteLeCreature() {
  creature.forEach(function (c) {
    c.el.remove();
  });
  creature = [];
  pericolo = null;
  document.getElementById("pioggia").hidden = true;
  chiudiScheda();
}

// Lampo bianco (quando una creatura o la regina vengono colpite)
function lampo(el) {
  el.classList.add(el.tagName === "DIV" ? "lampo" : "ferita");
  setTimeout(function () {
    el.classList.remove("lampo", "ferita");
  }, 200);
}

// Cosa trasporta: "foglia", "briciola", "uovo", "corpo" oppure null (niente)
function prendi(c, cosa) {
  c.carico = cosa;
  ["foglia", "briciola", "uovo", "corpo"].forEach(function (oggetto) {
    c.el.classList.toggle("porta-" + oggetto, cosa === oggetto);
  });
}

// Manda una creatura verso un punto: arrivata si ferma "sosta" secondi, poi fa "poi"
function vai(c, nodo, sosta, poi) {
  let partenza = c.nodo;
  let strada = [];
  if (c.stato === "cammina" && c.strada.length > 0) {
    strada = [c.strada[0]];               // se sta già camminando, prima finisce il pezzo che sta facendo
    partenza = c.strada[0].arrivo;
  } else {
    c.pos = 0;
  }
  c.strada = strada.concat(trovaStrada(partenza, nodo));
  c.meta = nodo;
  c.durataSosta = sosta;
  c.poi = poi || null;
  c.stato = "cammina";
}

// Ad ogni fotogramma: la creatura cammina nel suo tunnel, oppure fa la sua sosta
function muovi(c, dt) {
  if (c.tipo === "morta") return;                 // le morte restano ferme
  if (c.tipo === "alata") {
    vola(c, dt);                                  // le alate volano (10i)
    return;
  }
  if (c.stato === "libera") {
    prossimoLavoro(c);
    return;
  }

  if (c.stato === "cammina") {
    if (c.strada.length === 0) {
      arriva(c);
      return;
    }
    const pezzo = c.strada[0];
    c.pos += c.velocita * dt;                       // avanza: velocità × tempo

    if (c.pos >= pezzo.lunghezza) {                 // finito questo pezzo di tunnel
      c.pos -= pezzo.lunghezza;
      c.nodo = pezzo.arrivo;
      c.strada.shift();
      if (c.strada.length === 0) {
        const fine = pezzo.percorso.getPointAtLength(pezzo.avanti ? pezzo.lunghezza : 0);
        c.x = fine.x;
        c.y = fine.y;
        arriva(c);
      }
      disegnaCreatura(c);
      return;
    }

    // Il punto del tunnel dove si trova adesso, e un punto poco più avanti per sapere dove guarda
    const metri = pezzo.avanti ? c.pos : pezzo.lunghezza - c.pos;
    const p = pezzo.percorso.getPointAtLength(metri);
    const q = pezzo.percorso.getPointAtLength(metri + (pezzo.avanti ? 2 : -2));
    c.x = p.x;
    c.y = p.y;
    if (q.x !== p.x || q.y !== p.y) c.angolo = Math.atan2(q.y - p.y, q.x - p.x);
  } else {
    // SOSTA: fa un giretto, va verso un punto vicino e torna (il seno va da 0 a 1 e di nuovo a 0)
    c.sosta += dt;
    const k = Math.sin(Math.PI * Math.min(1, c.sosta / c.durataSosta));
    c.x = c.baseX + c.spostamento.x * k;
    c.y = c.baseY + c.spostamento.y * k;
    c.angolo = Math.atan2(c.spostamento.y, c.spostamento.x) + (c.sosta > c.durataSosta / 2 ? Math.PI : 0);
    if (c.sosta >= c.durataSosta) finisciSosta(c);
  }
  disegnaCreatura(c);
}

// Arrivata alla meta: inizia la sosta (le operaie girano di più, soldate e nemici restano vicini)
function arriva(c) {
  c.stato = "sosta";
  c.sosta = 0;
  c.baseX = c.x;
  c.baseY = c.y;
  const giro = c.tipo === "operaia" ? 22 : 8;
  c.spostamento = { x: casuale(-giro, giro), y: casuale(-giro / 4, giro / 4) };
  if (c.durataSosta <= 0) finisciSosta(c);
}

// Finita la sosta: fa quello che doveva fare dopo (che spesso è andare da un'altra parte)
function finisciSosta(c) {
  c.stato = "libera";
  const azione = c.poi;
  c.poi = null;
  if (azione) azione();
}

// Il ciclo dell'animazione: il browser lo chiama circa 60 volte al secondo
function fotogramma(ora) {
  const dt = Math.min(0.1, (ora - ultimoFotogramma) / 1000);   // secondi dall'ultimo fotogramma (massimo 0,1)
  ultimoFotogramma = ora;
  creature.slice().forEach(function (c) {      // slice() fa una copia: durante il giro qualcuna può sparire
    muovi(c, dt);
  });
  animazione = requestAnimationFrame(fotogramma);
}


// 10d. I LAVORI DELLE FORMICHE

// Quando una creatura è libera le do un lavoro (ragno e nemiche hanno già il loro piano, sezione 10g)
function prossimoLavoro(c) {
  if (c.tipo === "operaia") lavoroOperaia(c);
  if (c.tipo === "soldata") lavoroSoldata(c);
}

// Le camere già scavate
function camereScavate() {
  return ["regina", "uova", "cibo", "scorte", "caserma"].slice(0, colonia.camere);
}

// Dove si porta il cibo: nella camera del cibo o delle scorte; all'inizio vicino alla regina
function magazzino() {
  if (colonia.camere >= 4 && Math.random() < 0.5) return "scorte";
  if (colonia.camere >= 3) return "cibo";
  return "regina";
}

// Si può uscire a cercare cibo? Non con la pioggia, non di notte e non d'inverno
function siPuoUscire() {
  const piove = pericolo && pericolo.tipo === "pioggia";
  return !piove && !notte() && stagione() !== "inverno";
}

// OPERAIA: becchina (se c'è una morta), foraggiera, nutrice oppure lavoro in casa
function lavoroOperaia(f) {
  // BECCHINA: porta le formiche morte al cimitero (le formiche vere lo fanno: si chiama necroforia)
  const morta = creature.find(function (c) {
    return c.tipo === "morta" && !c.prenotata;
  });
  if (morta && Math.random() < 0.5) {
    morta.prenotata = true;
    f.lavoro = "becchina: va a prendere una morta";
    vai(f, morta.nodo, 1, function () {
      if (!creature.includes(morta)) return;      // qualcun altro l'ha già portata via
      rimuoviCreatura(morta);
      prendi(f, "corpo");
      f.lavoro = "porta una morta al cimitero";
      vai(f, "cimitero", 1.5, function () {
        prendi(f, null);
        colonia.cimitero++;
      });
    });
    return;
  }

  const caso = Math.random();
  if (caso < 0.35 && siPuoUscire()) {
    // FORAGGIERA: esce, cerca cibo e lo porta nel magazzino. Ogni viaggio = +1 di cibo
    f.lavoro = "foraggiera: cerca cibo fuori";
    vai(f, aCaso(["fuori_d", "fuori_s"]), casuale(3, 8), function () {
      prendi(f, Math.random() < 0.5 ? "foglia" : "briciola");
      f.lavoro = "porta " + (f.carico === "foglia" ? "una foglia" : "una briciola") + " al magazzino";
      vai(f, magazzino(), 1.5, function () {
        prendi(f, null);
        colonia.cibo = Math.min(ciboMassimo(), colonia.cibo + 1);
      });
    });
  } else if (caso < 0.6 && colonia.camere >= 2 && colonia.regina.stato === "viva" && colonia.uova.length > 0) {
    // NUTRICE: prende un uovo dalla regina e lo porta nella camera delle uova
    f.lavoro = "nutrice: va a prendere un uovo";
    vai(f, "regina", 1.5, function () {
      prendi(f, "uovo");
      f.lavoro = "nutrice: porta un uovo in \\uova";
      vai(f, "uova", 1.5, function () {
        prendi(f, null);
      });
    });
  } else {
    // LAVORO IN CASA: va in una camera a pulire e scavare (di notte a riposare)
    const camera = aCaso(camereScavate());
    f.lavoro = (notte() ? "riposa in \\" : "pulisce e scava in \\") + camera;
    vai(f, camera, casuale(3, 7));
  }
}

// SOLDATA: fa la guardia all'ingresso oppure gira tra le camere
function lavoroSoldata(s) {
  if (Math.random() < 0.5) {
    s.lavoro = "di guardia all'ingresso";
    vai(s, "buco", casuale(5, 10));
  } else {
    const camera = aCaso(camereScavate());
    s.lavoro = "pattuglia \\" + camera;
    vai(s, camera, casuale(4, 8));
  }
}


// 10e. UN GIORNO DELLA COLONIA
//      tranquillo = true quando il sito era chiuso: niente pericoli, niente morti per fame,
//      e il cibo raccolto lo calcolo con una formula (non ci sono formiche che fanno i viaggi)

function passaGiorno() {
  nuovoGiorno(false);
  aggiornaColonia();
}

function nuovoGiorno(tranquillo) {
  colonia.ultimoGiorno = Date.now();
  if (estinta()) return;              // colonia estinta: non succede più niente
  colonia.giorno++;
  const inverno = stagione() === "inverno";
  if (!tranquillo && (colonia.giorno - 1) % 10 === 0) {
    scriviDiario(ARRIVI[STAGIONI.indexOf(stagione())]);      // cambia la stagione
  }

  // 1. Vecchiaia: ogni formica invecchia; quando supera i suoi giorni di vita muore.
  //    Se il sito era chiuso, le morte finiscono direttamente al cimitero
  colonia.formiche.forEach(function (f) {
    f.eta++;
  });
  const prima = colonia.formiche.length;
  colonia.formiche = colonia.formiche.filter(function (f) {
    return f.eta <= f.vita;
  });
  if (tranquillo) colonia.cimitero += prima - colonia.formiche.length;

  // 2. Cibo: tutte mangiano (le soldate il doppio, d'inverno metà perché sono più lente)
  if (tranquillo && !inverno) {
    colonia.cibo += Math.round(conta("operaia") * casuale(0.45, 0.85));
  }
  let mangiato = Math.round((conta("operaia") + conta("soldata") * 2) / 3);
  if (inverno) mangiato = Math.round(mangiato / 2);
  colonia.cibo = limita(colonia.cibo - mangiato, 0, ciboMassimo());

  // 3. Fame: se il cibo è finito muore la formica più vecchia
  if (colonia.cibo === 0 && !tranquillo && colonia.formiche.length > 0) {
    const vecchia = colonia.formiche.reduce(function (a, b) {
      return a.eta > b.eta ? a : b;
    });
    togliFormica(vecchia);
    scriviDiario("fame: è morta una formica");
  }

  // 4. Uova: crescono di un giorno; a 4 giorni si schiudono e nasce una formica
  //    (nella realtà ci vogliono settimane: qui il tempo va molto più veloce).
  //    Nasce una soldata ogni 4 operaie, le altre sono operaie
  colonia.uova = colonia.uova.map(function (eta) {
    return eta + 1;
  });
  const schiuse = colonia.uova.filter(function (eta) {
    return eta >= 4;
  }).length;
  colonia.uova = colonia.uova.filter(function (eta) {
    return eta < 4;
  });
  for (let i = 0; i < schiuse; i++) {
    const tipo = conta("soldata") < Math.floor(conta("operaia") / 4) ? "soldata" : "operaia";
    colonia.formiche.push(nuovaFormica(tipo));
  }

  // 5. La regina depone le uova nuove (10f)
  deponiUova();

  // 6. Scavo: con abbastanza operaie si apre una camera nuova (9 operaie per camera, al massimo 5 camere)
  if (colonia.camere < 5 && conta("operaia") >= colonia.camere * 9) {
    colonia.camere++;
    scriviDiario("nuova camera: " + NOMI_CAMERE[colonia.camere]);
  }

  // 7. La regina guarisce, oppure la nuova regina cresce (10f)
  giornoRegina();

  // 8. Solo mentre guardi: forse il volo nuziale (10i) e forse un pericolo (10g, mai d'inverno)
  if (!tranquillo) {
    forseVoloNuziale();
    if (!pericolo && !inverno) forsePericolo();
  }

  controllaFine();
}

// Una formica muore: la tolgo dalla colonia e il suo disegno diventa una formica morta
function togliFormica(f) {
  if (!f) return;
  colonia.formiche = colonia.formiche.filter(function (altra) {
    return altra !== f;
  });
  const c = creature.find(function (c) {
    return c.id === f.id;
  });
  if (c) diventaMorta(c);
}

// Mentre il sito era chiuso: conto i giorni passati e li faccio passare "tranquilli"
function recuperaGiorniPassati() {
  const passati = Math.floor((Date.now() - colonia.ultimoGiorno) / durataGiorno);
  const giorni = Math.min(passati, 500);   // al massimo 500, così il calcolo è veloce
  if (giorni < 1) return;

  const prima = colonia.formiche.length;
  for (let i = 0; i < giorni; i++) {
    nuovoGiorno(true);
  }
  scriviDiario("via " + giorni + " giorni: formiche " + prima + "→" + colonia.formiche.length);
}


// 10f. LA REGINA E LA SECONDA VITA

// La regina depone un uovo 7 giorni su 10, se è viva, se c'è cibo e se c'è spazio
// (12 tra formiche e uova per camera). Ogni uovo costa 3 di cibo. D'inverno si riposa.
// Se è rimasta da sola depone lo stesso, usando le sue riserve:
// fanno così le regine vere quando fondano una colonia nuova.
function deponiUova() {
  if (colonia.regina.stato !== "viva" || stagione() === "inverno") return;
  const posto = colonia.camere * 12 - colonia.formiche.length - colonia.uova.length;
  if (posto <= 0 || Math.random() >= 0.7) return;

  const sola = colonia.formiche.length === 0;
  if (!sola && colonia.cibo < 15) return;     // poco cibo: oggi non depone
  if (!sola) colonia.cibo -= 3;
  colonia.uova.push(0);
  colonia.uovaDeposte++;
}

// Ogni giorno la regina ferita guarisce un po'; la nuova regina cresce
function giornoRegina() {
  const regina = colonia.regina;
  if (regina.stato === "viva") {
    regina.vita = Math.min(5, regina.vita + 1);
  } else if (regina.stato === "crescita") {
    regina.giorni--;
    if (regina.giorni <= 0) {
      colonia.regina = { stato: "viva", vita: 5, giorni: 0, nata: colonia.giorno };
      scriviDiario("nuova regina! (seconda vita)");
    }
  }
}

// La regina muore. Se c'è ancora un uovo e la seconda vita non è stata usata,
// le operaie lo nutrono con cibo speciale e diventa una nuova regina (in alcune specie succede davvero)
function reginaMorta() {
  if (colonia.secondaVita && colonia.uova.length > 0) {
    colonia.uova.pop();
    colonia.secondaVita = false;
    colonia.regina = { stato: "crescita", vita: 0, giorni: 5, nata: colonia.giorno };
    scriviDiario("regina morta! ne allevano una");
  } else {
    colonia.regina = { stato: "morta", vita: 0, giorni: 0, nata: colonia.regina.nata };
    scriviDiario("regina morta: niente più uova");
  }
}


// 10g. I PERICOLI E I COMBATTIMENTI

// Ogni giorno (tranne d'inverno) c'è il 25% di probabilità di un pericolo.
// La pioggia può arrivare dal giorno 3, il ragno dal 5, le formiche nemiche dal 10
function forsePericolo() {
  if (Math.random() >= 0.25) return;
  const possibili = [];
  if (colonia.giorno >= 3) possibili.push("pioggia");
  if (colonia.giorno >= 5) possibili.push("ragno");
  if (colonia.giorno >= 10) possibili.push("nemiche");
  if (possibili.length > 0) avviaPericolo(aCaso(possibili));
}

function avviaPericolo(tipo) {
  if (tipo === "pioggia") iniziaPioggia();
  if (tipo === "ragno") iniziaRagno();
  if (tipo === "nemiche") iniziaNemiche();
}

// RAGNO: entra dal buco, va a mangiare le uova, poi attacca la regina, poi se ne va
function iniziaRagno() {
  pericolo = { tipo: "ragno", ucciso: false, uova: false, regina: false };
  const ragno = creaCreatura("ragno", "erba", null);
  ragno.vita = 6 + Math.min(10, Math.floor(colonia.giorno / 15));   // più la colonia è vecchia, più il ragno è grosso
  const primaMeta = colonia.camere >= 2 ? "uova" : "regina";

  vai(ragno, primaMeta, 12, function () {
    vai(ragno, "regina", 15, function () {
      vai(ragno, "erba", 0, function () {
        rimuoviCreatura(ragno);       // è uscito dal formicaio
      });
    });
  });
  scriviDiario("un ragno sta entrando!");
}

// NEMICHE: un gruppo di formiche bianche entra per rubare le uova
function iniziaNemiche() {
  const quante = Math.min(7, 3 + Math.floor(colonia.giorno / 30));   // più passa il tempo, più sono
  pericolo = { tipo: "nemiche", sconfitte: 0, rubate: 0 };

  for (let i = 0; i < quante; i++) {
    const nemica = creaCreatura("nemica", "erba", null);
    nemica.velocita = casuale(50, 75);        // velocità diverse: così non camminano tutte appiccicate
    vai(nemica, colonia.camere >= 2 ? "uova" : "regina", 1, function () {
      if (colonia.uova.length > 0) {          // ruba un uovo...
        colonia.uova.pop();
        prendi(nemica, "uovo");
      }
      vai(nemica, "erba", 0, function () {    // ...e scappa fuori
        if (nemica.carico === "uovo") pericolo.rubate++;
        rimuoviCreatura(nemica);
      });
    });
  }
  scriviDiario(quante + " nemiche all'attacco!");
}

// PIOGGIA: dura 30 secondi; l'acqua entra dal buco e le operaie scavano canali per farla uscire
function iniziaPioggia() {
  pericolo = { tipo: "pioggia", acqua: 0, durata: 30 };
  const pioggia = document.getElementById("pioggia");
  pioggia.hidden = false;
  pioggia.classList.add("piove");
  scriviDiario("piove: foraggiere al riparo");
}

function turnoPioggia() {
  const pioggia = document.getElementById("pioggia");
  pericolo.durata--;
  if (pericolo.durata > 0) {
    pericolo.acqua += 4;                        // entra acqua
  } else {
    pioggia.classList.remove("piove");          // ha smesso di piovere
  }
  pericolo.acqua -= conta("operaia") / 6;       // più operaie ci sono, più acqua tolgono
  pericolo.acqua = limita(pericolo.acqua, 0, 100);
  document.getElementById("acqua").style.opacity = pericolo.acqua / 100;

  // tanta acqua: il cibo si bagna e qualche operaia può annegare
  if (pericolo.acqua > 50 && Math.random() < 0.3) {
    colonia.cibo = Math.max(0, colonia.cibo - 1);
  }
  if (pericolo.acqua > 80 && Math.random() < 0.15) {
    const operaie = colonia.formiche.filter(function (f) {
      return f.tipo === "operaia";
    });
    if (operaie.length > 0) {
      togliFormica(aCaso(operaie));
      scriviDiario("un'operaia è annegata");
    }
  }

  if (pericolo.durata <= 0 && pericolo.acqua <= 0) {
    pioggia.hidden = true;
    pericolo = null;
    scriviDiario("pioggia finita, tunnel asciutti");
  }
}

// COMBATTIMENTI: ogni secondo, per ogni nemico guardo le formiche vicine (a meno di 36 pixel)
function turnoCombattimento() {
  const nemici = creature.filter(function (c) {
    return c.tipo === "ragno" || c.tipo === "nemica";
  });
  if (nemici.length === 0) {
    finisciCombattimento();            // nessun nemico rimasto: il pericolo è finito
    return;
  }

  chiamaSoldate(nemici);

  nemici.forEach(function (nemico) {
    const vicine = creature.filter(function (f) {
      return (f.tipo === "operaia" || f.tipo === "soldata") && distanza(f, nemico) < 36;
    });

    // Le formiche mordono: le soldate colpiscono 35 volte su 100, le operaie 10 su 100
    vicine.forEach(function (f) {
      if (Math.random() < (f.tipo === "soldata" ? 0.35 : 0.1)) {
        nemico.vita--;
        lampo(nemico.el);
      }
    });
    if (nemico.vita <= 0) {
      nemicoSconfitto(nemico);
      return;
    }

    // Il nemico attacca una formica vicina (prima le soldate)
    const soldate = vicine.filter(function (f) {
      return f.tipo === "soldata";
    });
    const bersagli = soldate.length > 0 ? soldate : vicine;
    if (bersagli.length > 0 && Math.random() < (nemico.tipo === "ragno" ? 0.25 : 0.2)) {
      const vittima = aCaso(bersagli);
      togliFormica(colonia.formiche.find(function (f) {
        return f.id === vittima.id;
      }));
    }

    // Il ragno fermo nella camera delle uova le mangia; in quella della regina la attacca
    if (nemico.tipo === "ragno" && nemico.stato === "sosta") {
      if (nemico.nodo === "uova" && colonia.uova.length > 0 && Math.random() < 0.3) {
        colonia.uova.pop();
        if (!pericolo.uova) scriviDiario("il ragno mangia le uova!");
        pericolo.uova = true;
      }
      if (nemico.nodo === "regina" && colonia.regina.stato === "viva" && Math.random() < 0.2) {
        colonia.regina.vita--;
        lampo(document.getElementById("regina"));
        if (!pericolo.regina) scriviDiario("il ragno attacca la regina!");
        pericolo.regina = true;
        if (colonia.regina.vita <= 0) reginaMorta();
      }
    }
  });
}

// Un nemico è stato sconfitto: se aveva rubato un uovo, l'uovo viene recuperato
function nemicoSconfitto(nemico) {
  if (nemico.carico === "uovo") colonia.uova.push(0);
  if (nemico.tipo === "ragno") pericolo.ucciso = true;
  else pericolo.sconfitte++;
  rimuoviCreatura(nemico);
}

function finisciCombattimento() {
  if (pericolo.tipo === "ragno") {
    scriviDiario(pericolo.ucciso ? "ragno ucciso dalle formiche!" : "il ragno se n'è andato");
  } else if (pericolo.rubate > 0) {
    scriviDiario("nemiche fuggite con " + pericolo.rubate + " uova");
  } else {
    scriviDiario("nemiche respinte! (" + pericolo.sconfitte + " uccise)");
  }
  pericolo = null;

  // le soldate tornano ai loro lavori
  creature.forEach(function (s) {
    if (s.difesa) {
      s.difesa = false;
      lavoroSoldata(s);
    }
  });
}

// In caso di pericolo ogni soldata corre verso il nemico più vicino
// (va dove sta andando il nemico e lo aspetta lì)
function chiamaSoldate(nemici) {
  creature.forEach(function (s) {
    if (s.tipo !== "soldata") return;
    let bersaglio = nemici[0];
    nemici.forEach(function (n) {
      if (distanza(s, n) < distanza(s, bersaglio)) bersaglio = n;
    });
    s.difesa = true;
    s.lavoro = "difende la colonia!";
    if (distanza(s, bersaglio) > 36 && s.meta !== bersaglio.meta) {
      vai(s, bersaglio.meta, 30);
    }
  });
}


// 10h. GIORNO, NOTTE E STAGIONI

// La stagione dipende dal giorno: 10 giorni ciascuna, poi l'anno ricomincia
function stagione() {
  return STAGIONI[Math.floor(((colonia.giorno - 1) % 40) / 10)];
}

// È notte nell'ultimo 30% di ogni giorno
function notte() {
  const fase = (Date.now() - colonia.ultimoGiorno) / durataGiorno;   // da 0 (alba) a 1 (fine del giorno)
  return fase > 0.7;
}

// Di notte compare il velo scuro con la luna; d'inverno la neve (le classi le usa style.css)
function aggiornaCielo() {
  const mondo = document.querySelector(".mondo");
  mondo.classList.toggle("notte", notte());
  mondo.classList.toggle("inverno", stagione() === "inverno");
}


// 10i. IL CIMITERO E IL VOLO NUZIALE

// Una formica morta resta dov'è, grigia e ferma, finché una becchina non la porta al cimitero
function diventaMorta(c) {
  c.tipo = "morta";
  c.id = null;
  c.stato = "ferma";
  c.prenotata = false;
  prendi(c, null);
  c.el.classList.remove("operaia", "soldata");
  c.el.classList.add("morta");
  disegnaCreatura(c);

  // se le morte in giro sono troppe, la più vecchia finisce subito al cimitero
  const morte = creature.filter(function (x) {
    return x.tipo === "morta";
  });
  if (morte.length > 15) {
    rimuoviCreatura(morte[0]);
    colonia.cimitero++;
  }
}

// Il mucchietto del cimitero: un segno grigio per ogni formica portata lì (ne disegno al massimo 30)
function disegnaCimitero() {
  const gruppo = document.getElementById("cimitero-disegno");
  gruppo.textContent = "";
  const quante = Math.min(colonia.cimitero, 30);
  for (let i = 0; i < quante; i++) {
    const segno = document.createElementNS(SVG, "ellipse");
    segno.setAttribute("cx", 158 + (i % 10) * 5 + Math.floor(i / 10) * 2.5);   // 10 per fila, una fila sopra l'altra
    segno.setAttribute("cy", 88 - Math.floor(i / 10) * 2.5);
    segno.setAttribute("rx", 2.6);
    segno.setAttribute("ry", 1.3);
    gruppo.appendChild(segno);
  }
}

// In estate, quando la colonia è grande e matura, nascono formiche con le ali (nuove regine e maschi)
// che volano via per fondare altre colonie. Succede al massimo una volta all'anno.
function forseVoloNuziale() {
  const anno = Math.floor((colonia.giorno - 1) / 40);
  const pronta = colonia.camere === 5 && colonia.formiche.length >= 35 && colonia.cibo >= 40;
  if (stagione() === "estate" && pronta && colonia.ultimoVolo !== anno && Math.random() < 0.3) {
    voloNuziale();
  }
}

function voloNuziale() {
  colonia.ultimoVolo = Math.floor((colonia.giorno - 1) / 40);
  colonia.cibo = Math.max(0, colonia.cibo - 20);      // allevare le alate costa cibo
  const quante = Math.round(casuale(6, 10));
  for (let i = 0; i < quante; i++) {
    const alata = creaCreatura("alata", "buco", null);
    alata.attesa = i * 0.6;                           // escono una dopo l'altra
    alata.vx = casuale(-70, 70);                      // velocità orizzontale (a caso, a destra o a sinistra)
    alata.vy = casuale(-30, -10);                     // velocità verticale (negativa = verso l'alto)
  }
  scriviDiario("volo nuziale: " + quante + " alate!");
}

// Il volo di un'alata: aspetta il suo turno sul buco, poi sale sempre più veloce e sparisce in cielo
function vola(c, dt) {
  c.attesa -= dt;
  if (c.attesa > 0) return;
  c.vy -= 40 * dt;                    // accelera verso l'alto
  c.x += c.vx * dt;
  c.y += c.vy * dt;
  c.angolo = Math.atan2(c.vy, c.vx);
  disegnaCreatura(c);
  if (c.y < -300) rimuoviCreatura(c);
}


// 10j. LA SCHEDA DI UNA FORMICA (si apre col clic)

const REGINA = { tipo: "regina" };    // la regina è disegnata nell'SVG: la "scelgo" con questo oggetto

function scegli(c) {
  if (scelta && scelta.el) scelta.el.classList.remove("scelta");
  scelta = c;
  if (c.el) c.el.classList.add("scelta");      // alone bianco intorno alla creatura scelta
  document.getElementById("scheda").hidden = false;
  aggiornaScheda();
}

function chiudiScheda() {
  if (scelta && scelta.el) scelta.el.classList.remove("scelta");
  scelta = null;
  document.getElementById("scheda").hidden = true;
}

// Scrive nella scheda chi è la creatura scelta e cosa sta facendo (si aggiorna ogni secondo)
function aggiornaScheda() {
  if (!scelta) return;
  let titolo = "";
  let righe = [];

  if (scelta === REGINA) {
    const regina = colonia.regina;
    titolo = "Regina";
    if (regina.stato === "viva") righe.push("Vita: " + "■".repeat(regina.vita) + "□".repeat(5 - regina.vita));
    if (regina.stato === "crescita") righe.push("Sta nascendo: mancano " + regina.giorni + " giorni");
    if (regina.stato === "morta") righe.push("È morta");
    righe.push("Età: " + (colonia.giorno - regina.nata) + " giorni");
    righe.push("Uova deposte: " + colonia.uovaDeposte);
    righe.push("Seconda vita: " + (colonia.secondaVita ? "disponibile" : "usata"));
  } else if (!creature.includes(scelta)) {
    chiudiScheda();                     // la creatura non c'è più
    return;
  } else if (scelta.tipo === "operaia" || scelta.tipo === "soldata") {
    const f = colonia.formiche.find(function (x) {
      return x.id === scelta.id;
    });
    if (!f) return;
    titolo = "Formica #" + f.id + " · " + f.tipo;
    righe.push("Età: " + f.eta + " giorni (vivrà circa " + f.vita + ")");
    righe.push("Lavoro: " + (scelta.lavoro || "si guarda intorno"));
    if (scelta.carico) righe.push("Trasporta: " + scelta.carico);
  } else if (scelta.tipo === "morta") {
    titolo = "Formica morta";
    righe = ["Aspetta una becchina", "che la porti al \\cimitero"];
  } else if (scelta.tipo === "ragno") {
    titolo = "Ragno";
    righe = ["Vita: " + scelta.vita, "Vuole: le uova e la regina"];
  } else if (scelta.tipo === "nemica") {
    titolo = "Formica nemica";
    righe = [scelta.carico ? "Ha rubato un uovo!" : "Vuole rubare le uova"];
  } else if (scelta.tipo === "alata") {
    titolo = "Formica alata";
    righe = ["Parte per il volo nuziale:", "fonderà una nuova colonia"];
  }

  document.getElementById("scheda-titolo").textContent = titolo;
  document.getElementById("scheda-testo").textContent = righe.join("\n");
}


// 10k. MOSTRARE TUTTO SULLO SCHERMO

// Quando si apre il desktop: carico la colonia, recupero i giorni passati e faccio partire tutto
function avviaColonia() {
  caricaColonia();
  recuperaGiorniPassati();
  apriFinestraColonia();
  sincronizzaCreature(true);

  // se quando si è chiuso il desktop c'era un pericolo, ricomincia
  if (colonia.pericoloSospeso) {
    const tipo = colonia.pericoloSospeso;
    colonia.pericoloSospeso = null;
    avviaPericolo(tipo);
  }

  aggiornaCielo();
  aggiornaColonia();
  timerGiorno = setInterval(passaGiorno, durataGiorno);
  timerTurno = setInterval(turno, 1000);
  ultimoFotogramma = performance.now();
  animazione = requestAnimationFrame(fotogramma);
}

// Quando si chiude il desktop: mi segno l'eventuale pericolo, fermo tutto, tolgo le creature e salvo
function fermaColonia() {
  colonia.pericoloSospeso = pericolo ? pericolo.tipo : null;
  clearInterval(timerGiorno);
  clearInterval(timerTurno);
  cancelAnimationFrame(animazione);
  togliTutteLeCreature();
  salvaColonia();
}

// Ogni secondo: cielo, pericoli, poi aggiorno lo schermo e la scheda
function turno() {
  aggiornaCielo();
  if (pericolo && pericolo.tipo === "pioggia") {
    turnoPioggia();
  } else if (pericolo) {
    turnoCombattimento();
  }
  controllaFine();
  aggiornaColonia();
  aggiornaScheda();
}

// Collega i pulsanti della colonia (una volta sola)
function preparaColonia() {
  document.getElementById("colonia-chiudi").addEventListener("click", chiudiFinestraColonia);
  document.getElementById("tab-colonia").addEventListener("click", cambiaFinestraColonia);
  document.getElementById("scheda-chiudi").addEventListener("click", chiudiScheda);

  // Clic sulla regina (o sull'uovo della nuova regina): la sua scheda
  ["regina", "regina-nuova"].forEach(function (id) {
    document.getElementById(id).addEventListener("click", function (evento) {
      evento.stopPropagation();
      scegli(REGINA);
    });
  });

  // Colonia estinta: si ricomincia da capo
  document.getElementById("nuova-colonia").addEventListener("click", function () {
    togliTutteLeCreature();
    nuovaColonia();
    sincronizzaCreature(true);
    aggiornaColonia();
  });
}

// Una creatura per ogni formica della colonia: le morte diventano grigie, le nuove compaiono
// (le appena nate escono dalla camera delle uova; all'apertura del desktop sono sparse nelle camere)
function sincronizzaCreature(primaVolta) {
  creature.filter(function (c) {
    const formica = c.tipo === "operaia" || c.tipo === "soldata";
    return formica && !colonia.formiche.some(function (f) {
      return f.id === c.id;
    });
  }).forEach(function (c) {
    diventaMorta(c);
  });

  colonia.formiche.forEach(function (f) {
    const esiste = creature.some(function (c) {
      return c.id === f.id;
    });
    if (!esiste) {
      const nodo = primaVolta ? aCaso(camereScavate()) : (colonia.camere >= 2 ? "uova" : "regina");
      creaCreatura(f.tipo, nodo, f.id);
    }
  });
}

// Disegna le uova nella loro camera (o vicino alla regina, se la camera delle uova non c'è ancora)
function disegnaUova() {
  const gruppo = document.getElementById("uova-disegno");
  gruppo.textContent = "";
  const baseX = colonia.camere >= 2 ? 270 : 770;
  const baseY = colonia.camere >= 2 ? 452 : 422;
  const quante = Math.min(colonia.uova.length, 24);

  for (let i = 0; i < quante; i++) {
    const uovo = document.createElementNS(SVG, "ellipse");
    uovo.setAttribute("cx", baseX + (i % 8) * 9 + (Math.floor(i / 8) % 2) * 4);    // 8 uova per fila
    uovo.setAttribute("cy", baseY + Math.floor(i / 8) * 8);
    uovo.setAttribute("rx", 3.2);
    uovo.setAttribute("ry", 4.4);
    gruppo.appendChild(uovo);
  }
}

// Aggiorna la finestra colonia.exe, le camere, le uova, la regina e le creature, poi salva
function aggiornaColonia() {
  const regina = colonia.regina;

  // I numeri
  document.getElementById("colonia-giorno").textContent = colonia.giorno;
  document.getElementById("colonia-tempo").textContent = stagione() + " · " + (notte() ? "notte" : "giorno");
  document.getElementById("colonia-operaie").textContent = conta("operaia");
  document.getElementById("colonia-soldate").textContent = conta("soldata");
  document.getElementById("colonia-uova").textContent = colonia.uova.length;
  document.getElementById("colonia-cibo").textContent = colonia.cibo + "/" + ciboMassimo();
  document.getElementById("colonia-cibo-barra").style.width = (colonia.cibo / ciboMassimo() * 100) + "%";
  document.getElementById("colonia-camere").textContent =
    "■".repeat(colonia.camere) + "□".repeat(5 - colonia.camere) + "  " + colonia.camere + "/5";

  // La regina: viva (con la sua vita ■■■■■ e "+1" se ha ancora la seconda vita), in crescita o morta
  let testoRegina = "morta";
  if (regina.stato === "viva") testoRegina = "viva " + "■".repeat(regina.vita) + "□".repeat(5 - regina.vita);
  if (regina.stato === "crescita") testoRegina = "nasce tra " + regina.giorni + " g";
  if (colonia.secondaVita) testoRegina += " +1";
  document.getElementById("colonia-regina").textContent = testoRegina;
  document.getElementById("regina").style.display = regina.stato === "viva" ? "" : "none";
  document.getElementById("regina-nuova").style.display = regina.stato === "crescita" ? "" : "none";

  // Lo stato (l'ultimo che vale vince)
  let stato = "TRANQUILLA";
  if (colonia.cibo < 10) stato = "FAME";
  if (regina.stato !== "viva") stato = "SENZA REGINA";
  if (pericolo) stato = pericolo.tipo === "pioggia" ? "ALLAGAMENTO" : "IN PERICOLO";
  if (estinta()) stato = "ESTINTA";
  const rigaStato = document.getElementById("colonia-stato");
  rigaStato.textContent = "STATO: " + stato;
  rigaStato.classList.toggle("allarme", stato !== "TRANQUILLA");

  // Il diario: una riga <p> per ogni evento
  const diario = document.getElementById("colonia-diario");
  diario.textContent = "";
  colonia.diario.forEach(function (testo) {
    const riga = document.createElement("p");
    riga.textContent = testo;
    diario.appendChild(riga);
  });

  // Estinta: compare "Nuova colonia"
  document.getElementById("nuova-colonia").hidden = !estinta();

  // Camere: si vedono solo i tunnel già scavati (data-camera in index.html)
  document.querySelectorAll("#desktop [data-camera]").forEach(function (pezzo) {
    pezzo.style.display = Number(pezzo.dataset.camera) <= colonia.camere ? "" : "none";
  });

  disegnaUova();
  disegnaCimitero();
  sincronizzaCreature(false);
  salvaColonia();
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


// 10l. I COMANDI DEL CMD PER L'ESAME
//      La colonia è salvata nel browser: su un altro computer ripartirebbe dal giorno 1.
//      Con questi comandi (li legge la sezione 6) si può mostrare tutto subito.
//      Restituisce true se il comando era della colonia, false se no.

function comandoColonia(comando) {
  if (!colonia) caricaColonia();

  if (comando === "colonia") {
    scriviCmd(
      "Colonia: giorno " + colonia.giorno + " (" + stagione() + ")\n" +
      "Regina:  " + colonia.regina.stato + "\n" +
      "Operaie: " + conta("operaia") + "   Soldate: " + conta("soldata") + "   Uova: " + colonia.uova.length + "\n" +
      "Cibo:    " + colonia.cibo + "/" + ciboMassimo() + "   Camere: " + colonia.camere + "/5\n" +
      "Cimitero: " + colonia.cimitero + " formiche",
      "cmd-verde"
    );
    return true;
  }

  if (comando === "colonia veloce" || comando === "colonia normale") {
    durataGiorno = comando === "colonia veloce" ? 5000 : 60000;
    if (desktopAperto) {
      clearInterval(timerGiorno);
      timerGiorno = setInterval(passaGiorno, durataGiorno);   // il timer riparte con la nuova durata
    }
    scriviCmd("Tempo della colonia: 1 giorno = " + (durataGiorno / 1000) + " secondi", "cmd-verde");
    return true;
  }

  if (comando === "colonia demo" || comando === "colonia nuova") {
    if (desktopAperto) togliTutteLeCreature();
    if (comando === "colonia demo") {
      coloniaDemo();
    } else {
      nuovaColonia();
    }
    if (desktopAperto) {
      sincronizzaCreature(true);
      aggiornaColonia();
    } else {
      salvaColonia();
    }
    scriviCmd(comando === "colonia demo" ? "Caricata una colonia di 130 giorni." : "Nuova colonia creata.", "cmd-verde");
    return true;
  }

  if (["ragno", "pioggia", "nemiche", "volo"].includes(comando)) {
    if (!desktopAperto) {
      scriviCmd("Apri prima il desktop di BrainOS (pulsante giallo del terminale).");
    } else if (comando === "volo") {
      voloNuziale();
      aggiornaColonia();
      scriviCmd("Volo nuziale avviato!", "cmd-verde");
    } else if (pericolo) {
      scriviCmd("C'è già un pericolo in corso.");
    } else {
      avviaPericolo(comando);
      aggiornaColonia();
      scriviCmd("Pericolo avviato: " + comando, "cmd-verde");
    }
    return true;
  }

  return false;
}

// Una colonia già grande, per mostrarla subito: giorno 131 (estate), 5 camere, 43 formiche
function coloniaDemo() {
  nuovaColonia();
  colonia.giorno = 131;
  colonia.camere = 5;
  colonia.cibo = 150;
  colonia.cimitero = 24;
  colonia.uova = [0, 1, 2, 3];
  colonia.uovaDeposte = 140;
  colonia.formiche = [];
  for (let i = 0; i < 34; i++) {
    colonia.formiche.push(nuovaFormica("operaia", Math.round(casuale(0, 55))));
  }
  for (let i = 0; i < 9; i++) {
    colonia.formiche.push(nuovaFormica("soldata", Math.round(casuale(0, 55))));
  }
  colonia.diario = [];
  scriviDiario("colonia demo caricata");
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
} else if (document.body.classList.contains("pagina-extra")) {
  avviaExtra();
}
