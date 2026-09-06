const SONGS=[
{title:"Julieta",artist:"LATIN MAFIA",file:"julieta.mp3"},
{title:"No digas nada",artist:"LATIN MAFIA",file:"no-digas-nada.mp3"},
{title:"Hecho para ti",artist:"LATIN MAFIA",file:"hecho-para-ti.mp3"},
{title:"Flores",artist:"LATIN MAFIA",file:"flores.mp3"},
{title:"Mala suerte",artist:"LATIN MAFIA",file:"mala-suerte.mp3"},
{title:"Continuo atardecer",artist:"LATIN MAFIA",file:"continuo-atardecer.mp3"},
{title:"Te estoy correteando",artist:"LATIN MAFIA",file:"te-estoy-correteando.mp3"},
{title:"QHP Piñata",artist:"Maluma",file:"qhp-pinata.mp3"},
{title:"Vitamina",artist:"Jombriel",file:"vitamina.mp3"},
{title:"Views",artist:"Lil Joujou",file:"views.mp3"},
{title:"MOONLIGHT",artist:"Lil Joujou",file:"moonlight-plus.mp3"},
{title:"After House",artist:"C.R.O",file:"after-house.mp3"},
{title:"Instante",artist:"C.R.O",file:"instante.mp3"},
{title:"Encontrarte",artist:"C.R.O",file:"encontrarte.mp3"},
{title:"Superstar",artist:"C.R.O",file:"superstar.mp3"},
{title:"Race",artist:"Taichu",file:"race.mp3"},
{title:"Payday",artist:"Taichu",file:"payday.mp3"},
{title:"Noche de sateo",artist:"Taichu",file:"noche-de-sateo.mp3"},
{title:"Tolkin Yit",artist:"Taichu",file:"tolkin-yit.mp3"}
];

const STAGES={
  hearts:{
    id:"hearts",name:"CORAZONES",short:"♥",filled:"♥",empty:"♡",
    difficulty:"RÁPIDO",className:"hearts",
    min1:.68,min2:.80,min3:.90,
    travelStart:.72,travelEnd:.60,hitWindow:.18,missWindow:.15,
    density:2.45,color:"rgba(255,92,168,.82)"
  },
  stars:{
    id:"stars",name:"ESTRELLAS",short:"★",filled:"★",empty:"☆",
    difficulty:"DIFÍCIL",className:"stars",
    min1:.75,min2:.86,min3:.94,
    travelStart:.50,travelEnd:.39,hitWindow:.125,missWindow:.10,
    density:3.45,color:"rgba(255,211,109,.88)"
  },
  crowns:{
    id:"crowns",name:"CORONAS",short:"♛",filled:"♛",empty:"♔",
    difficulty:"EXTREMO",className:"crowns",
    min1:.82,min2:.91,min3:.97,
    travelStart:.34,travelEnd:.255,hitWindow:.09,missWindow:.075,
    density:4.75,color:"rgba(116,218,255,.90)"
  }
};

const PIANO_PARAMS=new URLSearchParams(location.search);
const BUBBLE_ID=PIANO_PARAMS.get("bubbleId")||"standalone";
const BUBBLE_NAME=PIANO_PARAMS.get("bubbleName")||"Burbuja";
const SAFE_BUBBLE_ID=String(BUBBLE_ID).replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,120)||"standalone";

/*
  V3 usa una llave totalmente nueva a propósito.
  Esto reinicia canciones, corazones, estrellas y coronas
  sin tocar puntos de Firebase ni otros datos de Burbuja.
*/
const STORAGE_KEY=`pianoburbuja_mastery_v3_${SAFE_BUBBLE_ID}`;
const MAX_LEVEL_SECONDS=120;
const MAX_POINTS_PER_SONG=3;
const MAX_TOTAL_POINTS=SONGS.length*MAX_POINTS_PER_SONG;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const audio=$("#audio");

let save=loadState();
let activeOrderIndex=0;
let activeSongIndex=0;
let activeSong=null;
let activeStage="hearts";
let songDuration=120;
let baseBeatMap=[];
let stageBeatMap=[];
let game=null;
let raf=0;
let judgeTimer=0;

/* ---------- ESTADO ---------- */

function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function freshState(){
  return{
    version:3,
    order:shuffle(SONGS.map((_,i)=>i)),
    unlocked:1,
    results:{}
  };
}

function validSave(s){
  return !!(
    s &&
    s.version===3 &&
    Array.isArray(s.order) &&
    s.order.length===SONGS.length &&
    s.results &&
    typeof s.results==="object"
  );
}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(validSave(s))return s;
  }catch{}
  const s=freshState();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
  return s;
}

function persist(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(save));
}

function blankResult(){
  return{
    hearts:0,
    stars:0,
    crowns:0,
    accuracy:{hearts:0,stars:0,crowns:0},
    combo:{hearts:0,stars:0,crowns:0},
    score:{hearts:0,stars:0,crowns:0}
  };
}

function resultFor(i){
  const raw=save.results[String(i)]||{};
  const base=blankResult();
  return{
    ...base,
    ...raw,
    accuracy:{...base.accuracy,...(raw.accuracy||{})},
    combo:{...base.combo,...(raw.combo||{})},
    score:{...base.score,...(raw.score||{})}
  };
}

function saveResult(i,r){
  save.results[String(i)]=r;
}

function songAtOrder(i){
  return SONGS[save.order[i]];
}

function esc(s){
  return String(s).replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[m]));
}

function symbols(n,stageId){
  const s=STAGES[stageId];
  const x=Math.max(0,Math.min(3,Number(n)||0));
  return s.filled.repeat(x)+s.empty.repeat(3-x);
}

function stageUnlocked(result,stageId){
  if(stageId==="hearts")return true;
  if(stageId==="stars")return result.hearts>=3;
  return result.stars>=3;
}

function songPoints(r){
  return (r.hearts>=3?1:0)+(r.stars>=3?1:0)+(r.crowns>=3?1:0);
}

function totalMasteryPoints(){
  return SONGS.reduce((n,_,i)=>n+songPoints(resultFor(i)),0);
}

function masteredCount(){
  return SONGS.reduce((n,_,i)=>n+(resultFor(i).crowns>=3?1:0),0);
}

function fmtTime(sec){
  sec=Math.max(0,Math.ceil(sec));
  return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");
}

function showScreen(id){
  $$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));
  window.scrollTo(0,0);
}

/* ---------- INTERFAZ V3 ---------- */

function installV3Interface(){
  if($("#pianoV3Styles"))return;

  const style=document.createElement("style");
  style.id="pianoV3Styles";
  style.textContent=`
    .crown-text{color:#75d9ff;font-style:normal;text-shadow:0 0 12px rgba(117,217,255,.12)}
    .featured-rating{flex-wrap:wrap;row-gap:7px}
    .song-side .rewards{flex-wrap:wrap;max-width:112px}
    .song-side .crown-text{display:block}
    .phase-chip.crowns{color:#aeeaff;background:#10242c;border:1px solid #285568}
    .phase-fill.stage-hearts{background:linear-gradient(90deg,#ff5ca8,#ff8ac1)}
    .phase-fill.stage-stars{background:linear-gradient(90deg,#e9b93f,#ffe39a)}
    .phase-fill.stage-crowns{background:linear-gradient(90deg,#47bce8,#a7efff)}
    .difficulty-text{font-size:12px!important;font-weight:900;letter-spacing:.7px}
    .difficulty-text.hearts{color:#ff7eb9}
    .difficulty-text.stars{color:#ffd36d}
    .difficulty-text.crowns{color:#75d9ff}
    .tile.stage-stars.hit{background:linear-gradient(#f3c456,#c38b22)}
    .tile.stage-crowns.hit{background:linear-gradient(#7adeff,#258ab3)}
    .board.crown-mode .hit-zone span{background:#6fdcff;box-shadow:0 0 18px rgba(111,220,255,.75)}
    .board.crown-mode .lanes i{background:linear-gradient(#f8fbfc,#e9f4f7)}
    .stage-modal-card{width:min(100%,390px);max-height:86vh;overflow:auto;text-align:left}
    .stage-modal-card h3{font-size:23px;margin-bottom:5px}
    .stage-modal-card>p{margin:0 0 14px}
    .stage-choices{display:grid;gap:9px}
    .stage-choice{width:100%;min-height:72px;border:1px solid #342c38;background:#121016;color:#fff;border-radius:17px;padding:12px 13px;display:grid;grid-template-columns:45px 1fr auto;align-items:center;gap:11px;text-align:left}
    .stage-choice:disabled{opacity:.38}
    .stage-choice-icon{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;font-size:21px;background:#20151e}
    .stage-choice.stars .stage-choice-icon{background:#261f12;color:#ffd36d}
    .stage-choice.crowns .stage-choice-icon{background:#10242c;color:#75d9ff}
    .stage-choice-copy strong,.stage-choice-copy small{display:block}
    .stage-choice-copy strong{font-size:13px}
    .stage-choice-copy small{font-size:9px;color:#948b97;margin-top:4px;line-height:1.35}
    .stage-choice-rating{font-size:14px;text-align:right}
    .stage-choice-rating small{display:block;font-size:8px;color:#77707b;margin-top:4px}
    .stage-close{margin-top:12px!important}
    .finish-ratings.v3{grid-template-columns:repeat(3,1fr)}
    .finish-ratings.v3 strong{font-size:19px}
    .finish-ratings .crown-box{border-color:#244451;background:#10191d}
    .stage-complete-badge{margin:2px 0 9px;padding:6px 10px;border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.7px;border:1px solid #3b303f;background:#17131b}
    .stage-complete-badge.crowns{color:#9fe9ff;border-color:#285568;background:#102129}
    .stage-complete-badge.stars{color:#ffe195;border-color:#59451e;background:#241d11}
    .stage-complete-badge.hearts{color:#ff8fbe;border-color:#4b2638;background:#27131d}
    @media(max-width:380px){
      .stage-choice{grid-template-columns:40px 1fr auto;padding:10px}
      .stage-choice-icon{width:38px;height:38px}
      .finish-ratings.v3 strong{font-size:16px}
    }
  `;
  document.head.appendChild(style);

  const featured=$("#featuredStars");
  if(featured&&!$("#featuredCrowns")){
    const crown=document.createElement("span");
    crown.id="featuredCrowns";
    crown.className="crown-text";
    crown.textContent="♔♔♔";
    featured.insertAdjacentElement("afterend",crown);
  }

  const finishRatings=$(".finish-ratings");
  if(finishRatings&&!$("#finishCrowns")){
    finishRatings.classList.add("v3");
    const box=document.createElement("div");
    box.className="crown-box";
    box.innerHTML='<small>CORONAS</small><strong id="finishCrowns" class="crown-text">♔♔♔</strong>';
    finishRatings.appendChild(box);
  }

  const progressGuide=$(".score-guide");
  if(progressGuide){
    progressGuide.innerHTML="<strong>Máximo 3 puntos por canción</strong><span>♥♥♥ = +1 · ★★★ = +1 · ♛♛♛ = +1. Cada logro solo cuenta una vez.</span>";
  }

  const sectionCopy=$("#songsScreen .section-copy");
  if(sectionCopy){
    sectionCopy.textContent="Cada canción tiene 3 velocidades: Corazones, Estrellas y Coronas. Las Coronas son el modo extremo.";
  }

  const homeFoot=$(".home-foot");
  if(homeFoot){
    homeFoot.textContent="Completa ♥♥♥, ★★★ y ♛♛♛. Los puntos solo se entregan por dominar cada dificultad.";
  }

  const modal=document.createElement("div");
  modal.id="stageModal";
  modal.className="modal hidden";
  modal.innerHTML=`
    <div class="modal-card stage-modal-card">
      <div class="eyebrow">ELIGE VELOCIDAD</div>
      <h3 id="stageSongTitle">Canción</h3>
      <p id="stageSongArtist">Artista</p>
      <div class="stage-choices">
        <button class="stage-choice hearts" data-stage="hearts" type="button">
          <span class="stage-choice-icon">♥</span>
          <span class="stage-choice-copy"><strong>CORAZONES · RÁPIDO</strong><small>La entrada. Ya es mucho más veloz que la versión anterior.</small></span>
          <span class="stage-choice-rating heart-text" data-rating="hearts">♡♡♡<small>+1 pt al 3/3</small></span>
        </button>
        <button class="stage-choice stars" data-stage="stars" type="button">
          <span class="stage-choice-icon">★</span>
          <span class="stage-choice-copy"><strong>ESTRELLAS · DIFÍCIL</strong><small>Más fichas, menor ventana de toque y bastante más velocidad.</small></span>
          <span class="stage-choice-rating star-text" data-rating="stars">☆☆☆<small>requiere ♥♥♥</small></span>
        </button>
        <button class="stage-choice crowns" data-stage="crowns" type="button">
          <span class="stage-choice-icon">♛</span>
          <span class="stage-choice-copy"><strong>CORONAS · EXTREMO</strong><small>Caída brutal y secuencias densas, estilo tramo avanzado de Piano Tiles.</small></span>
          <span class="stage-choice-rating crown-text" data-rating="crowns">♔♔♔<small>requiere ★★★</small></span>
        </button>
      </div>
      <button id="stageCloseBtn" class="btn secondary stage-close" type="button">CANCELAR</button>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll(".stage-choice").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const stage=btn.dataset.stage;
      if(btn.disabled)return;
      modal.classList.add("hidden");
      startSong(activeOrderIndex,stage);
    });
  });
  $("#stageCloseBtn").addEventListener("click",()=>modal.classList.add("hidden"));
}

function openStagePicker(orderIndex){
  if(orderIndex<0||orderIndex>=save.unlocked)return;
  activeOrderIndex=orderIndex;
  activeSongIndex=save.order[orderIndex];
  activeSong=SONGS[activeSongIndex];
  const r=resultFor(activeSongIndex);

  $("#stageSongTitle").textContent=activeSong.title;
  $("#stageSongArtist").textContent=activeSong.artist;

  ["hearts","stars","crowns"].forEach(stageId=>{
    const btn=$(`#stageModal [data-stage="${stageId}"]`);
    const rating=$(`#stageModal [data-rating="${stageId}"]`);
    const unlocked=stageUnlocked(r,stageId);
    btn.disabled=!unlocked;
    rating.childNodes[0].nodeValue=symbols(r[stageId],stageId);

    const small=rating.querySelector("small");
    if(r[stageId]>=3){
      small.textContent="COMPLETADO · 1 pt";
    }else if(!unlocked){
      small.textContent=stageId==="stars"?"requiere ♥♥♥":"requiere ★★★";
    }else{
      small.textContent="+1 pt al 3/3";
    }
  });

  $("#stageModal").classList.remove("hidden");
}

function refreshHome(){
  const idx=Math.min(Math.max(0,save.unlocked-1),SONGS.length-1);
  const songIndex=save.order[idx];
  const s=SONGS[songIndex];
  const r=resultFor(songIndex);
  const pts=totalMasteryPoints();

  $("#featuredTitle").textContent=s.title;
  $("#featuredArtist").textContent=s.artist;
  $("#featuredHearts").textContent=symbols(r.hearts,"hearts");
  $("#featuredStars").textContent=symbols(r.stars,"stars");
  if($("#featuredCrowns"))$("#featuredCrowns").textContent=symbols(r.crowns,"crowns");

  $("#unlockPill").textContent=`${save.unlocked} / ${SONGS.length}`;
  $("#songsCounter").textContent=`${save.unlocked}/${SONGS.length}`;
  $("#totalPoints").textContent=pts;
  $("#progressSubtitle").textContent=`${pts} de ${MAX_TOTAL_POINTS} puntos`;
  $("#pointsCounter").textContent=`${pts} pts`;
  $("#unlockedBig").textContent=save.unlocked;

  if(masteredCount()===SONGS.length){
    $("#progressHeadline").textContent="Dominaste PianoBurbuja";
    $("#progressCopy").textContent="Completaste corazones, estrellas y coronas en las 19 canciones.";
  }else if(save.unlocked===SONGS.length){
    $("#progressHeadline").textContent="19 canciones abiertas";
    $("#progressCopy").textContent="Ahora ve por las estrellas y las coronas que te falten.";
  }else{
    $("#progressHeadline").textContent="Nueva progresión";
    $("#progressCopy").textContent="Consigue ♥♥♥ para abrir la siguiente canción y el modo Estrellas.";
  }

  persist();
}

function renderLists(){
  const list=$("#songList");
  const prog=$("#progressList");
  list.innerHTML="";
  prog.innerHTML="";

  save.order.forEach((songIndex,orderIndex)=>{
    const s=SONGS[songIndex];
    const r=resultFor(songIndex);
    const unlocked=orderIndex<save.unlocked;
    const current=orderIndex===save.unlocked-1&&unlocked;

    const make=disabled=>{
      const b=document.createElement("button");
      b.type="button";
      b.className=`song-card ${unlocked?"":"locked"} ${current?"current":""}`;
      b.disabled=disabled||!unlocked;
      b.innerHTML=`
        <span class="song-number">${String(orderIndex+1).padStart(2,"0")}</span>
        <span class="song-info">
          <strong>${esc(s.title)}</strong>
          <span>${esc(s.artist)}</span>
        </span>
        <span class="song-side">
          ${unlocked?`
            <span class="rewards">
              <i class="heart-text">${symbols(r.hearts,"hearts")}</i>
              <i class="star-text">${symbols(r.stars,"stars")}</i>
              <i class="crown-text">${symbols(r.crowns,"crowns")}</i>
            </span>
            <small>${songPoints(r)}/3 pts</small>
          `:`
            <span class="lock">⌑</span>
            <small>bloqueada</small>
          `}
        </span>
      `;
      if(unlocked&&!disabled)b.addEventListener("click",()=>openStagePicker(orderIndex));
      return b;
    };

    list.appendChild(make(false));
    prog.appendChild(make(true));
  });
}

/* ---------- AUDIO ---------- */

function openError(text){
  $("#errorText").textContent=text;
  $("#errorModal").classList.remove("hidden");
}

$("#errorCloseBtn").addEventListener("click",()=>{
  $("#errorModal").classList.add("hidden");
  showScreen("songsScreen");
});

function waitMetadata(timeoutMs=9000){
  return new Promise((resolve,reject)=>{
    let timer=0;
    const ok=()=>{clean();resolve()};
    const bad=()=>{clean();reject(new Error("metadata"))};
    const clean=()=>{
      clearTimeout(timer);
      audio.removeEventListener("loadedmetadata",ok);
      audio.removeEventListener("error",bad);
    };
    audio.addEventListener("loadedmetadata",ok,{once:true});
    audio.addEventListener("error",bad,{once:true});
    timer=setTimeout(()=>{clean();reject(new Error("timeout"))},timeoutMs);
    audio.load();
  });
}

async function tryAudioCandidates(file){
  const lower=file.replace(/\.mp3$/i,"");
  const candidates=[
    `canciones/${file}`,
    `canciones/${lower}.MP3`,
    `canciones/${file}.mp3`
  ];

  for(const url of [...new Set(candidates)]){
    try{
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio.src=url;
      await waitMetadata();
      return url;
    }catch{}
  }
  throw new Error("audio-not-found");
}

async function startSong(orderIndex,stageId="hearts"){
  activeOrderIndex=orderIndex;
  activeSongIndex=save.order[orderIndex];
  activeSong=SONGS[activeSongIndex];
  activeStage=stageId;

  const r=resultFor(activeSongIndex);
  if(!stageUnlocked(r,stageId)){
    openStagePicker(orderIndex);
    return;
  }

  $("#gameTitle").textContent=activeSong.title;
  $("#gameArtist").textContent=activeSong.artist;
  $("#finishOverlay").classList.add("hidden");
  $("#loadingOverlay").classList.remove("hidden");
  $("#loadingTitle").textContent=`Preparando ${STAGES[stageId].name.toLowerCase()}`;
  $("#loadingText").textContent="Abriendo la canción…";

  showScreen("gameScreen");
  cancelAnimationFrame(raf);
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  try{
    const resolvedUrl=await tryAudioCandidates(activeSong.file);
    songDuration=Math.min(MAX_LEVEL_SECONDS,Math.max(1,audio.duration||MAX_LEVEL_SECONDS));
    $("#loadingText").textContent=`Creando el mapa ${STAGES[stageId].difficulty.toLowerCase()}…`;

    try{
      baseBeatMap=await analyzeSong(resolvedUrl,songDuration);
    }catch(err){
      console.warn("PianoBurbuja V3: se usará patrón alternativo.",err);
      baseBeatMap=fallbackBaseMap(songDuration,activeSong.file);
    }

    stageBeatMap=buildStageMap(baseBeatMap,songDuration,stageId,activeSong.file);
    $("#loadingOverlay").classList.add("hidden");
    await beginGame();
  }catch(e){
    audio.pause();
    $("#loadingOverlay").classList.add("hidden");
    openError(`No pude encontrar "${activeSong.file}" dentro de PianoBurbuja/canciones/. Revisa el nombre exacto en GitHub.`);
  }
}

async function analyzeSong(url,duration){
  const res=await fetch(url);
  if(!res.ok)throw new Error("fetch");

  const data=await res.arrayBuffer();
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return fallbackBaseMap(duration,activeSong.file);

  const ctx=new Ctx();
  const buf=await ctx.decodeAudioData(data.slice(0));
  const ch=buf.getChannelData(0);
  const sr=buf.sampleRate;
  const endSample=Math.min(ch.length,Math.floor(duration*sr));
  const win=Math.max(1024,Math.floor(sr*.04));
  const energies=[];

  for(let i=0;i<endSample;i+=win){
    let sum=0,peak=0;
    const end=Math.min(i+win,endSample);
    for(let j=i;j<end;j++){
      const v=Math.abs(ch[j]);
      sum+=v*v;
      if(v>peak)peak=v;
    }
    energies.push({
      rms:Math.sqrt(sum/Math.max(1,end-i)),
      peak
    });
  }

  const candidates=[];
  for(let i=4;i<energies.length-2;i++){
    const base=(energies[i-1].rms+energies[i-2].rms+energies[i-3].rms)/3;
    const flux=Math.max(0,energies[i].rms-base);
    const time=i*win/sr;
    if(
      time>.55 &&
      time<duration-.22 &&
      flux>.0058 &&
      energies[i].rms>base*1.055
    ){
      candidates.push({
        time,
        strength:flux+energies[i].peak*.025,
        energy:energies[i].rms
      });
    }
  }

  const accepted=[];
  let last=-10;
  for(const c of candidates){
    if(c.time-last>=.13){
      accepted.push(c);
      last=c.time;
    }
  }

  if(accepted.length<Math.max(75,duration*.85)){
    return fallbackBaseMap(duration,activeSong.file);
  }

  const maxBase=Math.floor(duration*3.0);
  let selected=accepted;

  if(selected.length>maxBase){
    const strongest=[...selected]
      .sort((a,b)=>b.strength-a.strength)
      .slice(0,maxBase);
    const keep=new Set(strongest);
    selected=selected.filter(x=>keep.has(x));
  }

  const seed=hash(activeSong.file);
  let prevLane=seed%4;

  return selected.map((c,i)=>{
    let lane=Math.abs(
      Math.floor(c.time*1000)+seed+i*11+Math.floor(c.energy*10000)
    )%4;
    if(lane===prevLane&&i%4!==0){
      lane=(lane+1+((seed+i)%3))%4;
    }
    prevLane=lane;
    return{
      time:c.time,
      lane,
      strength:c.strength||0
    };
  }).sort((a,b)=>a.time-b.time);
}

function hash(s){
  let h=2166136261;
  for(const ch of s){
    h^=ch.charCodeAt(0);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function fallbackBaseMap(duration,key){
  const seed=hash(key);
  const out=[];
  let lane=seed%4;

  for(let t=.62,i=0;t<duration-.22;t+=.24,i++){
    lane=(lane+1+((seed+i*5)%3))%4;
    out.push({time:t,lane,strength:1});
  }
  return out;
}

function normalizeStageNotes(notes,duration,maxDensity){
  const maxNotes=Math.floor(duration*maxDensity);
  const sorted=notes
    .filter(n=>n.time>.48&&n.time<duration-.16)
    .sort((a,b)=>a.time-b.time||a.lane-b.lane);

  if(sorted.length<=maxNotes)return sorted;

  const step=sorted.length/maxNotes;
  const out=[];
  for(let i=0;i<maxNotes;i++){
    out.push(sorted[Math.floor(i*step)]);
  }
  return out.sort((a,b)=>a.time-b.time||a.lane-b.lane);
}

function buildStageMap(base,duration,stageId,key){
  const seed=hash(`${key}:${stageId}`);
  const notes=[];

  if(stageId==="hearts"){
    let last=-10;
    base.forEach((n,i)=>{
      if(n.time-last<.21)return;
      notes.push({time:n.time,lane:n.lane});
      last=n.time;

      if(i%19===8 && n.time<duration-.5){
        notes.push({time:n.time,lane:(n.lane+2)%4});
      }
    });
    return normalizeStageNotes(notes,duration,STAGES.hearts.density);
  }

  if(stageId==="stars"){
    base.forEach((n,i)=>{
      notes.push({time:n.time,lane:n.lane});

      const next=base[i+1];
      const gap=next?next.time-n.time:99;
      if(gap>.29 && n.time+.145<duration-.2){
        notes.push({
          time:n.time+.145,
          lane:(n.lane+1+((seed+i)%3))%4
        });
      }

      if(i%12===5){
        notes.push({time:n.time,lane:(n.lane+2)%4});
      }
    });
    return normalizeStageNotes(notes,duration,STAGES.stars.density);
  }

  /* CORONAS:
     Se rellenan huecos del ritmo con secuencias muy rápidas.
     No se acelera la canción; aceleran fichas y densidad. */
  base.forEach((n,i)=>{
    notes.push({time:n.time,lane:n.lane});

    const next=base[i+1];
    const gap=next?next.time-n.time:99;

    if(gap>.20 && n.time+.105<duration-.17){
      notes.push({
        time:n.time+.105,
        lane:(n.lane+1+((seed+i*3)%3))%4
      });
    }

    if(gap>.34 && n.time+.215<duration-.17){
      notes.push({
        time:n.time+.215,
        lane:(n.lane+3-((seed+i)%2))%4
      });
    }

    if(i%8===3){
      notes.push({
        time:n.time,
        lane:(n.lane+2)%4
      });
    }
  });

  return normalizeStageNotes(notes,duration,STAGES.crowns.density);
}

/* ---------- JUEGO ---------- */

function stageTravel(noteTime){
  const cfg=STAGES[activeStage];
  const progress=Math.max(0,Math.min(1,noteTime/Math.max(1,songDuration)));
  const songDifficulty=Math.max(0,Math.min(1,activeOrderIndex/(SONGS.length-1)));
  let value=cfg.travelStart-(cfg.travelStart-cfg.travelEnd)*progress;

  if(activeStage==="stars")value-=songDifficulty*.025;
  if(activeStage==="crowns")value-=songDifficulty*.018;

  const floor=activeStage==="hearts"?.56:activeStage==="stars"?.36:.235;
  return Math.max(floor,value);
}

function configureStageHud(){
  const cfg=STAGES[activeStage];
  const r=resultFor(activeSongIndex);

  $("#phaseLabel").textContent=`${cfg.name} · ${cfg.difficulty}`;
  $("#phaseLabel").className=`phase-chip ${cfg.className}`;

  $("#phaseFill").className=`phase-fill stage-${activeStage}`;
  $("#phaseFill").style.width="0%";

  const strip=$(".reward-strip");
  const left=strip?.children?.[0];
  const right=strip?.children?.[2];

  if(left){
    left.querySelector("small").textContent="RECOMPENSA";
    const span=left.querySelector("span");
    span.className=activeStage==="hearts"?"heart-text":activeStage==="stars"?"star-text":"crown-text";
    span.textContent=symbols(r[activeStage],activeStage);
  }

  if(right){
    right.querySelector("small").textContent="VELOCIDAD";
    const span=right.querySelector("span");
    span.className=`difficulty-text ${activeStage}`;
    span.textContent=cfg.difficulty;
  }

  $("#phaseHint").textContent=
    activeStage==="hearts"?"rápido":
    activeStage==="stars"?"muy rápido":
    "EXTREMO";

  $("#board").classList.toggle("crown-mode",activeStage==="crowns");
}

function showStageFlash(){
  const f=$("#phaseFlash");
  if(!f)return;

  const cfg=STAGES[activeStage];
  const top=f.querySelector("span");
  const strong=f.querySelector("strong");
  const small=f.querySelector("small");

  top.textContent=cfg.difficulty;
  strong.textContent=
    activeStage==="hearts"?"♥ CORAZONES ♥":
    activeStage==="stars"?"★ ESTRELLAS ★":
    "♛ CORONAS ♛";
  small.textContent=
    activeStage==="hearts"?"Empieza rápido":
    activeStage==="stars"?"Ahora sí cuesta":
    "Modo extremo · no parpadees";

  f.classList.remove("hidden");
  setTimeout(()=>f.classList.add("hidden"),850);
}

async function beginGame(){
  $("#tiles").innerHTML="";
  $("#particles").innerHTML="";
  $("#liveScore").textContent="0";
  $("#liveCombo").textContent="combo 0";
  $("#timeLeft").textContent=fmtTime(songDuration);

  configureStageHud();

  game={
    running:false,
    score:0,
    combo:0,
    bestCombo:0,
    hits:0,
    misses:0,
    spawnIndex:0,
    activeTiles:[],
    notes:stageBeatMap.map((n,i)=>({
      ...n,
      index:i,
      travel:stageTravel(n.time),
      hit:false,
      missed:false,
      spawned:false,
      el:null
    }))
  };

  audio.currentTime=0;
  audio.playbackRate=1;

  try{
    await audio.play();
  }catch{
    openError("El navegador no permitió iniciar el audio. Vuelve a tocar la canción.");
    return;
  }

  game.running=true;
  showStageFlash();
  raf=requestAnimationFrame(loop);
}

function spawnTile(note){
  if(note.spawned)return;
  note.spawned=true;

  const el=document.createElement("button");
  el.type="button";
  el.className=`tile stage-${activeStage}`;
  el.style.left=(note.lane*25)+"%";
  el.setAttribute("aria-label",`Ficha ${STAGES[activeStage].name.toLowerCase()}`);

  note.el=el;
  el.addEventListener("pointerdown",ev=>{
    ev.preventDefault();
    hitTile(note,ev);
  });

  $("#tiles").appendChild(el);
  game.activeTiles.push(note);
}

function hitTile(tile,ev){
  if(!game?.running||tile.hit||tile.missed)return;

  const cfg=STAGES[activeStage];
  const diff=Math.abs(audio.currentTime-tile.time);

  if(diff>cfg.hitWindow){
    showJudge("Muy pronto");
    return;
  }

  tile.hit=true;
  game.hits++;
  game.combo++;
  game.bestCombo=Math.max(game.bestCombo,game.combo);

  const perfect=cfg.hitWindow*.34;
  const great=cfg.hitWindow*.66;
  let pts=55;
  let label="Bien";

  if(diff<=perfect){
    pts=115;
    label="Perfecto";
  }else if(diff<=great){
    pts=85;
    label="Genial";
  }

  game.score+=pts+Math.min(70,game.combo);
  $("#liveScore").textContent=game.score;
  $("#liveCombo").textContent=`combo ${game.combo}`;

  if(tile.el){
    tile.el.classList.add("hit");
    setTimeout(()=>tile.el?.remove(),55);
  }

  burst(ev.clientX,ev.clientY,cfg.color);
  showJudge(label);
}

function miss(tile){
  if(tile.missed||tile.hit)return;

  tile.missed=true;
  game.misses++;
  game.combo=0;
  $("#liveCombo").textContent="combo 0";

  if(tile.el){
    tile.el.classList.add("miss");
    setTimeout(()=>tile.el?.remove(),65);
  }
}

function burst(cx,cy,color){
  const rect=$("#board").getBoundingClientRect();
  for(let i=0;i<5;i++){
    const p=document.createElement("i");
    p.className="particle";
    p.style.left=(cx-rect.left-4)+"px";
    p.style.top=(cy-rect.top-4)+"px";
    p.style.borderColor=color;
    p.style.setProperty("--dx",`${Math.round((Math.random()-.5)*68)}px`);
    p.style.setProperty("--dy",`${Math.round(-16-Math.random()*50)}px`);
    $("#particles").appendChild(p);
    setTimeout(()=>p.remove(),450);
  }
}

function showJudge(text){
  const j=$("#judge");
  j.textContent=text;
  j.classList.add("show");
  clearTimeout(judgeTimer);
  judgeTimer=setTimeout(()=>j.classList.remove("show"),190);
}

function accuracyAll(){
  const total=game.hits+game.misses;
  return total?game.hits/total:0;
}

function stageRating(accuracy){
  const cfg=STAGES[activeStage];
  if(accuracy>=cfg.min3)return 3;
  if(accuracy>=cfg.min2)return 2;
  if(accuracy>=cfg.min1)return 1;
  return 0;
}

function updateLiveRating(){
  const total=game.hits+game.misses;
  const rating=total?stageRating(game.hits/total):0;
  const strip=$(".reward-strip");
  const span=strip?.children?.[0]?.querySelector("span");
  if(span)span.textContent=symbols(rating,activeStage);
}

function loop(){
  if(!game?.running)return;

  const now=audio.currentTime;
  const board=$("#board");
  const h=board.clientHeight;
  const targetY=h-34-62-142+7;

  while(game.spawnIndex<game.notes.length){
    const n=game.notes[game.spawnIndex];
    if(now<(n.time-n.travel-.035))break;
    spawnTile(n);
    game.spawnIndex++;
  }

  const kept=[];
  for(const t of game.activeTiles){
    if(t.hit||t.missed)continue;

    const p=(now-(t.time-t.travel))/t.travel;
    const y=-146+p*(targetY+146);

    if(t.el)t.el.style.transform=`translateY(${y}px)`;

    if(now>t.time+STAGES[activeStage].missWindow){
      miss(t);
    }else{
      kept.push(t);
    }
  }
  game.activeTiles=kept;

  updateLiveRating();
  $("#phaseFill").style.width=Math.min(100,now/songDuration*100)+"%";
  $("#timeLeft").textContent=fmtTime(songDuration-now);

  if(now>=songDuration-.025||audio.ended){
    finishGame();
    return;
  }

  raf=requestAnimationFrame(loop);
}

/* ---------- PUNTOS BURBUJA ---------- */

function emitBurbujaPoints(detail){
  const safeDetail={...detail,bubbleId:BUBBLE_ID,bubbleName:BUBBLE_NAME};
  const envelope={
    type:"burbuja:game-points",
    detail:safeDetail,
    nonce:`${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    at:Date.now()
  };

  try{
    window.dispatchEvent(new CustomEvent("burbuja:game-points",{detail:safeDetail}));
  }catch{}

  try{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage(envelope,location.origin);
    }
  }catch{}

  try{
    localStorage.setItem("burbuja-game-points-bridge",JSON.stringify(envelope));
  }catch{}

  try{
    if(window.BurbujaGamePoints&&typeof window.BurbujaGamePoints.award==="function"){
      window.BurbujaGamePoints.award(safeDetail);
    }
  }catch{}
}

function awardStagePoint(){
  /*
    Cada dificultad usa un songId distinto.
    El padre guarda el máximo por songId en Firebase, así:
      julieta.mp3::hearts  = máximo 1
      julieta.mp3::stars   = máximo 1
      julieta.mp3::crowns  = máximo 1

    Repetir el nivel no vuelve a sumar.
  */
  emitBurbujaPoints({
    game:"PianoBurbuja",
    songId:`${activeSong.file}::${activeStage}`,
    songTitle:`${activeSong.title} · ${STAGES[activeStage].name}`,
    earnedThisRun:1,
    previousBest:0,
    newBest:1,
    delta:1,
    maxPerSong:1
  });
}

/* ---------- FIN DE NIVEL ---------- */

function finishGame(){
  if(!game?.running)return;

  game.running=false;
  cancelAnimationFrame(raf);
  audio.pause();

  /*
    Las fichas que aún no hayan sido contabilizadas al final
    cuentan como fallo.
  */
  for(const n of game.notes){
    if(!n.hit&&!n.missed){
      n.missed=true;
      game.misses++;
    }
  }

  const accuracy=accuracyAll();
  const rating=stageRating(accuracy);
  const old=resultFor(activeSongIndex);
  const previousStageBest=Number(old[activeStage]||0);
  const newStageBest=Math.max(previousStageBest,rating);
  const newlyCompleted=previousStageBest<3&&newStageBest>=3;

  old[activeStage]=newStageBest;
  old.accuracy[activeStage]=Math.max(Number(old.accuracy[activeStage]||0),accuracy);
  old.combo[activeStage]=Math.max(Number(old.combo[activeStage]||0),game.bestCombo);
  old.score[activeStage]=Math.max(Number(old.score[activeStage]||0),game.score);

  saveResult(activeSongIndex,old);

  let unlockedSongName="";
  let unlockedStage="";

  if(activeStage==="hearts"&&newStageBest>=3){
    unlockedStage="ESTRELLAS";
    if(activeOrderIndex===save.unlocked-1&&save.unlocked<SONGS.length){
      save.unlocked++;
      unlockedSongName=songAtOrder(save.unlocked-1).title;
    }
  }

  if(activeStage==="stars"&&newStageBest>=3){
    unlockedStage="CORONAS";
  }

  persist();

  /*
    Se intenta sincronizar el logro cada vez que se consigue 3/3.
    Firebase evita duplicados. Esto también permite recuperar el
    punto si alguna partida anterior terminó sin conexión.
  */
  if(rating>=3){
    awardStagePoint();
  }

  $("#finishTitle").textContent=
    rating>=3
      ?activeSong.title
      :`Aún no · ${activeSong.title}`;

  $("#finishArtist").textContent=`${activeSong.artist} · ${STAGES[activeStage].name}`;
  $("#finishHearts").textContent=symbols(old.hearts,"hearts");
  $("#finishStars").textContent=symbols(old.stars,"stars");
  if($("#finishCrowns"))$("#finishCrowns").textContent=symbols(old.crowns,"crowns");

  $("#finishAccuracy").textContent=Math.round(accuracy*100)+"%";
  $("#finishCombo").textContent=game.bestCombo;
  $("#finishPoints").textContent=rating>=3?"1/1":"0/1";

  const overlay=$("#finishOverlay");
  let badge=overlay.querySelector(".stage-complete-badge");
  if(!badge){
    badge=document.createElement("div");
    badge.className="stage-complete-badge";
    $("#finishArtist").insertAdjacentElement("afterend",badge);
  }

  badge.className=`stage-complete-badge ${activeStage}`;
  badge.textContent=
    `${STAGES[activeStage].short} ${STAGES[activeStage].difficulty} · ${symbols(rating,activeStage)}`;

  if(rating<3){
    const needed=Math.round(STAGES[activeStage].min3*100);
    $("#pointDelta").textContent=`0 puntos · necesitas ${needed}% para completar 3/3`;
    $("#unlockText").textContent=
      activeStage==="hearts"
        ?"Consigue ♥♥♥ para abrir Estrellas y avanzar a la siguiente canción."
        :activeStage==="stars"
          ?"Consigue ★★★ para desbloquear Coronas."
          :"Las coronas requieren una partida casi perfecta.";
  }else{
    $("#pointDelta").textContent=
      newlyCompleted
        ?"+1 punto Burbuja por nuevo logro"
        :"Logro ya completado · no vuelve a sumar";

    if(unlockedSongName&&unlockedStage){
      $("#unlockText").textContent=
        `Desbloqueaste ${unlockedStage} y también la canción: ${unlockedSongName}.`;
    }else if(unlockedStage){
      $("#unlockText").textContent=`Desbloqueaste ${unlockedStage} en esta canción.`;
    }else if(activeStage==="crowns"){
      $("#unlockText").textContent="♛♛♛ Canción dominada por completo.";
    }else{
      $("#unlockText").textContent="Nivel completado.";
    }
  }

  overlay.classList.remove("hidden");
  refreshHome();
  renderLists();
}

/* ---------- BOTONES ---------- */

$("#playFeaturedBtn").addEventListener("click",()=>{
  openStagePicker(Math.min(save.unlocked-1,SONGS.length-1));
});

$("#openSongsBtn").addEventListener("click",()=>{
  renderLists();
  showScreen("songsScreen");
});

$("#openProgressBtn").addEventListener("click",()=>{
  renderLists();
  showScreen("progressScreen");
});

$$(".goHome").forEach(b=>b.addEventListener("click",()=>{
  refreshHome();
  showScreen("homeScreen");
}));

$("#exitGameBtn").addEventListener("click",()=>{
  cancelAnimationFrame(raf);
  if(game)game.running=false;
  audio.pause();
  refreshHome();
  showScreen("homeScreen");
});

$("#finishHomeBtn").addEventListener("click",()=>{
  refreshHome();
  showScreen("homeScreen");
});

$("#replayBtn").addEventListener("click",()=>{
  startSong(activeOrderIndex,activeStage);
});

/* ---------- ARRANQUE ---------- */

installV3Interface();
refreshHome();
renderLists();
