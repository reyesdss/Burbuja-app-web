import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "12.18.0";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const state = {
  auth: null,
  db: null,
  user: null,
  me: null,
  partner: null,
  profiles: new Map(),
  presence: new Map(),
  typing: new Map(),
  reads: {},
  messages: [],
  pinned: "",
  relationship: null,
  currentView: "Chat",
  unsubs: [],
  heartbeat: null,
  typingTimer: null,
  typingSent: false,
  registrationInProgress: false,
  todayKey: "",
  totData: null,
  questionData: null,
  lastNudges: [],
  burbujaPoints: null,
  appPoints: null,
  streakData: null,
  streakDayData: null,
  compatData: null,
  guessData: null,
  guessMineChoice: null,
  guessPartnerChoice: null,
  currentGameUrl: ""
};

const STATUS_OPTIONS = [
  ["💼", "Ocupado"],
  ["📚", "Estudiando"],
  ["🎮", "Jugando"],
  ["😴", "Durmiendo"],
  ["🍿", "Viendo algo"],
  ["🚗", "Voy en camino"],
  ["🍔", "Comiendo"],
  ["❤️", "Quiero hablar contigo"],
  ["👀", "Disponible"],
  ["🌙", "Necesito descansar"]
];

const STICKERS = [
  {id:"love", emoji:"💗", label:"Te quiero"},
  {id:"kiss", emoji:"😘", label:"Besito"},
  {id:"hug", emoji:"🫂", label:"Abrazo"},
  {id:"thinking", emoji:"💭", label:"Pienso en ti"},
  {id:"miss", emoji:"🥺", label:"Te extraño"},
  {id:"muak", emoji:"💋", label:"Muak"},
  {id:"morning", emoji:"☀️", label:"Buenos días"},
  {id:"night", emoji:"🌙", label:"Buenas noches"},
  {id:"bubble", emoji:"🫧", label:"Nuestra burbuja"},
  {id:"together", emoji:"🫶", label:"Tú y yo"},
  {id:"laugh", emoji:"😂", label:"JAJAJA"},
  {id:"angry", emoji:"😤", label:"Estoy enojad@"},
  {id:"sorry", emoji:"🥹", label:"Perdón"},
  {id:"proud", emoji:"🏆", label:"Orgullo total"},
  {id:"youcan", emoji:"💪", label:"Tú puedes"},
  {id:"sleepy", emoji:"😴", label:"Tengo sueño"},
  {id:"food", emoji:"🍕", label:"¿Comemos?"},
  {id:"play", emoji:"🎮", label:"¿Jugamos?"},
  {id:"call", emoji:"📞", label:"¿Llamada?"},
  {id:"movie", emoji:"🍿", label:"¿Vemos algo?"},
  {id:"purple", emoji:"💜", label:"Para ti"},
  {id:"pink", emoji:"🩷", label:"Para ti"},
  {id:"spark", emoji:"✨", label:"Me encantas"},
  {id:"home", emoji:"🏠", label:"Quiero verte"}
];

const THIS_OR_THAT = [
  ["🍕 Pizza", "🌮 Tacos"],
  ["🌊 Playa", "🌲 Bosque"],
  ["🎬 Película", "📺 Serie"],
  ["🌙 Noche", "☀️ Mañana"],
  ["🍫 Dulce", "🍟 Salado"],
  ["🏠 Plan en casa", "🚶 Salir"],
  ["📞 Llamada", "💬 Mensajes"],
  ["🐶 Perros", "🐱 Gatos"],
  ["❄️ Frío", "☀️ Calor"],
  ["🎁 Regalo", "💌 Carta"],
  ["🚗 Viaje", "🛋️ Descanso"],
  ["🍓 Fresa", "🍫 Chocolate"]
];

const DAILY_QUESTIONS = [
  "¿Qué momento conmigo recuerdas con más cariño?",
  "¿Qué pequeña cosa hago que te hace sentir querido/a?",
  "¿A dónde te gustaría escaparte conmigo un fin de semana?",
  "¿Qué canción te recuerda a nosotros?",
  "¿Qué momento nuestro te hizo reír muchísimo?",
  "¿Qué te gustaría que hiciéramos más seguido juntos?",
  "¿Cuál sería nuestra cita perfecta sin pensar en dinero?",
  "¿Qué fue lo primero que te llamó la atención de mí?",
  "¿Qué comida te gustaría cocinar o probar conmigo?",
  "¿Qué palabra usarías para describir nuestra relación hoy?",
  "¿Qué foto nuestra te gusta más y por qué?",
  "¿Qué detalle sencillo te gustaría recibir esta semana?"
];

const COMPATIBILITY_DAILY = [
  { q:"Si tuviéramos libre esta tarde, ¿qué se te antoja más?", options:["🏠 Quedarnos juntos","🍿 Ver algo","🚶 Salir a caminar","🍔 Ir por comida"] },
  { q:"¿Qué plan te haría más feliz esta noche?", options:["🎮 Jugar juntos","🎬 Película","💬 Hablar mucho","😴 Descansar juntos"] },
  { q:"Si pudiéramos salir ahora mismo, ¿a dónde irías?", options:["🌲 Naturaleza","☕ Algo tranquilo","🛍️ Pasear por tiendas","🍕 A comer"] },
  { q:"¿Qué tipo de cariño te gustaría más hoy?", options:["🤗 Un abrazo","💌 Un mensaje bonito","⏳ Tiempo juntos","🎁 Un detalle"] },
  { q:"¿Qué ambiente prefieres para nuestro próximo plan?", options:["🌙 Noche","☀️ Día","🌧️ Lluvia","✨ Cualquier hora juntos"] },
  { q:"Este fin de semana, ¿qué escogerías primero?", options:["🏠 Plan en casa","🚗 Salir lejos","🎮 Jugar","🍽️ Comer algo especial"] },
  { q:"Si hoy solo pudiéramos hacer una cosa juntos, ¿cuál?", options:["💬 Hablar","🎬 Ver algo","🎮 Jugar","🚶 Salir"] },
  { q:"¿Qué comida compartirías conmigo hoy?", options:["🌮 Tacos","🍕 Pizza","🍔 Hamburguesa","🍜 Algo nuevo"] },
  { q:"¿Qué energía tienes hoy para un plan juntos?", options:["🛋️ Muy tranquila","😊 Normal","⚡ Quiero hacer algo","🎉 Quiero salir"] },
  { q:"¿Qué momento del día elegirías para vernos hoy?", options:["🌅 Mañana","☀️ Tarde","🌙 Noche","♾️ Todo el día"] },
  { q:"¿Cómo te gustaría sorprendernos esta semana?", options:["🍴 Comida","🎁 Detalle","🎟️ Salida","💌 Algo romántico"] },
  { q:"Si hoy tomáramos una foto juntos, ¿dónde?", options:["🏠 En casa","🌳 Afuera","🍴 Comiendo","🌆 En algún lugar bonito"] }
];

const GUESS_DAILY = [
  { q:"Si pudiéramos pedir algo de comer hoy, ¿qué elegirías?", options:["🌮 Tacos","🍕 Pizza","🍔 Hamburguesa","🍜 Otra cosa"] },
  { q:"¿Qué plan escogerías para terminar el día?", options:["🎬 Película","🎮 Juego","💬 Hablar","😴 Dormir"] },
  { q:"Si mañana estuviera libre, ¿qué preferirías?", options:["🏠 Casa","🚗 Salir","🍽️ Comer fuera","🌲 Ir a un lugar tranquilo"] },
  { q:"¿Qué detalle te gustaría recibir hoy?", options:["💌 Mensaje","🤗 Abrazo","🍫 Algo rico","⏳ Tiempo juntos"] },
  { q:"¿Qué escogerías escuchar ahora?", options:["🎵 Música tranquila","🎸 Algo fuerte","❤️ Canciones románticas","🎲 Lo que salga"] },
  { q:"Si empezáramos una serie hoy, ¿qué género elegirías?", options:["😱 Terror","😂 Comedia","🔎 Misterio","❤️ Romance"] },
  { q:"¿Qué clima elegirías para una cita hoy?", options:["☀️ Soleado","🌧️ Lluvia","❄️ Frío","🌙 Noche fresca"] },
  { q:"¿Qué bebida escogerías ahora?", options:["☕ Café","🥤 Refresco","🧃 Jugo","💧 Agua"] },
  { q:"¿Cuál sería tu salida improvisada de hoy?", options:["🎬 Cine","🍽️ Comida","🚶 Paseo","🛍️ Tiendas"] },
  { q:"¿Qué juego se te antojaría jugar hoy conmigo?", options:["🏗️ Construcción","😱 Terror","🔫 Acción","🧩 Algo tranquilo"] },
  { q:"¿Qué te apetecería hacer antes de dormir?", options:["📞 Llamada","💬 Mensajes","🎬 Ver algo","🎵 Música"] },
  { q:"Si compráramos un postre hoy, ¿qué escogerías?", options:["🍫 Chocolate","🍦 Helado","🍰 Pastel","🍓 Algo con fruta"] }
];

const ROULETTE = [
  "🍿 Ver una película",
  "🍕 Pedir/comer algo rico",
  "🎮 Jugar algo juntos",
  "🚶 Dar una vuelta",
  "📞 Hacer una llamada",
  "💗 Decirnos 3 cosas bonitas",
  "🎵 Escuchar una canción juntos",
  "📷 Mandarnos una foto del momento",
  "❓ Hacernos una pregunta inesperada"
];

let firebase = null;

function configured() {
  return firebaseConfig &&
    firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("REEMPLAZAR") &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "REEMPLAZAR";
}

function showScreen(name) {
  $("#setupScreen").classList.toggle("hidden", name !== "setup");
  $("#authScreen").classList.toggle("hidden", name !== "auth");
  $("#appShell").classList.toggle("hidden", name !== "app");
}

function toast(message, ms = 2600) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), ms);
}

function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function validHandle(handle) {
  return /^[a-z0-9._-]{3,20}$/.test(handle);
}

function randomAuthEmail() {
  const key = crypto.randomUUID().replaceAll("-", "");
  return `${key}@burbuja.app`;
}

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0,2).map(p => p[0]?.toUpperCase()).join("") || "♡");
}

function setAvatar(el, profile) {
  if (!el) return;
  const avatar = profile?.avatarData || "";
  if (avatar) {
    el.style.backgroundImage = `url("${avatar}")`;
    el.textContent = "";
  } else {
    el.style.backgroundImage = "";
    el.textContent = initials(profile?.displayName || "");
  }
}

function tsMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (ts.seconds) return ts.seconds * 1000;
  if (typeof ts === "number") return ts;
  return 0;
}

function timeLabel(ts) {
  const m = tsMillis(ts);
  if (!m) return "";
  return new Intl.DateTimeFormat("es-MX", { hour:"numeric", minute:"2-digit" }).format(new Date(m));
}

function dateKeyMexico() {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0,10);
  }
}

function hashString(s) {
  let h = 2166136261;
  for (let i=0; i<s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

function previousDateKey(key) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0,10);
}

function getCompatibilityToday() {
  return COMPATIBILITY_DAILY[hashString("compat-"+state.todayKey) % COMPATIBILITY_DAILY.length];
}

function getGuessToday() {
  return GUESS_DAILY[hashString("guess-"+state.todayKey) % GUESS_DAILY.length];
}

function niceError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Usuario o contraseña incorrectos.";
  if (code.includes("weak-password")) return "La contraseña necesita al menos 6 caracteres; Burbuja recomienda 8.";
  if (code.includes("email-already-in-use")) return "Esa cuenta ya existe.";
  if (code.includes("too-many-requests")) return "Demasiados intentos. Intenta de nuevo más tarde.";
  if (code.includes("requires-recent-login")) return "Por seguridad, cierra sesión, vuelve a entrar y repite el cambio.";
  if (code.includes("permission-denied")) return "Firebase rechazó esta acción. Revisa que hayas publicado firestore.rules.";
  return err?.message || "Ocurrió un error inesperado.";
}

function clearSubscriptions() {
  state.unsubs.forEach(fn => { try { fn(); } catch {} });
  state.unsubs = [];
  if (state.heartbeat) clearInterval(state.heartbeat);
  state.heartbeat = null;
}

function switchAuthTab(tab) {
  const login = tab === "login";
  $("#tabLogin").classList.toggle("active", login);
  $("#tabRegister").classList.toggle("active", !login);
  $("#loginForm").classList.toggle("hidden", !login);
  $("#registerForm").classList.toggle("hidden", login);
}

function switchView(view) {
  state.currentView = view;
  $$(".view").forEach(el => el.classList.remove("active-view"));
  $(`#view${view}`)?.classList.add("active-view");
  $$(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.view === view));
  if (view === "Chat") {
    markRead();
    requestAnimationFrame(scrollMessages);
  }
}

async function loadFirebase() {
  if (!configured()) {
    showScreen("setup");
    return;
  }

  const [
    appMod, authMod, dbMod
  ] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
  ]);

  firebase = { ...appMod, ...authMod, ...dbMod };
  const app = firebase.initializeApp(firebaseConfig);
  state.auth = firebase.getAuth(app);
  state.db = firebase.getFirestore(app);

  firebase.onAuthStateChanged(state.auth, async (user) => {
    if (state.registrationInProgress) return;
    if (!user) {
      clearSubscriptions();
      state.user = state.me = state.partner = null;
      showScreen("auth");
      await updateSlotHint();
      return;
    }
    try {
      const slot = await getMySlot(user.uid);
      if (!slot) {
        await firebase.signOut(state.auth);
        toast("Esta cuenta no pertenece a esta Burbuja.");
        return;
      }
      await bootApp(user);
    } catch (err) {
      console.error(err);
      toast(niceError(err), 4200);
      showScreen("auth");
    }
  });
}

async function updateSlotHint() {
  if (!state.db || !state.auth?.currentUser) {
    $("#slotsHint").textContent = "Burbuja admite un máximo de 2 cuentas.";
    return;
  }
}

async function getMySlot(uid) {
  const one = await firebase.getDoc(firebase.doc(state.db, "slots", "one"));
  if (one.exists() && one.data().uid === uid) return "one";
  const two = await firebase.getDoc(firebase.doc(state.db, "slots", "two"));
  if (two.exists() && two.data().uid === uid) return "two";
  return null;
}

async function registerAccount(name, handleRaw, password) {
  const handle = normalizeHandle(handleRaw);
  if (!validHandle(handle)) throw new Error("El usuario debe tener 3–20 caracteres y usar solo letras, números, punto, guion o guion bajo.");
  if (password.length < 8) throw new Error("Usa una contraseña de al menos 8 caracteres.");

  const aliasRef = firebase.doc(state.db, "aliases", handle);
  const existing = await firebase.getDoc(aliasRef);
  if (existing.exists()) throw new Error("Ese nombre de usuario ya está ocupado.");

  state.registrationInProgress = true;
  let cred = null;
  let claimedRef = null;

  try {
    cred = await firebase.createUserWithEmailAndPassword(state.auth, randomAuthEmail(), password);
    const uid = cred.user.uid;
    const slotOne = firebase.doc(state.db, "slots", "one");
    const slotTwo = firebase.doc(state.db, "slots", "two");

    claimedRef = await firebase.runTransaction(state.db, async tx => {
      const [one, two] = await Promise.all([tx.get(slotOne), tx.get(slotTwo)]);
      if (one.exists() && two.exists()) throw new Error("BURBUJA_FULL");
      const chosen = !one.exists() ? slotOne : slotTwo;
      tx.set(chosen, { uid, createdAt: firebase.serverTimestamp() });
      return chosen;
    });

    const batch = firebase.writeBatch(state.db);
    batch.set(firebase.doc(state.db, "profiles", uid), {
      uid,
      displayName: name.trim().slice(0,30),
      handle,
      bio: "",
      avatarData: "",
      statusEmoji: "👀",
      statusText: "Disponible",
      createdAt: firebase.serverTimestamp(),
      updatedAt: firebase.serverTimestamp()
    });
    batch.set(aliasRef, {
      uid,
      email: cred.user.email,
      createdAt: firebase.serverTimestamp()
    });
    await batch.commit();

    state.registrationInProgress = false;
    await bootApp(cred.user);
    toast("Bienvenido/a a su Burbuja 🫧");
  } catch (err) {
    try {
      if (claimedRef && cred?.user) {
        const profile = await firebase.getDoc(firebase.doc(state.db, "profiles", cred.user.uid));
        if (!profile.exists()) await firebase.deleteDoc(claimedRef);
      }
    } catch {}
    try { if (cred?.user) await firebase.deleteUser(cred.user); } catch {}
    state.registrationInProgress = false;
    if (err?.message === "BURBUJA_FULL") throw new Error("🫧 Esta Burbuja ya está completa. Las dos cuentas ya fueron registradas.");
    throw err;
  }
}

async function loginWithHandle(handleRaw, password) {
  const handle = normalizeHandle(handleRaw);
  if (!validHandle(handle)) throw new Error("Usuario o contraseña incorrectos.");
  const aliasSnap = await firebase.getDoc(firebase.doc(state.db, "aliases", handle));
  if (!aliasSnap.exists()) throw new Error("Usuario o contraseña incorrectos.");
  const email = aliasSnap.data().email;
  await firebase.signInWithEmailAndPassword(state.auth, email, password);
}

async function bootApp(user) {
  clearSubscriptions();
  state.user = user;
  state.todayKey = dateKeyMexico();

  const profileSnap = await firebase.getDoc(firebase.doc(state.db, "profiles", user.uid));
  if (!profileSnap.exists()) throw new Error("Tu perfil no está configurado.");
  state.me = profileSnap.data();

  showScreen("app");
  wireRealtime();
  updatePresence(true);
  state.heartbeat = setInterval(() => updatePresence(true), 45000);
  renderAll();
}

function wireRealtime() {
  const db = state.db;
  const uid = state.user.uid;

  state.unsubs.push(firebase.onSnapshot(firebase.collection(db, "profiles"), snap => {
    state.profiles.clear();
    snap.forEach(d => state.profiles.set(d.id, d.data()));
    state.me = state.profiles.get(uid) || state.me;
    state.partner = [...state.profiles.entries()].find(([id]) => id !== uid)?.[1] || null;
    renderProfiles();
    renderMessages();
    renderGames();
  }));

  const msgQ = firebase.query(
    firebase.collection(db, "messages"),
    firebase.orderBy("createdAt", "asc"),
    firebase.limitToLast(160)
  );
  state.unsubs.push(firebase.onSnapshot(msgQ, snap => {
    const wasNearBottom = nearBottom();
    state.messages = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderMessages();
    if (wasNearBottom || state.currentView === "Chat") requestAnimationFrame(scrollMessages);
    if (state.currentView === "Chat") markRead();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "reads"), snap => {
    state.reads = snap.exists() ? snap.data() : {};
    renderMessages();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "pinned"), snap => {
    state.pinned = snap.exists() ? (snap.data().text || "") : "";
    renderPinned();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "relationship"), snap => {
    state.relationship = snap.exists() ? snap.data() : null;
    renderRelationship();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.collection(db, "presence"), snap => {
    state.presence.clear();
    snap.forEach(d => state.presence.set(d.id, d.data()));
    renderPartnerHeader();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.collection(db, "typing"), snap => {
    state.typing.clear();
    snap.forEach(d => state.typing.set(d.id, d.data()));
    renderTyping();
  }));

  const nudgeQ = firebase.query(firebase.collection(db, "nudges"), firebase.orderBy("createdAt", "desc"), firebase.limit(20));
  state.unsubs.push(firebase.onSnapshot(nudgeQ, snap => {
    const oldNewest = state.lastNudges[0]?.id;
    state.lastNudges = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderNudges();
    const newest = state.lastNudges[0];
    if (newest && newest.id !== oldNewest && newest.targetId === uid && newest.senderId !== uid) {
      const seen = localStorage.getItem("burbuja-last-nudge");
      if (seen !== newest.id) {
        localStorage.setItem("burbuja-last-nudge", newest.id);
        toast(`${state.partner?.displayName || "Tu persona"} está pensando en ti 💗`, 4200);
      }
    }
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "burbujacraftPoints"), snap => {
    state.burbujaPoints = snap.exists() ? snap.data() : null;
    renderBurbujaPoints();
  }));

  wireGames();
}

function wireGames() {
  const db = state.db;
  const date = state.todayKey;
  const totRef = firebase.doc(db, "games", `tot_${date}`);
  const qRef = firebase.doc(db, "games", `question_${date}`);
  const compatRef = firebase.doc(db, "games", `compat_${date}`);
  const guessRef = firebase.doc(db, "games", `guess_${date}`);
  const streakDayRef = firebase.doc(db, "games", `streak_${date}`);

  state.unsubs.push(firebase.onSnapshot(totRef, snap => {
    state.totData = snap.exists() ? snap.data() : null;
    renderThisOrThat();
  }));

  state.unsubs.push(firebase.onSnapshot(qRef, snap => {
    state.questionData = snap.exists() ? snap.data() : null;
    renderDailyQuestion();
  }));

  state.unsubs.push(firebase.onSnapshot(compatRef, snap => {
    state.compatData = snap.exists() ? snap.data() : null;
    renderCompatibility();
  }));

  state.unsubs.push(firebase.onSnapshot(guessRef, snap => {
    state.guessData = snap.exists() ? snap.data() : null;
    renderGuessGame();
    maybeAwardGuessPoints();
  }));

  state.unsubs.push(firebase.onSnapshot(streakDayRef, snap => {
    state.streakDayData = snap.exists() ? snap.data() : null;
    renderStreak();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "coupleStreak"), snap => {
    state.streakData = snap.exists() ? snap.data() : null;
    renderStreak();
  }));

  state.unsubs.push(firebase.onSnapshot(firebase.doc(db, "shared", "appPoints"), snap => {
    state.appPoints = snap.exists() ? snap.data() : null;
    renderBurbujaPoints();
  }));
}

function pointsForUid(uid) {
  if (!uid) return 0;
  const gameByUid = state.burbujaPoints?.byUid || {};
  const appByUid = state.appPoints?.byUid || {};
  return Number(gameByUid[uid] || 0) + Number(appByUid[uid] || 0);
}

function renderBurbujaPoints() {
  if (!state.user || !$("#rankFirst")) return;

  const players = [];
  if (state.me?.uid) {
    players.push({
      uid:state.me.uid,
      name:state.me.displayName || state.me.handle || "Tú",
      handle:state.me.handle || "",
      points:pointsForUid(state.me.uid),
      me:true
    });
  }
  if (state.partner?.uid) {
    players.push({
      uid:state.partner.uid,
      name:state.partner.displayName || state.partner.handle || "Tu persona",
      handle:state.partner.handle || "",
      points:pointsForUid(state.partner.uid),
      me:false
    });
  }

  // Si el perfil todavía está cargando, al menos muestra al usuario autenticado.
  if (!players.some(p => p.uid === state.user.uid)) {
    players.push({uid:state.user.uid,name:"Tú",handle:"",points:pointsForUid(state.user.uid),me:true});
  }

  players.sort((a,b) => (b.points-a.points) || a.name.localeCompare(b.name,"es"));
  const first = players[0] || {name:"—",points:0,handle:"",me:false};
  const second = players[1] || {name:"Esperando a tu persona",points:0,handle:"",me:false};
  const tied = players.length > 1 && first.points === second.points;

  $("#rankFirstName").textContent = first.name;
  $("#rankFirstPoints").textContent = `${first.points.toLocaleString("es-MX")} 🫧`;
  $("#rankFirstTag").textContent = tied ? "Empate en puntos" : (first.me ? "Tú · Primer lugar" : "Primer lugar");

  $("#rankSecondName").textContent = second.name;
  $("#rankSecondPoints").textContent = `${second.points.toLocaleString("es-MX")} 🫧`;
  $("#rankSecondTag").textContent = tied ? "Empate en puntos" : (second.me ? "Tú · Segundo lugar" : "Segundo lugar");

  $("#rankFirst")?.classList.toggle("rank-tie", tied);
  $("#rankSecond")?.classList.toggle("rank-tie", tied);

  const mine = pointsForUid(state.user.uid);
  const myIndex = players.findIndex(p => p.uid === state.user.uid);
  const place = myIndex === 0 ? "1.º" : myIndex === 1 ? "2.º" : "—";
  $("#myRankSummary").textContent = `Tú: ${mine.toLocaleString("es-MX")} 🫧 · Lugar ${place}`;
}

function renderStreak() {
  if (!state.user) return;
  const count = Number(state.streakData?.count || 0);
  const active = state.streakDayData?.active || {};
  const meActive = !!active[state.user.uid];
  const partnerUid = state.partner?.uid;
  const partnerActive = partnerUid ? !!active[partnerUid] : false;
  const complete = meActive && partnerActive;

  $("#streakCount").textContent = count;
  $("#streakMe")?.classList.toggle("active", meActive);
  $("#streakPartner")?.classList.toggle("active", partnerActive);
  $(".streak-card")?.classList.toggle("completed", complete);

  if (complete) {
    $("#streakTitle").textContent = count === 1 ? "¡Primer día juntos!" : `${count} días seguidos ♡`;
    $("#streakMessage").textContent = "Los dos activaron el día. Mañana vuelvan para mantener la racha.";
  } else if (meActive && partnerUid) {
    $("#streakTitle").textContent = "Tu día ya está activo";
    $("#streakMessage").textContent = "Falta que tu persona envíe un mensaje o complete una actividad.";
  } else if (!partnerUid) {
    $("#streakTitle").textContent = "Falta tu persona";
    $("#streakMessage").textContent = "La racha comienza cuando las dos cuentas estén en Burbuja.";
  } else {
    $("#streakTitle").textContent = count ? `Racha actual: ${count} días` : "Activen el día juntos";
    $("#streakMessage").textContent = "Enviar un mensaje o completar una actividad activa tu día.";
  }
}

function renderCompatibility() {
  if (!state.user || !$("#compatOptions")) return;
  const game = getCompatibilityToday();
  $("#compatQuestion").textContent = game.q;
  const votes = state.compatData?.votes || {};
  const mine = votes[state.user.uid];
  const partnerUid = state.partner?.uid;
  const partner = partnerUid ? votes[partnerUid] : undefined;

  const box = $("#compatOptions");
  box.textContent = "";
  game.options.forEach((label, idx) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `choice-option ${mine === idx ? "selected" : ""}`;
    b.textContent = label;
    b.addEventListener("click", () => voteCompatibility(idx));
    box.appendChild(b);
  });

  const result = $("#compatResult");
  if (mine === undefined) result.textContent = "Elige tu respuesta ♡";
  else if (!partnerUid) result.textContent = "Esperando a que se una tu persona.";
  else if (partner === undefined) result.textContent = "Tu respuesta está lista. Falta la otra.";
  else if (mine === partner) result.textContent = `💗 Coincidencia de hoy: 100% · ${game.options[mine]}`;
  else result.textContent = `🫧 Hoy eligieron distinto · Tú: ${game.options[mine]} · Tu persona: ${game.options[partner]}`;
}

function renderGuessGame() {
  if (!state.user || !$("#guessMineOptions")) return;
  const game = getGuessToday();
  $("#guessQuestion").textContent = game.q;
  const answers = state.guessData?.answers || {};
  const guesses = state.guessData?.guesses || {};
  const savedMine = answers[state.user.uid];
  const savedGuess = guesses[state.user.uid];

  if (state.guessMineChoice === null && savedMine !== undefined) state.guessMineChoice = savedMine;
  if (state.guessPartnerChoice === null && savedGuess !== undefined) state.guessPartnerChoice = savedGuess;

  const build = (box, selected, setter) => {
    box.textContent = "";
    game.options.forEach((label, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `choice-option ${selected === idx ? "selected" : ""}`;
      b.textContent = label;
      b.addEventListener("click", () => {
        setter(idx);
        renderGuessGame();
      });
      box.appendChild(b);
    });
  };

  build($("#guessMineOptions"), state.guessMineChoice, v => state.guessMineChoice = v);
  build($("#guessPartnerOptions"), state.guessPartnerChoice, v => state.guessPartnerChoice = v);

  const partnerUid = state.partner?.uid;
  const partnerAnswer = partnerUid ? answers[partnerUid] : undefined;
  const partnerGuess = partnerUid ? guesses[partnerUid] : undefined;
  const myAnswer = answers[state.user.uid];
  const myGuess = guesses[state.user.uid];
  const result = $("#guessResult");

  if (myAnswer === undefined || myGuess === undefined) {
    result.textContent = "Elige tus dos respuestas y guárdalas.";
  } else if (!partnerUid || partnerAnswer === undefined || partnerGuess === undefined) {
    result.textContent = "Tus respuestas están guardadas. Falta tu persona.";
  } else {
    const iGotIt = myGuess === partnerAnswer;
    const partnerGotIt = partnerGuess === myAnswer;
    if (iGotIt && partnerGotIt) result.textContent = "💗 ¡Los dos se adivinaron! +3 puntos cada uno.";
    else if (iGotIt) result.textContent = `✨ ¡Adivinaste! Tu persona eligió ${game.options[partnerAnswer]}. +3 puntos`;
    else if (partnerGotIt) result.textContent = `💞 Tu persona te adivinó. Tú elegiste ${game.options[myAnswer]}.`;
    else result.textContent = `🫧 Esta vez ninguno acertó. Tu persona eligió ${game.options[partnerAnswer]}.`;
  }
}

function renderAll() {
  renderProfiles();
  renderPartnerHeader();
  renderPinned();
  renderRelationship();
  renderMessages();
  renderTyping();
  renderThisOrThat();
  renderDailyQuestion();
  renderCompatibility();
  renderGuessGame();
  renderStreak();
  renderStatusOptions();
  renderBurbujaPoints();
}

function renderProfiles() {
  const me = state.me;
  const p = state.partner;
  if (!me) return;

  setAvatar($("#usMeAvatar"), me);
  setAvatar($("#avatarPickerBtn"), me);
  $("#profileHeroName").textContent = me.displayName || "Tu nombre";
  $("#profileHeroHandle").textContent = `@${me.handle || "usuario"}`;
  $("#profileNameInput").value = me.displayName || "";
  $("#profileHandleInput").value = me.handle || "";
  $("#profileBioInput").value = me.bio || "";
  $("#myStatusText").textContent = `${me.statusEmoji || "👀"} ${me.statusText || "Disponible"}`;

  if (p) {
    setAvatar($("#partnerAvatar"), p);
    setAvatar($("#usPartnerAvatar"), p);
    setAvatar($("#partnerStatusAvatar"), p);
    $("#partnerName").textContent = p.displayName || "Tu persona";
    $("#partnerStatusName").textContent = p.displayName || "Tu persona";
    $("#partnerStatusText").textContent = p.statusText || "Sin estado";
    $("#partnerStatusEmoji").textContent = p.statusEmoji || "✨";
  } else {
    ["partnerAvatar","usPartnerAvatar","partnerStatusAvatar"].forEach(id => setAvatar($("#"+id), null));
    $("#partnerName").textContent = "Esperando a tu persona";
    $("#partnerStatusName").textContent = "Tu persona";
    $("#partnerStatusText").textContent = "Aún no se ha unido";
    $("#partnerStatusEmoji").textContent = "🫧";
  }
  renderPartnerHeader();
}

function renderPartnerHeader() {
  const p = state.partner;
  if (!p) {
    $("#partnerPresence").textContent = "falta la segunda cuenta";
    return;
  }
  const pr = state.presence.get(p.uid);
  const age = Date.now() - tsMillis(pr?.lastSeen);
  const online = pr?.online === true && age < 100000;
  $("#partnerPresence").textContent = online ? `${p.statusEmoji || "●"} en línea` : (pr?.lastSeen ? `visto ${timeLabel(pr.lastSeen)}` : p.statusText || "sin conexión");
}

function renderPinned() {
  const text = state.pinned || "";
  $("#pinnedBanner").classList.toggle("hidden", !text);
  $("#pinnedText").textContent = text;
  if (document.activeElement !== $("#pinnedInput")) $("#pinnedInput").value = text;
}

function renderRelationship() {
  const start = state.relationship?.startDate || "";
  if (document.activeElement !== $("#relationshipDate")) $("#relationshipDate").value = start;
  const out = $("#relationshipCounter");
  if (!start) {
    out.textContent = "Configuren su fecha especial ♡";
    return;
  }
  const d0 = new Date(`${start}T12:00:00`);
  const now = new Date();
  const days = Math.max(0, Math.floor((now - d0) / 86400000));
  const years = Math.floor(days / 365.2425);
  const remAfterYears = Math.floor(days - years * 365.2425);
  const months = Math.floor(remAfterYears / 30.44);
  const remDays = Math.max(0, Math.floor(remAfterYears - months * 30.44));
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "año" : "años"}`);
  if (months) parts.push(`${months} ${months === 1 ? "mes" : "meses"}`);
  parts.push(`${remDays} ${remDays === 1 ? "día" : "días"}`);
  out.textContent = `${parts.join(", ")} juntos ♡`;
}

function nearBottom() {
  const box = $("#messages");
  return box.scrollHeight - box.scrollTop - box.clientHeight < 150;
}

function scrollMessages() {
  const box = $("#messages");
  box.scrollTop = box.scrollHeight;
}

function renderMessages() {
  const box = $("#messages");
  if (!box || !state.user) return;
  if (!state.messages.length) {
    box.innerHTML = `<div class="empty-state"><div class="empty-bubble">🫧</div><h2>Aquí comienza su Burbuja</h2><p>El primer mensaje siempre cuenta.</p></div>`;
    return;
  }

  box.textContent = "";
  const partnerRead = state.partner ? tsMillis(state.reads[state.partner.uid]) : 0;

  state.messages.forEach(msg => {
    const mine = msg.senderId === state.user.uid;
    const row = document.createElement("div");
    row.className = `message-row ${mine ? "mine" : "theirs"}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (msg.stickerId || msg.stickerEmoji) {
      bubble.classList.add("sticker-bubble");
      const sticker = STICKERS.find(s => s.id === msg.stickerId) || {
        emoji: msg.stickerEmoji || "💗",
        label: msg.stickerText || "Sticker"
      };
      const stickerEl = document.createElement("div");
      stickerEl.className = "chat-sticker";
      const emoji = document.createElement("div");
      emoji.className = "sticker-emoji";
      emoji.textContent = sticker.emoji;
      const caption = document.createElement("div");
      caption.className = "sticker-caption";
      caption.textContent = sticker.label;
      stickerEl.append(emoji, caption);
      bubble.appendChild(stickerEl);
    }

    if (msg.imageData) {
      const img = document.createElement("img");
      img.className = "message-image";
      img.src = msg.imageData;
      img.alt = "Foto";
      img.addEventListener("click", () => openImage(msg.imageData));
      bubble.appendChild(img);
    }

    if (msg.text) {
      const txt = document.createElement("div");
      txt.className = "message-text";
      txt.textContent = msg.text;
      bubble.appendChild(txt);
    }

    const meta = document.createElement("div");
    meta.className = "message-meta";
    const t = document.createElement("span");
    t.textContent = timeLabel(msg.createdAt);
    meta.appendChild(t);
    if (mine) {
      const seen = document.createElement("span");
      const created = tsMillis(msg.createdAt);
      seen.textContent = created && partnerRead >= created ? "✓✓" : "✓";
      meta.appendChild(seen);
    }
    bubble.appendChild(meta);

    if (mine) {
      const menu = document.createElement("button");
      menu.type = "button";
      menu.className = "msg-menu";
      menu.textContent = "•••";
      menu.title = "Borrar mensaje";
      menu.addEventListener("click", async () => {
        if (!confirm("¿Borrar este mensaje?")) return;
        try { await firebase.deleteDoc(firebase.doc(state.db, "messages", msg.id)); }
        catch (e) { toast(niceError(e)); }
      });
      row.append(menu, bubble);
    } else {
      row.append(bubble);
    }
    box.appendChild(row);
  });
}

function renderTyping() {
  const p = state.partner;
  if (!p) return $("#typingLine").classList.add("hidden");
  const typing = state.typing.get(p.uid);
  const fresh = typing?.typing === true && Date.now() - tsMillis(typing.updatedAt) < 6000;
  $("#typingLine").classList.toggle("hidden", !fresh);
  $("#typingName").textContent = fresh ? `${p.displayName || "Tu persona"} está escribiendo...` : "";
}

function renderStatusOptions() {
  const box = $("#statusOptions");
  box.textContent = "";
  STATUS_OPTIONS.forEach(([emoji, text]) => {
    const btn = document.createElement("button");
    btn.className = "status-btn";
    btn.type = "button";
    btn.innerHTML = `<span>${emoji}</span><strong>${text}</strong>`;
    btn.addEventListener("click", () => saveStatus(emoji, text));
    box.appendChild(btn);
  });
}

function renderNudges() {
  const latest = state.lastNudges[0];
  if (!latest) {
    $("#lastNudgeText").textContent = "Aún no se han mandado uno.";
    return;
  }
  const sender = state.profiles.get(latest.senderId);
  const name = latest.senderId === state.user?.uid ? "Tú" : (sender?.displayName || "Tu persona");
  $("#lastNudgeText").textContent = `${name} pensó en ${latest.senderId === state.user?.uid ? "su persona" : "ti"} · ${timeLabel(latest.createdAt)}`;
}

function getPairForToday() {
  return THIS_OR_THAT[hashString(state.todayKey) % THIS_OR_THAT.length];
}
function getQuestionForToday() {
  return DAILY_QUESTIONS[hashString("q"+state.todayKey) % DAILY_QUESTIONS.length];
}

function renderThisOrThat() {
  if (!state.user) return;
  const options = getPairForToday();
  const votes = state.totData?.votes || {};
  const myVote = votes[state.user.uid];
  const pUid = state.partner?.uid;
  const partnerVote = pUid ? votes[pUid] : undefined;

  $("#totPrompt").textContent = "Elijan sin ver primero la respuesta del otro.";
  const box = $("#totOptions");
  box.textContent = "";
  options.forEach((label, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tot-option ${myVote === idx ? "selected" : ""}`;
    btn.textContent = label;
    btn.addEventListener("click", () => voteThisOrThat(idx));
    box.appendChild(btn);
  });

  const result = $("#totResult");
  if (myVote === undefined) result.textContent = "Elige una opción ♡";
  else if (!pUid) result.textContent = "Esperando a que se una tu persona.";
  else if (partnerVote === undefined) result.textContent = "Tu respuesta está guardada. Falta la otra 💗";
  else if (partnerVote === myVote) result.textContent = `💗 ¡Coincidieron! Los dos eligieron ${options[myVote]}`;
  else result.textContent = `🫧 Tú: ${options[myVote]} · Tu persona: ${options[partnerVote]}`;
}

function renderDailyQuestion() {
  if (!state.user) return;
  const q = getQuestionForToday();
  $("#dailyQuestion").textContent = q;
  const answers = state.questionData?.answers || {};
  const mine = answers[state.user.uid] || "";
  const partner = state.partner ? (answers[state.partner.uid] || "") : "";
  if (document.activeElement !== $("#dailyAnswer")) $("#dailyAnswer").value = mine;

  const box = $("#partnerAnswerBox");
  const out = $("#partnerDailyAnswer");
  if (mine && partner) {
    box.classList.remove("locked");
    out.textContent = partner;
  } else {
    box.classList.add("locked");
    out.textContent = mine ? "Tu respuesta está guardada. Falta la otra." : "Se desbloquea cuando ambos respondan.";
  }
}


async function awardAppPoints(uid, claimId, amount, reason) {
  if (!state.db || !uid || !amount) return false;
  const ref = firebase.doc(state.db, "shared", "appPoints");
  const safeClaim = `${uid}_${claimId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

  try {
    return await firebase.runTransaction(state.db, async tx => {
      const snap = await tx.get(ref);
      const data = snap.exists() ? snap.data() : {};
      const claimed = data.claimed || {};
      if (claimed[safeClaim]) return false;
      const byUid = { ...(data.byUid || {}) };
      byUid[uid] = Number(byUid[uid] || 0) + amount;
      claimed[safeClaim] = { amount, reason, at: Date.now() };
      tx.set(ref, {
        byUid,
        claimed,
        total: Number(data.total || 0) + amount,
        updatedAt: firebase.serverTimestamp()
      }, { merge:true });
      return true;
    });
  } catch (e) {
    console.warn("No se pudieron guardar puntos", e);
    return false;
  }
}

async function markDailyActive(source = "app") {
  if (!state.user || !state.db) return;
  const dayRef = firebase.doc(state.db, "games", `streak_${state.todayKey}`);

  try {
    await firebase.setDoc(dayRef, {
      type:"streakDay",
      date:state.todayKey,
      updatedAt:firebase.serverTimestamp()
    }, { merge:true });

    await firebase.updateDoc(dayRef, {
      [`active.${state.user.uid}`]: { source, at:Date.now() },
      updatedAt:firebase.serverTimestamp()
    });

    if (!state.partner) return;

    const streakRef = firebase.doc(state.db, "shared", "coupleStreak");
    const result = await firebase.runTransaction(state.db, async tx => {
      const daySnap = await tx.get(dayRef);
      const day = daySnap.exists() ? daySnap.data() : {};
      const active = day.active || {};
      if (!active[state.user.uid] || !active[state.partner.uid] || day.completed) return null;

      const streakSnap = await tx.get(streakRef);
      const streak = streakSnap.exists() ? streakSnap.data() : {};
      const last = streak.lastCompletedDate || "";
      let count = 1;
      if (last === state.todayKey) count = Number(streak.count || 1);
      else if (last === previousDateKey(state.todayKey)) count = Number(streak.count || 0) + 1;

      tx.set(dayRef, {
        completed:true,
        completedAt:firebase.serverTimestamp(),
        streakCount:count
      }, { merge:true });

      tx.set(streakRef, {
        count,
        lastCompletedDate:state.todayKey,
        updatedAt:firebase.serverTimestamp()
      }, { merge:true });

      return count;
    });

    if (result) {
      await Promise.all([
        awardAppPoints(state.user.uid, `streak_${state.todayKey}`, 2, "Racha diaria"),
        awardAppPoints(state.partner.uid, `streak_${state.todayKey}`, 2, "Racha diaria")
      ]);
      toast(`🔥 ¡Racha de ${result} ${result === 1 ? "día" : "días"}! +2 puntos cada uno`, 3600);
    }
  } catch (e) {
    console.warn("No se pudo activar la racha", e);
  }
}

async function voteCompatibility(choice) {
  if (!state.user) return;
  const game = getCompatibilityToday();
  const ref = firebase.doc(state.db, "games", `compat_${state.todayKey}`);
  try {
    await firebase.setDoc(ref, {
      type:"compatibility",
      date:state.todayKey,
      question:game.q,
      options:game.options,
      updatedAt:firebase.serverTimestamp()
    }, { merge:true });
    await firebase.updateDoc(ref, {
      [`votes.${state.user.uid}`]:choice,
      updatedAt:firebase.serverTimestamp()
    });
    await markDailyActive("compatibility");
  } catch (e) { toast(niceError(e)); }
}

async function saveGuessGame() {
  if (!state.user) return;
  if (state.guessMineChoice === null || state.guessPartnerChoice === null) {
    return toast("Elige tu respuesta y también tu predicción.");
  }
  const game = getGuessToday();
  const ref = firebase.doc(state.db, "games", `guess_${state.todayKey}`);
  try {
    await firebase.setDoc(ref, {
      type:"guess",
      date:state.todayKey,
      question:game.q,
      options:game.options,
      updatedAt:firebase.serverTimestamp()
    }, { merge:true });
    await firebase.updateDoc(ref, {
      [`answers.${state.user.uid}`]:state.guessMineChoice,
      [`guesses.${state.user.uid}`]:state.guessPartnerChoice,
      updatedAt:firebase.serverTimestamp()
    });
    toast("Tus respuestas quedaron guardadas 💗");
    await markDailyActive("guess");
  } catch (e) { toast(niceError(e)); }
}

async function maybeAwardGuessPoints() {
  if (!state.user || !state.partner || !state.guessData) return;
  const answers = state.guessData.answers || {};
  const guesses = state.guessData.guesses || {};
  const myGuess = guesses[state.user.uid];
  const partnerAnswer = answers[state.partner.uid];
  if (myGuess === undefined || partnerAnswer === undefined || myGuess !== partnerAnswer) return;
  await awardAppPoints(state.user.uid, `guess_${state.todayKey}`, 3, "Adivina mi respuesta");
}

async function markRead() {
  if (!state.user || state.currentView !== "Chat") return;
  try {
    await firebase.setDoc(firebase.doc(state.db, "shared", "reads"), {
      [state.user.uid]: firebase.serverTimestamp()
    }, { merge:true });
  } catch {}
}

async function updatePresence(online) {
  if (!state.user) return;
  try {
    await firebase.setDoc(firebase.doc(state.db, "presence", state.user.uid), {
      uid: state.user.uid,
      online,
      lastSeen: firebase.serverTimestamp()
    }, { merge:true });
  } catch {}
}

async function setTyping(typing) {
  if (!state.user || state.typingSent === typing) return;
  state.typingSent = typing;
  try {
    await firebase.setDoc(firebase.doc(state.db, "typing", state.user.uid), {
      uid: state.user.uid,
      typing,
      updatedAt: firebase.serverTimestamp()
    }, { merge:true });
  } catch {}
}

function renderStickerTray() {
  const grid = $("#stickerGrid");
  if (!grid) return;
  grid.textContent = "";
  STICKERS.forEach(sticker => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sticker-option";
    btn.innerHTML = `<span class="sticker-emoji">${sticker.emoji}</span><span class="sticker-label"></span>`;
    btn.querySelector(".sticker-label").textContent = sticker.label;
    btn.addEventListener("click", () => sendSticker(sticker.id));
    grid.appendChild(btn);
  });
}

function toggleStickerTray(force) {
  const tray = $("#stickerTray");
  if (!tray) return;
  const shouldOpen = force === undefined ? tray.classList.contains("hidden") : !!force;
  tray.classList.toggle("hidden", !shouldOpen);
  if (shouldOpen) {
    renderStickerTray();
    setTyping(false);
  }
}

async function sendSticker(stickerId) {
  if (!state.user) return;
  const sticker = STICKERS.find(s => s.id === stickerId);
  if (!sticker) return;
  try {
    await firebase.addDoc(firebase.collection(state.db, "messages"), {
      senderId:state.user.uid,
      text:"",
      imageData:"",
      stickerId:sticker.id,
      stickerEmoji:sticker.emoji,
      stickerText:sticker.label,
      createdAt:firebase.serverTimestamp()
    });
    toggleStickerTray(false);
    await setTyping(false);
    requestAnimationFrame(scrollMessages);
    markDailyActive("sticker");
  } catch (e) {
    toast(niceError(e));
  }
}

async function sendMessage(text, imageData = "") {
  if (!state.user) return;
  const clean = String(text || "").trim();
  if (!clean && !imageData) return;
  await firebase.addDoc(firebase.collection(state.db, "messages"), {
    senderId: state.user.uid,
    text: clean.slice(0,3500),
    imageData: imageData || "",
    createdAt: firebase.serverTimestamp()
  });
  $("#messageInput").value = "";
  autoGrow($("#messageInput"));
  await setTyping(false);
  requestAnimationFrame(scrollMessages);
  markDailyActive(imageData ? "photo" : "message");
}

async function saveStatus(emoji, text) {
  if (!state.user) return;
  try {
    await firebase.updateDoc(firebase.doc(state.db, "profiles", state.user.uid), {
      statusEmoji: emoji,
      statusText: String(text).trim().slice(0,60),
      updatedAt: firebase.serverTimestamp()
    });
    $("#statusModal").classList.add("hidden");
    $("#customStatusInput").value = "";
    toast("Estado actualizado ✨");
  } catch (e) { toast(niceError(e)); }
}

async function sendNudge() {
  if (!state.user || !state.partner) return toast("Falta que se una tu persona 🫧");
  try {
    await firebase.addDoc(firebase.collection(state.db, "nudges"), {
      senderId: state.user.uid,
      targetId: state.partner.uid,
      createdAt: firebase.serverTimestamp()
    });
    toast("Toquecito enviado 💗");
  } catch (e) { toast(niceError(e)); }
}

async function saveProfile() {
  const uid = state.user.uid;
  const displayName = $("#profileNameInput").value.trim().slice(0,30);
  const newHandle = normalizeHandle($("#profileHandleInput").value);
  const bio = $("#profileBioInput").value.trim().slice(0,120);

  if (!displayName) return toast("Escribe tu nombre.");
  if (!validHandle(newHandle)) return toast("El usuario debe tener 3–20 caracteres válidos.");

  try {
    const oldHandle = state.me.handle;
    const batch = firebase.writeBatch(state.db);

    if (newHandle !== oldHandle) {
      const newAliasRef = firebase.doc(state.db, "aliases", newHandle);
      const existing = await firebase.getDoc(newAliasRef);
      if (existing.exists() && existing.data().uid !== uid) return toast("Ese nombre de usuario ya está ocupado.");
      batch.set(newAliasRef, {
        uid,
        email: state.user.email,
        createdAt: firebase.serverTimestamp()
      });
      if (oldHandle) batch.delete(firebase.doc(state.db, "aliases", oldHandle));
    }

    batch.update(firebase.doc(state.db, "profiles", uid), {
      displayName,
      handle: newHandle,
      bio,
      updatedAt: firebase.serverTimestamp()
    });
    await batch.commit();
    toast("Perfil guardado ♡");
  } catch (e) { toast(niceError(e)); }
}

async function voteThisOrThat(choice) {
  if (!state.user) return;
  const ref = firebase.doc(state.db, "games", `tot_${state.todayKey}`);
  try {
    await firebase.setDoc(ref, {
      type: "thisOrThat",
      date: state.todayKey,
      options: getPairForToday(),
      updatedAt: firebase.serverTimestamp()
    }, { merge:true });
    await firebase.updateDoc(ref, {
      [`votes.${state.user.uid}`]: choice,
      updatedAt: firebase.serverTimestamp()
    });
    await markDailyActive("this-or-that");
  } catch (e) { toast(niceError(e)); }
}

async function saveDailyAnswer() {
  if (!state.user) return;
  const answer = $("#dailyAnswer").value.trim().slice(0,500);
  if (!answer) return toast("Escribe una respuesta primero.");
  const ref = firebase.doc(state.db, "games", `question_${state.todayKey}`);
  try {
    await firebase.setDoc(ref, {
      type: "question",
      date: state.todayKey,
      question: getQuestionForToday(),
      updatedAt: firebase.serverTimestamp()
    }, { merge:true });
    await firebase.updateDoc(ref, {
      [`answers.${state.user.uid}`]: answer,
      updatedAt: firebase.serverTimestamp()
    });
    toast("Respuesta guardada 💗");
    await markDailyActive("daily-question");
  } catch (e) { toast(niceError(e)); }
}

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(112, el.scrollHeight)}px`;
}

async function compressImage(file, maxDim = 900, quality = .72) {
  if (!file?.type?.startsWith("image/")) throw new Error("Selecciona una imagen.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d", {alpha:false}).drawImage(bitmap, 0, 0, w, h);
  let data = canvas.toDataURL("image/jpeg", quality);
  if (data.length > 650000 && maxDim > 650) return compressImage(file, 640, .58);
  if (data.length > 780000) throw new Error("La foto sigue siendo muy pesada. Prueba con otra.");
  return data;
}

function openImage(src) {
  $("#imagePreview").src = src;
  $("#imagePreviewModal").classList.remove("hidden");
}


const GAME_PATHS = {
  burbujacraft: [
    "./burbujacraft/",
    "./Burbujacraft/",
    "./BURBUJACRAFT/",
    "./bubujacraft/",
    "./Bubujacraft/"
  ],
  hungry: [
    "./burbuja-hambrienta/",
    "./burbuja_hambrienta/",
    "./burbuja%20hambrienta/",
    "./Burbuja%20Hambrienta/",
    "./Burbuja-Hambrienta/",
    "./burbuja-hambrienta-github/",
    "./burbuja_hambrienta_github/"
  ]
};

async function findGamePath(paths) {
  for (const path of paths) {
    try {
      const url = new URL(path, location.href);
      const res = await fetch(url.href, { method:"HEAD", cache:"no-store" });
      if (res.ok) return url.href;
    } catch {}
  }
  return "";
}

async function launchGame(kind, title) {
  const paths = GAME_PATHS[kind] || [];
  toast(`Abriendo ${title}…`, 1400);
  const found = await findGamePath(paths);
  if (!found) {
    toast(`No encontré la carpeta de ${title}. Revisa el nombre en GitHub.`, 4800);
    return;
  }
  state.currentGameUrl = found;
  $("#gameLauncherTitle").textContent = title;
  $("#gameFrame").src = found;
  $("#gameLauncherModal").classList.remove("hidden");
}

function closeGameLauncher() {
  $("#gameLauncherModal").classList.add("hidden");
  $("#gameFrame").src = "about:blank";
  state.currentGameUrl = "";
  updatePresence(true);
}

function bindUI() {
  renderStickerTray();
  $("#tabLogin").addEventListener("click", () => switchAuthTab("login"));
  $("#tabRegister").addEventListener("click", () => switchAuthTab("register"));

  $$("[data-toggle-password]").forEach(btn => btn.addEventListener("click", () => {
    const input = $(btn.dataset.togglePassword);
    input.type = input.type === "password" ? "text" : "password";
  }));

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    try {
      await loginWithHandle($("#loginUser").value, $("#loginPassword").value);
    } catch (err) { toast(niceError(err), 3600); }
    finally { btn.disabled = false; }
  });

  $("#registerForm").addEventListener("submit", async e => {
    e.preventDefault();
    const p1 = $("#registerPassword").value;
    const p2 = $("#registerPassword2").value;
    if (p1 !== p2) return toast("Las contraseñas no coinciden.");
    const btn = e.submitter;
    btn.disabled = true;
    try {
      await registerAccount($("#registerName").value, $("#registerUser").value, p1);
    } catch (err) { toast(niceError(err), 4200); }
    finally { btn.disabled = false; }
  });

  $$(".nav-btn").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  $("#partnerHeader").addEventListener("click", () => switchView("Us"));
  $("#pinnedBanner").addEventListener("click", () => switchView("Us"));

  $("#openBurbujacraft")?.addEventListener("click", () => launchGame("burbujacraft", "Burbujacraft"));
  $("#openBurbujaHambrienta")?.addEventListener("click", () => launchGame("hungry", "Burbuja Hambrienta"));
  $("#closeGameLauncher")?.addEventListener("click", closeGameLauncher);
  $("#openGameNewTab")?.addEventListener("click", () => {
    if (state.currentGameUrl) window.open(state.currentGameUrl, "_blank", "noopener");
  });

  $("#composer").addEventListener("submit", async e => {
    e.preventDefault();
    const text = $("#messageInput").value;
    try { await sendMessage(text); }
    catch (err) { toast(niceError(err)); }
  });

  $("#messageInput").addEventListener("input", () => {
    autoGrow($("#messageInput"));
    setTyping(true);
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => setTyping(false), 1500);
  });
  $("#messageInput").addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 700) {
      e.preventDefault();
      $("#composer").requestSubmit();
    }
  });

  $("#attachImageBtn").addEventListener("click", () => {
    toggleStickerTray(false);
    $("#chatImageInput").click();
  });
  $("#openStickerBtn")?.addEventListener("click", () => toggleStickerTray());
  $("#closeStickerTray")?.addEventListener("click", () => toggleStickerTray(false));
  $("#messageInput").addEventListener("focus", () => toggleStickerTray(false));

  $("#chatImageInput").addEventListener("change", async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    toast("Preparando foto…");
    try {
      const data = await compressImage(file);
      await sendMessage("", data);
    } catch (err) { toast(niceError(err), 3800); }
  });

  $("#openStatusBtn").addEventListener("click", () => $("#statusModal").classList.remove("hidden"));
  $("#closeStatusModal").addEventListener("click", () => $("#statusModal").classList.add("hidden"));
  $("#statusModal").addEventListener("click", e => { if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden"); });
  $("#saveCustomStatus").addEventListener("click", () => {
    const text = $("#customStatusInput").value.trim();
    if (!text) return;
    saveStatus("✨", text);
  });

  ["nudgeBtn","headerNudge"].forEach(id => $("#"+id).addEventListener("click", sendNudge));

  $("#savePinnedBtn").addEventListener("click", async () => {
    try {
      await firebase.setDoc(firebase.doc(state.db, "shared", "pinned"), {
        text: $("#pinnedInput").value.trim().slice(0,140),
        updatedBy: state.user.uid,
        updatedAt: firebase.serverTimestamp()
      });
      toast("Mensaje fijado 📌");
    } catch (e) { toast(niceError(e)); }
  });

  $("#relationshipDate").addEventListener("change", async e => {
    if (!e.target.value) return;
    try {
      await firebase.setDoc(firebase.doc(state.db, "shared", "relationship"), {
        startDate: e.target.value,
        updatedBy: state.user.uid,
        updatedAt: firebase.serverTimestamp()
      });
      toast("Fecha guardada ♡");
    } catch (err) { toast(niceError(err)); }
  });

  $("#saveProfileBtn").addEventListener("click", saveProfile);

  $("#avatarPickerBtn").addEventListener("click", () => $("#avatarInput").click());
  $("#avatarInput").addEventListener("change", async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    toast("Preparando tu foto…");
    try {
      const data = await compressImage(file, 360, .68);
      await firebase.updateDoc(firebase.doc(state.db, "profiles", state.user.uid), {
        avatarData: data,
        updatedAt: firebase.serverTimestamp()
      });
      toast("Foto de perfil actualizada ♡");
    } catch (err) { toast(niceError(err), 3800); }
  });

  $("#changePasswordBtn").addEventListener("click", async () => {
    const pw = $("#newPasswordInput").value;
    if (pw.length < 8) return toast("Usa al menos 8 caracteres.");
    try {
      await firebase.updatePassword(state.auth.currentUser, pw);
      $("#newPasswordInput").value = "";
      toast("Contraseña actualizada 🔒");
    } catch (err) { toast(niceError(err), 4000); }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    await updatePresence(false);
    await firebase.signOut(state.auth);
  });

  $("#saveDailyAnswer").addEventListener("click", saveDailyAnswer);
  $("#saveGuessGame")?.addEventListener("click", saveGuessGame);

  $("#rouletteBtn")?.addEventListener("click", () => {
    const result = $("#rouletteResult");
    let i = 0;
    result.classList.remove("chosen");
    const timer = setInterval(() => {
      result.textContent = ROULETTE[i % ROULETTE.length];
      i++;
      if (i > 13) {
        clearInterval(timer);
        const pick = ROULETTE[Math.floor(Math.random() * ROULETTE.length)];
        result.textContent = pick;
        result.classList.add("chosen");
      }
    }, 70);
  });

  $("#closeImagePreview").addEventListener("click", () => $("#imagePreviewModal").classList.add("hidden"));
  $("#imagePreviewModal").addEventListener("click", e => { if (e.target === e.currentTarget || e.target.id === "imagePreviewModal") e.currentTarget.classList.add("hidden"); });

  document.addEventListener("visibilitychange", () => updatePresence(!document.hidden));
  window.addEventListener("pagehide", () => { updatePresence(false); setTyping(false); });

  window.addEventListener("focus", () => { updatePresence(true); if (state.currentView === "Chat") markRead(); });
}

bindUI();
loadFirebase().catch(err => {
  console.error(err);
  showScreen("setup");
  toast("No se pudo iniciar Firebase. Revisa la configuración.", 5000);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.warn));
}
