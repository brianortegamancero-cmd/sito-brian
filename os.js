// =====================================================
// os.js – il sistema operativo BrainOS
//   1. i programmi (APPS) e le loro icone
//   2. avvio, blocco e login
//   3. il desktop: icone, menu start, tasto destro, orologio
//   4. le finestre: aprire, spostare, ridimensionare, chiudere
//   5. il contenuto dei programmi (profilo, CV, stage, extra...)
//   6. spegnimento e riavvio
//   7. partenza
// =====================================================

// Impronta (hash SHA-256) della password di Brian: la password vera non è scritta da nessuna parte nel codice.
// Dall'impronta non si può tornare alla password. Il sito è pubblico e senza server: è scenografia, non vera sicurezza.
const IMPRONTA_PASSWORD = "0b69980d5db2cb9bd8f9f7ee2151eef97fe7a7dbd2748f5ce63d08c3856b4049";
const CHIAVE_AVVIO = "brainos-avvio";        // dice al prossimo caricamento di rifare l'avvio completo (riavvio, arresto, crollo)
const CHIAVE_SFONDO = "brainos-sfondo";


// 1. I PROGRAMMI

// Le icone (disegnate con il tratto, 24 x 24)
function disegno(tratti) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + tratti + '"></path></svg>';
}

const ICONE = {
  profilo: disegno("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c0-4 4-7 8-7s8 3 8 7"),
  cv: disegno("M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6"),
  stage: disegno("M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z M9 8v10"),
  extra: disegno("M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"),
  terminale: disegno("M3 5h18v14H3z M7 10l3 2.5L7 15 M12 15h5"),
  colonia: disegno("M2 19h20 M5 19c2-7 4-10 7-10s5 3 7 10 M11 15h2"),
  impostazioni: disegno("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M19 5l-2 2 M7 17l-2 2"),
  pannello: disegno("M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4"),
  cestino: disegno("M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6"),
  raggix: disegno("M3 3h6 M15 3h6 M3 21h6 M15 21h6 M3 3v6 M21 3v6 M3 15v6 M21 15v6 M8 8l8 8 M16 8l-8 8"),
  info: disegno("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5h.01"),
  cartella: disegno("M3 6h6l2 2h10v11H3z"),
  immagine: disegno("M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15 9h.01"),
  esplora: disegno("M3 6h6l2 2h10v11H3z M3 11h18"),
  contatti: disegno("M4 4h16v16H4z M12 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M7 18c0-2.5 2.2-4 5-4s5 1.500 5 4"),
  attenzione: disegno("M12 3l10 18H2z M12 10v5 M12 18h.01"),
  lucchetto: disegno("M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3")
};

// Ogni programma: id, nome, icona, grandezza della finestra e come costruire il contenuto.
// alias = altri nomi con cui si apre dal Terminale; bloccata = icona con il lucchetto;
// azione = non apre una finestra ma fa qualcosa; nascosta = non compare nel menu start
const APPS = [
  { id: "profilo", titolo: "Chi sono", icona: ICONE.profilo, alias: ["chi", "chisono", "chi sono", "home", "profilo"], w: 940, h: 640, costruisci: costruisciProfilo },
  { id: "cv", titolo: "CV", icona: ICONE.cv, alias: ["curriculum"], w: 860, h: 620, costruisci: costruisciCV },
  { id: "stage", titolo: "Stage", icona: ICONE.stage, alias: ["ticket"], w: 860, h: 600, costruisci: costruisciStage },
  { id: "extra", titolo: "Extra", icona: ICONE.extra, alias: ["lavori"], w: 900, h: 620, costruisci: costruisciExtra },
  {
    id: "terminale", titolo: "C:\\BrainOS\\cmd.exe", nomeBreve: "Terminale", icona: ICONE.terminale, alias: ["cmd", "terminale"], w: 720, h: 460,
    costruisci: costruisciTerminale,
    alFuoco: function () { if (inputCmd) inputCmd.focus(); },
    alChiudere: function () { righeCmd = null; inputCmd = null; }
  },
  { id: "colonia", titolo: "C:\\BrainOS\\colonia.exe", nomeBreve: "Colonia", icona: ICONE.colonia, alias: ["colonia", "formicaio", "formiche"], w: 1180, h: 640, costruisci: costruisciColonia, alChiudere: chiudiColonia },
  { id: "esplora", titolo: "Esplora file", icona: ICONE.esplora, alias: ["file", "esplora", "explorer", "files"], w: 760, h: 520, costruisci: costruisciEsplora },
  { id: "contatti", titolo: "Contatti", icona: ICONE.contatti, alias: ["contact", "link"], w: 560, h: 520, costruisci: costruisciContatti },
  { id: "impostazioni", titolo: "Impostazioni", icona: ICONE.impostazioni, alias: ["settings", "sfondi"], w: 640, h: 560, costruisci: costruisciImpostazioni },
  { id: "info", titolo: "Informazioni", icona: ICONE.info, alias: ["about", "informazioni", "crediti", "scuola", "github"], w: 520, h: 520, costruisci: costruisciInfo },
  { id: "pannello", titolo: "Pannello", icona: ICONE.pannello, alias: [], bloccata: true },
  { id: "cestino", titolo: "Cestino", icona: ICONE.cestino, alias: [], bloccata: true },
  { id: "raggix", titolo: "Raggi X", icona: ICONE.raggix, alias: ["raggi x"], azione: cambiaRaggiX, soloMenu: true },
  { id: "nonaprire", titolo: "Non aprire", icona: ICONE.attenzione, alias: [], azione: crollaSistema, pericolosa: true, nascosta: true }
];

// Trova un programma dal nome che hai scritto
function trovaApp(nome) {
  nome = nome.trim().toLowerCase();
  return APPS.find(function (app) {
    return app.id === nome || app.alias.includes(nome) || app.titolo.toLowerCase() === nome;
  });
}

// Gli sfondi del desktop
const SFONDI = [
  { id: "formicaio", nome: "Formicaio" },
  { id: "griglia", nome: "Griglia" },
  { id: "notte", nome: "Notte" },
  { id: "nero", nome: "Nero" }
];


// 2. AVVIO, BLOCCO E LOGIN

function mostra(id) {
  document.getElementById(id).hidden = false;
}

function nascondi(id) {
  document.getElementById(id).hidden = true;
}

// L'avvio: righe da BIOS e barra di caricamento (qualsiasi tasto la salta)
async function avvio() {
  mostra("avvio");
  const righe = [
    "BrainOS BIOS v2.0",
    "Controllo memoria ............ OK",
    "Controllo disco .............. OK",
    "Caricamento del kernel ....... OK",
    "Connessione a docs.google.com  OK",
    "Avvio dei servizi ............ OK",
    "Avvio dell'interfaccia grafica"
  ];
  const box = document.getElementById("avvio-righe");
  const barra = document.getElementById("avvio-riempimento");
  let saltato = false;

  function salta() {
    saltato = true;
  }
  document.addEventListener("keydown", salta);
  document.addEventListener("pointerdown", salta);

  for (let i = 0; i < righe.length && !saltato; i++) {
    const riga = crea("p", righe[i].endsWith("OK") ? "ok" : "", righe[i]);
    box.appendChild(riga);
    barra.style.width = Math.round(((i + 1) / righe.length) * 100) + "%";
    await aspetta(320);
  }
  barra.style.width = "100%";
  if (!saltato) await aspetta(400);

  document.removeEventListener("keydown", salta);
  document.removeEventListener("pointerdown", salta);
  nascondi("avvio");
  mostraBlocco();
}

// Orologio della schermata di blocco (si aggiorna da solo, con aggiornaOra)
function mostraBlocco() {
  const blocco = document.getElementById("blocco");
  blocco.classList.remove("sale");
  mostra("blocco");
  aggiornaOra();

  function sblocca(evento) {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(evento.key)) return;
    document.removeEventListener("keydown", sblocca);
    blocco.removeEventListener("pointerdown", sblocca);
    blocco.classList.add("sale");
    setTimeout(function () {
      nascondi("blocco");
      mostraLogin();
    }, 450);
  }
  document.addEventListener("keydown", sblocca);
  blocco.addEventListener("pointerdown", sblocca);
}

let tentativi = 0;

// Calcola l'impronta SHA-256 di un testo (64 caratteri esadecimali) con la crittografia del browser
async function impronta(testo) {
  const byte = new TextEncoder().encode(testo);
  const risultato = await crypto.subtle.digest("SHA-256", byte);
  return Array.from(new Uint8Array(risultato))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

function mostraLogin() {
  const campo = document.getElementById("login-password");
  campo.value = "";
  mostra("login");
  campo.focus();
}

function preparaLogin() {
  const modulo = document.getElementById("login-modulo");
  const campo = document.getElementById("login-password");
  const errore = document.getElementById("login-errore");

  modulo.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    // confronto le impronte, non le password
    if (await impronta(campo.value.trim()) === IMPRONTA_PASSWORD) {
      errore.textContent = "";
      tentativi = 0;
      suono("accesso");
      nascondi("login");
      mostra("benvenuto");
      await aspetta(1500);
      nascondi("benvenuto");
      entraNelSistema(true);
    } else {
      tentativi++;
      suono("errore");
      errore.textContent = "La password non è corretta. Riprova.";
      campo.value = "";
      campo.focus();
      modulo.classList.remove("scuote");
      void modulo.offsetWidth;                 // fa ripartire l'animazione
      modulo.classList.add("scuote");

    }
  });

  // l'occhio mostra e nasconde la password
  document.getElementById("login-occhio").addEventListener("click", function () {
    campo.type = campo.type === "password" ? "text" : "password";
    campo.focus();
  });

  document.getElementById("login-spegni").addEventListener("click", arresta);
}


// 3. IL DESKTOP

let sistemaPronto = false;     // icone e menu si costruiscono una volta sola
let primoAccesso = true;

function entraNelSistema(apriBenvenuto) {
  if (!sistemaPronto) {
    costruisciIcone();
    costruisciMenuStart();
    preparaDesktop();
    sistemaPronto = true;
  }
  caricaSfondo();
  mostra("sistema");
  aggiornaOra();
  leggiBatteria();
  leggiConnessione();

  // i fogli li scarico subito: quando apri un'app i dati sono già pronti
  Object.keys(FOGLI).forEach(function (nome) {
    prendiFoglio(nome).catch(function () {});
  });

  impostaSuoni(suoniAttivi);
  document.getElementById("tasto-suoni").onclick = function () {
    impostaSuoni(!suoniAttivi);
  };
  riavviaTimerSalvaschermo();

  if (apriBenvenuto && primoAccesso) {
    primoAccesso = false;
    apriApp("profilo");
    notifica("Benvenuto, Brian", "Tasto destro sul desktop per il menu, oppure apri il Terminale e scrivi help.");
  }
}

// Le icone sul desktop. Con il mouse si apre con il doppio clic; con il dito (o con Invio) basta un tocco
function costruisciIcone() {
  const box = document.getElementById("icone");
  APPS.forEach(function (app) {
    if (app.soloMenu) return;
    const icona = crea("button", "icona" + (app.bloccata ? " bloccata" : "") + (app.pericolosa ? " pericolosa" : ""));
    icona.type = "button";
    icona.dataset.app = app.id;

    const disegnoIcona = crea("span", "icona-disegno");
    disegnoIcona.innerHTML = app.icona + (app.bloccata ? '<svg class="lucchetto" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3"></path></svg>' : "");
    icona.append(disegnoIcona, document.createTextNode(app.nomeBreve || app.titolo));

    icona.addEventListener("click", function (evento) {
      document.querySelectorAll(".icona.scelta-icona").forEach(function (altra) {
        altra.classList.remove("scelta-icona");
      });
      icona.classList.add("scelta-icona");
      const toccoOTastiera = evento.detail === 0 || window.matchMedia("(pointer: coarse)").matches;
      if (toccoOTastiera) apriApp(app.id);
    });
    icona.addEventListener("dblclick", function () {
      apriApp(app.id);
    });
    box.appendChild(icona);
  });
}

function costruisciMenuStart() {
  const box = document.getElementById("menu-start-app");
  APPS.forEach(function (app) {
    if (app.nascosta) return;
    const voce = crea("button");
    voce.type = "button";
    voce.innerHTML = app.icona;
    voce.append(document.createTextNode(app.nomeBreve || app.titolo));
    voce.addEventListener("click", function () {
      chiudiMenuStart();
      apriApp(app.id);
    });
    box.appendChild(voce);
  });

  document.querySelectorAll("[data-potenza]").forEach(function (pulsante) {
    pulsante.addEventListener("click", function () {
      chiudiMenuStart();
      const azione = pulsante.dataset.potenza;
      if (azione === "disconnetti") disconnetti();
      if (azione === "riavvia") riavvia();
      if (azione === "arresta") arresta();
    });
  });
}

function cambiaMenuStart() {
  const menu = document.getElementById("menu-start");
  menu.hidden = !menu.hidden;
  document.getElementById("start").setAttribute("aria-expanded", String(!menu.hidden));
}

function chiudiMenuStart() {
  document.getElementById("menu-start").hidden = true;
  document.getElementById("start").setAttribute("aria-expanded", "false");
}

function chiudiMenuContestuale() {
  document.getElementById("menu-contestuale").hidden = true;
}

function preparaDesktop() {
  document.getElementById("start").addEventListener("click", function (evento) {
    evento.stopPropagation();
    chiudiMenuContestuale();
    cambiaMenuStart();
  });

  // un clic fuori dai menu li chiude; un clic sul desktop vuoto toglie la selezione alle icone
  document.addEventListener("pointerdown", function (evento) {
    if (!evento.target.closest("#menu-start, #start")) chiudiMenuStart();
    if (!evento.target.closest("#menu-contestuale")) chiudiMenuContestuale();
    if (!evento.target.closest(".icona")) {
      document.querySelectorAll(".icona.scelta-icona").forEach(function (icona) {
        icona.classList.remove("scelta-icona");
      });
    }
  });

  // il tasto destro sul desktop apre il menu di BrainOS (sulle finestre e sulla barra resta quello normale)
  document.getElementById("sistema").addEventListener("contextmenu", function (evento) {
    if (evento.target.closest(".finestra, .barra-applicazioni, .menu-start")) return;
    evento.preventDefault();
    mostraMenuContestuale(evento.clientX, evento.clientY);
  });

  // quando la finestra del browser cambia, le finestre del sistema non devono uscire dallo schermo
  window.addEventListener("resize", tieniFinestreDentro);
}

function mostraMenuContestuale(x, y) {
  chiudiMenuStart();
  const menu = document.getElementById("menu-contestuale");
  menu.textContent = "";

  const voci = [
    ["Aggiorna", function () {
      const sistema = document.getElementById("sistema");
      sistema.style.animation = "none";
      void sistema.offsetWidth;
      sistema.style.animation = "";
    }],
    ["Cambia sfondo", function () {
      const attuale = document.getElementById("sfondo").dataset.sfondo;
      const indice = SFONDI.findIndex(function (s) { return s.id === attuale; });
      cambiaSfondo(SFONDI[(indice + 1) % SFONDI.length].id);
    }],
    null,
    ["Apri il Terminale", function () { apriApp("terminale"); }],
    ["Impostazioni", function () { apriApp("impostazioni"); }],
    ["Raggi X", cambiaRaggiX]
  ];

  voci.forEach(function (voce) {
    if (!voce) {
      menu.appendChild(document.createElement("hr"));
      return;
    }
    const pulsante = crea("button", "", voce[0]);
    pulsante.type = "button";
    pulsante.addEventListener("click", function () {
      chiudiMenuContestuale();
      voce[1]();
    });
    menu.appendChild(pulsante);
  });

  menu.hidden = false;
  menu.style.left = Math.min(x, window.innerWidth - menu.offsetWidth - 4) + "px";
  menu.style.top = Math.min(y, window.innerHeight - menu.offsetHeight - 52) + "px";
}

// Sfondo: si ricorda tra una visita e l'altra
function cambiaSfondo(id) {
  if (!SFONDI.some(function (s) { return s.id === id; })) return false;
  document.getElementById("sfondo").dataset.sfondo = id;
  try {
    localStorage.setItem(CHIAVE_SFONDO, id);
  } catch (errore) {}
  document.querySelectorAll(".sfondo-prova").forEach(function (prova) {
    prova.classList.toggle("scelto", prova.dataset.sfondo === id);
  });
  return true;
}

function caricaSfondo() {
  let id = "griglia";    // sfondo di partenza: la griglia
  try {
    id = localStorage.getItem(CHIAVE_SFONDO) || id;
  } catch (errore) {}
  cambiaSfondo(id);
}

// Ora e data: sia nella barra sia nella schermata di blocco
function aggiornaOra() {
  const adesso = new Date();
  const ora = adesso.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("ora").textContent = ora;
  document.getElementById("data").textContent = adesso.toLocaleDateString("it-IT");
  document.getElementById("blocco-ora").textContent = ora;
  document.getElementById("blocco-data").textContent = adesso.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

// Batteria vera (funziona in Chrome ed Edge; negli altri browser resta il disegno pieno)
function leggiBatteria() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then(function (batteria) {
    const livello = Math.round(batteria.level * 100);
    document.getElementById("batteria-testo").textContent = livello + "%";
    document.getElementById("batteria-carica").setAttribute("width", 13 * batteria.level);
  });
}

// Wi-Fi vero: se il dispositivo non è connesso, l'icona diventa grigia
function leggiConnessione() {
  const wifi = document.getElementById("wifi");
  wifi.classList.toggle("offline", !navigator.onLine);
  wifi.setAttribute("aria-label", navigator.onLine ? "Connesso a Internet" : "Nessuna connessione");
}


// 4. LE FINESTRE

const finestreAperte = {};   // id → { id, app, el, corpo, tab, minimizzata }
let ordine = 10;             // chi ha il numero più alto sta davanti
let idAttiva = null;
let cascata = 0;             // ogni finestra nuova parte un po' più in basso a destra

function finestraMobile() {
  return window.matchMedia("(max-width: 700px)").matches;
}

// Apre un programma: se è già aperto lo porta davanti
function apriApp(id) {
  const app = typeof id === "string" ? trovaApp(id) : id;
  if (!app) return;
  if (app.azione) {
    app.azione();
    return;
  }
  if (app.bloccata) {
    mostraDialogo("sicurezza.exe", "> ACCESSO NEGATO", "Serve il permesso dell'amministratore (Brian).");
    return;
  }
  if (finestreAperte[app.id]) {
    ripristina(app.id);
    return;
  }
  creaFinestra(app);
}

function chiudiApp(id) {
  const finestra = finestreAperte[id];
  if (!finestra) return;
  if (finestra.app.alChiudere) finestra.app.alChiudere();
  delete finestreAperte[id];
  suono("chiudi");
  finestra.el.classList.add("chiude");
  finestra.tab.remove();
  setTimeout(function () {
    finestra.el.remove();
  }, 150);

  if (idAttiva === id) {
    idAttiva = null;
    const davanti = Object.values(finestreAperte)
      .filter(function (f) { return !f.minimizzata; })
      .sort(function (a, b) { return Number(b.el.style.zIndex) - Number(a.el.style.zIndex); })[0];
    if (davanti) mettiInPrimoPiano(davanti.id);
  }
  aggiornaBarra();
}

// Un messaggio in una piccola finestra (accesso negato, ecc.)
function mostraDialogo(programma, intestazione, testo) {
  chiudiApp("dialogo");
  creaFinestra({
    id: "dialogo",
    titolo: "C:\\BrainOS\\" + programma,
    nomeBreve: programma,
    icona: ICONE.lucchetto,
    w: 360,
    h: 230,
    costruisci: function (corpo) {
      const dialogo = crea("div", "dialogo");
      const ok = crea("button", "finestra-ok", "[ OK ]");
      ok.type = "button";
      ok.addEventListener("click", function () {
        chiudiApp("dialogo");
      });
      dialogo.append(crea("p", "dialogo-titolo", intestazione), crea("p", "", testo), ok);
      corpo.appendChild(dialogo);
      ok.focus();
    }
  });
}

function creaFinestra(app) {
  const contenitore = document.getElementById("finestre");
  const larghezzaMax = contenitore.clientWidth - 24;
  const altezzaMax = contenitore.clientHeight - 24;
  const w = Math.min(app.w || 700, larghezzaMax);
  const h = Math.min(app.h || 500, altezzaMax);
  cascata = (cascata + 1) % 6;
  const left = Math.max(0, Math.round((contenitore.clientWidth - w) / 2 + (cascata - 2) * 28));
  const top = Math.max(0, Math.round((contenitore.clientHeight - h) / 2 + (cascata - 2) * 24));

  const el = crea("div", "finestra");
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", app.nomeBreve || app.titolo);
  el.style.left = left + "px";
  el.style.top = top + "px";
  el.style.width = w + "px";
  el.style.height = h + "px";

  // barra del titolo: nome a sinistra, tre comandi a destra
  const barra = crea("div", "finestra-titolo");
  const nome = crea("span", "finestra-nome");
  nome.innerHTML = app.icona;
  nome.append(document.createTextNode(app.titolo));

  const comandi = crea("div", "finestra-comandi");
  const minimizza = creaComando("minimizza", "−", "Riduci a icona");
  const massimizza = creaComando("massimizza", "□", "Ingrandisci");
  const chiudi = creaComando("chiudi", "✕", "Chiudi");
  comandi.append(minimizza, massimizza, chiudi);
  barra.append(nome, comandi);

  const corpo = crea("div", "finestra-corpo-app");
  el.append(barra, corpo);

  ["d", "s", "b", "a", "bd", "bs", "ad", "as"].forEach(function (lato) {
    const maniglia = crea("div", "maniglia " + lato);
    maniglia.dataset.lato = lato;
    el.appendChild(maniglia);
  });

  contenitore.appendChild(el);
  suono("apri");

  // il bottone nella barra delle applicazioni
  const tab = crea("button", "tab-app aperta");
  tab.type = "button";
  tab.innerHTML = app.icona;
  tab.append(crea("span", "", app.nomeBreve || app.titolo));
  document.getElementById("barra-app").appendChild(tab);

  const finestra = { id: app.id, app: app, el: el, corpo: corpo, tab: tab, minimizzata: false };
  finestreAperte[app.id] = finestra;

  tab.addEventListener("click", function () {
    if (finestra.minimizzata || idAttiva !== app.id) {
      ripristina(app.id);
    } else {
      minimizzaFinestra(app.id);
    }
  });
  minimizza.addEventListener("click", function () { minimizzaFinestra(app.id); });
  massimizza.addEventListener("click", function () { cambiaMassimizza(app.id); });
  chiudi.addEventListener("click", function () { chiudiApp(app.id); });
  el.addEventListener("pointerdown", function () { mettiInPrimoPiano(app.id); }, true);

  rendiTrascinabile(finestra, barra);
  rendiRidimensionabile(finestra);

  app.costruisci(corpo, finestra);
  mettiInPrimoPiano(app.id);
}

function creaComando(classe, simbolo, etichetta) {
  const pulsante = crea("button", classe, simbolo);
  pulsante.type = "button";
  pulsante.setAttribute("aria-label", etichetta);
  pulsante.title = etichetta;
  return pulsante;
}

function mettiInPrimoPiano(id) {
  const finestra = finestreAperte[id];
  if (!finestra) return;
  ordine++;
  finestra.el.style.zIndex = ordine;
  const eraGiaAttiva = idAttiva === id;
  idAttiva = id;
  Object.values(finestreAperte).forEach(function (altra) {
    altra.el.classList.toggle("attiva", altra.id === id);
  });
  aggiornaBarra();
  if (!eraGiaAttiva && finestra.app.alFuoco) finestra.app.alFuoco();
}

function ripristina(id) {
  const finestra = finestreAperte[id];
  if (!finestra) return;
  finestra.minimizzata = false;
  finestra.el.classList.remove("minimizzata");
  mettiInPrimoPiano(id);
}

function minimizzaFinestra(id) {
  const finestra = finestreAperte[id];
  if (!finestra) return;
  finestra.minimizzata = true;
  finestra.el.classList.add("minimizzata");
  finestra.el.classList.remove("attiva");
  if (idAttiva === id) {
    idAttiva = null;
    const davanti = Object.values(finestreAperte)
      .filter(function (f) { return !f.minimizzata; })
      .sort(function (a, b) { return Number(b.el.style.zIndex) - Number(a.el.style.zIndex); })[0];
    if (davanti) mettiInPrimoPiano(davanti.id);
  }
  aggiornaBarra();
}

function cambiaMassimizza(id) {
  const finestra = finestreAperte[id];
  if (!finestra) return;
  const el = finestra.el;
  const massimizzata = el.classList.toggle("massimizzata");
  el.querySelector(".massimizza").textContent = massimizzata ? "❐" : "□";
  el.querySelector(".massimizza").title = massimizzata ? "Ripristina" : "Ingrandisci";
}

// Nella barra delle applicazioni: acceso = in primo piano, spento ma sottolineato = aperto
function aggiornaBarra() {
  Object.values(finestreAperte).forEach(function (finestra) {
    finestra.tab.classList.toggle("in-primo-piano", finestra.id === idAttiva && !finestra.minimizzata);
  });
}

function tieniFinestreDentro() {
  const contenitore = document.getElementById("finestre");
  Object.values(finestreAperte).forEach(function (finestra) {
    const el = finestra.el;
    if (el.classList.contains("massimizzata")) return;
    const w = Math.min(el.offsetWidth, contenitore.clientWidth);
    const h = Math.min(el.offsetHeight, contenitore.clientHeight);
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.style.left = Math.max(0, Math.min(el.offsetLeft, contenitore.clientWidth - w)) + "px";
    el.style.top = Math.max(0, Math.min(el.offsetTop, contenitore.clientHeight - h)) + "px";
  });
}

// Si sposta trascinando la barra del titolo (doppio clic = ingrandisci)
function rendiTrascinabile(finestra, barra) {
  const el = finestra.el;

  barra.addEventListener("dblclick", function (evento) {
    if (evento.target.closest("button") || finestraMobile()) return;
    cambiaMassimizza(finestra.id);
  });

  barra.addEventListener("pointerdown", function (evento) {
    if (evento.target.closest("button") || finestraMobile() || evento.button !== 0) return;
    const contenitore = document.getElementById("finestre");

    // se è ingrandita, la trascino fuori: torna piccola e segue il mouse
    if (el.classList.contains("massimizzata")) {
      cambiaMassimizza(finestra.id);
      el.style.left = Math.max(0, evento.clientX - el.offsetWidth / 2) + "px";
      el.style.top = "0px";
    }

    const partenzaX = evento.clientX;
    const partenzaY = evento.clientY;
    const partenzaLeft = el.offsetLeft;
    const partenzaTop = el.offsetTop;
    barra.setPointerCapture(evento.pointerId);
    document.body.classList.add("trascina");

    function muovi(e) {
      const w = el.offsetWidth;
      el.style.left = Math.max(80 - w, Math.min(contenitore.clientWidth - 80, partenzaLeft + e.clientX - partenzaX)) + "px";
      el.style.top = Math.max(0, Math.min(contenitore.clientHeight - 36, partenzaTop + e.clientY - partenzaY)) + "px";
    }
    function fine(e) {
      barra.releasePointerCapture(e.pointerId);
      barra.removeEventListener("pointermove", muovi);
      barra.removeEventListener("pointerup", fine);
      barra.removeEventListener("pointercancel", fine);
      document.body.classList.remove("trascina");
    }
    barra.addEventListener("pointermove", muovi);
    barra.addEventListener("pointerup", fine);
    barra.addEventListener("pointercancel", fine);
  });
}

// Si ridimensiona trascinando i bordi e gli angoli
function rendiRidimensionabile(finestra) {
  const el = finestra.el;

  el.querySelectorAll(".maniglia").forEach(function (maniglia) {
    maniglia.addEventListener("pointerdown", function (evento) {
      if (finestraMobile() || evento.button !== 0) return;
      evento.preventDefault();
      const lato = maniglia.dataset.lato;
      const contenitore = document.getElementById("finestre");
      const minL = 320;
      const minA = 180;
      const x0 = evento.clientX;
      const y0 = evento.clientY;
      const l0 = el.offsetLeft;
      const t0 = el.offsetTop;
      const w0 = el.offsetWidth;
      const h0 = el.offsetHeight;
      maniglia.setPointerCapture(evento.pointerId);
      document.body.classList.add("trascina");

      function muovi(e) {
        const dx = e.clientX - x0;
        const dy = e.clientY - y0;
        let w = w0, h = h0, l = l0, t = t0;
        if (lato.includes("d")) w = Math.max(minL, w0 + dx);
        if (lato.includes("b")) h = Math.max(minA, h0 + dy);
        if (lato.includes("s")) { w = Math.max(minL, w0 - dx); l = l0 + (w0 - w); }
        if (lato.includes("a")) { h = Math.max(minA, h0 - dy); t = Math.max(0, t0 + (h0 - h)); h = h0 - (t - t0); }
        el.style.width = w + "px";
        el.style.height = h + "px";
        el.style.left = l + "px";
        el.style.top = Math.min(t, contenitore.clientHeight - 36) + "px";
      }
      function fine(e) {
        maniglia.releasePointerCapture(e.pointerId);
        maniglia.removeEventListener("pointermove", muovi);
        maniglia.removeEventListener("pointerup", fine);
        maniglia.removeEventListener("pointercancel", fine);
        document.body.classList.remove("trascina");
      }
      maniglia.addEventListener("pointermove", muovi);
      maniglia.addEventListener("pointerup", fine);
      maniglia.addEventListener("pointercancel", fine);
    });
  });
}


// 5. IL CONTENUTO DEI PROGRAMMI

// Il messaggio d'errore (rosso, come un errore nel terminale)
function erroreDati() {
  return crea("p", "errore", "Errore: dati non trovati. Riprova più tardi.");
}

// Carica un foglio e, quando arriva, chiama "disegna" per riempire il contenuto.
// Intanto si vede "Caricamento dati in corso"; se qualcosa va storto, il messaggio d'errore.
async function caricaNellApp(contenuto, nomeFoglio, disegna) {
  const caricamento = crea("p", "caricamento", "Caricamento dati in corso");
  contenuto.appendChild(caricamento);
  try {
    const righe = await prendiFoglio(nomeFoglio);
    caricamento.remove();
    if (!contenuto.isConnected) return;     // nel frattempo hai chiuso la finestra
    disegna(righe);
  } catch (errore) {
    console.error(errore);
    caricamento.remove();
    contenuto.appendChild(erroreDati());
  }
}

// --- CHI SONO (la vecchia Home) ---

let profiloAnimato = false;   // l'animazione del terminale si vede solo la prima volta

async function costruisciProfilo(corpo) {
  const contenuto = crea("div", "contenuto-app");
  corpo.appendChild(contenuto);

  const terminale = crea("section", "profilo-terminale");
  const caricamento = crea("p", "caricamento", "Connessione al server in corso");
  const righeAvvio = crea("div", "profilo-righe");
  const nome = crea("h1", "profilo-nome");
  const ruolo = crea("p", "profilo-ruolo");
  terminale.append(caricamento, righeAvvio, nome, ruolo);
  contenuto.appendChild(terminale);

  try {
    const righe = await prendiFoglio("home");
    caricamento.remove();
    const avvioRighe = prendiSezione(righe, "avvio");
    const presentazione = prendiSezione(righe, "presentazione")[0];
    if (!presentazione) throw new Error("Presentazione non trovata");

    // animazione del terminale: prima le righe, poi il nome, poi il ruolo (solo la prima volta)
    if (!profiloAnimato) {
      for (const riga of avvioRighe) {
        if (!contenuto.isConnected) return;
        righeAvvio.appendChild(crea("p", "", "> " + riga.testo));
        await aspetta(450);
      }
      for (const lettera of presentazione.titolo) {
        if (!contenuto.isConnected) return;
        nome.textContent += lettera;
        await aspetta(90);
      }
      ruolo.textContent = presentazione.sottotitolo;
      await aspetta(300);
    } else {
      avvioRighe.forEach(function (riga) {
        righeAvvio.appendChild(crea("p", "", "> " + riga.testo));
      });
      nome.textContent = presentazione.titolo;
      ruolo.textContent = presentazione.sottotitolo;
    }
    if (!contenuto.isConnected) return;
    profiloAnimato = true;

    // presentazione, passioni e competenze
    const resto = crea("div", "profilo-resto");
    const sezionePresentazione = crea("section", "presentazione");
    const foto = document.createElement("img");
    foto.id = "foto";
    foto.alt = "Foto di Brian Ortega";
    foto.src = "img/" + presentazione.immagine;
    sezionePresentazione.append(foto, crea("p", "", presentazione.testo));

    const passioni = crea("div", "griglia");
    creaPassioni(passioni, prendiSezione(righe, "passione"));
    const competenze = crea("div");
    creaCompetenze(competenze, prendiSezione(righe, "competenza"));

    resto.append(sezionePresentazione, crea("h2", "", "Le mie passioni"), passioni, crea("h2", "", "Competenze"), competenze);
    contenuto.appendChild(resto);
  } catch (errore) {
    console.error(errore);
    caricamento.remove();
    contenuto.appendChild(erroreDati());
  }
}

// Crea una card per ogni passione
function creaPassioni(box, lista) {
  lista.forEach(function (passione) {
    const card = crea("article", "card");
    const img = document.createElement("img");
    img.src = "img/" + passione.immagine;
    img.alt = passione.titolo;
    provaEstensioni(img);    // il foglio chiede un .jpg: se non c'è provo gli altri formati, e se manca tutto tolgo l'immagine
    card.append(img, crea("h3", "", passione.titolo), crea("p", "", passione.testo));
    box.appendChild(card);
  });
}

// Crea una batteria per ogni competenza (livello = carica da 0 a 100)
function creaCompetenze(box, lista) {
  lista.forEach(function (competenza) {
    const livello = Number(competenza.livello) || 0;
    const riga = crea("div", "competenza");
    const batteria = crea("div", "batteria");
    const carica = crea("div", "carica");
    carica.style.width = livello + "%";
    batteria.appendChild(carica);
    riga.append(crea("span", "nome-competenza", competenza.titolo), batteria, crea("span", "percentuale", livello + "%"));
    box.appendChild(riga);
  });
}

// --- CV ---

function costruisciCV(corpo) {
  const contenuto = crea("div", "contenuto-app");
  corpo.appendChild(contenuto);
  contenuto.appendChild(crea("h1", "titolo-pagina", "Curriculum"));

  caricaNellApp(contenuto, "cv", function (righe) {
    const lavoro = crea("div", "timeline");
    const istruzione = crea("div", "timeline");
    const trasversali = crea("div", "etichette");
    const lingue = crea("div", "lingue");
    creaTimeline(lavoro, prendiSezione(righe, "lavoro"));
    creaTimeline(istruzione, prendiSezione(righe, "istruzione"));
    creaEtichette(trasversali, prendiSezione(righe, "competenza"));
    creaLingue(lingue, prendiSezione(righe, "lingua"));

    contenuto.append(
      crea("h2", "", "Esperienze e tirocini"), lavoro,
      crea("h2", "", "Istruzione e formazione"), istruzione,
      crea("h2", "", "Competenze trasversali"), trasversali,
      crea("h2", "", "Lingue"), lingue
    );
  });
}

// Una tappa per ogni riga del foglio (la uso per il lavoro e per l'istruzione)
function creaTimeline(box, lista) {
  lista.forEach(function (voce) {
    const tappa = crea("article", "tappa");
    if (voce.periodo.toLowerCase() === "in corso") tappa.classList.add("in-corso");   // pallino verde che pulsa

    tappa.append(crea("p", "periodo", voce.periodo), crea("h3", "", voce.titolo), crea("p", "luogo", voce.luogo));
    if (voce.testo) tappa.appendChild(crea("p", "descrizione", voce.testo));
    box.appendChild(tappa);
  });
}

function creaEtichette(box, lista) {
  lista.forEach(function (voce) {
    box.appendChild(crea("span", "etichetta", voce.titolo));
  });
}

function creaLingue(box, lista) {
  lista.forEach(function (voce) {
    const riga = crea("div", "lingua");
    riga.append(crea("span", "nome-lingua", voce.titolo), crea("span", "livello", voce.testo));
    box.appendChild(riga);
  });
}

// --- STAGE (i ticket di assistenza) ---

function costruisciStage(corpo) {
  const contenuto = crea("div", "contenuto-app");
  corpo.appendChild(contenuto);
  contenuto.appendChild(crea("h1", "titolo-pagina", "Stage"));
  const riepilogo = crea("p", "riepilogo");
  contenuto.appendChild(riepilogo);

  caricaNellApp(contenuto, "stage", function (righe) {
    const stage = prendiSezione(righe, "stage");
    // In ordine di ticket (#001, #002, #003...), qualunque sia l'ordine delle righe nel foglio
    stage.sort(function (a, b) {
      return a.ticket.localeCompare(b.ticket, "it", { numeric: true });
    });
    riepilogo.textContent = "Ticket trovati: " + stage.length;
    const griglia = crea("div", "griglia-ticket");
    creaTicket(griglia, stage);
    contenuto.append(crea("h2", "", "Storico interventi"), griglia);
  });
}

function aggiungiRiga(dettagli, etichetta, valore) {
  dettagli.append(crea("dt", "", etichetta), crea("dd", "", valore));
}

function creaTicket(box, lista) {
  lista.forEach(function (stage) {
    const ticket = crea("article", "ticket");

    const testa = crea("div", "ticket-testa");
    testa.append(crea("span", "numero-ticket", "Ticket " + stage.ticket), crea("span", "stato", stage.stato));

    const corpoTicket = crea("div", "ticket-corpo");
    const dettagli = document.createElement("dl");
    aggiungiRiga(dettagli, "Azienda", stage.azienda);
    aggiungiRiga(dettagli, "Periodo", stage.periodo);
    aggiungiRiga(dettagli, "Intervento", stage.testo);
    corpoTicket.append(crea("h3", "", stage.ruolo), dettagli);

    ticket.append(testa, corpoTicket);
    box.appendChild(ticket);
  });
}

// --- EXTRA (i miei lavori) ---

function costruisciExtra(corpo) {
  const contenuto = crea("div", "contenuto-app");
  corpo.appendChild(contenuto);
  const titolo = crea("h1", "titolo-pagina", "Extra");
  contenuto.appendChild(titolo);

  caricaNellApp(contenuto, "extra", function (righe) {
    // dalla riga "pagina": il titolo grande e l'introduzione
    const pagina = prendiSezione(righe, "pagina")[0];
    if (pagina) {
      titolo.textContent = pagina.titolo;
      contenuto.appendChild(crea("p", "intro-extra", pagina.descrizione));
    }
    const schede = crea("div", "griglia");
    creaSchede(schede, prendiSezione(righe, "scheda"));
    contenuto.appendChild(schede);
  });
}

// Una card per ogni lavoro: immagine, categoria, titolo, descrizione e (se c'è) il pulsante "Apri".
// Se una cella del foglio è vuota, quella parte non la mostro
function creaSchede(box, lista) {
  lista.forEach(function (lavoro) {
    const card = crea("article", "card card-extra");

    if (lavoro.immagine) {
      const img = document.createElement("img");
      img.src = "img/" + lavoro.immagine;
      img.alt = lavoro.titolo;
      provaEstensioni(img);    // se il file non c'è tolgo l'immagine: niente icona rotta
      card.appendChild(img);
    }

    const corpoCard = crea("div", "card-corpo");
    if (lavoro.categoria) corpoCard.appendChild(crea("span", "categoria", lavoro.categoria));
    corpoCard.appendChild(crea("h3", "", lavoro.titolo));
    if (lavoro.descrizione) corpoCard.appendChild(crea("p", "", lavoro.descrizione));

    // Il pulsante c'è solo se il link è un indirizzo web vero (comincia con https:// o http://)
    const link = lavoro.link || "";
    if (link.startsWith("https://") || link.startsWith("http://")) {
      const pulsante = crea("a", "pulsante-apri", "Apri");
      pulsante.href = link;
      pulsante.target = "_blank";
      pulsante.rel = "noopener noreferrer";   // sicurezza: la nuova scheda non può controllare il mio sito
      corpoCard.appendChild(pulsante);
    }

    card.appendChild(corpoCard);
    box.appendChild(card);
  });
}

// --- INFORMAZIONI (il vecchio footer: chi sono, GitHub, la scuola) ---

function costruisciInfo(corpo) {
  const box = crea("div", "info-app");

  const chi = crea("div", "info-chi");
  const formica = document.createElement("img");
  formica.src = "img/icona.svg";
  formica.alt = "";
  const nome = crea("div");
  nome.append(crea("p", "info-nome", "Brian Ortega"), crea("p", "info-sotto", "Operatore informatico · Milano"));
  chi.append(formica, nome);

  const github = crea("a", "info-github");
  github.href = "https://github.com/brianortegamancero-cmd";
  github.target = "_blank";
  github.rel = "noopener noreferrer";
  const iconaGithub = document.createElement("img");
  iconaGithub.src = "img/github.svg";
  iconaGithub.alt = "";
  iconaGithub.width = 20;
  iconaGithub.height = 20;
  github.append(iconaGithub, crea("span", "", "github.com/brianortegamancero-cmd"));

  const scuola = crea("div", "info-scuola");
  const logoScuola = document.createElement("img");
  logoScuola.src = "img/logo-scuola.webp";
  logoScuola.alt = "CFP Immaginazione e Lavoro";
  logoScuola.className = "logo-scuola";
  scuola.append(crea("p", "", "Progetto d'esame realizzato al"), logoScuola);

  box.append(chi, github, scuola, crea("p", "info-fondo", "© 2026 Brian Ortega · Realizzato in HTML, CSS e JavaScript · BrainOS v2.0"));
  corpo.appendChild(box);
}

// --- IMPOSTAZIONI ---

function costruisciImpostazioni(corpo) {
  const box = crea("div", "impostazioni");
  box.appendChild(crea("h3", "", "Sfondo del desktop"));

  const scelta = crea("div", "sfondi-scelta");
  const attuale = document.getElementById("sfondo").dataset.sfondo;
  SFONDI.forEach(function (sfondo) {
    const prova = crea("button", "sfondo-prova sfondo");
    prova.type = "button";
    prova.dataset.sfondo = sfondo.id;
    prova.classList.toggle("scelto", sfondo.id === attuale);
    prova.appendChild(crea("span", "", sfondo.nome));
    prova.addEventListener("click", function () {
      cambiaSfondo(sfondo.id);
    });
    scelta.appendChild(prova);
  });
  box.appendChild(scelta);

  box.appendChild(crea("h3", "", "Suoni"));
  const interruttore = crea("button", "finestra-ok interruttore-suoni");
  interruttore.type = "button";
  interruttore.addEventListener("click", function () {
    impostaSuoni(!suoniAttivi);
  });
  interruttore.textContent = suoniAttivi ? "ATTIVI" : "DISATTIVATI";
  box.appendChild(interruttore);

  box.appendChild(crea("h3", "", "Salvaschermo"));
  const anteprimaSalvaschermo = crea("button", "finestra-ok", "AVVIA ORA");
  anteprimaSalvaschermo.type = "button";
  anteprimaSalvaschermo.addEventListener("click", function () {
    setTimeout(avviaSalvaschermo, 300);
  });
  box.append(anteprimaSalvaschermo, crea("p", "nota-impostazioni", "Parte da solo dopo 2 minuti senza toccare niente."));

  box.appendChild(crea("h3", "", "Informazioni sul sistema"));
  const info = crea("dl", "info-sistema");
  [
    ["Sistema", "BrainOS v2.0"],
    ["Utente", "Brian Ortega (amministratore)"],
    ["Schermo", screen.width + " x " + screen.height + " pixel"],
    ["Finestra", window.innerWidth + " x " + window.innerHeight + " pixel"],
    ["Processori", String(navigator.hardwareConcurrency || "non disponibile")],
    ["Lingua", navigator.language],
    ["Connessione", navigator.onLine ? "online" : "offline"],
    ["Realizzato in", "HTML, CSS e JavaScript"]
  ].forEach(function (riga) {
    info.append(crea("dt", "", riga[0]), crea("dd", "", riga[1]));
  });
  box.appendChild(info);
  corpo.appendChild(box);
}

// --- COLONIA (il motore è in colonia.js) ---

let osservatoreColonia = null;

function costruisciColonia(corpo) {
  corpo.appendChild(document.getElementById("modello-colonia").content.cloneNode(true));
  corpo.style.overflow = "hidden";

  // il formicaio è un disegno di 960 x 552: lo ingrandisco o rimpicciolisco per farlo stare nella finestra
  const vista = document.getElementById("colonia-vista");
  const mondo = vista.querySelector(".mondo");
  osservatoreColonia = new ResizeObserver(function () {
    const w = vista.clientWidth;
    const h = vista.clientHeight;
    if (w === 0 || h === 0) return;
    const scala = Math.min(w / 960, h / 552);
    mondo.style.transform = "translate(" + (w - 960 * scala) / 2 + "px, " + (h - 552 * scala) / 2 + "px) scale(" + scala + ")";
  });
  osservatoreColonia.observe(vista);

  coloniaInApertura = true;
  avviaColonia();
  setTimeout(function () {
    coloniaInApertura = false;
  }, 2000);
}

function chiudiColonia() {
  fermaColonia();
  if (osservatoreColonia) osservatoreColonia.disconnect();
  osservatoreColonia = null;
}


// 6. SPEGNIMENTO E RIAVVIO

// Ricarica la pagina: il login non si ricorda mai, quindi dopo si riparte dall'avvio (e poi la password)
function riavviaPagina() {
  try {
    sessionStorage.setItem(CHIAVE_AVVIO, "completo");
  } catch (errore) {}
  location.reload();
}

function chiudiTutto() {
  Object.keys(finestreAperte).forEach(chiudiApp);
  if (raggiAttivi) disattivaRaggiX();
  chiudiMenuStart();
  chiudiMenuContestuale();
}

// Disconnetti: torna alla schermata di login senza riavviare
function disconnetti() {
  chiudiTutto();
  nascondi("sistema");
  primoAccesso = true;
  mostraLogin();
}

async function riavvia() {
  chiudiTutto();
  const testo = document.getElementById("spento-testo");
  testo.textContent = "Riavvio in corso";
  testo.className = "cursore";
  mostra("spento");
  await aspetta(1500);
  riavviaPagina();
}

async function arresta() {
  chiudiTutto();
  const testo = document.getElementById("spento-testo");
  testo.textContent = "Arresto in corso";
  testo.className = "cursore";
  mostra("spento");
  await aspetta(1500);

  testo.className = "";
  testo.textContent = "È ora possibile spegnere il computer.\n\n[ clicca o premi un tasto per riaccendere ]";
  document.addEventListener("keydown", riavviaPagina, { once: true });
  document.getElementById("spento").addEventListener("pointerdown", riavviaPagina, { once: true });
}


// 7. PARTENZA

document.addEventListener("keydown", function (evento) {
  // scorciatoie: Ctrl + Alt + R apre il Terminale, Ctrl + Alt + M la pioggia Matrix
  if (!document.getElementById("sistema").hidden) {
    if (evento.ctrlKey && evento.altKey && evento.code === "KeyR") {
      evento.preventDefault();
      apriApp("terminale");
    }
    if (evento.ctrlKey && evento.altKey && evento.code === "KeyM") {
      evento.preventDefault();
      pioggiaMatrix();
    }
  }
  if (evento.key === "Escape") {
    if (raggiAttivi) {
      disattivaRaggiX();
    } else {
      chiudiMenuStart();
      chiudiMenuContestuale();
    }
  }
});

// Il footer: lo copio dal modello in tutti i posti dove serve
document.querySelectorAll("[data-piede]").forEach(function (piede) {
  piede.appendChild(document.getElementById("modello-piede").content.cloneNode(true));
});

window.addEventListener("online", leggiConnessione);
window.addEventListener("offline", leggiConnessione);
setInterval(aggiornaOra, 1000);
preparaLogin();

// Il login non si ricorda mai: ad ogni caricamento serve la password.
// Dopo un riavvio, un arresto o un crollo (e alla prima visita) parte l'avvio completo con il blocco;
// se invece ricarichi la pagina (F5) si va dritti alla richiesta della password.
let soloLogin = false;
try {
  const navigazione = performance.getEntriesByType("navigation")[0];
  soloLogin = !!navigazione && navigazione.type === "reload" && sessionStorage.getItem(CHIAVE_AVVIO) !== "completo";
  sessionStorage.removeItem(CHIAVE_AVVIO);
} catch (errore) {}

if (soloLogin) {
  mostraLogin();
} else {
  avvio();
}
