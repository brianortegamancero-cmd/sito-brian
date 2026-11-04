// =====================================================
// funzioni.js – le funzioni in più del sistema
//   1. suoni
//   2. notifiche
//   3. Contatti
//   4. Esplora file e Anteprima
//   5. salvaschermo
// =====================================================


// 1. SUONI
//    Sono suoni sintetizzati dal browser (nessun file audio). Si accendono e spengono dall'altoparlante
//    nella barra o da Impostazioni, e la scelta resta salvata.

const CHIAVE_SUONI = "brainos-suoni";
let suoniAttivi = true;
let contestoAudio = null;   // il browser lo permette solo dopo un primo clic o tasto

try {
  suoniAttivi = localStorage.getItem(CHIAVE_SUONI) !== "no";
} catch (errore) {}

// Ogni suono è una lista di note: [frequenza in Hz, durata in secondi]
const SUONI = {
  click: { onda: "sine", note: [[880, 0.04]] },
  apri: { onda: "sine", note: [[440, 0.06], [660, 0.09]] },
  chiudi: { onda: "sine", note: [[660, 0.05], [440, 0.08]] },
  accesso: { onda: "sine", note: [[523, 0.1], [659, 0.1], [784, 0.2]] },
  errore: { onda: "square", note: [[200, 0.14], [150, 0.22]] },
  notifica: { onda: "sine", note: [[988, 0.08], [1319, 0.16]] }
};

function preparaAudio() {
  if (contestoAudio) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  contestoAudio = new Audio();
}

function suono(nome) {
  if (!suoniAttivi || !SUONI[nome]) return;
  try {
    preparaAudio();
    if (!contestoAudio) return;
    if (contestoAudio.state === "suspended") contestoAudio.resume();

    let inizio = contestoAudio.currentTime;
    SUONI[nome].note.forEach(function (nota) {
      const oscillatore = contestoAudio.createOscillator();
      const volume = contestoAudio.createGain();
      oscillatore.type = SUONI[nome].onda;
      oscillatore.frequency.value = nota[0];
      volume.gain.setValueAtTime(0.0001, inizio);
      volume.gain.exponentialRampToValueAtTime(0.06, inizio + 0.01);          // sale piano...
      volume.gain.exponentialRampToValueAtTime(0.0001, inizio + nota[1]);     // ...e si spegne piano: niente "click"
      oscillatore.connect(volume);
      volume.connect(contestoAudio.destination);
      oscillatore.start(inizio);
      oscillatore.stop(inizio + nota[1] + 0.02);
      inizio += nota[1];
    });
  } catch (errore) {}
}

function impostaSuoni(attivi) {
  suoniAttivi = attivi;
  try {
    localStorage.setItem(CHIAVE_SUONI, attivi ? "si" : "no");
  } catch (errore) {}
  const tasto = document.getElementById("tasto-suoni");
  if (tasto) {
    tasto.classList.toggle("muto", !attivi);
    tasto.setAttribute("aria-label", attivi ? "Disattiva i suoni" : "Attiva i suoni");
    tasto.title = attivi ? "Suoni attivi" : "Suoni disattivati";
  }
  document.querySelectorAll(".interruttore-suoni").forEach(function (interruttore) {
    interruttore.setAttribute("aria-pressed", String(attivi));
    interruttore.textContent = attivi ? "ATTIVI" : "DISATTIVATI";
  });
  if (attivi) suono("click");
}


// 2. NOTIFICHE
//    Piccoli messaggi in basso a destra, sopra la barra. Un clic apre il programma collegato.

function notifica(titolo, testo, appDaAprire) {
  const box = document.getElementById("notifiche");
  if (!box) return;

  const scheda = crea("div", "notifica");
  scheda.setAttribute("role", "status");
  const chiudi = crea("button", "notifica-chiudi", "✕");
  chiudi.type = "button";
  chiudi.setAttribute("aria-label", "Chiudi la notifica");
  scheda.append(chiudi, crea("p", "notifica-titolo", titolo), crea("p", "notifica-testo", testo));

  function togli() {
    scheda.classList.add("esce");
    setTimeout(function () {
      scheda.remove();
    }, 250);
  }
  chiudi.addEventListener("click", function (evento) {
    evento.stopPropagation();
    togli();
  });
  if (appDaAprire) {
    scheda.classList.add("cliccabile");
    scheda.addEventListener("click", function () {
      apriApp(appDaAprire);
      togli();
    });
  }

  // al massimo 4 insieme: la più vecchia sparisce
  while (box.children.length >= 4) box.firstChild.remove();
  box.appendChild(scheda);
  suono("notifica");
  setTimeout(togli, 6500);
}

// Gli eventi importanti della colonia arrivano come notifica quando non stai guardando la finestra
// (la chiama scriviDiario in colonia.js)
let coloniaInApertura = false;   // per 2 secondi dopo l'apertura della finestra niente notifiche (os.js)
const PAROLE_NOTIFICA = ["ragno", "nemiche", "piove", "regina morta", "estinta", "volo nuziale", "fame"];

function notificaColonia(testo) {
  if (document.getElementById("sistema").hidden || coloniaInApertura) return;
  const finestra = finestreAperte.colonia;
  const inPrimoPiano = finestra && idAttiva === "colonia" && !finestra.minimizzata;
  if (inPrimoPiano) return;
  if (!PAROLE_NOTIFICA.some(function (parola) { return testo.includes(parola); })) return;
  notifica("Colonia", testo, "colonia");
}


// 3. CONTATTI
//    Per aggiungere un contatto (email, WhatsApp...) basta una riga in più qui sotto.

const CONTATTI = [
  { nome: "GitHub", dettaglio: "github.com/brianortegamancero-cmd", link: "https://github.com/brianortegamancero-cmd" },
  { nome: "Bryant Developer", dettaglio: "Siti web per attività di Milano", link: "https://bryant-phonix.pages.dev/" },
  { nome: "Phonix", dettaglio: "Riparazioni di telefoni, tablet e PC", link: "https://bryant-phonix.pages.dev/phonix/" }
];

function costruisciContatti(corpo) {
  const box = crea("div", "contatti");
  box.appendChild(crea("h2", "", "Contatti"));

  CONTATTI.forEach(function (contatto) {
    const scheda = crea("article", "contatto");
    const testi = crea("div", "contatto-testi");
    testi.append(crea("h3", "", contatto.nome), crea("p", "", contatto.dettaglio));

    const azioni = crea("div", "contatto-azioni");
    const apri = crea("a", "pulsante-apri", "Apri");
    apri.href = contatto.link;
    apri.target = "_blank";
    apri.rel = "noopener noreferrer";

    const copia = crea("button", "contatto-copia", "Copia link");
    copia.type = "button";
    copia.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(contatto.link);
        notifica("Copiato", contatto.nome + ": link negli appunti.");
      } catch (errore) {
        notifica("Non riesco a copiare", "Il browser non lo permette qui. Copia il link a mano: " + contatto.link);
      }
    });

    azioni.append(apri, copia);
    scheda.append(testi, azioni);
    box.appendChild(scheda);
  });
  corpo.appendChild(box);
}


// 4. ESPLORA FILE E ANTEPRIMA
//    Un finto disco C: con cartelle. I "file" aprono i programmi del sistema o mostrano le immagini.

const DISCO = {
  nome: "BrainOS (C:)",
  figli: [
    {
      nome: "Documenti",
      figli: [
        { nome: "Chi sono", app: "profilo" },
        { nome: "CV", app: "cv" },
        { nome: "Stage", app: "stage" },
        { nome: "Extra", app: "extra" }
      ]
    },
    {
      nome: "Programmi",
      figli: [
        { nome: "Terminale", app: "terminale" },
        { nome: "Colonia", app: "colonia" },
        { nome: "Contatti", app: "contatti" },
        { nome: "Impostazioni", app: "impostazioni" },
        { nome: "Informazioni", app: "info" }
      ]
    },
    {
      nome: "Immagini",
      figli: [
        { nome: "foto.jpg", immagine: "foto.jpg" },
        { nome: "brainos.png", immagine: "brainos.png" },
        { nome: "passione1.webp", immagine: "passione1.webp" },
        { nome: "passione2.webp", immagine: "passione2.webp" },
        { nome: "justfix.jpg", immagine: "justfix.jpg" },
        { nome: "logo-scuola.webp", immagine: "logo-scuola.webp" }
      ]
    },
    { nome: "Cestino", bloccata: true }
  ]
};

function costruisciEsplora(corpo) {
  const app = crea("div", "esplora");
  const barra = crea("div", "esplora-barra");

  const indietro = crea("button", "esplora-tasto", "←");
  indietro.type = "button";
  indietro.title = "Indietro";
  indietro.setAttribute("aria-label", "Indietro");
  const su = crea("button", "esplora-tasto", "↑");
  su.type = "button";
  su.title = "Cartella superiore";
  su.setAttribute("aria-label", "Cartella superiore");
  const percorso = crea("div", "esplora-percorso");
  barra.append(indietro, su, percorso);

  const elenco = crea("div", "esplora-elenco");
  const stato = crea("p", "esplora-stato");
  app.append(barra, elenco, stato);
  corpo.appendChild(app);

  let cammino = [DISCO];       // le cartelle da C: fino a dove sono adesso
  const storia = [];           // i posti dove sono stato (per "indietro")

  function vai(nuovoCammino, ricordaPosto) {
    if (ricordaPosto) storia.push(cammino);
    cammino = nuovoCammino;
    disegna();
  }

  function disegna() {
    const cartella = cammino[cammino.length - 1];
    percorso.textContent = "C:\\BrainOS" + cammino.slice(1).map(function (c) { return "\\" + c.nome; }).join("");
    indietro.disabled = storia.length === 0;
    su.disabled = cammino.length === 1;
    elenco.textContent = "";

    cartella.figli.forEach(function (voce) {
      const pulsante = crea("button", "esplora-voce");
      pulsante.type = "button";
      const disegnoVoce = crea("span", "esplora-icona");

      if (voce.immagine) {
        const miniatura = document.createElement("img");
        miniatura.src = "img/" + voce.immagine;
        miniatura.alt = "";
        miniatura.addEventListener("error", function () {
          disegnoVoce.innerHTML = ICONE.immagine;
        });
        disegnoVoce.appendChild(miniatura);
      } else if (voce.figli || voce.bloccata) {
        disegnoVoce.innerHTML = voce.bloccata ? ICONE.cestino : ICONE.cartella;
        disegnoVoce.classList.add("cartella");
      } else {
        const programma = APPS.find(function (a) { return a.id === voce.app; });
        disegnoVoce.innerHTML = programma ? programma.icona : ICONE.immagine;
      }
      pulsante.append(disegnoVoce, crea("span", "esplora-nome", voce.nome));

      function apri() {
        if (voce.figli) vai(cammino.concat([voce]), true);
        else if (voce.immagine) apriAnteprima(voce.immagine);
        else if (voce.app) apriApp(voce.app);
        else if (voce.bloccata) apriApp("cestino");
      }
      pulsante.addEventListener("click", function (evento) {
        elenco.querySelectorAll(".esplora-voce.scelta").forEach(function (altra) {
          altra.classList.remove("scelta");
        });
        pulsante.classList.add("scelta");
        if (evento.detail === 0 || window.matchMedia("(pointer: coarse)").matches) apri();
      });
      pulsante.addEventListener("dblclick", apri);
      elenco.appendChild(pulsante);
    });

    stato.textContent = cartella.figli.length + " element" + (cartella.figli.length === 1 ? "o" : "i") + " · doppio clic per aprire";
  }

  indietro.addEventListener("click", function () {
    if (storia.length > 0) vai(storia.pop(), false);
  });
  su.addEventListener("click", function () {
    if (cammino.length > 1) vai(cammino.slice(0, -1), true);
  });
  disegna();
}

// Mostra un'immagine in una piccola finestra (una alla volta)
function apriAnteprima(file) {
  chiudiApp("anteprima");
  creaFinestra({
    id: "anteprima",
    titolo: "Anteprima · " + file,
    nomeBreve: file,
    icona: ICONE.immagine,
    w: 640,
    h: 480,
    costruisci: function (corpo) {
      const vista = crea("div", "anteprima");
      const img = document.createElement("img");
      img.src = "img/" + file;
      img.alt = file;
      vista.appendChild(img);
      corpo.appendChild(vista);
    }
  });
}


// 5. SALVASCHERMO
//    Dopo 2 minuti senza toccare niente, il logo rimbalza sullo schermo nero.
//    Un tasto o un movimento del mouse lo chiude. Si può avviare subito con il comando "salvaschermo".

const ATTESA_SALVASCHERMO = 120000;   // 2 minuti
let timerSalvaschermo = null;
let salvaschermo = null;              // lo strato nero (c'è solo mentre è acceso)
let animazioneSalvaschermo = null;
let acceso = 0;                       // quando è partito (per ignorare i movimenti dell'inizio)

function riavviaTimerSalvaschermo() {
  clearTimeout(timerSalvaschermo);
  if (document.getElementById("sistema").hidden) return;
  timerSalvaschermo = setTimeout(avviaSalvaschermo, ATTESA_SALVASCHERMO);
}

function avviaSalvaschermo() {
  if (salvaschermo || document.getElementById("sistema").hidden) return;

  salvaschermo = crea("div", "salvaschermo");
  const logo = document.createElement("img");
  logo.src = "img/logo.svg";
  logo.alt = "";
  salvaschermo.appendChild(logo);
  document.body.appendChild(salvaschermo);
  acceso = Date.now();

  const larghezza = 220;
  const altezza = larghezza * 120 / 255;
  logo.style.width = larghezza + "px";
  let x = Math.random() * (window.innerWidth - larghezza);
  let y = Math.random() * (window.innerHeight - altezza);
  let vx = 2.2;
  let vy = 1.6;

  function giro() {
    x += vx;
    y += vy;
    if (x <= 0 || x >= window.innerWidth - larghezza) vx = -vx;
    if (y <= 0 || y >= window.innerHeight - altezza) vy = -vy;
    logo.style.transform = "translate(" + x + "px, " + y + "px)";
    animazioneSalvaschermo = requestAnimationFrame(giro);
  }
  giro();
}

function fermaSalvaschermo() {
  if (!salvaschermo) return;
  cancelAnimationFrame(animazioneSalvaschermo);
  salvaschermo.remove();
  salvaschermo = null;
}

// qualsiasi gesto: se il salvaschermo è acceso lo chiude, e il conto dei 2 minuti riparte
["pointerdown", "pointermove", "keydown", "wheel"].forEach(function (tipo) {
  document.addEventListener(tipo, function () {
    if (salvaschermo && Date.now() - acceso > 600) fermaSalvaschermo();
    if (!salvaschermo) riavviaTimerSalvaschermo();
  }, true);
});

// la prima volta che c'è un gesto si può avviare l'audio
document.addEventListener("pointerdown", preparaAudio, { once: true });
document.addEventListener("keydown", preparaAudio, { once: true });
