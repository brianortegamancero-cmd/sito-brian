// colonia.js – la colonia di formiche (adattata dal vecchio script.js, sezione 10)
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
let coloniaAttiva = false;  // true mentre la finestra "Colonia" è aperta e la simulazione gira

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
  if (coloniaAttiva && typeof notificaColonia === "function") notificaColonia(testo);   // (funzioni.js) avvisa se non guardi la finestra
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
  const pioggia = document.getElementById("pioggia");
  if (pioggia) pioggia.hidden = true;
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
  if (!mondo) return;
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
  const scheda = document.getElementById("scheda");
  if (scheda) scheda.hidden = true;
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

// Quando si apre la finestra Colonia: carico la colonia, recupero i giorni passati e faccio partire tutto
function avviaColonia() {
  if (coloniaAttiva) return;
  coloniaAttiva = true;
  preparaColonia();
  caricaColonia();
  recuperaGiorniPassati();
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

// Quando si chiude la finestra Colonia: mi segno l'eventuale pericolo, fermo tutto, tolgo le creature e salvo
function fermaColonia() {
  if (!coloniaAttiva) return;
  coloniaAttiva = false;
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
  document.querySelectorAll(".mondo [data-camera]").forEach(function (pezzo) {
    pezzo.style.display = Number(pezzo.dataset.camera) <= colonia.camere ? "" : "none";
  });

  disegnaUova();
  disegnaCimitero();
  sincronizzaCreature(false);
  salvaColonia();
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
    if (coloniaAttiva) {
      clearInterval(timerGiorno);
      timerGiorno = setInterval(passaGiorno, durataGiorno);   // il timer riparte con la nuova durata
    }
    scriviCmd("Tempo della colonia: 1 giorno = " + (durataGiorno / 1000) + " secondi", "cmd-verde");
    return true;
  }

  if (comando === "colonia demo" || comando === "colonia nuova") {
    if (coloniaAttiva) togliTutteLeCreature();
    if (comando === "colonia demo") {
      coloniaDemo();
    } else {
      nuovaColonia();
    }
    if (coloniaAttiva) {
      sincronizzaCreature(true);
      aggiornaColonia();
    } else {
      salvaColonia();
    }
    scriviCmd(comando === "colonia demo" ? "Caricata una colonia di 130 giorni." : "Nuova colonia creata.", "cmd-verde");
    return true;
  }

  if (["ragno", "pioggia", "nemiche", "volo"].includes(comando)) {
    if (!coloniaAttiva) {
      scriviCmd("Apri prima l'app Colonia (scrivi: apri colonia).");
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
