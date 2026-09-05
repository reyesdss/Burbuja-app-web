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
const PIANO_PARAMS=new URLSearchParams(location.search);
const BUBBLE_ID=PIANO_PARAMS.get("bubbleId")||"standalone";
const BUBBLE_NAME=PIANO_PARAMS.get("bubbleName")||"Burbuja";
const SAFE_BUBBLE_ID=String(BUBBLE_ID).replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,120)||"standalone";
const LEGACY_STORAGE_KEY="pianoburbuja_final_v1";
const STORAGE_KEY=`pianoburbuja_final_v2_${SAFE_BUBBLE_ID}`;
const MAX_LEVEL_SECONDS=120,MAX_POINTS_PER_SONG=20;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],audio=$("#audio");
let save=loadState(),activeOrderIndex=0,activeSongIndex=0,activeSong=null,songDuration=120,phaseSplit=60,beatMap=[],game=null,raf=0,judgeTimer=0,phaseShown=false;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function validSave(s){return !!(s&&Array.isArray(s.order)&&s.order.length===SONGS.length)}
function loadState(){
  try{
    const own=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(validSave(own))return own;
  }catch(e){}
  if(BUBBLE_ID!=="standalone"){
    try{
      const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)||"null");
      if(validSave(legacy)){
        localStorage.setItem(STORAGE_KEY,JSON.stringify(legacy));
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return legacy;
      }
    }catch(e){}
  }
  const s={order:shuffle(SONGS.map((_,i)=>i)),unlocked:1,results:{},pianoPoints:0};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
  return s;
}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(save))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function resultFor(i){return save.results[String(i)]||{hearts:0,stars:0,accuracy:0,combo:0,score:0,bestPoints:0}}
function songAtOrder(i){return SONGS[save.order[i]]}
function symbols(n,type){const f=type==="heart"?"♥":"★",e=type==="heart"?"♡":"☆";return f.repeat(n)+e.repeat(3-n)}
function showScreen(id){$$('.screen').forEach(x=>x.classList.toggle('active',x.id===id));window.scrollTo(0,0)}
function fmtTime(sec){sec=Math.max(0,Math.ceil(sec));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")}
function totalBestPoints(){return Object.values(save.results).reduce((n,r)=>n+(Number(r.bestPoints)||0),0)}
function refreshHome(){save.pianoPoints=totalBestPoints();const idx=Math.min(save.unlocked-1,SONGS.length-1),songIndex=save.order[idx],s=SONGS[songIndex],r=resultFor(songIndex);$('#featuredTitle').textContent=s.title;$('#featuredArtist').textContent=s.artist;$('#featuredHearts').textContent=symbols(r.hearts,'heart');$('#featuredStars').textContent=symbols(r.stars,'star');$('#unlockPill').textContent=`${save.unlocked} / ${SONGS.length}`;$('#songsCounter').textContent=`${save.unlocked}/${SONGS.length}`;$('#totalPoints').textContent=save.pianoPoints;$('#progressSubtitle').textContent=`${save.pianoPoints} de ${SONGS.length*MAX_POINTS_PER_SONG} puntos`;$('#pointsCounter').textContent=`${save.pianoPoints} pts`;$('#unlockedBig').textContent=save.unlocked;$('#progressHeadline').textContent=save.unlocked===SONGS.length?'Colección completa':'Sigue desbloqueando';$('#progressCopy').textContent=save.unlocked===SONGS.length?'Ya puedes jugar cualquiera de las 19 canciones.':'Completa la canción actual para abrir la siguiente.';persist()}
function renderLists(){const list=$('#songList'),prog=$('#progressList');list.innerHTML='';prog.innerHTML='';save.order.forEach((songIndex,orderIndex)=>{const s=SONGS[songIndex],r=resultFor(songIndex),unlocked=orderIndex<save.unlocked,current=orderIndex===save.unlocked-1&&unlocked;const make=disabled=>{const b=document.createElement('button');b.type='button';b.className=`song-card ${unlocked?'':'locked'} ${current?'current':''}`;b.disabled=disabled||!unlocked;b.innerHTML=`<span class="song-number">${String(orderIndex+1).padStart(2,'0')}</span><span class="song-info"><strong>${esc(s.title)}</strong><span>${esc(s.artist)}</span></span><span class="song-side">${unlocked?`<span class="rewards"><i class="heart-text">${symbols(r.hearts,'heart')}</i><i class="star-text">${symbols(r.stars,'star')}</i></span><small>${r.bestPoints||0}/20 pts</small>`:`<span class="lock">⌑</span><small>bloqueada</small>`}</span>`;if(unlocked&&!disabled)b.addEventListener('click',()=>startSong(orderIndex));return b};list.appendChild(make(false));prog.appendChild(make(true))})}
function openError(text){$('#errorText').textContent=text;$('#errorModal').classList.remove('hidden')}
$('#errorCloseBtn').addEventListener('click',()=>{$('#errorModal').classList.add('hidden');showScreen('songsScreen')});
function waitMetadata(timeoutMs=9000){return new Promise((resolve,reject)=>{let timer=0;const ok=()=>{clean();resolve()},bad=()=>{clean();reject(new Error('metadata'))},clean=()=>{clearTimeout(timer);audio.removeEventListener('loadedmetadata',ok);audio.removeEventListener('error',bad)};audio.addEventListener('loadedmetadata',ok,{once:true});audio.addEventListener('error',bad,{once:true});timer=setTimeout(()=>{clean();reject(new Error('timeout'))},timeoutMs);audio.load()})}
async function tryAudioCandidates(file){
  const lower=file.replace(/\.mp3$/i,'');
  const candidates=[`canciones/${file}`,`canciones/${lower}.MP3`,`canciones/${file}.mp3`];
  const unique=[...new Set(candidates)];
  for(const url of unique){
    try{
      audio.pause();audio.removeAttribute('src');audio.load();
      audio.src=url;await waitMetadata();
      return url;
    }catch(e){}
  }
  throw new Error('audio-not-found');
}
async function startSong(orderIndex){
  activeOrderIndex=orderIndex;activeSongIndex=save.order[orderIndex];activeSong=SONGS[activeSongIndex];phaseShown=false;
  $('#gameTitle').textContent=activeSong.title;$('#gameArtist').textContent=activeSong.artist;
  $('#loadingOverlay').classList.remove('hidden');$('#finishOverlay').classList.add('hidden');
  $('#loadingTitle').textContent='Preparando nivel';$('#loadingText').textContent='Abriendo la canción…';
  showScreen('gameScreen');cancelAnimationFrame(raf);audio.pause();audio.removeAttribute('src');audio.load();
  try{
    const resolvedUrl=await tryAudioCandidates(activeSong.file);
    songDuration=Math.min(MAX_LEVEL_SECONDS,Math.max(1,audio.duration||MAX_LEVEL_SECONDS));
    phaseSplit=songDuration>=110?60:songDuration/2;
    $('#loadingText').textContent='Analizando el ritmo de la canción…';
    try{
      beatMap=await analyzeSong(resolvedUrl,songDuration,phaseSplit);
    }catch(analysisError){
      console.warn('PianoBurbuja: el audio abrió, pero no se pudo analizar. Se usará un patrón alternativo.',analysisError);
      beatMap=fallbackMap(songDuration,phaseSplit,activeSong.file);
    }
    $('#loadingOverlay').classList.add('hidden');
    await beginGame();
  }catch(e){
    audio.pause();$('#loadingOverlay').classList.add('hidden');
    openError(`No pude encontrar un audio reproducible para "${activeSong.file}". Revisa que esté dentro de canciones/ exactamente con ese nombre. GitHub distingue mayúsculas y minúsculas. También revisa que Windows no lo haya dejado como "${activeSong.file}.mp3".`);
  }
}
async function analyzeSong(url,duration,split){const res=await fetch(url);if(!res.ok)throw new Error('fetch');const data=await res.arrayBuffer(),Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return fallbackMap(duration,split,activeSong.file);const ctx=new Ctx(),buf=await ctx.decodeAudioData(data.slice(0)),ch=buf.getChannelData(0),sr=buf.sampleRate,endSample=Math.min(ch.length,Math.floor(duration*sr)),win=Math.max(1024,Math.floor(sr*.05)),energies=[];for(let i=0;i<endSample;i+=win){let sum=0,peak=0,end=Math.min(i+win,endSample);for(let j=i;j<end;j++){const v=Math.abs(ch[j]);sum+=v*v;if(v>peak)peak=v}energies.push({rms:Math.sqrt(sum/Math.max(1,end-i)),peak})}const candidates=[];for(let i=4;i<energies.length-2;i++){const base=(energies[i-1].rms+energies[i-2].rms+energies[i-3].rms)/3,flux=Math.max(0,energies[i].rms-base),time=i*win/sr;if(time>.65&&time<duration-.25&&flux>.0075&&energies[i].rms>base*1.08)candidates.push({time,strength:flux+energies[i].peak*.02,energy:energies[i].rms})}const accepted=[];let last=-10;for(const c of candidates){const minGap=c.time<split?.30:.24;if(c.time-last>=minGap){accepted.push(c);last=c.time}}if(accepted.length<Math.max(45,duration*.55))return fallbackMap(duration,split,activeSong.file);const maxNotes=Math.floor(duration*1.55);let selected=accepted;if(selected.length>maxNotes){const ranked=[...selected].sort((a,b)=>b.strength-a.strength).slice(0,maxNotes),keep=new Set(ranked);selected=selected.filter(x=>keep.has(x))}const seed=hash(activeSong.file);let prevLane=seed%4;const strengths=selected.map(x=>x.strength).sort((a,b)=>a-b),strongCut=strengths[Math.floor(strengths.length*.78)]||999,notes=[];selected.forEach((c,i)=>{let finalLane=Math.abs(Math.floor(c.time*1000)+seed+i*7+Math.floor(c.energy*10000))%4;if(finalLane===prevLane&&i%3!==0)finalLane=(finalLane+1+(seed+i)%3)%4;prevLane=finalLane;notes.push({time:c.time,lane:finalLane,double:false});if(c.time>=split&&c.strength>=strongCut&&i%6===0&&c.time<duration-.5)notes.push({time:c.time,lane:(finalLane+2)%4,double:true})});return notes.sort((a,b)=>a.time-b.time||a.lane-b.lane)}
function hash(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function fallbackMap(duration,split,key){const seed=hash(key),out=[];let lane=seed%4;for(let t=.8,i=0;t<duration-.3;t+=t<split?.48:.39,i++){lane=(lane+1+((seed+i*5)%3))%4;out.push({time:t,lane,double:false});if(t>=split&&i%9===4)out.push({time:t,lane:(lane+2)%4,double:true})}return out}
async function beginGame(){$('#tiles').innerHTML='';$('#particles').innerHTML='';$('#liveScore').textContent='0';$('#liveCombo').textContent='combo 0';$('#phaseFill').style.width='0%';$('#liveHearts').textContent='♡♡♡';$('#liveStars').textContent='☆☆☆';$('#phaseLabel').textContent='CORAZONES';$('#phaseLabel').className='phase-chip hearts';$('#phaseHint').textContent=songDuration<110?`cambio en ${fmtTime(phaseSplit)}`:'cambio en 1:00';$('#timeLeft').textContent=fmtTime(songDuration);game={running:false,score:0,combo:0,bestCombo:0,hits:0,misses:0,firstHits:0,firstMisses:0,secondHits:0,secondMisses:0,tiles:[]};beatMap.forEach(n=>{const el=document.createElement('button');el.type='button';el.className='tile';el.style.left=(n.lane*25)+'%';el.setAttribute('aria-label','Ficha musical');const tile={...n,el,hit:false,missed:false,travel:n.time<phaseSplit?1.62:1.38};el.addEventListener('pointerdown',ev=>{ev.preventDefault();hitTile(tile,ev)});$('#tiles').appendChild(el);game.tiles.push(tile)});audio.currentTime=0;audio.playbackRate=1;try{await audio.play()}catch(e){openError('El navegador no permitió iniciar el audio. Vuelve a tocar la canción desde la lista.');return}game.running=true;raf=requestAnimationFrame(loop)}
function hitTile(tile,ev){if(!game?.running||tile.hit||tile.missed)return;const diff=Math.abs(audio.currentTime-tile.time);if(diff>.31){showJudge('Muy pronto');return}tile.hit=true;game.hits++;game.combo++;game.bestCombo=Math.max(game.bestCombo,game.combo);if(tile.time<phaseSplit)game.firstHits++;else game.secondHits++;let pts=60,label='Bien';if(diff<=.09){pts=105;label='Perfecto'}else if(diff<=.18){pts=85;label='Genial'}game.score+=pts+Math.min(45,game.combo);$('#liveScore').textContent=game.score;$('#liveCombo').textContent=`combo ${game.combo}`;tile.el.classList.add('hit');burst(ev.clientX,ev.clientY,tile.time>=phaseSplit);showJudge(label);setTimeout(()=>tile.el.remove(),70)}
function miss(tile){tile.missed=true;game.misses++;game.combo=0;$('#liveCombo').textContent='combo 0';if(tile.time<phaseSplit)game.firstMisses++;else game.secondMisses++;tile.el.classList.add('miss');setTimeout(()=>tile.el.remove(),90)}
function burst(cx,cy,gold){const rect=$('#board').getBoundingClientRect();for(let i=0;i<6;i++){const p=document.createElement('i');p.className='particle';p.style.left=(cx-rect.left-4)+'px';p.style.top=(cy-rect.top-4)+'px';p.style.borderColor=gold?'rgba(255,211,109,.8)':'rgba(255,92,168,.8)';p.style.setProperty('--dx',`${Math.round((Math.random()-.5)*72)}px`);p.style.setProperty('--dy',`${Math.round(-18-Math.random()*56)}px`);$('#particles').appendChild(p);setTimeout(()=>p.remove(),500)}}
function showJudge(text){const j=$('#judge');j.textContent=text;j.classList.add('show');clearTimeout(judgeTimer);judgeTimer=setTimeout(()=>j.classList.remove('show'),230)}
function phaseRating(h,m){const total=h+m;if(total<=0)return 0;const a=h/total;return a>=.92?3:a>=.78?2:a>=.60?1:0}
function accuracyAll(){const total=game.hits+game.misses;return total?game.hits/total:0}
function liveRatings(){const hr=phaseRating(game.firstHits,game.firstMisses),sr=phaseRating(game.secondHits,game.secondMisses);$('#liveHearts').textContent=symbols(hr,'heart');$('#liveStars').textContent=symbols(sr,'star')}
function loop(){if(!game?.running)return;const now=audio.currentTime,board=$('#board'),h=board.clientHeight,targetY=h-34-62-142+7;for(const t of game.tiles){if(t.hit||t.missed)continue;const p=(now-(t.time-t.travel))/t.travel,y=-146+p*(targetY+146);t.el.style.transform=`translateY(${y}px)`;if(now>t.time+.28)miss(t)}if(!phaseShown&&now>=phaseSplit){phaseShown=true;$('#phaseLabel').textContent='ESTRELLAS';$('#phaseLabel').className='phase-chip stars';$('#phaseHint').textContent='fase final';const f=$('#phaseFlash');f.classList.remove('hidden');setTimeout(()=>f.classList.add('hidden'),1250)}liveRatings();$('#phaseFill').style.width=Math.min(100,now/songDuration*100)+'%';$('#timeLeft').textContent=fmtTime(songDuration-now);if(now>=songDuration-.03||audio.ended){finishGame();return}raf=requestAnimationFrame(loop)}
function comboBonus(c){if(c>=140)return 5;if(c>=100)return 4;if(c>=75)return 3;if(c>=50)return 2;if(c>=25)return 1;return 0}
function calculateBurbujaPoints(hearts,stars,accuracy,combo){let p=4+hearts+stars;if(accuracy>=.90)p+=3;if(accuracy>=.97)p+=2;p+=comboBonus(combo);return Math.min(20,p)}
function emitBurbujaPoints(detail){
  const safeDetail={...detail,bubbleId:BUBBLE_ID,bubbleName:BUBBLE_NAME};
  const envelope={
    type:"burbuja:game-points",
    detail:safeDetail,
    nonce:`${Date.now()}_${Math.random().toString(36).slice(2,9)}`,
    at:Date.now()
  };
  try{window.dispatchEvent(new CustomEvent("burbuja:game-points",{detail:safeDetail}))}catch(e){}
  try{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage(envelope,location.origin);
    }
  }catch(e){}
  try{
    localStorage.setItem("burbuja-game-points-bridge",JSON.stringify(envelope));
  }catch(e){}
  try{
    if(window.BurbujaGamePoints&&typeof window.BurbujaGamePoints.award==="function"){
      window.BurbujaGamePoints.award(safeDetail);
    }
  }catch(e){}
}
function finishGame(){if(!game?.running)return;game.running=false;cancelAnimationFrame(raf);audio.pause();const hearts=phaseRating(game.firstHits,game.firstMisses),stars=phaseRating(game.secondHits,game.secondMisses),accuracy=accuracyAll(),earned=calculateBurbujaPoints(hearts,stars,accuracy,game.bestCombo),old=resultFor(activeSongIndex),previous=old.bestPoints||0,newBest=Math.max(previous,earned),delta=Math.max(0,newBest-previous);save.results[String(activeSongIndex)]={hearts:Math.max(old.hearts||0,hearts),stars:Math.max(old.stars||0,stars),accuracy:Math.max(old.accuracy||0,accuracy),combo:Math.max(old.combo||0,game.bestCombo),score:Math.max(old.score||0,game.score),bestPoints:newBest};let unlockedName='';if(activeOrderIndex===save.unlocked-1&&save.unlocked<SONGS.length){save.unlocked++;unlockedName=songAtOrder(save.unlocked-1).title}save.pianoPoints=totalBestPoints();persist();if(delta>0)emitBurbujaPoints({game:'PianoBurbuja',songId:activeSong.file,songTitle:activeSong.title,earnedThisRun:earned,previousBest:previous,newBest,delta,maxPerSong:20});const final=resultFor(activeSongIndex);$('#finishTitle').textContent=activeSong.title;$('#finishArtist').textContent=activeSong.artist;$('#finishHearts').textContent=symbols(final.hearts,'heart');$('#finishStars').textContent=symbols(final.stars,'star');$('#finishAccuracy').textContent=Math.round(accuracy*100)+'%';$('#finishCombo').textContent=game.bestCombo;$('#finishPoints').textContent=`${earned}/20`;$('#pointDelta').textContent=delta>0?`+${delta} puntos nuevos para Burbuja`:(earned===previous?'Igualaste tu mejor puntuación':'Tu mejor puntuación sigue siendo mayor');$('#unlockText').textContent=unlockedName?`Nueva canción desbloqueada: ${unlockedName}`:(save.unlocked===SONGS.length?'Ya desbloqueaste las 19 canciones.':'Puedes repetirla para mejorar tu resultado.');$('#finishOverlay').classList.remove('hidden');refreshHome();renderLists()}
$('#playFeaturedBtn').addEventListener('click',()=>startSong(Math.min(save.unlocked-1,SONGS.length-1)));$('#openSongsBtn').addEventListener('click',()=>{renderLists();showScreen('songsScreen')});$('#openProgressBtn').addEventListener('click',()=>{renderLists();showScreen('progressScreen')});$$('.goHome').forEach(b=>b.addEventListener('click',()=>{refreshHome();showScreen('homeScreen')}));$('#exitGameBtn').addEventListener('click',()=>{cancelAnimationFrame(raf);if(game)game.running=false;audio.pause();refreshHome();showScreen('homeScreen')});$('#finishHomeBtn').addEventListener('click',()=>{refreshHome();showScreen('homeScreen')});$('#replayBtn').addEventListener('click',()=>startSong(activeOrderIndex));
refreshHome();renderLists();
