import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "12.18.0";
const BURBUJA_VERSION = "entrada-simple-20260903";

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
  currentGameUrl: "",
  currentGameTitle: "",
  accountProfile: null,
  bubbles: [],
  activeBubbleId: "",
  activeBubble: null,
  bubbleChooserFromApp: false,
  legacyMigrating: false,
  statuses: [],
  replyTo: null,
  editMessageId: "",
  messageActionId: "",
  pendingImages: [],
  stickerTab: "phrases",
  searchTerm: "",
  olderExhausted: false,
  storyViewerItems: [],
  storyViewerIndex: 0,
  storyDraftImage: "",
  unreadWhileUp: 0,
  unreadTotal: 0,
  lastReadAt: 0,
  firstUnreadId: "",
  lastPartnerStoryCount: 0,
  lastPartnerQuestionNotice: "",
  whileAwayItems: [],
  gameWireDate: "",
  newestMessageId: "",
  editingBubbleId: "",
  lastMarkedReadMessageId: "",
  keyboardSession: null,
  streakRepairBusy: false,
  streakRepairAt: 0,
  streakRepairCount: 0,
  savedMessages: {},
  sharedNote: null,
  specialDates: [],
  chatAppearance: null,
  archiveMessages: [],
  archiveCursor: null,
  archiveDone: false,
  archiveLoadedAt: 0,
  memoryMessageId: "",
  chatPositionRestored: false,
  viewportSettleTimer: null,
  presenceOverride: ""
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
  {id:"te_amo", emoji:"❤️", label:"Te amo", kind:"phrase"},
  {id:"besito", emoji:"😘", label:"Besito", kind:"phrase"},
  {id:"abrazo", emoji:"🫂", label:"Abrazo", kind:"phrase"},
  {id:"te_extrano", emoji:"🥺", label:"Te extraño", kind:"phrase"},
  {id:"muak", emoji:"💋", label:"Muak", kind:"phrase"},
  {id:"buenos_dias", emoji:"☀️", label:"Buenos días", kind:"phrase"},
  {id:"buenas_noches", emoji:"🌙", label:"Buenas noches", kind:"phrase"},
  {id:"jajaja", emoji:"😂", label:"JAJAJA", kind:"phrase"},
  {id:"sueno", emoji:"😴", label:"Tengo sueño", kind:"phrase"},
  {id:"jugamos", emoji:"🎮", label:"¿Jugamos?", kind:"phrase"},
  {id:"para_ti", emoji:"🎁", label:"Para ti", kind:"phrase"},
  {id:"me_encantas", emoji:"💕", label:"Me encantas", kind:"phrase"},
  {id:"quiero_verte", emoji:"🥹", label:"Quiero verte", kind:"phrase"}
];
const MAPACHIN_STICKERS = Array.from({length:10},(_,i)=>{
  const n=String(i+1).padStart(2,"0");
  return {id:`mapachin_${n}`,kind:"mapachin",asset:`./assets/stickers/mapachin/mapachin-${n}.webp`,label:""};
});

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
  $("#loadingScreen")?.classList.toggle("hidden", name !== "loading");
  $("#setupScreen").classList.toggle("hidden", name !== "setup");
  $("#authScreen").classList.toggle("hidden", name !== "auth");
  $("#bubbleScreen").classList.toggle("hidden", name !== "bubbles");
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


function messageDateKey(ts){const m=tsMillis(ts);if(!m)return "";const d=new Date(m);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function dateSeparatorLabel(ts){const m=tsMillis(ts);if(!m)return "";const d=new Date(m),today=new Date();const a=new Date(today.getFullYear(),today.getMonth(),today.getDate()).getTime(),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime(),diff=Math.round((a-b)/86400000);if(diff===0)return "Hoy";if(diff===1)return "Ayer";return new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"long",year:d.getFullYear()===today.getFullYear()?undefined:"numeric"}).format(d)}
function relativeTime(ts){const m=tsMillis(ts);if(!m)return "ahora";const s=Math.max(0,Math.floor((Date.now()-m)/1000));if(s<60)return "ahora";if(s<3600)return `hace ${Math.floor(s/60)} min`;if(s<86400)return `hace ${Math.floor(s/3600)} h`;return dateSeparatorLabel(ts)}
function haptic(ms=12){try{navigator.vibrate?.(ms)}catch{}}
function draftKey(){return `burbuja-draft-${state.user?.uid||"anon"}-${state.activeBubbleId||"none"}`}
function saveDraft(){if(!state.user||!state.activeBubbleId)return;localStorage.setItem(draftKey(),$("#messageInput")?.value||"")}
function restoreDraft(){const el=$("#messageInput");if(!el)return;el.value=localStorage.getItem(draftKey())||"";autoGrow(el)}
function bubbleLocalKey(kind){return `burbuja-${kind}-${state.user?.uid||"anon"}-${state.activeBubbleId||"none"}`}
function saveCurrentChatPosition(){
  if(!state.user||!state.activeBubbleId)return;
  const box=$("#messages");if(!box)return;
  const payload=nearBottom(120)?{bottom:true}:{bottom:false,top:Math.max(0,Math.round(box.scrollTop))};
  try{localStorage.setItem(bubbleLocalKey("chat-position"),JSON.stringify(payload))}catch{}
}
function restoreChatPositionOnce(){
  if(state.chatPositionRestored)return;
  state.chatPositionRestored=true;
  const box=$("#messages");if(!box)return;
  let saved=null;try{saved=JSON.parse(localStorage.getItem(bubbleLocalKey("chat-position"))||"null")}catch{}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(saved&&!saved.bottom&&Number.isFinite(saved.top))box.scrollTop=Math.min(saved.top,Math.max(0,box.scrollHeight-box.clientHeight));
    else scrollMessages();
  }));
}

function stickerStorageKey(kind){return `burbuja-stickers-${kind}-${state.user?.uid||"anon"}`}
function getStickerSaved(kind){try{return JSON.parse(localStorage.getItem(stickerStorageKey(kind))||"[]")}catch{return[]}}
function setStickerSaved(kind,arr){localStorage.setItem(stickerStorageKey(kind),JSON.stringify([...new Set(arr)].slice(0,24)))}
function allStickerDefs(){return [...STICKERS,...MAPACHIN_STICKERS]}
function stickerById(id){return allStickerDefs().find(s=>s.id===id)}

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
  const allowed=["Chat","Us","Games","Profile"];
  if(!allowed.includes(view))view="Chat";
  const previous=state.currentView;
  if(previous==="Chat"&&view!=="Chat")saveCurrentChatPosition();
  state.currentView=view;
  if(state.user&&state.activeBubbleId)localStorage.setItem(bubbleLocalKey("view"),view);
  $("#appShell")?.setAttribute("data-view",view);
  $$(".view").forEach(el=>el.classList.remove("active-view"));
  $(`#view${view}`)?.classList.add("active-view");
  $$(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===view));
  if(view==="Chat"&&previous!=="Chat"){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!state.chatPositionRestored)restoreChatPositionOnce();markRead()}));
  }
  if(view==="Us"){
    renderBurbujaSummary();
    renderSpecialDates();
    setTimeout(()=>refreshMemoryCard(false),80);
  }
  if(state.user&&state.activeBubbleId)updatePresence(true);
}


function activeBubbleRequired() {
  if (!state.activeBubbleId) throw new Error("Elige una Burbuja primero.");
  return state.activeBubbleId;
}

function bubbleCollection(name) {
  return firebase.collection(state.db, "bubbles", activeBubbleRequired(), name);
}
function bubbleDoc(group, id) {
  return firebase.doc(state.db, "bubbles", activeBubbleRequired(), group, id);
}
function bubbleMemberDoc(uid = state.user?.uid) {
  return bubbleDoc("members", uid);
}
function membershipCollection(uid = state.user?.uid) {
  return firebase.collection(state.db, "users", uid, "memberships");
}
function membershipDoc(bubbleId, uid = state.user?.uid) {
  return firebase.doc(state.db, "users", uid, "memberships", bubbleId);
}
function normalizeInviteCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0,6);
}
function makeInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map(v => chars[v % chars.length]).join("");
}
function memberProfileData(profile = state.accountProfile || {}) {
  return {
    uid: state.user.uid,
    displayName: profile.displayName || "Mi persona",
    handle: profile.handle || "",
    bio: profile.bio || "",
    avatarData: profile.avatarData || "",
    statusEmoji: "👀",
    statusText: "Disponible",
    updatedAt: firebase.serverTimestamp()
  };
}
function resetBubbleRuntimeState() {
  state.profiles.clear();
  state.presence.clear();
  state.typing.clear();
  state.reads = {};
  state.messages = [];
  state.pinned = "";
  state.relationship = null;
  state.partner = null;
  state.me = null;
  state.lastNudges = [];
  state.burbujaPoints = null;
  state.appPoints = null;
  state.streakData = null;
  state.streakDayData = null;
  state.compatData = null;
  state.guessData = null;
  state.totData = null;
  state.questionData = null;
  state.guessMineChoice = null;
  state.guessPartnerChoice = null;
  state.statuses = []; state.replyTo=null; state.editMessageId=""; state.messageActionId=""; state.pendingImages=[]; state.searchTerm=""; state.olderExhausted=false; state.storyViewerItems=[]; state.storyViewerIndex=0; state.storyDraftImage=""; state.unreadWhileUp=0; state.unreadTotal=0; state.lastReadAt=0; state.firstUnreadId=""; state.lastPartnerStoryCount=0; state.lastPartnerQuestionNotice=""; state.whileAwayItems=[]; state.gameWireDate=""; state.newestMessageId="";
  state.savedMessages={};state.sharedNote=null;state.specialDates=[];state.chatAppearance=null;state.archiveMessages=[];state.archiveCursor=null;state.archiveDone=false;state.archiveLoadedAt=0;state.memoryMessageId="";state.chatPositionRestored=false;state.keyboardSession=null;state.presenceOverride="";state.streakRepairCount=0;state.streakRepairAt=0;
}


async function detectLegacySlot(uid) {
  for (const slotId of ["one", "two"]) {
    try {
      const snap = await firebase.getDoc(firebase.doc(state.db, "slots", slotId));
      if (snap.exists() && snap.data().uid === uid) return slotId;
    } catch {}
  }
  return null;
}

async function copyLegacyCollection(sourceName, bubbleId, targetName = sourceName) {
  const snap = await firebase.getDocs(firebase.collection(state.db, sourceName));
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 8) {
    const batch = firebase.writeBatch(state.db);
    for (const d of docs.slice(i, i + 8)) {
      batch.set(firebase.doc(state.db, "bubbles", bubbleId, targetName, d.id), d.data(), { merge:true });
    }
    await batch.commit();
  }
  return docs.length;
}

async function migrateLegacyData(bubbleId) {
  if (state.legacyMigrating) return;
  const ref = firebase.doc(state.db, "bubbles", bubbleId);
  const before = await firebase.getDoc(ref);
  if (!before.exists() || before.data().legacyMigrationComplete) return;
  state.legacyMigrating = true;
  toast("Importando tu Burbuja anterior… no cierres la página.", 6000);
  try {
    await copyLegacyCollection("messages", bubbleId);
    await copyLegacyCollection("shared", bubbleId);
    await copyLegacyCollection("games", bubbleId);
    await copyLegacyCollection("nudges", bubbleId);
    await firebase.updateDoc(ref, {
      legacyMigrationComplete:true,
      legacyMigratedAt:firebase.serverTimestamp(),
      updatedAt:firebase.serverTimestamp()
    });
    toast("Tu Burbuja anterior quedó migrada ♡", 3200);
  } finally {
    state.legacyMigrating = false;
  }
}

async function ensureLegacyMembership() {
  const slot = await detectLegacySlot(state.user.uid);
  if (!slot) return false;
  const bubbleId = "legacy-main-v1";
  const bubbleRef = firebase.doc(state.db, "bubbles", bubbleId);
  let bubbleSnap = null;
  try { bubbleSnap = await firebase.getDoc(bubbleRef); } catch {}

  if (!bubbleSnap?.exists()) {
    let code = makeInviteCode();
    for (let i=0;i<5;i++) {
      const c = await firebase.getDoc(firebase.doc(state.db,"inviteCodes",code));
      if (!c.exists()) break;
      code = makeInviteCode();
    }
    const batch = firebase.writeBatch(state.db);
    batch.set(bubbleRef, {
      name:"Nuestra Burbuja",
      emoji:"💜",
      inviteCode:code,
      memberIds:[state.user.uid],
      memberCount:1,
      createdBy:state.user.uid,
      legacy:true,
      legacyMigrationComplete:false,
      createdAt:firebase.serverTimestamp(),
      updatedAt:firebase.serverTimestamp()
    });
    batch.set(firebase.doc(state.db,"inviteCodes",code), {
      bubbleId, active:true, createdBy:state.user.uid, createdAt:firebase.serverTimestamp()
    });
    batch.set(firebase.doc(state.db,"bubbles",bubbleId,"members",state.user.uid), {
      ...memberProfileData(), joinedAt:firebase.serverTimestamp(), legacySlot:slot
    });
    batch.set(membershipDoc(bubbleId), {
      bubbleId,name:"Nuestra Burbuja",emoji:"💜",inviteCode:code,joinedAt:firebase.serverTimestamp()
    });
    await batch.commit();
  } else {
    const data = bubbleSnap.data();
    if (!(data.memberIds || []).includes(state.user.uid)) {
      await firebase.runTransaction(state.db, async tx => {
        const fresh = await tx.get(bubbleRef);
        const d = fresh.data() || {};
        const ids = [...(d.memberIds || [])];
        if (!ids.includes(state.user.uid)) {
          if (ids.length >= 2) throw new Error("La Burbuja anterior ya tiene dos integrantes.");
          ids.push(state.user.uid);
          tx.update(bubbleRef,{memberIds:ids,memberCount:ids.length,updatedAt:firebase.serverTimestamp()});
        }
        tx.set(firebase.doc(state.db,"bubbles",bubbleId,"members",state.user.uid), {
          ...memberProfileData(), joinedAt:firebase.serverTimestamp(), legacySlot:slot
        }, {merge:true});
        tx.set(membershipDoc(bubbleId), {
          bubbleId,name:d.name||"Nuestra Burbuja",emoji:d.emoji||"💜",inviteCode:d.inviteCode||"",joinedAt:firebase.serverTimestamp()
        }, {merge:true});
      });
    } else {
      await firebase.setDoc(firebase.doc(state.db,"bubbles",bubbleId,"members",state.user.uid), memberProfileData(), {merge:true});
      await firebase.setDoc(membershipDoc(bubbleId), {
        bubbleId,name:data.name||"Nuestra Burbuja",emoji:data.emoji||"💜",inviteCode:data.inviteCode||""
      }, {merge:true});
    }
  }

  try { await migrateLegacyData(bubbleId); } catch (e) { console.warn("Migración anterior incompleta", e); }
  return true;
}

async function loadMemberships() {
  const snap = await firebase.getDocs(membershipCollection());
  const resolved = await Promise.all(snap.docs.map(async d => {
    try {
      const b = await firebase.getDoc(firebase.doc(state.db,"bubbles",d.id));
      if (b.exists() && (b.data().memberIds || []).includes(state.user.uid)) return {id:d.id,...b.data()};
    } catch {}
    return null;
  }));
  const rows = resolved.filter(Boolean);
  rows.sort((a,b) => tsMillis(b.updatedAt)-tsMillis(a.updatedAt));
  state.bubbles = rows;
  try{localStorage.setItem(`burbuja-memberships-${state.user.uid}`,JSON.stringify(rows.map(b=>({id:b.id,name:b.name||"Nuestra Burbuja",emoji:b.emoji||"🫧",inviteCode:b.inviteCode||"",memberCount:b.memberCount||b.memberIds?.length||1,memberIds:b.memberIds||[],updatedAt:tsMillis(b.updatedAt)}))))}catch{}
  return rows;
}

function renderBubbleChooser() {
  const list = $("#bubbleList");
  if (!list) return;
  $("#bubbleAccountName").textContent = `${state.accountProfile?.displayName || "Tu cuenta"} · ${state.bubbles.length} ${state.bubbles.length===1?"Burbuja":"Burbujas"}`;
  $("#bubbleBackBtn").classList.toggle("hidden", !state.activeBubbleId || !state.bubbleChooserFromApp);
  list.textContent = "";
  if (!state.bubbles.length) {
    const empty=document.createElement("div");empty.className="bubble-list-empty";
    empty.innerHTML="<span>🫧</span><strong>Aún no tienes una Burbuja</strong><small>Crea una o usa el código que te compartió tu persona.</small>";
    list.appendChild(empty);return;
  }
  for (const bubble of state.bubbles) {
    const row=document.createElement("article");
    row.className=`bubble-list-card ${bubble.id===state.activeBubbleId?"active-bubble":""}`;
    const top=document.createElement("div");top.className="bubble-card-main";
    const emoji=document.createElement("div");emoji.className="bubble-list-emoji";emoji.textContent=bubble.emoji||"🫧";
    const copy=document.createElement("div");copy.className="bubble-list-copy";
    const strong=document.createElement("strong");strong.textContent=bubble.name||"Nuestra Burbuja";
    const count=Number(bubble.memberCount||bubble.memberIds?.length||1);
    const small=document.createElement("small");small.textContent=count>=2?"2 personas · completa":"1 persona · esperando a tu persona";
    const unreadBadge=document.createElement("em");unreadBadge.className="bubble-unread-badge hidden";unreadBadge.dataset.unreadBubble=bubble.id;copy.append(strong,small,unreadBadge);
    const edit=document.createElement("button");edit.type="button";edit.className="bubble-edit-btn";edit.textContent="✎";edit.setAttribute("aria-label","Editar Burbuja");edit.addEventListener("click",()=>openEditBubble(bubble.id));
    top.append(emoji,copy,edit);

    const codeRow=document.createElement("div");codeRow.className="bubble-code-row";
    const codeLabel=document.createElement("span");codeLabel.innerHTML=`<small>CÓDIGO</small><b>${bubble.inviteCode||"------"}</b>`;
    const copyCode=document.createElement("button");copyCode.type="button";copyCode.className="bubble-copy-btn";copyCode.textContent=count>=2?"Copiar":"Invitar";copyCode.disabled=!bubble.inviteCode;
    copyCode.addEventListener("click",()=>openInvitePartnerForBubble(bubble));
    codeRow.append(codeLabel,copyCode);

    const enter=document.createElement("button");enter.type="button";enter.className="bubble-enter-btn";enter.textContent=bubble.id===state.activeBubbleId?"Abrir esta Burbuja":"Entrar";
    enter.addEventListener("click",()=>enterBubble(bubble.id));
    row.append(top,codeRow,enter);list.appendChild(row);
  }
  loadBubbleUnreadCounts().catch(()=>{});
}

async function loadBubbleUnreadCounts(){
  if(!state.user)return;
  await Promise.all(state.bubbles.map(async b=>{
    try{
      const reads=await firebase.getDoc(firebase.doc(state.db,"bubbles",b.id,"shared","reads"));
      const last=tsMillis(reads.exists()?reads.data()?.[state.user.uid]:null);
      const q=firebase.query(firebase.collection(state.db,"bubbles",b.id,"messages"),firebase.orderBy("createdAt","desc"),firebase.limit(60));
      const snap=await firebase.getDocs(q);
      let n=0;snap.forEach(d=>{const m=d.data();if(m.senderId!==state.user.uid&&tsMillis(m.createdAt)>last&&!m.hiddenBy?.[state.user.uid])n++});
      const badge=document.querySelector(`[data-unread-bubble="${CSS.escape(b.id)}"]`);
      if(badge){badge.textContent=n?`${n} nuevo${n===1?"":"s"}`:"";badge.classList.toggle("hidden",!n)}
    }catch{}
  }));
}

function openBubbleForm(which){
  $("#bubbleForms")?.classList.remove("hidden");
  $$('[data-bubble-form]').forEach(f=>f.classList.toggle('hidden',f.dataset.bubbleForm!==which));
  requestAnimationFrame(()=>document.querySelector(`[data-bubble-form="${which}"] input`)?.focus({preventScroll:true}));
}
function closeBubbleForms(){
  $("#bubbleForms")?.classList.add("hidden");
  $$('[data-bubble-form]').forEach(f=>f.classList.add('hidden'));
}
function openEditBubble(bubbleId){
  const b=state.bubbles.find(x=>x.id===bubbleId);if(!b)return;
  state.editingBubbleId=bubbleId;
  $("#editBubbleId").value=bubbleId;
  $("#editBubbleName").value=b.name||"Nuestra Burbuja";
  $("#editBubbleEmoji").value=b.emoji||"💜";
  $("#editBubbleModal").classList.remove("hidden");
}
async function saveBubbleEdit(){
  const id=state.editingBubbleId||$("#editBubbleId").value;
  const name=$("#editBubbleName").value.trim().slice(0,28),emoji=$("#editBubbleEmoji").value||"🫧";
  if(!id||!name)return toast("Ponle un nombre a tu Burbuja.");
  const btn=$("#saveBubbleEdit");btn.disabled=true;
  try{
    await firebase.updateDoc(firebase.doc(state.db,"bubbles",id),{name,emoji,updatedAt:firebase.serverTimestamp()});
    if(state.activeBubbleId===id){state.activeBubble={...(state.activeBubble||{}),name,emoji};$("#currentBubbleName").textContent=name;$("#currentBubbleEmoji").textContent=emoji;}
    await loadMemberships();renderBubbleChooser();$("#editBubbleModal").classList.add("hidden");toast("Burbuja actualizada ♡");
  }catch(e){toast(niceError(e),4200)}finally{btn.disabled=false}
}
function openInvitePartnerForBubble(bubble){
  if(!bubble)return;
  $("#inviteCodeText").textContent=bubble.inviteCode||"------";
  $("#inviteBubbleLabel").textContent=`${bubble.emoji||"🫧"} ${bubble.name||"Nuestra Burbuja"}`;
  $("#invitePartnerModal").dataset.code=bubble.inviteCode||"";
  $("#invitePartnerModal").classList.remove("hidden");
}
function openCurrentInvite(){
  if(!state.activeBubble)return;
  openInvitePartnerForBubble(state.activeBubble);
}
async function copyCurrentInviteCode(){
  const code=$("#invitePartnerModal")?.dataset.code||state.activeBubble?.inviteCode||"";
  if(!code)return toast("Esta Burbuja no tiene código.");
  try{await navigator.clipboard.writeText(code);toast(`Código ${code} copiado ♡`)}catch{toast(`Código: ${code}`,4200)}
}

async function showBubbleChooser(fromApp = false) {
  state.bubbleChooserFromApp = fromApp;
  renderBubbleChooser();
  showScreen("bubbles");
  closeBubbleForms();
  // Refresh in the background; opening Mis Burbujas must never wait on the network.
  try { await loadMemberships(); renderBubbleChooser(); } catch(e) { console.warn("No se pudo refrescar Mis Burbujas", e); }
}

async function createBubble(name, emoji) {
  const clean=String(name||"").trim().slice(0,28);
  if (!clean) throw new Error("Ponle un nombre a tu Burbuja.");
  let code=makeInviteCode();
  for(let i=0;i<8;i++){
    const snap=await firebase.getDoc(firebase.doc(state.db,"inviteCodes",code));
    if(!snap.exists())break;
    code=makeInviteCode();
  }
  const bubbleRef=firebase.doc(firebase.collection(state.db,"bubbles"));
  const bubbleId=bubbleRef.id;
  const batch=firebase.writeBatch(state.db);
  batch.set(bubbleRef,{
    name:clean,emoji:emoji||"🫧",inviteCode:code,memberIds:[state.user.uid],memberCount:1,
    createdBy:state.user.uid,createdAt:firebase.serverTimestamp(),updatedAt:firebase.serverTimestamp(),version:2
  });
  batch.set(firebase.doc(state.db,"inviteCodes",code),{bubbleId,active:true,createdBy:state.user.uid,createdAt:firebase.serverTimestamp()});
  batch.set(firebase.doc(state.db,"bubbles",bubbleId,"members",state.user.uid),{...memberProfileData(),joinedAt:firebase.serverTimestamp()});
  batch.set(membershipDoc(bubbleId),{bubbleId,name:clean,emoji:emoji||"🫧",inviteCode:code,joinedAt:firebase.serverTimestamp()});
  await batch.commit();
  await loadMemberships();
  toast(`Burbuja creada · código ${code}`,4200);
  await enterBubble(bubbleId);
}

async function joinBubble(codeRaw) {
  const code=normalizeInviteCode(codeRaw);
  if(code.length!==6)throw new Error("Escribe el código de 6 caracteres.");
  const inviteRef=firebase.doc(state.db,"inviteCodes",code);
  const invite=await firebase.getDoc(inviteRef);
  if(!invite.exists()||invite.data().active===false)throw new Error("Ese código no existe o ya no está activo.");
  const bubbleId=invite.data().bubbleId;
  const bubbleRef=firebase.doc(state.db,"bubbles",bubbleId);
  await firebase.runTransaction(state.db,async tx=>{
    const snap=await tx.get(bubbleRef);
    if(!snap.exists())throw new Error("No encontré esa Burbuja.");
    const d=snap.data(), ids=[...(d.memberIds||[])];
    if(!ids.includes(state.user.uid)){
      if(ids.length>=2)throw new Error("🫧 Esta Burbuja ya está completa.");
      ids.push(state.user.uid);
      tx.update(bubbleRef,{memberIds:ids,memberCount:ids.length,updatedAt:firebase.serverTimestamp()});
    }
    tx.set(firebase.doc(state.db,"bubbles",bubbleId,"members",state.user.uid),{...memberProfileData(),joinedAt:firebase.serverTimestamp()},{merge:true});
    tx.set(membershipDoc(bubbleId),{bubbleId,name:d.name||"Nuestra Burbuja",emoji:d.emoji||"🫧",inviteCode:d.inviteCode||code,joinedAt:firebase.serverTimestamp()},{merge:true});
  });
  await loadMemberships();
  toast("Ya estás dentro de esta Burbuja ♡",2600);
  await enterBubble(bubbleId);
}



function lastAuthUid(){
  const explicit=localStorage.getItem("burbuja-last-auth-uid");
  if(explicit)return explicit;
  try{
    const key=Object.keys(localStorage).find(k=>{
      if(!k.startsWith("burbuja-active-"))return false;
      if(k==="burbuja-active-bubble")return false;
      if(k.startsWith("burbuja-active-meta-"))return false;
      return !!localStorage.getItem(k);
    });
    return key?key.slice("burbuja-active-".length):"";
  }catch{return ""}
}

function recentCacheKey(uid,bubbleId){return `burbuja-recent-cache-${uid}-${bubbleId}`}
function membersCacheKey(uid,bubbleId){return `burbuja-members-cache-${uid}-${bubbleId}`}

function lightCachedMessage(m){
  const hasPhotos=(Array.isArray(m.images)&&m.images.length)||m.imageData;
  // Las fotos completas NO se meten a localStorage: podrían llenarlo.
  // Se restauran apenas llega el snapshot real de Firestore.
  if(hasPhotos && !m.text && !m.stickerId && !m.systemEvent)return null;
  return {
    id:m.id,
    senderId:m.senderId,
    text:m.text||"",
    stickerId:m.stickerId||"",
    stickerEmoji:m.stickerEmoji||"",
    stickerText:m.stickerText||"",
    stickerAsset:m.stickerAsset||"",
    stickerKind:m.stickerKind||"",
    replyTo:m.replyTo||null,
    statusReply:m.statusReply||null,
    systemEvent:m.systemEvent||null,
    reactions:m.reactions||{},
    hiddenBy:m.hiddenBy||{},
    createdAt:tsMillis(m.createdAt)||Date.now(),
    editedAt:tsMillis(m.editedAt)||0
  };
}

function cacheRecentMessages(){
  if(!state.user?.uid||!state.activeBubbleId)return;
  try{
    const list=state.messages
      .slice(-70)
      .map(lightCachedMessage)
      .filter(Boolean)
      .slice(-35);
    localStorage.setItem(recentCacheKey(state.user.uid,state.activeBubbleId),JSON.stringify(list));
  }catch(e){
    try{
      const list=state.messages.slice(-15).map(lightCachedMessage).filter(Boolean);
      localStorage.setItem(recentCacheKey(state.user.uid,state.activeBubbleId),JSON.stringify(list));
    }catch{}
  }
}

function readRecentMessages(uid,bubbleId){
  try{
    const list=JSON.parse(localStorage.getItem(recentCacheKey(uid,bubbleId))||"[]");
    return Array.isArray(list)?list:[];
  }catch{return []}
}

function cacheMembers(){
  if(!state.user?.uid||!state.activeBubbleId)return;
  try{
    const list=[...state.profiles.entries()].map(([uid,p])=>[
      uid,{
        uid,
        displayName:p?.displayName||"",
        handle:p?.handle||"",
        bio:p?.bio||"",
        avatarData:(String(p?.avatarData||"").length<260000)?(p?.avatarData||""):"",
        status:p?.status||""
      }
    ]);
    localStorage.setItem(membersCacheKey(state.user.uid,state.activeBubbleId),JSON.stringify(list));
  }catch{}
}

function readCachedMembers(uid,bubbleId){
  try{
    const list=JSON.parse(localStorage.getItem(membersCacheKey(uid,bubbleId))||"[]");
    return Array.isArray(list)?new Map(list):new Map();
  }catch{return new Map()}
}

function setPrebootMode(on){
  document.documentElement.classList.toggle("burbuja-preboot",!!on);
  let badge=$("#prebootSyncBadge");
  if(on){
    if(!badge){
      badge=document.createElement("div");
      badge.id="prebootSyncBadge";
      badge.textContent="Sincronizando…";
      Object.assign(badge.style,{
        position:"fixed",zIndex:"9999",left:"50%",transform:"translateX(-50%)",
        top:"max(6px, env(safe-area-inset-top))",padding:"4px 9px",
        borderRadius:"999px",fontSize:"10px",fontWeight:"800",
        background:"rgba(22,17,28,.92)",color:"#ddd1dc",
        border:"1px solid rgba(255,255,255,.09)",pointerEvents:"none"
      });
      document.body.appendChild(badge);
    }
    const composer=$("#composer");
    if(composer){
      composer.style.opacity=".65";
      composer.style.pointerEvents="none";
    }
    const actions=$(".header-actions");
    if(actions)actions.style.pointerEvents="none";
  }else{
    badge?.remove();
    const composer=$("#composer");
    if(composer){
      composer.style.opacity="";
      composer.style.pointerEvents="";
    }
    const actions=$(".header-actions");
    if(actions)actions.style.pointerEvents="";
  }
}

function prebootFromLocalCache(){
  const uid=lastAuthUid();
  if(!uid)return false;
  const bubbleId=localStorage.getItem(`burbuja-active-${uid}`);
  if(!bubbleId)return false;

  let meta=null,profile=null;
  try{meta=JSON.parse(localStorage.getItem(`burbuja-active-meta-${uid}`)||"null")}catch{}
  try{profile=JSON.parse(localStorage.getItem(`burbuja-profile-cache-${uid}`)||"null")}catch{}
  if(!meta?.id||meta.id!==bubbleId)return false;

  // Usuario provisional exclusivamente para pintar caché local.
  state.user={uid,displayName:profile?.displayName||"Tu cuenta"};
  state.accountProfile=profile||{displayName:"Tu cuenta",handle:"",bio:"",avatarData:""};
  state.activeBubbleId=bubbleId;
  state.activeBubble={id:bubbleId,...meta};
  state.todayKey=dateKeyMexico();
  state.profiles=readCachedMembers(uid,bubbleId);
  state.me=state.profiles.get(uid)||{uid,...state.accountProfile};
  state.partner=[...state.profiles.entries()].find(([id])=>id!==uid)?.[1]||null;
  state.messages=readRecentMessages(uid,bubbleId);
  state.chatPositionRestored=false;

  const remembered=localStorage.getItem(`burbuja-view-${uid}-${bubbleId}`)||"Chat";
  state.currentView=["Chat","Us","Games","Profile"].includes(remembered)?remembered:"Chat";

  $("#currentBubbleName").textContent=meta.name||"Nuestra Burbuja";
  $("#currentBubbleEmoji").textContent=meta.emoji||"🫧";

  showScreen("app");
  $("#appShell")?.setAttribute("data-view",state.currentView);
  $$(".view").forEach(el=>el.classList.remove("active-view"));
  $(`#view${state.currentView}`)?.classList.add("active-view");
  $$(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.view===state.currentView));

  renderPartnerHeader();
  renderProfiles();

  if(state.messages.length){
    renderMessages();
    requestAnimationFrame(()=>restoreChatPositionOnce());
  }else{
    const box=$("#messages");
    if(box)box.innerHTML='<div class="empty-state"><div class="empty-bubble">🫧</div><h2>Abriendo su chat…</h2><p>Sincronizando los últimos mensajes.</p></div>';
  }

  restoreDraft();
  applyChatAppearance({
    theme:localStorage.getItem(`burbuja-chat-theme-${uid}-${bubbleId}`)||"oscuro",
    accent:"#ff4f91",
    customBackground:""
  });
  setPrebootMode(true);
  window.__burbujaPreboot={uid,bubbleId};
  return true;
}

function accountProfileCacheKey(uid){return `burbuja-profile-cache-${uid}`}
function getCachedAccountProfile(uid){
  try{return JSON.parse(localStorage.getItem(accountProfileCacheKey(uid))||"null")}catch{return null}
}
function setCachedAccountProfile(uid,profile){
  try{localStorage.setItem(accountProfileCacheKey(uid),JSON.stringify(profile||{}))}catch{}
}
function getCachedActiveBubbleMeta(uid){
  try{
    const meta=JSON.parse(localStorage.getItem(`burbuja-active-meta-${uid}`)||"null");
    return meta&&meta.id?meta:null;
  }catch{return null}
}

function activateBubbleShell(bubbleId,bubbleData={}){
  clearSubscriptions();
  resetBubbleRuntimeState();

  state.activeBubbleId=bubbleId;
  state.activeBubble={id:bubbleId,...bubbleData};

  localStorage.setItem(`burbuja-active-${state.user.uid}`,bubbleId);
  localStorage.setItem("burbuja-active-bubble",bubbleId);
  try{
    localStorage.setItem(`burbuja-active-meta-${state.user.uid}`,JSON.stringify({
      id:bubbleId,
      name:state.activeBubble.name||"Nuestra Burbuja",
      emoji:state.activeBubble.emoji||"🫧",
      inviteCode:state.activeBubble.inviteCode||""
    }));
  }catch{}

  state.todayKey=dateKeyMexico();
  const rememberedView=localStorage.getItem(`burbuja-view-${state.user.uid}-${bubbleId}`)||"Chat";
  state.currentView=["Chat","Us","Games","Profile"].includes(rememberedView)?rememberedView:"Chat";

  $("#currentBubbleName").textContent=state.activeBubble.name||"Nuestra Burbuja";
  $("#currentBubbleEmoji").textContent=state.activeBubble.emoji||"🫧";

  showScreen("app");
  switchView(state.currentView);

  wireRealtime();
  scheduleDayBoundaryCheck();

  setTimeout(()=>updatePresence(true).catch(()=>{}),120);
  state.heartbeat=setInterval(()=>updatePresence(true),45000);

  renderAll();
  restoreDraft();
  applyChatAppearance({
    theme:localStorage.getItem(`burbuja-chat-theme-${state.user.uid}-${bubbleId}`)||"oscuro",
    accent:"#ff4f91",
    customBackground:""
  });
}

async function validateFastSession(user,bubbleId){
  try{
    const profileRef=firebase.doc(state.db,"profiles",user.uid);
    const bubbleRef=firebase.doc(state.db,"bubbles",bubbleId);
    const [profileSnap,bubbleSnap]=await Promise.all([
      firebase.getDoc(profileRef),
      firebase.getDoc(bubbleRef)
    ]);

    if(profileSnap.exists()){
      state.accountProfile=profileSnap.data();
      setCachedAccountProfile(user.uid,state.accountProfile);
    }

    const valid=bubbleSnap.exists()&&(bubbleSnap.data().memberIds||[]).includes(user.uid);
    if(valid){
      if(state.activeBubbleId===bubbleId){
        state.activeBubble={id:bubbleId,...bubbleSnap.data()};
        $("#currentBubbleName").textContent=state.activeBubble.name||"Nuestra Burbuja";
        $("#currentBubbleEmoji").textContent=state.activeBubble.emoji||"🫧";
        try{
          localStorage.setItem(`burbuja-active-meta-${user.uid}`,JSON.stringify({
            id:bubbleId,
            name:state.activeBubble.name||"Nuestra Burbuja",
            emoji:state.activeBubble.emoji||"🫧",
            inviteCode:state.activeBubble.inviteCode||""
          }));
        }catch{}
      }
      return true;
    }

    if(state.activeBubbleId===bubbleId){
      clearSubscriptions();
      resetBubbleRuntimeState();
      state.activeBubbleId="";
      state.activeBubble=null;
      localStorage.removeItem(`burbuja-active-${user.uid}`);
      localStorage.removeItem(`burbuja-active-meta-${user.uid}`);
      await loadMemberships();
      if(state.bubbles.length)await enterBubble(state.bubbles[0].id);
      else await showBubbleChooser(false);
    }
    return false;
  }catch(e){
    // Si la red está lenta o sin conexión no expulsamos al usuario de la
    // Burbuja cacheada. Los listeners de Firestore se sincronizarán al volver.
    console.warn("Validación de sesión rápida pendiente",e);
    return null;
  }
}

async function enterBubble(bubbleId) {
  const bubbleSnap=await firebase.getDoc(firebase.doc(state.db,"bubbles",bubbleId));
  if(!bubbleSnap.exists()||!(bubbleSnap.data().memberIds||[]).includes(state.user.uid))
    throw new Error("No tienes acceso a esa Burbuja.");

  if(state.activeBubbleId&&state.activeBubbleId!==bubbleId){
    try{await updatePresence(false)}catch{}
  }
  activateBubbleShell(bubbleId,bubbleSnap.data());
}

async function syncProfileToAllBubbles(patch) {
  const memberships=await firebase.getDocs(membershipCollection());
  for(const d of memberships.docs){
    try{await firebase.setDoc(firebase.doc(state.db,"bubbles",d.id,"members",state.user.uid),{...patch,uid:state.user.uid,updatedAt:firebase.serverTimestamp()},{merge:true})}catch{}
  }
}

async function bootAccount(user) {
  clearSubscriptions();
  state.user=user;

  const cachedProfile=getCachedAccountProfile(user.uid);
  state.accountProfile=cachedProfile||{
    displayName:user.displayName||"Tu cuenta",
    handle:"",
    bio:"",
    avatarData:""
  };

  const saved=localStorage.getItem(`burbuja-active-${user.uid}`);
  const savedMeta=getCachedActiveBubbleMeta(user.uid);

  if(saved&&savedMeta?.id===saved){
    activateBubbleShell(saved,savedMeta);

    setTimeout(()=>{
      validateFastSession(user,saved).catch(e=>console.warn("Validación de Burbuja",e));
      loadMemberships().catch(e=>console.warn("Refresco de membresías",e));
    },350);
    return;
  }

  const profileSnap=await firebase.getDoc(firebase.doc(state.db,"profiles",user.uid));
  if(!profileSnap.exists())throw new Error("Tu perfil no está configurado.");

  state.accountProfile=profileSnap.data();
  setCachedAccountProfile(user.uid,state.accountProfile);

  if(saved){
    try{
      await enterBubble(saved);
      setTimeout(()=>loadMemberships().catch(e=>console.warn("Refresco de membresías",e)),350);
      return;
    }catch(e){
      console.warn("La Burbuja guardada ya no está disponible",e);
    }
  }

  await loadMemberships();

  if(!state.bubbles.length){
    try{await ensureLegacyMembership()}catch(e){
      console.warn("No se pudo preparar la migración anterior",e);
    }
    await loadMemberships();
  }

  if(!state.bubbles.length){
    state.activeBubbleId="";
    state.activeBubble=null;
    resetBubbleRuntimeState();
    await showBubbleChooser(false);
    return;
  }

  await enterBubble(state.bubbles[0].id);
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

  // Firestore estándar.
  state.db = firebase.getFirestore(app);

  firebase.onAuthStateChanged(state.auth, async (user) => {
    if (state.registrationInProgress) return;
    if (!user) {
      localStorage.removeItem("burbuja-last-auth-uid");
      clearSubscriptions();
      state.user = state.me = state.partner = state.accountProfile = null;
      state.activeBubbleId = ""; state.activeBubble = null; state.bubbles = [];
      showScreen("auth");
      await updateSlotHint();
      return;
    }
    try {
      localStorage.setItem("burbuja-last-auth-uid",user.uid);
      await bootAccount(user);
    } catch (err) {
      console.error(err);
      toast(niceError(err), 4200);
      showScreen("auth");
    }
  });
}

async function updateSlotHint() {
  if (!state.db || !state.auth?.currentUser) {
    $("#slotsHint").textContent = "Una cuenta puede tener varias Burbujas; cada Burbuja admite máximo 2 personas.";
    return;
  }
}

async function getMySlot(uid) { return detectLegacySlot(uid); }

async function registerAccount(name, handleRaw, password) {
  const handle = normalizeHandle(handleRaw);
  if (!validHandle(handle)) throw new Error("El usuario debe tener 3–20 caracteres y usar solo letras, números, punto, guion o guion bajo.");
  if (password.length < 8) throw new Error("Usa una contraseña de al menos 8 caracteres.");

  const aliasRef = firebase.doc(state.db, "aliases", handle);
  const existing = await firebase.getDoc(aliasRef);
  if (existing.exists()) throw new Error("Ese nombre de usuario ya está ocupado.");

  state.registrationInProgress = true;
  let cred = null;
  try {
    cred = await firebase.createUserWithEmailAndPassword(state.auth, randomAuthEmail(), password);
    const uid = cred.user.uid;
    const profile = {
      uid,
      displayName:name.trim().slice(0,30),
      handle,
      bio:"",
      avatarData:"",
      createdAt:firebase.serverTimestamp(),
      updatedAt:firebase.serverTimestamp()
    };
    const batch=firebase.writeBatch(state.db);
    batch.set(firebase.doc(state.db,"profiles",uid),profile);
    batch.set(aliasRef,{uid,email:cred.user.email,createdAt:firebase.serverTimestamp()});
    batch.set(firebase.doc(state.db,"users",uid),{uid,createdAt:firebase.serverTimestamp(),updatedAt:firebase.serverTimestamp()},{merge:true});
    await batch.commit();
    state.registrationInProgress=false;
    await bootAccount(cred.user);
    toast("Cuenta creada. Ahora crea o únete a una Burbuja 🫧",3000);
  } catch(err) {
    try{if(cred?.user)await firebase.deleteUser(cred.user)}catch{}
    state.registrationInProgress=false;
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

async function bootApp(user) { return bootAccount(user); }

function wireRealtime() {
  const db = state.db;
  const uid = state.user.uid;

  // Metadata de la Burbuja en vivo: si cualquiera cambia nombre/emoji, ambos lo ven sin recargar.
  state.unsubs.push(firebase.onSnapshot(firebase.doc(state.db,"bubbles",state.activeBubbleId), snap => {
    if(!snap.exists()) return;
    state.activeBubble={id:snap.id,...snap.data()};
    $("#currentBubbleName").textContent=state.activeBubble.name||"Nuestra Burbuja";
    $("#currentBubbleEmoji").textContent=state.activeBubble.emoji||"🫧";
    if(!state.partner) renderPartnerHeader();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleCollection("members"), snap => {
    state.profiles.clear();
    snap.forEach(d => state.profiles.set(d.id, d.data()));
    state.me = state.profiles.get(uid) || state.me;
    state.partner = [...state.profiles.entries()].find(([id]) => id !== uid)?.[1] || null;
    cacheMembers();
    renderProfiles();
    updateMessageReadReceipts();
    renderGames();
    if(state.partner){
      const runRepair=()=>repairStreakFromHistory(false);
      if("requestIdleCallback" in window)requestIdleCallback(runRepair,{timeout:2600});
      else setTimeout(runRepair,2200);
    }
  }));

  const msgQ = firebase.query(
    bubbleCollection("messages"),
    firebase.orderBy("createdAt", "asc"),
    firebase.limitToLast(60)
  );
  state.unsubs.push(firebase.onSnapshot(msgQ, snap => {
    const box=$("#messages");
    const firstLoad=!state.messages.length;
    const wasBottom=firstLoad||nearBottom(110);
    const oldTop=box?.scrollTop||0;
    const previousNewest=state.messages[state.messages.length-1]?.id||"";

    const live=snap.docs.map(d=>({id:d.id,...d.data()}));
    const liveIds=new Set(live.map(m=>m.id));
    const oldestLive=tsMillis(live[0]?.createdAt);
    const older=state.messages.filter(m=>!liveIds.has(m.id)&&(!oldestLive||tsMillis(m.createdAt)<oldestLive));
    state.messages=[...older,...live].sort((a,b)=>tsMillis(a.createdAt)-tsMillis(b.createdAt));

    const newest=state.messages[state.messages.length-1];
    const newIncoming=previousNewest&&newest?.id!==previousNewest&&newest?.senderId!==uid;

    if(firstLoad)computeUnreadBoundary();
    renderMessages();

    requestAnimationFrame(()=>{
      if(firstLoad){
        restoreChatPositionOnce();
        if(state.currentView==="Chat")setTimeout(markRead,160);
      }else if(wasBottom){
        hideNewMessageButton();
        scrollMessages();
        if(state.currentView==="Chat")setTimeout(markRead,120);
      }else{
        if(box)box.scrollTop=oldTop;
        if(newIncoming)showNewMessageButton(state.unreadWhileUp+1);
      }
    });

    state.newestMessageId=newest?.id||"";
    cacheRecentMessages();
    buildWhileAway();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "reads"), snap => {
    state.reads = snap.exists() ? snap.data() : {};
    state.lastReadAt=tsMillis(state.reads[state.user.uid]);
    updateMessageReadReceipts();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "pinned"), snap => {
    state.pinned = snap.exists() ? (snap.data().text || "") : "";
    state.pinnedMessageId = snap.exists() ? (snap.data().messageId || "") : "";
    renderPinned();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "relationship"), snap => {
    state.relationship = snap.exists() ? snap.data() : null;
    renderRelationship();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleCollection("presence"), snap => {
    state.presence.clear();
    snap.forEach(d => state.presence.set(d.id, d.data()));
    renderPartnerHeader();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleCollection("typing"), snap => {
    state.typing.clear();
    snap.forEach(d => state.typing.set(d.id, d.data()));
    renderTyping();
  }));

  const bubbleIdAtWire = state.activeBubbleId;
  const loadExtras=()=>{
    if(!state.user||state.activeBubbleId!==bubbleIdAtWire)return;
    try{wireRealtimeExtras()}
    catch(e){console.warn("Extras de Burbuja pendientes",e)}
  };
  if("requestIdleCallback" in window)requestIdleCallback(loadExtras,{timeout:2600});
  else setTimeout(loadExtras,1800);
}

function wireRealtimeExtras() {
  const uid=state.user?.uid;
  const bubbleId=state.activeBubbleId;
  if(!uid||!bubbleId)return;
  const statusQ=firebase.query(bubbleCollection("statuses"),firebase.orderBy("createdAt","desc"),firebase.limit(80));
  state.unsubs.push(firebase.onSnapshot(statusQ,snap=>{
    const now=Date.now(),expired=[];
    state.statuses=snap.docs.map(d=>({id:d.id,...d.data()})).filter(s=>{const ok=tsMillis(s.expiresAt)>now;if(!ok)expired.push(s);return ok});
    renderStoryRail();buildWhileAway();
    expired.slice(0,8).forEach(s=>firebase.deleteDoc(bubbleDoc("statuses",s.id)).catch(()=>{}));
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared","savedMessages"),snap=>{
    state.savedMessages=snap.exists()?(snap.data().items||{}):{};
    renderSavedCount();
    if(!$("#savedModal")?.classList.contains("hidden"))renderSavedMessages();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared","sharedNote"),snap=>{
    state.sharedNote=snap.exists()?snap.data():null;
    renderSharedNote();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared","specialDates"),snap=>{
    state.specialDates=snap.exists()&&Array.isArray(snap.data().items)?snap.data().items:[];
    renderSpecialDates();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared","chatAppearance"),snap=>{
    if(snap.exists()){
      state.chatAppearance=snap.data();
      applyChatAppearance(state.chatAppearance);
    }
  }));

  const nudgeQ = firebase.query(bubbleCollection("nudges"), firebase.orderBy("createdAt", "desc"), firebase.limit(20));
  state.unsubs.push(firebase.onSnapshot(nudgeQ, snap => {
    const oldNewest = state.lastNudges[0]?.id;
    state.lastNudges = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderNudges();
    const newest = state.lastNudges[0];
    if (newest && newest.id !== oldNewest && newest.targetId === uid && newest.senderId !== uid) {
      const seen = localStorage.getItem(`burbuja-last-nudge-${state.activeBubbleId}`);
      if (seen !== newest.id) {
        localStorage.setItem(`burbuja-last-nudge-${state.activeBubbleId}`, newest.id);
        toast(`${state.partner?.displayName || "Tu persona"} está pensando en ti 💗`, 4200);
      }
    }
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "burbujacraftPoints"), snap => {
    state.burbujaPoints = snap.exists() ? snap.data() : null;
    renderBurbujaPoints();
  }));

  // Juegos, racha y puntos no bloquean la entrada al chat.
  try{wireGames()}catch(e){console.warn("Juegos/racha pendientes",e)}
}

function wireGames() {
  const db = state.db;
  const date = state.todayKey;
  if(state.gameWireDate===date)return;
  state.gameWireDate=date;
  const totRef = bubbleDoc("games", `tot_${date}`);
  const qRef = bubbleDoc("games", `question_${date}`);
  const compatRef = bubbleDoc("games", `compat_${date}`);
  const guessRef = bubbleDoc("games", `guess_${date}`);
  const streakDayRef = bubbleDoc("games", `streak_${date}`);

  state.unsubs.push(firebase.onSnapshot(totRef, snap => {
    state.totData = snap.exists() ? snap.data() : null;
    renderThisOrThat();
  }));

  state.unsubs.push(firebase.onSnapshot(qRef, snap => {
    state.questionData = snap.exists() ? snap.data() : null;
    renderDailyQuestion();buildWhileAway();
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

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "coupleStreak"), snap => {
    state.streakData = snap.exists() ? snap.data() : null;
    renderStreak();
  }));

  state.unsubs.push(firebase.onSnapshot(bubbleDoc("shared", "appPoints"), snap => {
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
  renderBurbujaSummary();
}

function renderStreak() {
  if (!state.user) return;
  const count = Math.max(Number(state.streakData?.count || 0),Number(state.streakRepairCount || 0));
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
  renderBurbujaSummary();
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
  renderBurbujaSummary();
  renderSavedCount();
  renderSharedNote();
  renderSpecialDates();
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
  renderStoryRail();
}

function renderPartnerHeader() {
  const p=state.partner,el=$("#partnerPresence");
  if(!p){el.textContent=`${state.activeBubble?.name||"Tu Burbuja"} · toca aquí para invitar`;el.classList.remove("game-activity-together");return}
  const pr=state.presence.get(p.uid),age=Date.now()-tsMillis(pr?.lastSeen),online=pr?.online===true&&age<100000,activity=pr?.activity||"";
  el.classList.remove("game-activity-together");
  if(online&&activity.startsWith("game:")){
    const game=activity.slice(5);
    if(state.currentGameTitle&&game===state.currentGameTitle){el.textContent=`💜🩷 Jugando juntos · ${game}`;el.classList.add("game-activity-together")}
    else el.textContent=`🎮 Jugando ${game}`;
  }else if(online&&activity==="stories")el.textContent="📸 Viendo estados";
  else if(online&&activity==="Chat")el.textContent="💬 En Chat";
  else if(online&&activity==="Us")el.textContent="♡ En Nosotros";
  else if(online&&activity==="Games")el.textContent="🎮 En Juegos";
  else if(online)el.textContent=`${p.statusEmoji||"●"} en línea`;
  else if(pr?.lastSeen)el.textContent=relativeTime(pr.lastSeen);
  else el.textContent=p.statusText||"sin conexión";
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

function nearBottom(threshold=96) {
  const box = $("#messages");
  if(!box) return true;
  return box.scrollHeight - box.scrollTop - box.clientHeight < threshold;
}

function chatBottomDistance(){
  const box=$("#messages");
  return box ? Math.max(0, box.scrollHeight-box.scrollTop-box.clientHeight) : 0;
}

function captureMessageAnchor(){
  const box=$("#messages");
  if(!box)return null;
  const boxTop=box.getBoundingClientRect().top;
  const rows=[...box.querySelectorAll("[data-message-id]")];
  let chosen=null;
  for(const row of rows){
    const r=row.getBoundingClientRect();
    if(r.bottom>=boxTop+1){chosen=row;break}
  }
  if(!chosen)return {id:"",offset:0,scrollTop:box.scrollTop};
  return {id:chosen.dataset.messageId||"",offset:chosen.getBoundingClientRect().top-boxTop,scrollTop:box.scrollTop};
}

function restoreMessageAnchor(anchor){
  const box=$("#messages");
  if(!box||!anchor)return;
  if(anchor.id){
    const row=box.querySelector(`[data-message-id="${CSS.escape(anchor.id)}"]`);
    if(row){
      const boxTop=box.getBoundingClientRect().top;
      box.scrollTop += row.getBoundingClientRect().top-boxTop-anchor.offset;
      return;
    }
  }
  box.scrollTop=anchor.scrollTop||0;
}

function scrollMessages({smooth=false}={}) {
  const box = $("#messages");
  if(!box)return;
  const go=()=>box.scrollTo({top:box.scrollHeight,behavior:smooth?"smooth":"auto"});
  requestAnimationFrame(()=>requestAnimationFrame(go));
}

function showNewMessageButton(count=1){
  state.unreadWhileUp=Math.max(1,Number(count)||1);
  const b=$("#newMessagesBtn");
  if(!b)return;
  b.classList.remove("hidden");
  b.textContent=`↓ ${state.unreadWhileUp} mensaje${state.unreadWhileUp===1?"":"s"} nuevo${state.unreadWhileUp===1?"":"s"}`;
}

function hideNewMessageButton(){
  state.unreadWhileUp=0;
  $("#newMessagesBtn")?.classList.add("hidden");
}

function renderMessages() {
  const box=$("#messages");if(!box||!state.user)return;
  const hiddenForMe=m=>m.hiddenBy?.[state.user.uid]===true;
  const visible=state.messages.filter(m=>!hiddenForMe(m));
  const term=state.searchTerm.trim().toLowerCase();
  const shown=term?visible.filter(m=>`${m.text||""} ${m.stickerText||""} ${m.replyTo?.text||""}`.toLowerCase().includes(term)):visible;
  const count=$("#chatSearchCount");if(count)count.textContent=term?`${shown.length}`:"";
  if(!shown.length){box.innerHTML=`<div class="empty-state"><div class="empty-bubble">🫧</div><h2>${term?"Sin resultados":"Aquí comienza su Burbuja"}</h2><p>${term?"Prueba con otra palabra.":"El primer mensaje siempre cuenta."}</p></div>`;return}
  box.textContent="";const partnerRead=state.partner?tsMillis(state.reads[state.partner.uid]):0;let prev=null,prevDay="";
  shown.forEach(msg=>{
    const day=messageDateKey(msg.createdAt);if(day!==prevDay){const sep=document.createElement("div");sep.className="date-separator";sep.innerHTML=`<span>${dateSeparatorLabel(msg.createdAt)}</span>`;box.appendChild(sep);prevDay=day;prev=null}
    if(state.firstUnreadId && msg.id===state.firstUnreadId){
      const nu=document.createElement("div");nu.className="unread-separator";nu.innerHTML="<span>NUEVOS</span>";box.appendChild(nu);prev=null;
    }
    const mine=msg.senderId===state.user.uid,grouped=prev&&prev.senderId===msg.senderId&&tsMillis(msg.createdAt)-tsMillis(prev.createdAt)<180000;
    const row=document.createElement("div");row.className=`message-row ${mine?"mine":"theirs"}${grouped?" grouped":""}${msg.systemEvent?" system-event-row":""}`;row.dataset.messageId=msg.id;
    const bubble=document.createElement("div");bubble.className=`message-bubble${msg.systemEvent?" activity-message":""}`;bubble.tabIndex=0;
    if(msg.systemEvent){
      const card=document.createElement("button");card.type="button";card.className="activity-message-card";
      const icon=document.createElement("span");icon.className="activity-message-icon";icon.textContent=msg.systemEvent.icon||"✨";
      const copy=document.createElement("span");copy.className="activity-message-copy";
      const title=document.createElement("strong");title.textContent=msg.systemEvent.title||msg.text||"Hay algo nuevo";
      const sub=document.createElement("small");sub.textContent=msg.systemEvent.subtitle||"Toca para verlo";
      copy.append(title,sub);card.append(icon,copy);
      card.onclick=()=>handleActivityMessageAction(msg.systemEvent);
      bubble.appendChild(card);
    }
    const stickerOnly=!!(msg.stickerId||msg.stickerEmoji||msg.stickerAsset)&&!msg.text&&!(Array.isArray(msg.images)&&msg.images.length)&&!msg.imageData;
    if(stickerOnly)bubble.classList.add("sticker-only");
    if(msg.replyTo){const q=document.createElement("button");q.type="button";q.className="reply-quote";q.innerHTML=`<small></small><span></span>`;q.querySelector("small").textContent=msg.replyTo.senderName||"Mensaje";q.querySelector("span").textContent=msg.replyTo.text||"📷 Foto / sticker";q.onclick=e=>{e.stopPropagation();scrollToMessage(msg.replyTo.id)};bubble.appendChild(q)}
    if(msg.statusReply){const q=document.createElement("div");q.className="status-reply-quote";q.innerHTML=`<small>RESPUESTA A ESTADO</small><strong></strong>`;q.querySelector("strong").textContent=msg.statusReply.text||`Estado de ${msg.statusReply.ownerName||"tu persona"}`;bubble.appendChild(q)}
    if(msg.stickerId||msg.stickerEmoji||msg.stickerAsset){const st=stickerById(msg.stickerId)||{emoji:msg.stickerEmoji||"💗",label:msg.stickerText||"",asset:msg.stickerAsset,kind:msg.stickerKind};if(st.asset||msg.stickerAsset){const im=document.createElement("img");im.className="chat-sticker-image";im.src=msg.stickerAsset||st.asset;im.alt="Sticker";bubble.appendChild(im)}else{const s=document.createElement("div");s.className="chat-sticker-text";s.innerHTML=`<div class="big"></div><strong></strong>`;s.querySelector(".big").textContent=st.emoji||msg.stickerEmoji||"💗";s.querySelector("strong").textContent=st.label||msg.stickerText||"";bubble.appendChild(s)}}
    const imgs=(Array.isArray(msg.images)&&msg.images.length?msg.images:(msg.imageData?[msg.imageData]:[]));if(imgs.length){const grid=document.createElement("div");grid.className=`message-image-grid ${imgs.length===1?"single":""}`;imgs.slice(0,4).forEach(src=>{const im=document.createElement("img");im.src=src;im.alt="Foto";im.loading="lazy";im.onclick=e=>{e.stopPropagation();openImage(src)};grid.appendChild(im)});bubble.appendChild(grid)}
    if(msg.text&&!msg.systemEvent){const txt=document.createElement("div");txt.className="message-text";txt.textContent=msg.text;bubble.appendChild(txt)}
    const reactions=msg.reactions||{};const groupedReactions={};Object.entries(reactions).forEach(([uid,e])=>{if(e)groupedReactions[e]=(groupedReactions[e]||[]).concat(uid)});if(Object.keys(groupedReactions).length){const r=document.createElement("div");r.className="message-reactions";Object.entries(groupedReactions).forEach(([emoji,uids])=>{const b=document.createElement("button");b.type="button";b.className=`reaction-pill ${uids.includes(state.user.uid)?"mine-react":""}`;b.textContent=`${emoji}${uids.length>1?` ${uids.length}`:""}`;b.onclick=e=>{e.stopPropagation();reactToMessage(msg.id,emoji)};r.appendChild(b)});bubble.appendChild(r)}
    const meta=document.createElement("div");meta.className="message-meta";const t=document.createElement("span");t.textContent=timeLabel(msg.createdAt);meta.appendChild(t);if(msg.editedAt){const ed=document.createElement("span");ed.className="edited-label";ed.textContent="editado";meta.appendChild(ed)}if(mine){row.dataset.mine="1";row.dataset.createdAt=String(tsMillis(msg.createdAt)||0);const seen=document.createElement("span"),created=tsMillis(msg.createdAt),partnerOnline=state.partner&&state.presence.get(state.partner.uid)?.online;seen.className="delivery-check";seen.textContent=created&&partnerRead>=created?"✓✓":partnerOnline?"✓✓":"✓";seen.title=created&&partnerRead>=created?"Visto":partnerOnline?"Entregado":"Enviado";meta.appendChild(seen)}bubble.appendChild(meta);
    let hold=null,sx=0,sy=0;bubble.addEventListener("pointerdown",e=>{sx=e.clientX;sy=e.clientY;hold=setTimeout(()=>openMessageActions(msg),520)});bubble.addEventListener("pointermove",e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>12){clearTimeout(hold);hold=null}});bubble.addEventListener("pointerup",e=>{clearTimeout(hold);if(e.clientX-sx>55&&Math.abs(e.clientY-sy)<50){setReply(msg);haptic(10)}});bubble.addEventListener("pointercancel",()=>clearTimeout(hold));bubble.addEventListener("contextmenu",e=>{e.preventDefault();openMessageActions(msg)});bubble.addEventListener("dblclick",()=>openMessageActions(msg));
    row.appendChild(bubble);box.appendChild(row);prev=msg;
  })
}


function computeUnreadBoundary(){
  if(!state.user)return;
  const last=Number(state.lastReadAt||tsMillis(state.reads?.[state.user.uid])||0);
  const incoming=state.messages.filter(m=>m.senderId!==state.user.uid && tsMillis(m.createdAt)>last && !m.hiddenBy?.[state.user.uid]);
  state.unreadTotal=incoming.length;
  state.firstUnreadId=incoming[0]?.id||"";
}

function updateMessageReadReceipts(){
  const box=$("#messages");
  if(!box||!state.partner)return;
  const partnerRead=tsMillis(state.reads?.[state.partner.uid]);
  const partnerOnline=state.presence.get(state.partner.uid)?.online===true;
  box.querySelectorAll('[data-mine="1"]').forEach(row=>{
    const check=row.querySelector(".delivery-check");
    if(!check)return;
    const created=Number(row.dataset.createdAt||0);
    check.textContent=created&&partnerRead>=created?"✓✓":partnerOnline?"✓✓":"✓";
    check.title=created&&partnerRead>=created?"Visto":partnerOnline?"Entregado":"Enviado";
  });
}

function renderMessagesPreservingPosition(){
  const box=$("#messages"),wasBottom=nearBottom(),oldTop=box?.scrollTop||0;
  renderMessages();
  requestAnimationFrame(()=>{if(wasBottom)scrollMessages();else if(box)box.scrollTop=oldTop});
}

function activityNoticeRef(id){
  return bubbleDoc("shared","activityNotices");
}

async function claimActivityNotice(key){
  if(!state.user||!key)return false;
  const ref=activityNoticeRef();
  try{
    return await firebase.runTransaction(state.db,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():{};
      const notices={...(data.notices||{})};
      if(notices[key])return false;
      notices[key]={uid:state.user.uid,at:Date.now()};
      const keys=Object.keys(notices);
      if(keys.length>180) keys.sort((a,b)=>(notices[a]?.at||0)-(notices[b]?.at||0)).slice(0,keys.length-160).forEach(k=>delete notices[k]);
      tx.set(ref,{notices,updatedAt:firebase.serverTimestamp()},{merge:true});
      return true;
    });
  }catch(e){console.warn("activity claim",e);return false}
}

async function sendActivityMessage({key,icon="✨",title,subtitle="",action="",statusId=""}){
  if(!state.user||!state.activeBubbleId)return;
  if(key && !(await claimActivityNotice(key)))return;
  try{
    await firebase.addDoc(bubbleCollection("messages"),{
      senderId:state.user.uid,text:"",
      images:[],
      systemEvent:{icon,title,subtitle,action,statusId},
      createdAt:firebase.serverTimestamp()
    });
  }catch(e){console.warn("activity message",e)}
}

async function upsertStoryActivityMessage(){
  if(!state.user)return;
  const bucket=Math.floor(Date.now()/(15*60*1000));
  const id=`activity_status_${state.user.uid}_${bucket}`;
  const ref=bubbleDoc("messages",id);
  try{
    const snap=await firebase.getDoc(ref);
    const prev=snap.exists()?Number(snap.data()?.systemEvent?.count||1):0;
    const count=prev+1;
    await firebase.setDoc(ref,{
      senderId:state.user.uid,text:"",images:[],
      systemEvent:{
        icon:"📸",
        title:count===1?"Actualizó su estado":`Añadió ${count} estados nuevos`,
        subtitle:"Toca para ver sus historias",
        action:"stories",
        count
      },
      createdAt:snap.exists()?(snap.data().createdAt||firebase.serverTimestamp()):firebase.serverTimestamp(),
      lastActivityAt:firebase.serverTimestamp()
    },{merge:true});
  }catch(e){console.warn("story activity",e)}
}

function handleActivityMessageAction(ev){
  if(!ev)return;
  if(ev.action==="stories"){
    switchView("Us");
    setTimeout(()=>{if(state.partner?.uid)openStoryViewer(state.partner.uid,0)},120);
  }else if(ev.action==="questions"){
    switchView("Games");
    setTimeout(()=>$("#dailyAnswer")?.focus({preventScroll:true}),120);
  }else if(ev.action==="games"){
    switchView("Games");
  }else if(ev.action==="streak"){
    switchView("Games");
  }
}

function refreshTodayKeyIfNeeded(){
  const key=dateKeyMexico();
  if(key===state.todayKey)return false;
  state.todayKey=key;
  state.questionData=null;state.totData=null;state.compatData=null;state.guessData=null;state.streakDayData=null;
  state.guessMineChoice=null;state.guessPartnerChoice=null;
  wireGames();
  renderGames();
  state.streakRepairAt=0;
  setTimeout(()=>repairStreakFromHistory(true),120);
  return true;
}

function scheduleDayBoundaryCheck(){
  clearInterval(window.__burbujaDayCheck);
  window.__burbujaDayCheck=setInterval(()=>{
    const changed=refreshTodayKeyIfNeeded();
    if(!changed&&Date.now()-state.streakRepairAt>120000)repairStreakFromHistory(false);
  },20000);
}

function buildWhileAway(){
  if(!state.user)return;
  const seenAt=Number(localStorage.getItem(`burbuja-away-seen-${state.user.uid}-${state.activeBubbleId}`)||0);
  const items=[],partner=state.partner;
  if(partner){
    const stories=activeStatusesFor(partner.uid).filter(s=>tsMillis(s.createdAt)>seenAt);
    if(stories.length)items.push({icon:"📸",text:`Subió ${stories.length} ${stories.length===1?"estado nuevo":"estados nuevos"}`,detail:"Toca para ver sus momentos",action:"stories"});
    const pQuestion=state.questionData?.answers?.[partner.uid];
    if(pQuestion&&tsMillis(state.questionData?.updatedAt)>seenAt)items.push({icon:"💭",text:"Respondió la pregunta de hoy",detail:"Toca para responder la tuya",action:"questions"});

    const events=state.messages.filter(m=>m.systemEvent&&tsMillis(m.createdAt)>seenAt).filter(m=>m.senderId===partner.uid||m.systemEvent?.action==="streak");
    const used=new Set();
    events.forEach(m=>{
      const ev=m.systemEvent||{},key=`${ev.action||"event"}:${ev.title||""}`;
      if(used.has(key))return;used.add(key);
      if(ev.action==="stories"&&stories.length)return;
      if(ev.action==="questions"&&pQuestion)return;
      if(ev.action==="streak")items.push({icon:"🔥",text:ev.title||"La racha cambió",detail:"Toca para verla",action:"streak"});
      else if(ev.action==="games")items.push({icon:"🎮",text:ev.title||"Estuvo jugando",detail:ev.subtitle||"Actividad de juego",action:"games"});
    });
  }
  state.whileAwayItems=items.slice(0,12);
  renderWhileAway();
}

function renderWhileAway(){
  const card=$("#whileAwayCard"),list=$("#whileAwayList");
  if(!card||!list)return;
  list.textContent="";
  if(!state.whileAwayItems.length){card.classList.add("hidden");return}
  card.classList.remove("hidden");
  $("#whileAwayTitle").textContent=`${state.whileAwayItems.length} ${state.whileAwayItems.length===1?"novedad":"novedades"}`;
  state.whileAwayItems.forEach(item=>{
    const b=document.createElement("button");b.type="button";b.className="while-away-item";
    b.innerHTML=`<span></span><div><strong></strong><small></small></div>`;b.querySelector("span").textContent=item.icon;b.querySelector("strong").textContent=item.text;b.querySelector("small").textContent=item.detail||"Toca para abrir";
    b.onclick=()=>{
      if(item.action==="chat"){switchView("Chat");setTimeout(()=>scrollMessages({smooth:true}),80)}
      if(item.action==="stories"&&state.partner){openStoryViewer(state.partner.uid,0)}
      if(item.action==="questions"){switchView("Games")}
    };
    list.appendChild(b);
  });
}

function dismissWhileAway(){
  localStorage.setItem(`burbuja-away-seen-${state.user.uid}-${state.activeBubbleId}`,String(Date.now()));
  state.whileAwayItems=[];renderWhileAway();
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
  const ref = bubbleDoc("shared", "appPoints");
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


function shiftDateKey(key,days){
  const d=new Date(`${key}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
function mexicoDayStartMillis(key){return new Date(`${key}T00:00:00-06:00`).getTime()}
function messageActivityByDay(messages,validUids){
  const map=new Map();
  messages.forEach(m=>{
    if(!validUids.has(m.senderId))return;
    const ms=tsMillis(m.createdAt);if(!ms)return;
    let key="";
    try{key=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(ms))}
    catch{key=messageDateKey(m.createdAt)}
    if(!map.has(key))map.set(key,new Set());
    map.get(key).add(m.senderId);
  });
  return map;
}
async function repairStreakFromHistory(force=false){
  if(!state.user||!state.partner||state.streakRepairBusy)return state.streakRepairCount||Number(state.streakData?.count||0);
  if(!force&&Date.now()-state.streakRepairAt<120000)return state.streakRepairCount||Number(state.streakData?.count||0);
  state.streakRepairBusy=true;
  try{
    refreshTodayKeyIfNeeded();
    const today=state.todayKey,days=Array.from({length:14},(_,i)=>shiftDateKey(today,-i));
    const validUids=new Set([state.user.uid,state.partner.uid]);
    const daySnaps=await Promise.all(days.map(k=>firebase.getDoc(bubbleDoc("games",`streak_${k}`))));
    const activeByDay=new Map();
    days.forEach((k,i)=>{
      const data=daySnaps[i].exists()?daySnaps[i].data():{},set=new Set();
      Object.entries(data.active||{}).forEach(([uid,val])=>{if(val&&validUids.has(uid))set.add(uid)});
      if(data.completed){set.add(state.user.uid);set.add(state.partner.uid)}
      activeByDay.set(k,set);
    });

    const q=firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","asc"),firebase.startAt(firebase.Timestamp.fromMillis(mexicoDayStartMillis(days[days.length-1]))),firebase.limitToLast(1200));
    const snap=await firebase.getDocs(q);
    const msgMap=messageActivityByDay(snap.docs.map(d=>({id:d.id,...d.data()})),validUids);
    msgMap.forEach((set,key)=>{if(!activeByDay.has(key))activeByDay.set(key,new Set());set.forEach(uid=>activeByDay.get(key).add(uid))});

    const complete=k=>{const set=activeByDay.get(k)||new Set();return set.has(state.user.uid)&&set.has(state.partner.uid)};
    let cursor=complete(today)?today:shiftDateKey(today,-1),count=0,lastCompleted="";
    for(let i=0;i<14;i++){if(!complete(cursor))break;if(!lastCompleted)lastCompleted=cursor;count++;cursor=shiftDateKey(cursor,-1)}

    state.streakRepairCount=count;state.streakRepairAt=Date.now();

    const todaySet=activeByDay.get(today)||new Set();
    if(todaySet.size){
      const active={};todaySet.forEach(uid=>active[uid]={source:"history-repair",at:Date.now()});
      await firebase.setDoc(bubbleDoc("games",`streak_${today}`),{type:"streakDay",date:today,active,completed:complete(today),...(complete(today)?{streakCount:count}:{}),repairedAt:firebase.serverTimestamp()},{merge:true});
    }

    if(Number(state.streakData?.count||0)!==count||(state.streakData?.lastCompletedDate||"")!==(lastCompleted||"")){
      await firebase.setDoc(bubbleDoc("shared","coupleStreak"),{count,lastCompletedDate:lastCompleted||"",repairedAt:firebase.serverTimestamp(),updatedAt:firebase.serverTimestamp()},{merge:true});
      state.streakData={...(state.streakData||{}),count,lastCompletedDate:lastCompleted||""};renderStreak();
    }
    return count;
  }catch(e){console.warn("No se pudo reparar la racha",e);return Number(state.streakData?.count||0)}
  finally{state.streakRepairBusy=false}
}

async function markDailyActive(source="app"){
  if(!state.user||!state.db)return;
  refreshTodayKeyIfNeeded();
  const dayRef=bubbleDoc("games",`streak_${state.todayKey}`);
  try{
    await firebase.setDoc(dayRef,{type:"streakDay",date:state.todayKey,[`active.${state.user.uid}`]:{source,at:Date.now()},updatedAt:firebase.serverTimestamp()},{merge:true});
    if(!state.partner)return;

    const newlyCompleted=await firebase.runTransaction(state.db,async tx=>{
      const snap=await tx.get(dayRef),data=snap.exists()?snap.data():{},active=data.active||{};
      if(!active[state.user.uid]||!active[state.partner.uid]||data.completed)return false;
      tx.set(dayRef,{completed:true,completedAt:firebase.serverTimestamp()},{merge:true});return true;
    });

    state.streakRepairAt=0;
    const count=await repairStreakFromHistory(true);
    if(newlyCompleted){
      await Promise.all([
        awardAppPoints(state.user.uid,`streak_${state.todayKey}`,2,"Racha diaria"),
        awardAppPoints(state.partner.uid,`streak_${state.todayKey}`,2,"Racha diaria")
      ]);
      toast(`🔥 ¡Racha de ${count} ${count===1?"día":"días"}! +2 puntos cada uno`,3600);
      await sendActivityMessage({key:`streak_complete_${state.todayKey}`,icon:"🔥",title:`¡La racha llegó a ${count} ${count===1?"día":"días"}!`,subtitle:"Los dos estuvieron presentes hoy ♡",action:"streak"});
    }
  }catch(e){console.warn("No se pudo activar la racha",e)}
}

async function voteCompatibility(choice) {
  if (!state.user) return;
  const game = getCompatibilityToday();
  const ref = bubbleDoc("games", `compat_${state.todayKey}`);
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
    await sendActivityMessage({key:`questions_${state.todayKey}_${state.user.uid}`,icon:"💭",title:"Respondió preguntas de pareja",subtitle:"Toca para responder las tuyas",action:"questions"});
  } catch (e) { toast(niceError(e)); }
}

async function saveGuessGame() {
  if (!state.user) return;
  if (state.guessMineChoice === null || state.guessPartnerChoice === null) {
    return toast("Elige tu respuesta y también tu predicción.");
  }
  const game = getGuessToday();
  const ref = bubbleDoc("games", `guess_${state.todayKey}`);
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
    await sendActivityMessage({key:`questions_${state.todayKey}_${state.user.uid}`,icon:"💭",title:"Respondió preguntas de pareja",subtitle:"Toca para responder las tuyas",action:"questions"});
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
  const newest=state.messages[state.messages.length-1];
  if(!newest?.id||state.lastMarkedReadMessageId===newest.id)return;
  state.lastMarkedReadMessageId=newest.id;
  try{
    await firebase.setDoc(bubbleDoc("shared","reads"),{[state.user.uid]:firebase.serverTimestamp()},{merge:true});
  }catch{state.lastMarkedReadMessageId=""}
}

async function updatePresence(online) {
  if(!state.user||!state.activeBubbleId)return;
  const activity=state.currentGameTitle?`game:${state.currentGameTitle}`:(state.presenceOverride||state.currentView||"Chat");
  try{
    await firebase.setDoc(bubbleDoc("presence",state.user.uid),{
      uid:state.user.uid,online,bubbleId:state.activeBubbleId,activity:online?activity:"",lastSeen:firebase.serverTimestamp()
    },{merge:true});
  }catch{}
}

async function setTyping(typing) {
  if (!state.user || state.typingSent === typing) return;
  state.typingSent = typing;
  try {
    await firebase.setDoc(bubbleDoc("typing", state.user.uid), {
      uid: state.user.uid,
      typing,
      updatedAt: firebase.serverTimestamp()
    }, { merge:true });
  } catch {}
}

function renderStickerTray() {
  const grid=$("#stickerGrid");if(!grid)return;grid.textContent="";
  const favs=getStickerSaved("favorites"),recent=getStickerSaved("recent");let list=[];
  if(state.stickerTab==="phrases")list=STICKERS;else if(state.stickerTab==="mapachin")list=MAPACHIN_STICKERS;else if(state.stickerTab==="favorites")list=favs.map(stickerById).filter(Boolean);else list=recent.map(stickerById).filter(Boolean);
  if(!list.length){grid.innerHTML=`<div class="tiny" style="grid-column:1/-1;text-align:center;padding:20px">${state.stickerTab==="favorites"?"Marca stickers con ★ para guardarlos.":"Todavía no hay stickers recientes."}</div>`;return}
  list.forEach(sticker=>{const wrap=document.createElement("div");wrap.className=`sticker-option ${sticker.kind||"phrase"}`;const main=document.createElement("button");main.type="button";main.className="sticker-main";if(sticker.asset){main.innerHTML=`<img alt="Sticker">`;main.querySelector("img").src=sticker.asset}else{main.innerHTML=`<span class="sticker-emoji"></span><span class="sticker-label"></span>`;main.querySelector(".sticker-emoji").textContent=sticker.emoji;main.querySelector(".sticker-label").textContent=sticker.label}main.onclick=()=>sendSticker(sticker.id);const star=document.createElement("button");star.type="button";star.className="sticker-fav";star.textContent=favs.includes(sticker.id)?"★":"☆";star.onclick=e=>{e.stopPropagation();toggleStickerFavorite(sticker.id)};wrap.append(main,star);grid.appendChild(wrap)})
}
function toggleStickerFavorite(id){let favs=getStickerSaved("favorites");favs=favs.includes(id)?favs.filter(x=>x!==id):[id,...favs];setStickerSaved("favorites",favs);renderStickerTray();haptic(8)}
function toggleStickerTray(force){const tray=$("#stickerTray");if(!tray)return;const shouldOpen=force===undefined?tray.classList.contains("hidden"):!!force;tray.classList.toggle("hidden",!shouldOpen);if(shouldOpen){renderStickerTray();const g=$("#stickerGrid");if(g)requestAnimationFrame(()=>{g.scrollTop=0});setTyping(false)}}
async function sendSticker(stickerId){if(!state.user)return;const sticker=stickerById(stickerId);if(!sticker)return;try{await firebase.addDoc(bubbleCollection("messages"),{senderId:state.user.uid,text:"",images:[],stickerId:sticker.id,stickerEmoji:sticker.emoji||"",stickerText:sticker.label||"",stickerAsset:sticker.asset||"",stickerKind:sticker.kind||"phrase",replyTo:replyPayload(),createdAt:firebase.serverTimestamp()});let recent=getStickerSaved("recent").filter(x=>x!==sticker.id);setStickerSaved("recent",[sticker.id,...recent]);clearComposeContext();toggleStickerTray(false);await setTyping(false);requestAnimationFrame(scrollMessages);haptic(12);markDailyActive("sticker")}catch(e){toast(niceError(e))}}


function replyPayload(){if(!state.replyTo)return null;return{id:state.replyTo.id,senderId:state.replyTo.senderId,senderName:state.replyTo.senderId===state.user.uid?(state.me?.displayName||"Tú"):(state.partner?.displayName||"Tu persona"),text:(state.replyTo.text||state.replyTo.stickerText||(state.replyTo.images?.length||state.replyTo.imageData?"📷 Foto":"Sticker")).slice(0,180)}}
function setReply(msg){state.replyTo=msg;state.editMessageId="";renderReplyBar();$("#messageInput").focus()}
function renderReplyBar(){const bar=$("#replyBar");if(!bar)return;if(state.editMessageId){const msg=state.messages.find(m=>m.id===state.editMessageId);bar.classList.remove("hidden");$("#replyBarLabel").textContent="EDITANDO MENSAJE";$("#replyBarText").textContent=(msg?.text||"").slice(0,120);return}if(state.replyTo){bar.classList.remove("hidden");$("#replyBarLabel").textContent="RESPONDIENDO";$("#replyBarText").textContent=(state.replyTo.text||state.replyTo.stickerText||"📷 Foto / sticker").slice(0,120)}else bar.classList.add("hidden")}
function clearComposeContext(){state.replyTo=null;state.editMessageId="";renderReplyBar()}
function renderPendingMedia(){const box=$("#pendingMedia");if(!box)return;box.textContent="";box.classList.toggle("hidden",!state.pendingImages.length);state.pendingImages.forEach((src,i)=>{const d=document.createElement("div");d.className="pending-media-item";d.innerHTML=`<img alt="Foto pendiente"><button type="button">×</button>`;d.querySelector("img").src=src;d.querySelector("button").onclick=()=>{state.pendingImages.splice(i,1);renderPendingMedia()};box.appendChild(d)})}
async function sendMessage(text, imageData=""){
  if(!state.user)return;const clean=String(text||"").trim();
  if(state.editMessageId){if(!clean)return toast("El mensaje no puede quedar vacío.");const msg=state.messages.find(m=>m.id===state.editMessageId);if(!msg||msg.senderId!==state.user.uid)return clearComposeContext();await firebase.updateDoc(bubbleDoc("messages",msg.id),{text:clean.slice(0,3500),editedAt:firebase.serverTimestamp()});$("#messageInput").value="";localStorage.removeItem(draftKey());clearComposeContext();autoGrow($("#messageInput"));haptic(10);return}
  const images=state.pendingImages.length?[...state.pendingImages]:(imageData?[imageData]:[]);if(!clean&&!images.length)return;
  await firebase.addDoc(bubbleCollection("messages"),{senderId:state.user.uid,text:clean.slice(0,3500),images:images.slice(0,3),imageData:"",replyTo:replyPayload(),createdAt:firebase.serverTimestamp()});
  $("#messageInput").value="";state.pendingImages=[];renderPendingMedia();localStorage.removeItem(draftKey());clearComposeContext();autoGrow($("#messageInput"));await setTyping(false);requestAnimationFrame(scrollMessages);haptic(10);markDailyActive(images.length?"photo":"message")
}


async function saveStatus(emoji, text) {
  if (!state.user) return;
  try {
    await firebase.updateDoc(bubbleMemberDoc(), {
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
    await firebase.addDoc(bubbleCollection("nudges"), {
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
    const oldHandle = state.accountProfile?.handle || state.me?.handle || "";
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
    state.accountProfile = { ...(state.accountProfile || {}), uid, displayName, handle:newHandle, bio };
    await syncProfileToAllBubbles({displayName,handle:newHandle,bio});
    toast("Perfil guardado ♡");
  } catch (e) { toast(niceError(e)); }
}

async function voteThisOrThat(choice) {
  if (!state.user) return;
  const ref = bubbleDoc("games", `tot_${state.todayKey}`);
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
    await sendActivityMessage({key:`questions_${state.todayKey}_${state.user.uid}`,icon:"💭",title:"Respondió preguntas de pareja",subtitle:"Toca para responder las tuyas",action:"questions"});
  } catch (e) { toast(niceError(e)); }
}

async function saveDailyAnswer() {
  if (!state.user) return;
  const answer = $("#dailyAnswer").value.trim().slice(0,500);
  if (!answer) return toast("Escribe una respuesta primero.");
  const ref = bubbleDoc("games", `question_${state.todayKey}`);
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
    await sendActivityMessage({key:`questions_${state.todayKey}_${state.user.uid}`,icon:"💭",title:"Respondió preguntas de pareja",subtitle:"Toca para responder las tuyas",action:"questions"});
  } catch (e) { toast(niceError(e)); }
}

function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = `${Math.min(112, el.scrollHeight)}px`;
}

async function compressImage(file,maxDim=900,quality=.72,maxChars=620000){if(!file?.type?.startsWith("image/"))throw new Error("Selecciona una imagen.");const bitmap=await createImageBitmap(file),scale=Math.min(1,maxDim/Math.max(bitmap.width,bitmap.height)),w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale)),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;canvas.getContext("2d",{alpha:false}).drawImage(bitmap,0,0,w,h);const data=canvas.toDataURL("image/jpeg",quality);if(data.length>maxChars&&maxDim>420)return compressImage(file,Math.max(420,Math.floor(maxDim*.78)),Math.max(.42,quality-.08),maxChars);if(data.length>maxChars*1.18)throw new Error("La foto sigue siendo muy pesada. Prueba con otra.");return data}

function openImage(src) {
  $("#imagePreview").src = src;
  $("#imagePreviewModal").classList.remove("hidden");
}


const GAME_PATHS = {
  burbujacraft: [
    "../burbujacraft/",
    "../Burbujacraft/",
    "../BURBUJACRAFT/",
    "../bubujacraft/",
    "../Bubujacraft/"
  ],
  hungry: [
    "../burbuja-hambrienta/",
    "../burbuja_hambrienta/",
    "../burbuja%20hambrienta/",
    "../Burbuja%20Hambrienta/",
    "../Burbuja-Hambrienta/",
    "../burbuja-hambrienta-github/",
    "../burbuja_hambrienta_github/"
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
  const gameUrl = new URL(found);
  gameUrl.searchParams.set("bubbleId", state.activeBubbleId);
  gameUrl.searchParams.set("bubbleName", state.activeBubble?.name || "Nuestra Burbuja");
  localStorage.setItem("burbuja-active-bubble", state.activeBubbleId);
  state.currentGameUrl = gameUrl.href;
  state.currentGameTitle = title;
  updatePresence(true);
  renderPartnerHeader();
  $("#gameLauncherTitle").textContent = title;
  $("#gameFrame").src = gameUrl.href;
  $("#gameLauncherModal").classList.remove("hidden");
}

function closeGameLauncher() {
  $("#gameLauncherModal").classList.add("hidden");
  $("#gameFrame").src = "about:blank";
  state.currentGameUrl = "";
  state.currentGameTitle = "";
  updatePresence(true);
}


function scrollToMessage(id){
  const box=$("#messages"),row=box?.querySelector(`[data-message-id="${CSS.escape(id||"")}"]`);
  if(!box||!row)return toast("Ese mensaje no está cargado. Prueba cargar anteriores.");
  const target=row.offsetTop-(box.clientHeight-row.offsetHeight)/2;
  box.scrollTo({top:Math.max(0,target),behavior:"smooth"});
  row.animate([{filter:"brightness(1)"},{filter:"brightness(1.8)"},{filter:"brightness(1)"}],{duration:900});
}
function openMessageActions(msg){state.messageActionId=msg.id;const mine=msg.senderId===state.user.uid;$("#actionEdit").classList.toggle("hidden",!mine||!msg.text||msg.stickerId);$("#actionDeleteAll").classList.toggle("hidden",!mine);$("#actionCopy").classList.toggle("hidden",!msg.text);const save=$("#actionSave span");if(save)save.textContent=isMessageSaved(msg.id)?"Quitar guardado":"Guardar";$("#messageActionsModal").classList.remove("hidden");haptic(8)}
function closeMessageActions(){state.messageActionId="";$("#messageActionsModal").classList.add("hidden")}
function actionMessage(){return state.messages.find(m=>m.id===state.messageActionId)}
async function reactToMessage(id,emoji){const msg=state.messages.find(m=>m.id===id);if(!msg)return;const current=msg.reactions?.[state.user.uid]||"";try{await firebase.updateDoc(bubbleDoc("messages",id),{[`reactions.${state.user.uid}`]:current===emoji?firebase.deleteField():emoji});haptic(8)}catch(e){toast(niceError(e))}}
async function loadOlderMessages(){
  if(state.olderExhausted||!state.messages.length)return;
  const btn=$("#loadOlderBtn"),box=$("#messages"),first=state.messages[0];
  if(!first?.createdAt||!box)return;
  const oldHeight=box.scrollHeight,oldTop=box.scrollTop;
  btn.disabled=true;btn.textContent="Cargando…";
  try{
    const q=firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","asc"),firebase.endBefore(first.createdAt),firebase.limitToLast(80));
    const snap=await firebase.getDocs(q),older=snap.docs.map(d=>({id:d.id,...d.data()}));
    const ids=new Set(state.messages.map(m=>m.id));
    state.messages=[...older.filter(m=>!ids.has(m.id)),...state.messages];
    state.olderExhausted=older.length<80;
    btn.classList.toggle("hidden",state.olderExhausted);
    renderMessages();
    requestAnimationFrame(()=>{box.scrollTop=oldTop+Math.max(0,box.scrollHeight-oldHeight)});
    if(!older.length)toast("Ya llegaste al inicio ♡");
  }catch(e){toast(niceError(e))}
  finally{btn.disabled=false;btn.textContent="↑ Cargar mensajes anteriores"}
}
function safeAccent(value){
  const allowed=["#ff4f91","#b86cff","#65b8ff","#ff7b6b","#71d7b4"];
  return allowed.includes(value)?value:"#ff4f91";
}
function hexRgb(hex){const n=parseInt(hex.slice(1),16);return `${(n>>16)&255},${(n>>8)&255},${n&255}`}
function applyChatAppearance(data={}){
  const allowed=["oscuro","estrellas","burbujas","rosa-morado","minimal","custom"];
  const theme=allowed.includes(data.theme)?data.theme:"oscuro";
  const accent=safeAccent(data.accent);
  const custom=typeof data.customBackground==="string"?data.customBackground:"";
  state.chatAppearance={...(state.chatAppearance||{}),...data,theme,accent,customBackground:custom};
  const view=$("#viewChat"),shell=$("#appShell");
  view?.setAttribute("data-chat-theme",theme);
  shell?.style.setProperty("--bubble-accent",accent);
  shell?.style.setProperty("--bubble-accent-rgb",hexRgb(accent));
  let image="";
  if(custom)image=`url("${custom}")`;
  else{
    const urls={oscuro:"./assets/backgrounds/oscuro.svg?v=15",estrellas:"./assets/backgrounds/estrellas.svg?v=15",burbujas:"./assets/backgrounds/burbujas.svg?v=15","rosa-morado":"./assets/backgrounds/rosa-morado.svg?v=15",minimal:"./assets/backgrounds/minimal.svg?v=15"};
    image=`url("${urls[theme]||urls.oscuro}")`;
  }
  view?.style.setProperty("--chat-wallpaper",image);
  view?.style.setProperty("--chat-wallpaper-size",custom||theme==="minimal"?"cover":"360px 260px");
  view?.style.setProperty("--chat-wallpaper-repeat",custom||theme==="minimal"?"no-repeat":"repeat");
  $$("[data-chat-theme]").forEach(b=>b.classList.toggle("active",!custom&&b.dataset.chatTheme===theme));
  $$("[data-accent]").forEach(b=>b.classList.toggle("active",b.dataset.accent===accent));
  $("#removeChatBackground")?.classList.toggle("hidden",!custom);
  if(state.user&&state.activeBubbleId)localStorage.setItem(`burbuja-chat-theme-${state.user.uid}-${state.activeBubbleId}`,custom?"oscuro":theme);
}
async function saveChatAppearance(patch){
  if(!state.user)return;
  const next={theme:state.chatAppearance?.theme||"oscuro",accent:state.chatAppearance?.accent||"#ff4f91",customBackground:state.chatAppearance?.customBackground||"",...patch,updatedBy:state.user.uid,updatedAt:firebase.serverTimestamp()};
  applyChatAppearance(next);
  try{await firebase.setDoc(bubbleDoc("shared","chatAppearance"),next,{merge:true})}catch(e){toast(niceError(e))}
}
function applyChatTheme(theme){saveChatAppearance({theme,customBackground:""})}

function setAvatarBackground(el,profile){if(!el)return;const src=profile?.avatarData||"";el.style.backgroundImage=src?`url("${src}")`:"";el.textContent=src?"":initials(profile?.displayName||"")}

function renderSavedCount(){
  const n=Object.keys(state.savedMessages||{}).length;
  if($("#savedCountMini"))$("#savedCountMini").textContent=String(n);
}
function isMessageSaved(id){return !!state.savedMessages?.[id]}
async function toggleSavedMessage(id){
  if(!id||!state.user)return;
  const ref=bubbleDoc("shared","savedMessages");
  try{
    await firebase.runTransaction(state.db,async tx=>{
      const snap=await tx.get(ref),data=snap.exists()?snap.data():{},items={...(data.items||{})};
      if(items[id])delete items[id];
      else{
        const keys=Object.keys(items);
        if(keys.length>=120)delete items[keys.sort((a,b)=>(items[a]?.savedAtMs||0)-(items[b]?.savedAtMs||0))[0]];
        items[id]={savedBy:state.user.uid,savedAtMs:Date.now()};
      }
      tx.set(ref,{items,updatedAt:firebase.serverTimestamp()},{merge:true});
    });
    toast(isMessageSaved(id)?"Quitado de Guardados":"Guardado ⭐");
  }catch(e){toast(niceError(e))}
}
async function renderSavedMessages(){
  const box=$("#savedMessagesList");if(!box)return;
  const ids=Object.keys(state.savedMessages||{});
  if(!ids.length){box.innerHTML='<div class="v15-empty">⭐<strong>Aún no guardan nada</strong><small>Mantén pulsado un mensaje y toca Guardar.</small></div>';return}
  box.innerHTML='<div class="v15-loading">Cargando guardados…</div>';
  const docs=await Promise.all(ids.slice(0,120).map(async id=>{try{const s=await firebase.getDoc(bubbleDoc("messages",id));return s.exists()?{id,...s.data()}:null}catch{return null}}));
  box.textContent="";
  docs.filter(Boolean).sort((a,b)=>(state.savedMessages[b.id]?.savedAtMs||0)-(state.savedMessages[a.id]?.savedAtMs||0)).forEach(m=>{
    const card=document.createElement("div");card.className="v15-item-card saved-card";
    const media=(m.images?.[0]||m.imageData||m.stickerAsset||"");
    if(media){const im=document.createElement("img");im.src=media;im.alt="Guardado";card.appendChild(im)}
    const copy=document.createElement("div");copy.className="v15-item-copy";copy.innerHTML='<strong></strong><small></small>';
    copy.querySelector('strong').textContent=m.text||m.stickerText||(media?"📷 Foto guardada":"Mensaje guardado");
    copy.querySelector('small').textContent=`${m.senderId===state.user.uid?"Tú":state.partner?.displayName||"Tu persona"} · ${dateSeparatorLabel(m.createdAt)}`;
    const actions=document.createElement("div");actions.className="v15-inline-actions";
    const go=document.createElement("button");go.type="button";go.textContent="Ir al mensaje";go.onclick=()=>goToMessageFromArchive(m.id);
    const del=document.createElement("button");del.type="button";del.textContent="Quitar";del.onclick=()=>toggleSavedMessage(m.id);
    actions.append(go,del);copy.appendChild(actions);card.appendChild(copy);box.appendChild(card);
  });
}
function mergeArchiveMessages(list){
  const map=new Map([...state.archiveMessages,...state.messages,...list].map(m=>[m.id,m]));
  state.archiveMessages=[...map.values()].sort((a,b)=>tsMillis(a.createdAt)-tsMillis(b.createdAt));
}
async function loadArchiveBatch(reset=false){
  if(reset){state.archiveMessages=[];state.archiveCursor=null;state.archiveDone=false}
  if(state.archiveDone)return;
  try{
    let q;
    if(state.archiveCursor)q=firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","desc"),firebase.startAfter(state.archiveCursor),firebase.limit(70));
    else q=firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","desc"),firebase.limit(70));
    const snap=await firebase.getDocs(q),list=snap.docs.map(d=>({id:d.id,...d.data()}));
    if(snap.docs.length)state.archiveCursor=snap.docs[snap.docs.length-1];
    if(snap.docs.length<70)state.archiveDone=true;
    mergeArchiveMessages(list);state.archiveLoadedAt=Date.now();
  }catch(e){console.warn("No se pudo cargar historial",e);toast("No se pudo cargar más historial")}
}
async function ensureArchive(){if(!state.archiveMessages.length||Date.now()-state.archiveLoadedAt>180000)await loadArchiveBatch(true)}
function messageImages(m){return Array.isArray(m.images)&&m.images.length?m.images:(m.imageData?[m.imageData]:[])}
async function openGallery(){
  $("#galleryModal").classList.remove("hidden");$("#galleryGrid").innerHTML='<div class="v15-loading">Preparando galería…</div>';
  await ensureArchive();renderGallery();
}
function renderGallery(){
  const grid=$("#galleryGrid");if(!grid)return;grid.textContent="";
  const items=[];
  state.archiveMessages.forEach(m=>messageImages(m).forEach((src,i)=>items.push({src,messageId:m.id,at:tsMillis(m.createdAt),label:m.senderId===state.user.uid?"Tú":state.partner?.displayName||"Tu persona"})));
  activeStatusesFor(state.user?.uid).concat(state.partner?activeStatusesFor(state.partner.uid):[]).forEach(s=>{if(s.photoData)items.push({src:s.photoData,statusId:s.id,at:tsMillis(s.createdAt),label:"Estado"})});
  items.sort((a,b)=>b.at-a.at);
  if(!items.length){grid.innerHTML='<div class="v15-empty wide">🖼️<strong>Aún no hay fotos</strong><small>Las fotos del chat y estados activos aparecerán aquí.</small></div>';return}
  items.slice(0,180).forEach(item=>{
    const card=document.createElement("button");card.type="button";card.className="gallery-tile";card.innerHTML='<img alt="Foto"><span></span>';card.querySelector('img').src=item.src;card.querySelector('span').textContent=item.label;card.onclick=()=>openImage(item.src);if(item.messageId){const go=document.createElement("i");go.textContent="↗";go.title="Ir al mensaje";go.onclick=e=>{e.stopPropagation();goToMessageFromArchive(item.messageId)};card.appendChild(go)}grid.appendChild(card);
  });
}
function extractUrls(text=""){return [...new Set((String(text).match(/https?:\\/\\/[^\\s<>()]+/gi)||[]).map(u=>u.replace(/[.,!?;:]+$/,"")))]}
async function openLinks(){
  $("#linksModal").classList.remove("hidden");$("#linksList").innerHTML='<div class="v15-loading">Buscando enlaces…</div>';await ensureArchive();renderLinks();
}
function renderLinks(){
  const box=$("#linksList");if(!box)return;box.textContent="";const items=[];
  state.archiveMessages.forEach(m=>extractUrls(m.text).forEach(url=>items.push({url,m})));items.sort((a,b)=>tsMillis(b.m.createdAt)-tsMillis(a.m.createdAt));
  if(!items.length){box.innerHTML='<div class="v15-empty">🔗<strong>Aún no hay enlaces</strong><small>Los links enviados por chat aparecerán automáticamente.</small></div>';return}
  items.slice(0,120).forEach(({url,m})=>{let host=url;try{host=new URL(url).hostname.replace(/^www\\./,'')}catch{}const card=document.createElement("div");card.className="v15-item-card link-card";const copy=document.createElement("div");copy.className="v15-item-copy";copy.innerHTML='<strong></strong><small></small>';copy.querySelector('strong').textContent=host;copy.querySelector('small').textContent=(m.text||url).slice(0,120);const acts=document.createElement("div");acts.className="v15-inline-actions";const open=document.createElement("button");open.type="button";open.textContent="Abrir";open.onclick=()=>window.open(url,"_blank","noopener");const go=document.createElement("button");go.type="button";go.textContent="Ir al mensaje";go.onclick=()=>goToMessageFromArchive(m.id);acts.append(open,go);copy.appendChild(acts);card.appendChild(copy);box.appendChild(card)});
}
async function loadMessageContext(id){
  const target=await firebase.getDoc(bubbleDoc("messages",id));if(!target.exists())return false;const data={id,...target.data()},at=data.createdAt;
  const [before,after]=await Promise.all([
    firebase.getDocs(firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","asc"),firebase.endAt(at),firebase.limitToLast(24))),
    firebase.getDocs(firebase.query(bubbleCollection("messages"),firebase.orderBy("createdAt","asc"),firebase.startAt(at),firebase.limit(24)))
  ]);
  const list=[...before.docs,...after.docs].map(d=>({id:d.id,...d.data()}));const map=new Map([...state.messages,...list].map(m=>[m.id,m]));state.messages=[...map.values()].sort((a,b)=>tsMillis(a.createdAt)-tsMillis(b.createdAt));renderMessages();return true;
}
async function goToMessageFromArchive(id){
  ["savedModal","galleryModal","linksModal"].forEach(mid=>$("#"+mid)?.classList.add("hidden"));
  switchView("Chat");
  if(!state.messages.some(m=>m.id===id)){try{await loadMessageContext(id)}catch{}}
  setTimeout(()=>scrollToMessage(id),80);
}
function renderSharedNote(){
  const text=state.sharedNote?.text||"";const mini=$("#noteMini");if(mini)mini.textContent=text?`${Math.min(text.length,99)} car.`:"Vacía";
  const input=$("#sharedNoteInput");if(input&&document.activeElement!==input)input.value=text;
  const label=$("#noteUpdatedLabel");if(label&&state.sharedNote?.updatedAt)label.textContent=`Actualizada ${relativeTime(state.sharedNote.updatedAt)}`;
}
async function saveSharedNote(){
  const text=$("#sharedNoteInput").value.slice(0,5000);try{await firebase.setDoc(bubbleDoc("shared","sharedNote"),{text,updatedBy:state.user.uid,updatedAt:firebase.serverTimestamp()},{merge:true});toast("Nota guardada 📝")}catch(e){toast(niceError(e))}
}
function dateInfo(item){
  if(!item?.date)return null;const parts=item.date.split('-').map(Number);if(parts.length<3)return null;const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);let next=new Date(now.getFullYear(),parts[1]-1,parts[2],12);if(next<today)next=new Date(now.getFullYear()+1,parts[1]-1,parts[2],12);const days=Math.max(0,Math.round((next-today)/86400000));return {next,days};
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>{if(ch==="&")return "&amp;";if(ch==="<")return "&lt;";if(ch===">")return "&gt;";if(ch==='"')return "&quot;";return "&#39;"});
}
function renderSpecialDates(){
  const list=[...(state.specialDates||[])].map(i=>({item:i,info:dateInfo(i)})).filter(x=>x.info).sort((a,b)=>a.info.days-b.info.days);
  const mini=$("#dateMini"),next=$("#nextSpecialDate");
  if(!list.length){if(mini)mini.textContent="Agregar";next?.classList.add("hidden")}else{const first=list[0];if(mini)mini.textContent=first.info.days===0?"Hoy":`${first.info.days} d`;if(next){next.classList.remove("hidden");next.innerHTML=`<span>${first.item.emoji||"❤️"}</span><div><small>PRÓXIMA FECHA</small><strong>${escapeHtml(first.item.label||"Fecha especial")}</strong><p>${first.info.days===0?"Es hoy ♡":first.info.days===1?"Falta 1 día":`Faltan ${first.info.days} días`}</p></div>`}}
  const box=$("#specialDatesList");if(!box)return;box.textContent="";
  if(!list.length){box.innerHTML='<div class="v15-empty">📅<strong>Aún no hay fechas</strong><small>Agrega cumpleaños, aniversarios u otros días importantes.</small></div>';return}
  list.forEach(({item,info})=>{const row=document.createElement("div");row.className="special-date-row";row.innerHTML='<span class="special-emoji"></span><div><strong></strong><small></small></div><button type="button">×</button>';row.querySelector('.special-emoji').textContent=item.emoji||"❤️";row.querySelector('strong').textContent=item.label||"Fecha especial";row.querySelector('small').textContent=`${item.date.slice(5).split('-').reverse().join('/')} · ${info.days===0?"hoy":info.days===1?"1 día":`${info.days} días`}`;row.querySelector('button').onclick=()=>removeSpecialDate(item.id);box.appendChild(row)});
}
async function addSpecialDate(){
  const label=$("#specialDateLabel").value.trim(),date=$("#specialDateValue").value,emoji=$("#specialDateEmoji").value||"❤️";if(!label||!date)return toast("Escribe un nombre y elige una fecha.");
  const ref=bubbleDoc("shared","specialDates");try{await firebase.runTransaction(state.db,async tx=>{const snap=await tx.get(ref),items=snap.exists()&&Array.isArray(snap.data().items)?[...snap.data().items]:[];if(items.length>=12)throw new Error("Máximo 12 fechas especiales.");items.push({id:`d_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,label:label.slice(0,40),date,emoji,createdBy:state.user.uid});tx.set(ref,{items,updatedAt:firebase.serverTimestamp()},{merge:true})});$("#specialDateLabel").value="";$("#specialDateValue").value="";toast("Fecha guardada 📅")}catch(e){toast(niceError(e))}
}
async function removeSpecialDate(id){
  if(!confirm("¿Quitar esta fecha especial?"))return;const ref=bubbleDoc("shared","specialDates");try{await firebase.runTransaction(state.db,async tx=>{const snap=await tx.get(ref),items=snap.exists()&&Array.isArray(snap.data().items)?snap.data().items:[];tx.set(ref,{items:items.filter(i=>i.id!==id),updatedAt:firebase.serverTimestamp()},{merge:true})})}catch(e){toast(niceError(e))}
}
function renderBurbujaSummary(){
  const streak=Math.max(Number(state.streakData?.count||0),Number(state.streakRepairCount||0));
  const stories=state.statuses.filter(s=>tsMillis(s.expiresAt)>Date.now()).length;
  const points=(state.me?.uid?pointsForUid(state.me.uid):0)+(state.partner?.uid?pointsForUid(state.partner.uid):0);
  if($("#summaryStreak"))$("#summaryStreak").textContent=String(streak);if($("#summaryStories"))$("#summaryStories").textContent=String(stories);if($("#summaryPoints"))$("#summaryPoints").textContent=points.toLocaleString("es-MX");
}
function memoryHash(text){let h=0;for(let i=0;i<text.length;i++)h=(h*31+text.charCodeAt(i))>>>0;return h}
async function refreshMemoryCard(force=false){
  const card=$("#memoryCard");if(!card||!state.user)return;try{if(force||!state.archiveMessages.length)await ensureArchive();const cutoff=Date.now()-86400000;const candidates=state.archiveMessages.filter(m=>!m.systemEvent&&tsMillis(m.createdAt)<cutoff&&(m.text||messageImages(m).length));if(!candidates.length){card.classList.add("hidden");return}const pick=candidates[memoryHash(`${state.todayKey}-${state.activeBubbleId}`)%candidates.length];state.memoryMessageId=pick.id;card.classList.remove("hidden");const media=$("#memoryMedia"),img=messageImages(pick)[0];media.textContent="";media.classList.toggle("hidden",!img);if(img){const im=document.createElement("img");im.src=img;im.alt="Recuerdo";media.appendChild(im)}$("#memoryText").textContent=(pick.text||pick.stickerText||(img?"Una foto de ustedes":"Un momento de ustedes")).slice(0,180);$("#memoryWhen").textContent=`${relativeTime(pick.createdAt)} · toca para verlo en el chat`;}catch{card.classList.add("hidden")}
}
function dataUrlBytes(s=""){if(!s)return 0;const comma=s.indexOf(',');const b64=comma>=0?s.slice(comma+1):s;return Math.round(b64.length*0.75)}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
async function openStorageManager(){
  $("#storageModal").classList.remove("hidden");$("#storageList").innerHTML='<div class="v15-loading">Calculando…</div>';await ensureArchive();renderStorageManager();
}
function renderStorageManager(){
  const box=$("#storageList");if(!box)return;box.textContent="";const items=[];
  state.archiveMessages.filter(m=>m.senderId===state.user.uid).forEach(m=>{const imgs=messageImages(m);if(imgs.length)items.push({kind:"message",id:m.id,src:imgs[0],bytes:imgs.reduce((n,s)=>n+dataUrlBytes(s),0),at:tsMillis(m.createdAt),hasText:!!(m.text||m.stickerId)})});
  activeStatusesFor(state.user.uid).forEach(s=>{if(s.photoData)items.push({kind:"status",id:s.id,src:s.photoData,bytes:dataUrlBytes(s.photoData),at:tsMillis(s.createdAt)})});
  if(state.chatAppearance?.customBackground)items.push({kind:"background",id:"background",src:state.chatAppearance.customBackground,bytes:dataUrlBytes(state.chatAppearance.customBackground),at:Date.now()});
  items.sort((a,b)=>b.at-a.at);const total=items.reduce((n,i)=>n+i.bytes,0);$("#storageSummary").textContent=`Tus imágenes encontradas: ${items.length} · aprox. ${formatBytes(total)}`;
  if(!items.length){box.innerHTML='<div class="v15-empty">🧹<strong>No hay imágenes tuyas para limpiar</strong><small>Burbuja no borra nada automáticamente desde aquí.</small></div>';return}
  items.forEach(item=>{const row=document.createElement("div");row.className="storage-row";row.innerHTML='<img alt="Imagen"><div><strong></strong><small></small></div><button type="button"></button>';row.querySelector('img').src=item.src;row.querySelector('strong').textContent=item.kind==="status"?"Estado":item.kind==="background"?"Fondo personalizado":"Foto del chat";row.querySelector('small').textContent=formatBytes(item.bytes);row.querySelector('button').textContent=item.kind==="background"?"Quitar":"Eliminar";row.querySelector('button').onclick=()=>removeStoredMedia(item);box.appendChild(row)});
}
async function removeStoredMedia(item){
  if(!confirm(item.kind==="message"?"¿Quitar esta foto de tu mensaje?":"¿Eliminar esta imagen?"))return;
  try{
    if(item.kind==="status")await firebase.deleteDoc(bubbleDoc("statuses",item.id));
    else if(item.kind==="background")await saveChatAppearance({theme:"oscuro",customBackground:""});
    else{const m=state.archiveMessages.find(x=>x.id===item.id)||state.messages.find(x=>x.id===item.id);if(m&&(m.text||m.stickerId))await firebase.updateDoc(bubbleDoc("messages",item.id),{images:[],imageData:firebase.deleteField()});else await firebase.deleteDoc(bubbleDoc("messages",item.id))}
    state.archiveLoadedAt=0;await loadArchiveBatch(true);renderStorageManager();toast("Contenido eliminado")
  }catch(e){toast(niceError(e))}
}
function activeStatusesFor(uid){return state.statuses.filter(s=>s.ownerUid===uid&&tsMillis(s.expiresAt)>Date.now()).sort((a,b)=>tsMillis(a.createdAt)-tsMillis(b.createdAt))}
function renderStoryRail(){if(!state.user)return;const mine=activeStatusesFor(state.user.uid),partner=state.partner?activeStatusesFor(state.partner.uid):[];setAvatarBackground($("#myStoryAvatar"),state.me);$("#addStoryBtn")?.classList.toggle("has-story",!!mine.length);const myLabel=$("#addStoryBtn small");if(myLabel)myLabel.textContent=mine.length?`Tus estados · ${mine.length}`:"Tu estado";if(state.partner){const btn=$("#partnerStoryBtn");btn.classList.remove("hidden");btn.classList.toggle("has-story",!!partner.length);btn.classList.toggle("empty-story",!partner.length);setAvatarBackground($("#partnerStoryAvatar"),state.partner);$("#partnerStoryName").textContent=partner.length?`${state.partner.displayName||"Su estado"} · ${partner.length}`:(state.partner.displayName||"Su estado")}else $("#partnerStoryBtn")?.classList.add("hidden");renderBurbujaSummary()}
function openStoryCreate(){state.storyDraftImage="";$("#storyTextInput").value="";$("#storyPhotoPreview").textContent="";$("#storyPhotoPreview").classList.add("hidden");$("#storyCreateModal").classList.remove("hidden")}
async function publishStory(){
  const text=$("#storyTextInput").value.trim().slice(0,220),photo=state.storyDraftImage;
  if(!text&&!photo)return toast("Agrega una foto o escribe algo.");
  const mine=activeStatusesFor(state.user.uid);
  if(mine.length>=30)return toast("Puedes tener hasta 30 estados activos. Elimina uno para subir otro.",4200);
  const btn=$("#publishStoryBtn");btn.disabled=true;
  try{
    await firebase.addDoc(bubbleCollection("statuses"),{
      ownerUid:state.user.uid,text,photoData:photo||"",
      createdAt:firebase.serverTimestamp(),
      expiresAt:firebase.Timestamp.fromMillis(Date.now()+86400000),
      viewedBy:{[state.user.uid]:true},reactions:{}
    });
    $("#storyCreateModal").classList.add("hidden");state.storyDraftImage="";
    toast(`Estado ${mine.length+1}/30 publicado por 24 horas ✨`);
    haptic(12);
    await upsertStoryActivityMessage();
    await markDailyActive("status");
  }catch(e){toast(niceError(e),4000)}finally{btn.disabled=false}
}
function openStoryViewer(uid,index=0){const items=activeStatusesFor(uid);if(!items.length)return;if(uid===state.user.uid&&index===0&&items.length===0)return openStoryCreate();state.storyViewerItems=items;state.storyViewerIndex=Math.max(0,Math.min(index,items.length-1));state.presenceOverride="stories";updatePresence(true);$("#storyViewerModal").classList.remove("hidden");renderStoryViewer()}
async function renderStoryViewer(){const items=state.storyViewerItems,s=items[state.storyViewerIndex];if(!s)return $("#storyViewerModal").classList.add("hidden");const owner=s.ownerUid===state.user.uid?state.me:state.partner;setAvatar($("#storyViewerAvatar"),owner);$("#storyViewerName").textContent=owner?.displayName||"Estado";$("#storyViewerTime").textContent=relativeTime(s.createdAt);const progress=$("#storyProgress");progress.textContent="";items.forEach((_,i)=>{const p=document.createElement("i");if(i<state.storyViewerIndex)p.className="done";if(i===state.storyViewerIndex)p.className="active";progress.appendChild(p)});const media=$("#storyMedia");media.textContent="";if(s.photoData){const im=document.createElement("img");im.src=s.photoData;im.alt="Estado";media.appendChild(im)}else{const d=document.createElement("div");d.className="story-text-card";d.textContent=s.text||"🫧";media.appendChild(d)}$("#storyCaption").textContent=s.photoData?s.text:"";const seen=s.viewedBy||{};const partnerReaction=s.reactions?.[state.partner?.uid]||"";$("#storySeen").textContent=s.ownerUid===state.user.uid?(seen[state.partner?.uid]?`Visto por ${state.partner?.displayName||"tu persona"}${partnerReaction?` · ${partnerReaction}`:" ♡"}`:"Aún no lo ha visto"):"";const mineStory=s.ownerUid===state.user.uid;$("#deleteStoryBtn")?.classList.toggle("hidden",!mineStory);$("#storyViewerAddBtn")?.classList.toggle("hidden",!mineStory);if(s.ownerUid!==state.user.uid&&!seen[state.user.uid]){firebase.updateDoc(bubbleDoc("statuses",s.id),{[`viewedBy.${state.user.uid}`]:true}).catch(()=>{})}}
function stepStory(delta){const ni=state.storyViewerIndex+delta;if(ni<0)return;if(ni>=state.storyViewerItems.length){state.presenceOverride="";updatePresence(true);return $("#storyViewerModal").classList.add("hidden")}state.storyViewerIndex=ni;renderStoryViewer()}
async function reactStory(emoji){const s=state.storyViewerItems[state.storyViewerIndex];if(!s||s.ownerUid===state.user.uid)return;try{await firebase.updateDoc(bubbleDoc("statuses",s.id),{[`reactions.${state.user.uid}`]:emoji});toast(`${emoji} Reacción enviada`);haptic(8)}catch(e){toast(niceError(e))}}
async function replyStory(){const s=state.storyViewerItems[state.storyViewerIndex],text=$("#storyReplyInput").value.trim();if(!s||!text)return;const owner=s.ownerUid===state.user.uid?state.me:state.partner;try{await firebase.addDoc(bubbleCollection("messages"),{senderId:state.user.uid,text:text.slice(0,500),images:[],statusReply:{statusId:s.id,ownerName:owner?.displayName||"Estado",text:(s.text||"📷 Foto").slice(0,160)},createdAt:firebase.serverTimestamp()});$("#storyReplyInput").value="";state.presenceOverride="";$("#storyViewerModal").classList.add("hidden");switchView("Chat");requestAnimationFrame(scrollMessages);markDailyActive("status_reply")}catch(e){toast(niceError(e))}}
async function deleteCurrentStory(){
  const s=state.storyViewerItems[state.storyViewerIndex];
  if(!s||s.ownerUid!==state.user.uid)return;
  if(!confirm("¿Eliminar este estado ahora?"))return;
  const btn=$("#deleteStoryBtn");if(btn)btn.disabled=true;
  try{
    await firebase.deleteDoc(bubbleDoc("statuses",s.id));
    state.storyViewerItems=state.storyViewerItems.filter(x=>x.id!==s.id);
    if(!state.storyViewerItems.length){state.presenceOverride="";updatePresence(true);$("#storyViewerModal").classList.add("hidden");}
    else{state.storyViewerIndex=Math.min(state.storyViewerIndex,state.storyViewerItems.length-1);renderStoryViewer();}
    toast("Estado eliminado 🗑️");haptic(8);
  }catch(e){toast(niceError(e),4000)}finally{if(btn)btn.disabled=false}
}


let viewportBaseline=Math.max(window.innerHeight,window.visualViewport?.height||0);
let viewportRAF=0;
function editableFocused(){
  const a=document.activeElement;return !!a&&(a.matches?.('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select')||a.isContentEditable);
}
function beginKeyboardSession(){
  const box=$("#messages");if(state.currentView!=="Chat"||!box)return;
  state.keyboardSession={wasBottom:nearBottom(130),scrollTop:box.scrollTop};
}
function settleChatAfterViewport(){
  clearTimeout(state.viewportSettleTimer);
  state.viewportSettleTimer=setTimeout(()=>{
    const box=$("#messages"),session=state.keyboardSession;if(!box||!session)return;
    if(session.wasBottom)box.scrollTop=box.scrollHeight;
    else box.scrollTop=Math.min(session.scrollTop,Math.max(0,box.scrollHeight-box.clientHeight));
  },110);
}
function endKeyboardSession(){saveCurrentChatPosition();state.keyboardSession=null}
function syncMobileViewport(resetBaseline=false){
  cancelAnimationFrame(viewportRAF);
  viewportRAF=requestAnimationFrame(()=>{
    const vv=window.visualViewport;
    const h=Math.max(280,Math.round(vv?.height||window.innerHeight));
    const top=Math.max(0,Math.round(vv?.offsetTop||0));
    const focused=editableFocused();
    if(resetBaseline||!focused)viewportBaseline=Math.max(window.innerHeight,vv?.height||0,viewportBaseline);
    const keyboardOpen=focused&&(viewportBaseline-h)>120;
    const root=document.documentElement;
    root.style.setProperty("--vv-height",`${h}px`);
    root.style.setProperty("--vv-top",`${top}px`);
    root.classList.toggle("keyboard-open",keyboardOpen);
    root.classList.toggle("field-focused",focused);
    if(state.currentView==="Chat"&&state.keyboardSession)settleChatAfterViewport();
  });
}

function bindUI() {
  syncMobileViewport(true);
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

  $("#createBubbleForm").addEventListener("submit", async e => {
    e.preventDefault(); const btn=e.submitter; btn.disabled=true;
    try{await createBubble($("#createBubbleName").value,$("#createBubbleEmoji").value);$("#createBubbleName").value="";closeBubbleForms()}
    catch(err){toast(niceError(err),4200)}finally{btn.disabled=false}
  });
  $("#joinBubbleCode").addEventListener("input",e=>{e.target.value=normalizeInviteCode(e.target.value)});
  $("#joinBubbleForm").addEventListener("submit", async e => {
    e.preventDefault(); const btn=e.submitter; btn.disabled=true;
    try{await joinBubble($("#joinBubbleCode").value);$("#joinBubbleCode").value="";closeBubbleForms()}
    catch(err){toast(niceError(err),4200)}finally{btn.disabled=false}
  });
  $("#bubbleSwitcher").addEventListener("click",()=>{saveCurrentChatPosition();showBubbleChooser(true)});
  $("#manageBubblesBtn").addEventListener("click",()=>{saveCurrentChatPosition();showBubbleChooser(true)});
  $("#bubbleBackBtn").addEventListener("click",()=>{state.bubbleChooserFromApp=false;showScreen("app")});
  $("#bubbleHubLogout").addEventListener("click",async()=>{try{if(state.activeBubbleId)await updatePresence(false)}catch{}await firebase.signOut(state.auth)});
  $("#openCreateBubbleBtn")?.addEventListener("click",()=>openBubbleForm("create"));
  $("#openJoinBubbleBtn")?.addEventListener("click",()=>openBubbleForm("join"));
  $$('[data-close-bubble-forms]').forEach(b=>b.addEventListener('click',closeBubbleForms));
  $("#closeEditBubble")?.addEventListener("click",()=>$("#editBubbleModal").classList.add("hidden"));
  $("#editBubbleModal")?.addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add("hidden")});
  $("#saveBubbleEdit")?.addEventListener("click",saveBubbleEdit);
  $("#closeInvitePartner")?.addEventListener("click",()=>$("#invitePartnerModal").classList.add("hidden"));
  $("#invitePartnerModal")?.addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add("hidden")});
  $("#copyInviteCodeBtn")?.addEventListener("click",copyCurrentInviteCode);
  $("#inviteCodeButton")?.addEventListener("click",copyCurrentInviteCode);

  $$(".nav-btn").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  $("#partnerHeader").addEventListener("click", () => state.partner ? switchView("Us") : openCurrentInvite());
  $("#pinnedBanner").addEventListener("click",()=>{if(state.pinnedMessageId){switchView("Chat");requestAnimationFrame(()=>scrollToMessage(state.pinnedMessageId))}else switchView("Us")});

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
    saveDraft();
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
  $("#messageInput").addEventListener("focus",()=>{toggleStickerTray(false);beginKeyboardSession();setTimeout(()=>syncMobileViewport(false),20)});
  $("#messageInput").addEventListener("blur",()=>setTimeout(()=>{syncMobileViewport(true);setTimeout(endKeyboardSession,140)},80));
  $$(".sticker-tab").forEach(btn=>btn.addEventListener("click",()=>{state.stickerTab=btn.dataset.stickerTab;$$('.sticker-tab').forEach(b=>b.classList.toggle('active',b===btn));renderStickerTray();requestAnimationFrame(()=>{const g=$("#stickerGrid");if(g)g.scrollTop=0})}));
  $("#cancelReplyBtn").addEventListener("click",()=>{clearComposeContext();if(state.editMessageId)$("#messageInput").value=""});
  $("#loadOlderBtn").addEventListener("click",loadOlderMessages);
  $("#newMessagesBtn").addEventListener("click",()=>{hideNewMessageButton();scrollMessages({smooth:true});setTimeout(markRead,180)});
  let readScrollTimer=null,positionTimer=null;
  $("#messages").addEventListener("scroll",()=>{
    clearTimeout(positionTimer);positionTimer=setTimeout(saveCurrentChatPosition,450);
    if(nearBottom()){
      hideNewMessageButton();clearTimeout(readScrollTimer);
      if(state.currentView==="Chat")readScrollTimer=setTimeout(markRead,450);
    }
  },{passive:true});
  $("#toggleSearchBtn").addEventListener("click",()=>{$("#chatSearchBox").classList.toggle("hidden");if(!$("#chatSearchBox").classList.contains("hidden"))$("#chatSearchInput").focus()});
  $("#closeSearchBtn").addEventListener("click",()=>{state.searchTerm="";$("#chatSearchInput").value="";$("#chatSearchBox").classList.add("hidden");renderMessages()});
  $("#chatSearchInput").addEventListener("input",e=>{state.searchTerm=e.target.value;renderMessages()});
  $("#chatDateInput").addEventListener("change",e=>{const target=state.messages.find(m=>messageDateKey(m.createdAt)===e.target.value);if(target)scrollToMessage(target.id);else toast("Esa fecha no está cargada. Carga mensajes anteriores.")});
  $$("[data-chat-theme]").forEach(btn=>btn.addEventListener("click",()=>saveChatAppearance({theme:btn.dataset.chatTheme,customBackground:""})));
  $$("[data-accent]").forEach(btn=>btn.addEventListener("click",()=>saveChatAppearance({accent:btn.dataset.accent})));
  $("#chooseChatBackground")?.addEventListener("click",()=>$("#chatBackgroundInput").click());
  $("#chatBackgroundInput")?.addEventListener("change",async e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;toast("Preparando fondo…");try{const data=await compressImage(f,1280,.62,560000);await saveChatAppearance({theme:"custom",customBackground:data});toast("Fondo actualizado 🎨")}catch(err){toast(niceError(err),4200)}});
  $("#removeChatBackground")?.addEventListener("click",()=>saveChatAppearance({theme:"oscuro",customBackground:""}));

  $("#closeMessageActions").addEventListener("click",closeMessageActions);$("#messageActionsModal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeMessageActions()});
  $("#reactionBar").addEventListener("click",async e=>{const b=e.target.closest("button"),m=actionMessage();if(b&&m){await reactToMessage(m.id,b.textContent);closeMessageActions()}});
  $("#actionReply").addEventListener("click",()=>{const m=actionMessage();if(m)setReply(m);closeMessageActions()});
  $("#actionCopy").addEventListener("click",async()=>{const m=actionMessage();if(m?.text){try{await navigator.clipboard.writeText(m.text);toast("Mensaje copiado") }catch{toast("No se pudo copiar")}}closeMessageActions()});
  $("#actionEdit").addEventListener("click",()=>{const m=actionMessage();if(m&&m.senderId===state.user.uid){state.editMessageId=m.id;state.replyTo=null;$("#messageInput").value=m.text||"";autoGrow($("#messageInput"));renderReplyBar();$("#messageInput").focus()}closeMessageActions()});
  $("#actionSave")?.addEventListener("click",async()=>{const m=actionMessage();if(m)await toggleSavedMessage(m.id);closeMessageActions()});
  $("#actionPin").addEventListener("click",async()=>{const m=actionMessage();if(!m)return;try{await firebase.setDoc(bubbleDoc("shared","pinned"),{text:(m.text||m.stickerText||"📷 Foto").slice(0,140),messageId:m.id,updatedBy:state.user.uid,updatedAt:firebase.serverTimestamp()});toast("Mensaje fijado 📌")}catch(e){toast(niceError(e))}closeMessageActions()});
  $("#actionDeleteMe").addEventListener("click",async()=>{const m=actionMessage();if(!m)return;try{await firebase.updateDoc(bubbleDoc("messages",m.id),{[`hiddenBy.${state.user.uid}`]:true});toast("Oculto para ti")}catch(e){toast(niceError(e))}closeMessageActions()});
  $("#actionDeleteAll").addEventListener("click",async()=>{const m=actionMessage();if(!m||m.senderId!==state.user.uid)return;if(!confirm("¿Eliminar este mensaje para ambos?"))return;try{await firebase.deleteDoc(bubbleDoc("messages",m.id))}catch(e){toast(niceError(e))}closeMessageActions()});

  $("#openSavedBtn")?.addEventListener("click",()=>{$("#savedModal").classList.remove("hidden");renderSavedMessages()});
  $("#openGalleryBtn")?.addEventListener("click",openGallery);
  $("#openLinksBtn")?.addEventListener("click",openLinks);
  $("#openNoteBtn")?.addEventListener("click",()=>{$("#noteModal").classList.remove("hidden");renderSharedNote()});
  $("#openDatesBtn")?.addEventListener("click",()=>{$("#datesModal").classList.remove("hidden");renderSpecialDates()});
  $("#openStorageBtn")?.addEventListener("click",openStorageManager);
  $("#memoryCard")?.addEventListener("click",()=>state.memoryMessageId&&goToMessageFromArchive(state.memoryMessageId));
  $("#saveSharedNoteBtn")?.addEventListener("click",saveSharedNote);
  $("#addSpecialDateBtn")?.addEventListener("click",addSpecialDate);
  $("#galleryLoadMore")?.addEventListener("click",async()=>{await loadArchiveBatch(false);renderGallery()});
  $("#linksLoadMore")?.addEventListener("click",async()=>{await loadArchiveBatch(false);renderLinks()});
  $("#storageLoadMore")?.addEventListener("click",async()=>{await loadArchiveBatch(false);renderStorageManager()});
  $$('[data-close-v15]').forEach(btn=>btn.addEventListener('click',()=>$("#"+btn.dataset.closeV15)?.classList.add('hidden')));
  ["savedModal","galleryModal","linksModal","noteModal","datesModal","storageModal"].forEach(id=>$("#"+id)?.addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add('hidden')}));

  $("#addStoryBtn").addEventListener("click",()=>{const mine=activeStatusesFor(state.user.uid);if(mine.length)openStoryViewer(state.user.uid,0);else openStoryCreate()});
  $("#addAnotherStoryBtn")?.addEventListener("click",openStoryCreate);
  $("#storyViewerAddBtn")?.addEventListener("click",()=>{$("#storyViewerModal").classList.add("hidden");openStoryCreate()});
  $("#partnerStoryBtn").addEventListener("click",()=>state.partner&&openStoryViewer(state.partner.uid,0));
  $("#closeStoryCreate").addEventListener("click",()=>$("#storyCreateModal").classList.add("hidden"));$("#storyCreateModal").addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add("hidden")});
  $("#storyPickPhoto").addEventListener("click",()=>$("#storyPhotoInput").click());
  $("#storyPhotoInput").addEventListener("change",async e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;toast("Preparando estado…");try{state.storyDraftImage=await compressImage(f,900,.66,560000);const box=$("#storyPhotoPreview");box.innerHTML='<img alt="Vista previa">';box.querySelector('img').src=state.storyDraftImage;box.classList.remove('hidden')}catch(err){toast(niceError(err),3800)}});
  $("#publishStoryBtn").addEventListener("click",publishStory);
  $("#closeStoryViewer").addEventListener("click",()=>{state.presenceOverride="";updatePresence(true);$("#storyViewerModal").classList.add("hidden")});$("#deleteStoryBtn")?.addEventListener("click",deleteCurrentStory);$("#storyPrev").addEventListener("click",()=>stepStory(-1));$("#storyNext").addEventListener("click",()=>stepStory(1));
  $("#storyReactions").addEventListener("click",e=>{const b=e.target.closest('button');if(b)reactStory(b.textContent)});$("#storyReplyBtn").addEventListener("click",replyStory);$("#storyReplyInput").addEventListener("keydown",e=>{if(e.key==='Enter'){e.preventDefault();replyStory()}});


  $("#chatImageInput").addEventListener("change",async e=>{const files=[...(e.target.files||[])].slice(0,3);e.target.value="";if(!files.length)return;toast("Preparando foto…");try{const remaining=Math.max(0,3-state.pendingImages.length);for(const f of files.slice(0,remaining))state.pendingImages.push(await compressImage(f,680,.56,220000));renderPendingMedia();$("#messageInput").focus();toast(state.pendingImages.length>1?`${state.pendingImages.length} fotos listas`:"Foto lista ♡")}catch(err){toast(niceError(err),3800)}});

  $("#dismissWhileAway")?.addEventListener("click",dismissWhileAway);
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
      await firebase.setDoc(bubbleDoc("shared", "pinned"), {
        text: $("#pinnedInput").value.trim().slice(0,140),
        messageId:"",
        updatedBy: state.user.uid,
        updatedAt: firebase.serverTimestamp()
      });
      toast("Mensaje fijado 📌");
    } catch (e) { toast(niceError(e)); }
  });

  $("#relationshipDate").addEventListener("change", async e => {
    if (!e.target.value) return;
    try {
      await firebase.setDoc(bubbleDoc("shared", "relationship"), {
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
        avatarData:data, updatedAt:firebase.serverTimestamp()
      });
      state.accountProfile = { ...(state.accountProfile || {}), avatarData:data };
      setCachedAccountProfile(state.user.uid,state.accountProfile);
      await syncProfileToAllBubbles({avatarData:data});
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
    if (state.activeBubbleId) await updatePresence(false);
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

  document.addEventListener("focusin",e=>{if(e.target?.matches?.("input,textarea,select")&&e.target!==$("#messageInput"))setTimeout(()=>syncMobileViewport(false),20)});
  document.addEventListener("focusout",e=>{if(e.target?.matches?.("input,textarea,select")&&e.target!==$("#messageInput"))setTimeout(()=>syncMobileViewport(true),100)});
  document.addEventListener("visibilitychange", () => updatePresence(!document.hidden));
  window.addEventListener("pagehide",()=>{saveDraft();saveCurrentChatPosition();updatePresence(false);setTyping(false)});

  window.addEventListener("focus", () => { updatePresence(true); if (state.currentView === "Chat") markRead(); });

  window.visualViewport?.addEventListener("resize",()=>syncMobileViewport(false),{passive:true});
  window.addEventListener("orientationchange",()=>setTimeout(()=>syncMobileViewport(true),240));
  window.addEventListener("resize",()=>{if(!window.visualViewport)syncMobileViewport(true)},{passive:true});
  syncMobileViewport(true);
}


bindUI();

// Arranque simple: Firebase -> Authentication -> Burbuja.
// No ejecutamos preboot ni limpieza de Service Workers desde app.js.
loadFirebase().catch(err=>{
  console.error("Error al iniciar Burbuja:",err);
  const text=$("#loadingText");
  if(text)text.textContent="No se pudo conectar. Toca Reintentar.";
  $("#loadingRetryBtn")?.classList.remove("hidden");
  toast("No se pudo iniciar Burbuja. Reintenta.",5000);
});
