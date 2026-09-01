
(()=>{
"use strict";

const $ = id => document.getElementById(id);
const screens = {
  menu:$("menuScreen"), how:$("howScreen"), game:$("gameScreen")
};
const overlays = {
  pause:$("pauseOverlay"), level:$("levelOverlay"), gameover:$("gameOverOverlay")
};
const canvas=$("gameCanvas"), ctx=canvas.getContext("2d");
const shell=$("gameShell");

const ui={
  menuHigh:$("menuHighScore"),menuBest:$("menuBestLevel"),
  score:$("scoreEl"),level:$("levelEl"),levelName:$("levelNameEl"),
  runes:$("runesEl"),runeFill:$("runeFill"),lives:$("livesEl"),
  powerBanner:$("powerBanner"),powerTimer:$("powerTimer"),toast:$("toast"),
  finalScore:$("finalScoreEl"),finalLevel:$("finalLevelEl"),finalEaten:$("finalEatenEl"),
  bonus:$("levelBonusEl"),levelCompleteTitle:$("levelCompleteTitle"),levelCompleteText:$("levelCompleteText")
};

const dirs={
  left:{x:-1,y:0},right:{x:1,y:0},up:{x:0,y:-1},down:{x:0,y:1},none:{x:0,y:0}
};
const opp=d=>d==="left"?"right":d==="right"?"left":d==="up"?"down":d==="down"?"up":"none";

const LEVEL_NAMES=[
  "CÁMARA DEL UMBRAL","SALÓN DE LAS MAREAS","CRIPTA DEL OJO",
  "PASILLO DE LOS AHOGADOS","TEMPLO SIN CIELO","CÁMARA HAMBRIENTA"
];
const PALETTES=[
  ["#223765","#152548","#5eead4"],
  ["#27415c","#162b42","#72d4e6"],
  ["#3a315f","#211b42","#a78bfa"],
  ["#304653","#182a31","#8ad7c9"],
  ["#44334f","#281d34","#f092c5"],
  ["#4b313d","#291b25","#fb7185"]
];

const COLS=19, ROWS=23, TILE=34;
let W=0,H=0,DPR=1,scale=1,offX=0,offY=0,boardW=COLS*TILE,boardH=ROWS*TILE,mobileCamera=false;
let maze, pellets, powerups, basePellets, basePowerups, totalCollectibles;
let player,enemies;
let level=1,score=0,lives=3,eaten=0,powerTime=0;
let started=false,paused=false,transitioning=false,last=0,requestedDir="left";
let animationId=0,soundEnabled=true,lastExtraLifeScore=0;
let seed=1,currentMazeSeed=0;

// Dúo: conserva exactamente el juego individual y añade sincronización Firebase.
let gameMode="solo";
let online=new window.BurbujaHambrientaOnline();
let duoSession=null,remotePlayer=null,duoRole="one",partnerProfile=null;
let pendingCollect=new Set(),lastKnownDuoLevel=0,lastKnownDuoSeed=0;

const storage={
  get(key,def){try{const v=localStorage.getItem(key);return v===null?def:JSON.parse(v)}catch{return def}},
  set(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch{}}
};
let highScore=storage.get("hambriento_highscore",0);
let bestLevel=storage.get("hambriento_bestlevel",1);

function updateMenuStats(){
  ui.menuHigh.textContent=highScore.toLocaleString("es-MX");
  ui.menuBest.textContent=bestLevel;
}
updateMenuStats();

function setScreen(name){
  Object.values(screens).forEach(s=>s.classList.remove("active"));
  screens[name].classList.add("active");
}
function showOverlay(name,on=true){
  overlays[name].classList.toggle("active",on);
}
function hideAllOverlays(){Object.values(overlays).forEach(o=>o.classList.remove("active"))}

function rand(){
  seed=(seed*1664525+1013904223)>>>0;
  return seed/4294967296;
}
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}
  return arr;
}

function generateMaze(levelNo, fixedSeed=null){
  seed=(fixedSeed===null ? (Date.now() ^ (levelNo*0x9e3779b9)) : fixedSeed)>>>0;
  const grid=Array.from({length:ROWS},()=>Array(COLS).fill(1));
  const stack=[[1,1]];
  grid[1][1]=0;
  const steps=[[2,0],[-2,0],[0,2],[0,-2]];

  while(stack.length){
    const [cx,cy]=stack[stack.length-1];
    const options=shuffle(steps.map(v=>v.slice())).filter(([dx,dy])=>{
      const nx=cx+dx,ny=cy+dy;
      return nx>0&&nx<COLS-1&&ny>0&&ny<ROWS-1&&grid[ny][nx]===1;
    });
    if(!options.length){stack.pop();continue}
    const [dx,dy]=options[0],nx=cx+dx,ny=cy+dy;
    grid[cy+dy/2][cx+dx/2]=0;
    grid[ny][nx]=0;
    stack.push([nx,ny]);
  }

  // Añade bucles para que no sea un laberinto lineal.
  const loopCount=15+Math.min(levelNo,12);
  for(let i=0;i<loopCount;i++){
    const x=1+Math.floor(rand()*(COLS-2)),y=1+Math.floor(rand()*(ROWS-2));
    if(grid[y][x]===1){
      const horiz=grid[y][x-1]===0&&grid[y][x+1]===0;
      const vert=grid[y-1][x]===0&&grid[y+1][x]===0;
      if(horiz||vert)grid[y][x]=0;
    }
  }

  // Santuario central para las entidades.
  const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2);
  for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++)grid[y][x]=0;
  grid[cy-3][cx]=0;grid[cy+3][cx]=0;grid[cy][cx-3]=0;grid[cy][cx+3]=0;

  // Zona inicial inferior conectada.
  let px=cx,py=ROWS-2;
  grid[py][px]=0;
  // conecta verticalmente hasta encontrar camino existente
  for(let y=py;y>=1;y--){
    grid[y][px]=0;
    if(y<py-3 && (grid[y][px-1]===0||grid[y][px+1]===0))break;
  }

  // Mantén bordes sólidos.
  for(let x=0;x<COLS;x++){grid[0][x]=1;grid[ROWS-1][x]=1}
  for(let y=0;y<ROWS;y++){grid[y][0]=1;grid[y][COLS-1]=1}

  return {grid,playerSpawn:{x:px,y:py},enemySpawn:{x:cx,y:cy}};
}

function nearestOpen(grid,tx,ty){
  let best=null,bd=1e9;
  for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){
    if(grid[y][x]!==0)continue;
    const d=(x-tx)**2+(y-ty)**2;
    if(d<bd){bd=d;best={x,y}}
  }
  return best;
}

function randomSeed(){
  try{return crypto.getRandomValues(new Uint32Array(1))[0]>>>0}catch{return (Date.now()^Math.floor(Math.random()*0xffffffff))>>>0}
}

function buildLevel(seedOverride=null){
  currentMazeSeed=(seedOverride===null?randomSeed():seedOverride)>>>0;
  const generated=generateMaze(level,currentMazeSeed);
  maze=generated.grid;
  pellets=new Set();powerups=new Set();

  const center=generated.enemySpawn;
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(maze[y][x]!==0)continue;
    const nearCenter=Math.abs(x-center.x)<=2&&Math.abs(y-center.y)<=2;
    const isPlayer=x===generated.playerSpawn.x&&y===generated.playerSpawn.y;
    if(!nearCenter&&!isPlayer)pellets.add(`${y},${x}`);
  }

  const corners=[[1,1],[COLS-2,1],[1,ROWS-2],[COLS-2,ROWS-2]];
  corners.forEach(([x,y])=>{
    const p=nearestOpen(maze,x,y);if(!p)return;
    pellets.delete(`${p.y},${p.x}`);powerups.add(`${p.y},${p.x}`);
  });
  basePellets=new Set(pellets);basePowerups=new Set(powerups);
  totalCollectibles=basePellets.size+basePowerups.size;

  const speedBonus=Math.min((level-1)*0.09,1.15);
  let spawn={...generated.playerSpawn};
  if(gameMode==="duo"&&duoRole==="two"){
    const alternate=nearestOpen(maze,generated.playerSpawn.x-2,generated.playerSpawn.y-1);
    if(alternate)spawn=alternate;
  }
  player={x:spawn.x,y:spawn.y,dir:"left",next:"left",speed:4.48};
  enemies=createEnemies(center,speedBonus);
  powerTime=0;requestedDir="left";transitioning=false;
  if(gameMode==="duo"&&duoSession)applyDuoCollections(duoSession);
  updateHud();fitBoard();draw();
  showToast(`<b>${levelName()}</b><br>El templo se ha reconfigurado.`,1600);
}

function createEnemies(center,speedBonus=Math.min((level-1)*0.09,1.15)){
  return [
    {name:"El Profundo",x:center.x-1,y:center.y,dir:"left",speed:3.55+speedBonus,type:0,color:"#5eead4",damageCd:0},
    {name:"La Lengua",x:center.x,y:center.y,dir:"right",speed:3.45+speedBonus,type:1,color:"#f472b6",damageCd:0},
    {name:"El Ojo",x:center.x+1,y:center.y,dir:"up",speed:3.30+speedBonus,type:2,color:"#f6d365",damageCd:0},
    {name:"La Sombra",x:center.x,y:center.y+1,dir:"down",speed:3.52+speedBonus,type:3,color:"#a78bfa",damageCd:0}
  ];
}

function applyDuoCollections(session){
  pellets=new Set(basePellets);powerups=new Set(basePowerups);
  (session.pellets||[]).forEach(k=>pellets.delete(k));
  (session.powerups||[]).forEach(k=>powerups.delete(k));
  score=session.score||0;lives=session.lives??5;eaten=session.eaten||0;
  powerTime=Math.max(0,((session.powerUntil||0)-Date.now())/1000);
  updateHud();
}

function applyDuoSession(session){
  if(gameMode!=="duo"||!session)return;
  const wasStopped=!started||transitioning;
  const wasInGame=screens.game.classList.contains("active");
  duoSession=session;
  const changed=!maze||session.level!==lastKnownDuoLevel||session.seed!==lastKnownDuoSeed;
  level=session.level||1;
  if(changed){
    lastKnownDuoLevel=level;lastKnownDuoSeed=session.seed>>>0;
    buildLevel(session.seed>>>0);
  }
  applyDuoCollections(session);
  if(score>highScore){highScore=score;storage.set("hambriento_highscore",highScore)}
  if(level>bestLevel){bestLevel=level;storage.set("hambriento_bestlevel",bestLevel)}
  updateMenuStats();

  if(session.status==="levelComplete"){
    transitioning=true;started=false;
    ui.bonus.textContent=session.bonus||0;
    ui.levelCompleteTitle.textContent=`Nivel ${level} superado`;
    ui.levelCompleteText.textContent=`Entre los dos han limpiado ${levelName().toLowerCase()}. El siguiente descenso generará un templo nuevo.`;
    showOverlay("level",true);
  }else if(session.status==="gameover"){
    transitioning=true;started=false;
    ui.finalScore.textContent=score.toLocaleString("es-MX");ui.finalLevel.textContent=level;ui.finalEaten.textContent=eaten;
    showOverlay("gameover",true);
  }else if(session.status==="playing"){
    showOverlay("level",false);showOverlay("gameover",false);transitioning=false;
    if(wasInGame&&wasStopped&&!paused){started=true;last=performance.now();requestAnimationFrame(loop)}
  }
}

function applyDuoRuntime(runtime,isHost){
  if(gameMode!=="duo"||!runtime||runtime.level!==level)return;
  if(!isHost&&Array.isArray(runtime.enemies)&&runtime.enemies.length){
    enemies=runtime.enemies.map(e=>({...e,damageCd:e.damageCd||0}));
  }
}

function applyPartner(state,profile){
  partnerProfile=profile||partnerProfile;
  if(!state||state.level!==level||state.seed!==currentMazeSeed||Date.now()-(state.updatedAt||0)>7000){remotePlayer=null;return}
  remotePlayer={...state,speed:4.48,next:state.dir||"left"};
}

function respawnLocal(){
  const p=findPlayerSpawn();player.x=p.x;player.y=p.y;player.dir="left";player.next="left";requestedDir="left";
  powerTime=duoSession?Math.max(0,((duoSession.powerUntil||0)-Date.now())/1000):0;
  showToast("<b>Tu cordura se fracturó</b>",1100);tone(95,.18,.05);
}

function levelName(){
  return LEVEL_NAMES[(level-1)%LEVEL_NAMES.length];
}

function walkable(c,r){
  return r>=0&&r<ROWS&&c>=0&&c<COLS&&maze[r][c]===0;
}
function atCenter(e){
  return Math.abs(e.x-Math.round(e.x))<.0001&&Math.abs(e.y-Math.round(e.y))<.0001;
}
function canGo(e,dir){
  const d=dirs[dir],c=Math.round(e.x),r=Math.round(e.y);
  return !!d&&walkable(c+d.x,r+d.y);
}

// Movimiento seguro de centro a centro.
// Ningún personaje puede atravesar bloques ni abandonar el tablero.
function moveEntity(e,dt){
  let remaining=Math.min(e.speed*dt,.45);
  while(remaining>.00001){
    const cx=Math.round(e.x),cy=Math.round(e.y);
    const centered=Math.abs(e.x-cx)<.0001&&Math.abs(e.y-cy)<.0001;

    if(centered){
      e.x=cx;e.y=cy;
      if(e===player){
        if(canGo(e,e.next))e.dir=e.next;
      }else chooseEnemyDir(e);
      if(!canGo(e,e.dir))return;
    }

    const d=dirs[e.dir];
    if(!d||(d.x===0&&d.y===0))return;

    let tx=e.x,ty=e.y;
    if(d.x>0)tx=Math.floor(e.x+.0001)+1;
    if(d.x<0)tx=Math.ceil(e.x-.0001)-1;
    if(d.y>0)ty=Math.floor(e.y+.0001)+1;
    if(d.y<0)ty=Math.ceil(e.y-.0001)-1;

    const tc=Math.round(tx),tr=Math.round(ty);
    if(!walkable(tc,tr)){e.x=Math.round(e.x);e.y=Math.round(e.y);return}

    const dist=d.x!==0?Math.abs(tx-e.x):Math.abs(ty-e.y);
    const step=Math.min(remaining,dist);
    e.x+=d.x*step;e.y+=d.y*step;remaining-=step;

    if(step>=dist-.00001){e.x=tx;e.y=ty}
    e.x=Math.max(1,Math.min(COLS-2,e.x));
    e.y=Math.max(1,Math.min(ROWS-2,e.y));
  }
}

function enemyTarget(e){
  const targets=[{x:player.x,y:player.y,dir:player.dir,uid:online.uid||"local"}];
  if(gameMode==="duo"&&remotePlayer)targets.push({x:remotePlayer.x,y:remotePlayer.y,dir:remotePlayer.dir||"left",uid:online.partnerUid});
  targets.sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y));
  return targets[0];
}

function chooseEnemyDir(e){
  const c=Math.round(e.x),r=Math.round(e.y);
  let opts=["left","right","up","down"].filter(d=>walkable(c+dirs[d].x,r+dirs[d].y));
  let cand=opts.filter(d=>d!==opp(e.dir));if(!cand.length)cand=opts;if(!cand.length)return;
  const target=enemyTarget(e);

  if(powerTime>0){
    cand.sort((a,b)=>{
      const da=(c+dirs[a].x-target.x)**2+(r+dirs[a].y-target.y)**2;
      const db=(c+dirs[b].x-target.x)**2+(r+dirs[b].y-target.y)**2;
      return db-da;
    });e.dir=cand[0];return;
  }

  let tx=target.x,ty=target.y;
  if(e.type===1){const pd=dirs[target.dir]||dirs.left;tx+=pd.x*4;ty+=pd.y*4}
  else if(e.type===2){if(Math.hypot(e.x-target.x,e.y-target.y)<5.5){tx=1;ty=1}}
  else if(e.type===3){if(Math.random()<.31){e.dir=cand[Math.floor(Math.random()*cand.length)];return}tx=COLS-2-target.x;ty=ROWS-2-target.y}
  cand.sort((a,b)=>{
    const da=(c+dirs[a].x-tx)**2+(r+dirs[a].y-ty)**2;
    const db=(c+dirs[b].x-tx)**2+(r+dirs[b].y-ty)**2;return da-db;
  });e.dir=cand[0];
}

function collect(){
  const c=Math.round(player.x),r=Math.round(player.y),key=`${r},${c}`;
  if(gameMode==="duo"){
    if(pellets.has(key)&&!pendingCollect.has("p"+key)){
      pendingCollect.add("p"+key);pellets.delete(key);tone(520,.025,.018);
      const bonus=900+level*150+lives*100;
      online.collect("pellet",key,totalCollectibles,level,bonus).finally(()=>pendingCollect.delete("p"+key));
    }
    if(powerups.has(key)&&!pendingCollect.has("o"+key)){
      pendingCollect.add("o"+key);powerups.delete(key);
      showToast("<b>¡MODO DEVORAR!</b><br>Los dos pueden comer a las entidades.",1700);
      tone(220,.08,.045);setTimeout(()=>tone(440,.10,.04),70);setTimeout(()=>tone(720,.12,.035),150);
      const bonus=900+level*150+lives*100;
      online.collect("power",key,totalCollectibles,level,bonus).finally(()=>pendingCollect.delete("o"+key));
    }
    updateHud();return;
  }

  if(pellets.delete(key)){addScore(10);tone(520,.025,.018)}
  if(powerups.delete(key)){
    addScore(75);powerTime=Math.max(8,8.8-Math.min(level*.15,1.8));
    showToast("<b>¡MODO DEVORAR!</b><br>Ahora las entidades son tu alimento.",1700);
    tone(220,.08,.045);setTimeout(()=>tone(440,.10,.04),70);setTimeout(()=>tone(720,.12,.035),150);
  }
  updateHud();
  if(pellets.size+powerups.size===0&&!transitioning){
    transitioning=true;started=false;const bonus=900+level*150+lives*100;addScore(bonus);
    ui.bonus.textContent=bonus;ui.levelCompleteTitle.textContent=`Nivel ${level} superado`;
    ui.levelCompleteText.textContent=`Has limpiado ${levelName().toLowerCase()}. El siguiente descenso generará un templo nuevo y las entidades serán más rápidas.`;
    showOverlay("level",true);saveProgress();
  }
}

function addScore(n){
  if(gameMode==="duo")return;
  score+=n;
  if(score-lastExtraLifeScore>=10000){
    lives=Math.min(lives+1,5);lastExtraLifeScore=score;
    showToast("<b>CORDURA RECUPERADA</b><br>Has ganado una vida.",1600);
    tone(880,.12,.04);
  }
  if(score>highScore){highScore=score;storage.set("hambriento_highscore",highScore)}
}

function collide(){
  if(transitioning)return;
  if(gameMode==="duo"){
    if(!online.isHost)return;
    const targets=[{entity:player,uid:online.uid}];
    if(remotePlayer)targets.push({entity:remotePlayer,uid:online.partnerUid});
    for(const e of enemies){
      e.damageCd=Math.max(0,(e.damageCd||0)-.035);
      for(const t of targets){
        if(!t.uid||Math.hypot(e.x-t.entity.x,e.y-t.entity.y)>=.54)continue;
        if(powerTime>0){
          const center=findCenterSpawn();e.x=center.x;e.y=center.y;e.dir="up";e.damageCd=1;
          online.awardEnemy(250+(level*20));
          if(t.uid===online.uid){showToast(`Has devorado a <b>${e.name}</b>`,800);tone(150,.07,.04)}
          break;
        }
        if((e.damageCd||0)<=0){
          e.damageCd=1.5;online.damage(t.uid);
          const center=findCenterSpawn();e.x=center.x;e.y=center.y;e.dir="up";
          break;
        }
      }
    }
    return;
  }
  for(const e of enemies){
    if(Math.hypot(e.x-player.x,e.y-player.y)<.54){
      if(powerTime>0){eaten++;addScore(250+(level*20));const center=findCenterSpawn();e.x=center.x;e.y=center.y;e.dir="up";showToast(`Has devorado a <b>${e.name}</b>`,800);tone(150,.07,.04)}
      else{loseLife();break}
    }
  }
}

function findCenterSpawn(){
  const cx=Math.floor(COLS/2),cy=Math.floor(ROWS/2);
  return nearestOpen(maze,cx,cy)||{x:1,y:1};
}
function findPlayerSpawn(){
  return nearestOpen(maze,Math.floor(COLS/2),ROWS-2)||{x:1,y:1};
}

function loseLife(){
  if(transitioning)return;
  lives--;transitioning=true;updateHud();
  tone(95,.25,.06);
  if(lives<=0){gameOver();return}

  started=false;
  showToast("<b>Tu cordura se fracturó</b>",1200);
  setTimeout(()=>{
    const p=findPlayerSpawn(),c=findCenterSpawn();
    player.x=p.x;player.y=p.y;player.dir="left";player.next="left";
    const pos=[[c.x-1,c.y],[c.x,c.y],[c.x+1,c.y],[c.x,c.y+1]];
    enemies.forEach((e,i)=>{
      const q=nearestOpen(maze,pos[i][0],pos[i][1])||c;
      e.x=q.x;e.y=q.y;e.dir=["left","right","up","down"][i];
    });
    powerTime=0;transitioning=false;started=true;last=performance.now();
    requestAnimationFrame(loop);
  },900);
}

function gameOver(){
  started=false;transitioning=true;saveProgress();
  ui.finalScore.textContent=score.toLocaleString("es-MX");
  ui.finalLevel.textContent=level;
  ui.finalEaten.textContent=eaten;
  showOverlay("gameover",true);
}

function saveProgress(){
  if(score>highScore)highScore=score;
  if(level>bestLevel)bestLevel=level;
  storage.set("hambriento_highscore",highScore);
  storage.set("hambriento_bestlevel",bestLevel);
  updateMenuStats();
}

function updateHud(){
  ui.score.textContent=String(score).padStart(6,"0");
  ui.level.textContent=level;
  ui.levelName.textContent=levelName();
  const got=totalCollectibles-(pellets.size+powerups.size);
  ui.runes.textContent=`${got} / ${totalCollectibles} RUNAS`;
  ui.runeFill.style.width=(totalCollectibles?got/totalCollectibles*100:0)+"%";
  ui.lives.textContent=Array.from({length:lives},()=>"●").join(" ");
  ui.powerBanner.classList.toggle("active",powerTime>0);
  ui.powerTimer.textContent=powerTime>0?powerTime.toFixed(1)+" s":"";
}

let toastTimer;
function showToast(html,ms=1300){
  ui.toast.innerHTML=html;ui.toast.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),ms);
}

function update(dt){
  if(!started||paused)return;
  player.next=requestedDir;moveEntity(player,dt);

  if(gameMode==="solo"||online.isHost)enemies.forEach(e=>moveEntity(e,dt));
  else enemies.forEach(e=>moveEntity(e,Math.min(dt,.018)));

  collect();collide();
  if(gameMode==="duo"){
    powerTime=Math.max(0,(((duoSession?.powerUntil)||0)-Date.now())/1000);
    online.publishPlayer({x:player.x,y:player.y,dir:player.dir,level,seed:currentMazeSeed,lives,updatedAt:Date.now()});
    if(online.isHost)online.publishRuntime(enemies.map(e=>({...e})),level);
    online.tickHost();updateHud();
  }else if(powerTime>0){powerTime=Math.max(0,powerTime-dt);updateHud()}
}

function fitBoard(){
  if(!shell)return;
  const rect=shell.getBoundingClientRect();
  W=Math.max(320,rect.width);H=Math.max(320,rect.height);
  DPR=Math.min(2,devicePixelRatio||1);
  canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);
  canvas.style.width=W+"px";canvas.style.height=H+"px";
  ctx.setTransform(DPR,0,0,DPR,0,0);

  const coarse=matchMedia("(pointer: coarse)").matches;
  const portrait=H>=W;
  mobileCamera=coarse && Math.min(W,H)<760;

  if(mobileCamera){
    // En teléfono ya no intentamos meter TODO el laberinto en una pantalla.
    // Mostramos una zona amplia alrededor del jugador y la cámara lo sigue.
    const byWidth=W/(portrait ? 13.2*TILE : 18*TILE);
    const byHeight=H/(portrait ? 17*TILE : 12.8*TILE);
    scale=Math.max(.76,Math.min(1.02,Math.max(byWidth,byHeight)));
    updateMobileCamera();
    return;
  }

  const topReserve=58,bottomReserve=28,sideReserve=14;
  const availW=W-sideReserve*2;
  const availH=H-topReserve-bottomReserve;
  scale=Math.min(availW/boardW,availH/boardH);
  scale=Math.max(.28,scale);
  const realW=boardW*scale,realH=boardH*scale;
  offX=(W-realW)/2;
  offY=topReserve+(availH-realH)/2;
}

function updateMobileCamera(){
  if(!mobileCamera||!player)return;
  const realW=boardW*scale,realH=boardH*scale;
  const margin=8;
  const portrait=H>=W;

  let wantedX=W*.5-(player.x*TILE+TILE/2)*scale;
  let wantedY=(portrait?H*.43:H*.51)-(player.y*TILE+TILE/2)*scale;

  if(realW<=W-margin*2) offX=(W-realW)/2;
  else offX=Math.max(W-realW-margin,Math.min(margin,wantedX));

  if(realH<=H-margin*2) offY=(H-realH)/2;
  else offY=Math.max(H-realH-margin,Math.min(margin,wantedY));
}
addEventListener("resize",()=>{fitBoard();draw()});

function draw(){
  if(!maze)return;
  if(mobileCamera)updateMobileCamera();
  ctx.clearRect(0,0,W,H);
  drawAmbient();
  drawMaze();
  if(powerTime>0)drawPowerOverlay();
}

function drawAmbient(){
  const pal=PALETTES[(level-1)%PALETTES.length];
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#0c1020");g.addColorStop(1,"#05060d");
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);

  const t=performance.now()*.00025;
  for(let i=0;i<13;i++){
    const x=(Math.sin(t+i*2.2)*.5+.5)*W;
    const y=(Math.cos(t*1.2+i*1.7)*.5+.5)*H;
    const rg=ctx.createRadialGradient(x,y,0,x,y,22);
    rg.addColorStop(0,"rgba(94,234,212,.06)");rg.addColorStop(1,"rgba(94,234,212,0)");
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.fill();
  }
}

function roundedRect(x,y,w,h,r,fill,stroke){
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);
  if(fill)ctx.fill();if(stroke)ctx.stroke();
}

function drawMaze(){
  const pal=PALETTES[(level-1)%PALETTES.length];
  ctx.save();ctx.translate(offX,offY);ctx.scale(scale,scale);

  const bg=ctx.createLinearGradient(0,0,0,boardH);
  bg.addColorStop(0,"#111933");bg.addColorStop(1,"#0a1022");
  ctx.fillStyle=bg;roundedRect(0,0,boardW,boardH,20,true,false);

  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const px=x*TILE,py=y*TILE;
    if(maze[y][x]===1){
      const wg=ctx.createLinearGradient(px,py,px,py+TILE);
      wg.addColorStop(0,pal[0]);wg.addColorStop(1,pal[1]);
      ctx.fillStyle=wg;roundedRect(px+1.6,py+1.6,TILE-3.2,TILE-3.2,8,true,false);
      ctx.strokeStyle="rgba(94,234,212,.09)";ctx.lineWidth=1;roundedRect(px+4,py+4,TILE-8,TILE-8,6,false,true);
      if((x*5+y*7+level)%13===0){
        ctx.strokeStyle="rgba(94,234,212,.10)";
        ctx.beginPath();ctx.arc(px+TILE/2,py+TILE/2,5.5,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px+TILE/2,py+9);ctx.lineTo(px+TILE/2,py+TILE-9);ctx.stroke();
      }
    }else{
      ctx.fillStyle=(x+y)%2?"rgba(255,255,255,.012)":"rgba(255,255,255,.02)";
      roundedRect(px+5,py+5,TILE-10,TILE-10,7,true,false);
    }
  }

  for(const key of pellets){
    const [r,c]=key.split(",").map(Number),x=c*TILE+TILE/2,y=r*TILE+TILE/2;
    const rg=ctx.createRadialGradient(x,y,0,x,y,6.5);rg.addColorStop(0,"#fff1b8");rg.addColorStop(1,"rgba(246,211,101,0)");
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,6.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#f6d365";ctx.beginPath();ctx.arc(x,y,2.25,0,Math.PI*2);ctx.fill();
  }

  for(const key of powerups){
    const [r,c]=key.split(",").map(Number),x=c*TILE+TILE/2,y=r*TILE+TILE/2;
    ctx.save();ctx.shadowColor="#89fff1";ctx.shadowBlur=18;ctx.strokeStyle="#dcfffa";ctx.lineWidth=2.2;
    ctx.beginPath();ctx.ellipse(x,y,8,5,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#dcfffa";ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  if(gameMode==="duo"&&remotePlayer){
    drawPlayer(remotePlayer.x*TILE+TILE/2,remotePlayer.y*TILE+TILE/2,remotePlayer,duoRole==="one");
  }
  drawPlayer(player.x*TILE+TILE/2,player.y*TILE+TILE/2,player,gameMode==="duo"&&duoRole==="two");
  enemies.forEach((e,i)=>drawEnemy(e,i));
  ctx.restore();
}

function drawPlayer(x,y,entity=player,isPink=false){
  ctx.save();ctx.translate(x,y);
  const empowered=powerTime>0,pulse=empowered?(Math.sin(performance.now()*.012)*.5+.5):0;
  if(empowered){
    ctx.shadowColor="rgba(137,255,241,.8)";ctx.shadowBlur=34;ctx.strokeStyle=`rgba(137,255,241,${.48+pulse*.34})`;ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(0,0,22+pulse*3,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=`rgba(255,255,255,${.20+pulse*.24})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,28+pulse*4,0,Math.PI*2);ctx.stroke();
  }
  ctx.shadowColor=empowered?"rgba(137,255,241,.65)":(isPink?"rgba(244,114,182,.55)":"rgba(167,139,250,.55)");ctx.shadowBlur=empowered?28:22;
  const g=ctx.createRadialGradient(-4,-5,2,0,0,16);
  if(empowered){g.addColorStop(0,"#f1fffd");g.addColorStop(.35,"#b8fff7");g.addColorStop(.65,"#6ef2de");g.addColorStop(1,"#1d7b72")}
  else if(isPink){g.addColorStop(0,"#fff0f8");g.addColorStop(.35,"#ffc2df");g.addColorStop(.65,"#f472b6");g.addColorStop(1,"#9d356e")}
  else{g.addColorStop(0,"#efe9ff");g.addColorStop(.35,"#c8b8ff");g.addColorStop(.65,"#8b5cf6");g.addColorStop(1,"#44218f")}
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(0,0,7.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=empowered?"#13736a":(isPink?"#9d356e":"#4b298b");ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
  const dir=entity.dir||"left";const a=dir==="right"?0:dir==="left"?Math.PI:dir==="up"?-Math.PI/2:Math.PI/2;
  ctx.fillStyle=empowered?"#0a2926":"#11152a";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,14,a-.43,a+.43);ctx.closePath();ctx.fill();ctx.restore();
}

function drawEnemy(e,i){
  const x=e.x*TILE+TILE/2,y=e.y*TILE+TILE/2,scared=powerTime>0,pulse=scared?(Math.sin(performance.now()*.02+i)*.5+.5):0;
  ctx.save();ctx.translate(x,y);ctx.shadowBlur=scared?28:18;
  ctx.shadowColor=scared?"rgba(137,255,241,.55)":e.color;

  if(i===0){
    const g=ctx.createLinearGradient(0,-12,0,14);g.addColorStop(0,scared?"#dcfffb":"#8df7e8");g.addColorStop(1,scared?"#57dfcc":"#2e9d91");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-2,12,Math.PI,0);ctx.lineTo(12,7);ctx.lineTo(8,13);ctx.lineTo(2,10);ctx.lineTo(-2,13);ctx.lineTo(-8,10);ctx.lineTo(-12,13);ctx.lineTo(-12,7);ctx.closePath();ctx.fill();drawEyes(scared);
    ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,4,5,0,Math.PI);ctx.stroke();
  }else if(i===1){
    const g=ctx.createLinearGradient(0,-12,0,14);g.addColorStop(0,scared?"#fffaff":"#ffc4e7");g.addColorStop(1,scared?"#79f2e0":"#dd5aa4");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,-2,12,Math.PI,0);ctx.lineTo(12,8);ctx.lineTo(9,13);ctx.lineTo(3,10);ctx.lineTo(-3,13);ctx.lineTo(-9,10);ctx.lineTo(-12,13);ctx.lineTo(-12,8);ctx.closePath();ctx.fill();drawEyes(scared);
    ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,4);ctx.quadraticCurveTo(7,9,2,14);ctx.stroke();
  }else if(i===2){
    ctx.strokeStyle=scared?"#fff":"#f6d365";ctx.lineWidth=scared?4:3;ctx.beginPath();ctx.ellipse(0,0,13,8,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=scared?"#89fff1":"#fde7a0";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=scared?"#13736a":"#3e351f";ctx.beginPath();ctx.arc(0,0,2.3,0,Math.PI*2);ctx.fill();
  }else{
    ctx.fillStyle=scared?"#89fff1":"#9f88fa";ctx.beginPath();
    for(let k=0;k<10;k++){const a=k*Math.PI/5-Math.PI/2,r=k%2?7:13,px=Math.cos(a)*r,py=Math.sin(a)*r;k?ctx.lineTo(px,py):ctx.moveTo(px,py)}
    ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-3,-1,2,0,Math.PI*2);ctx.arc(3,-1,2,0,Math.PI*2);ctx.fill();
  }

  if(scared){
    ctx.strokeStyle=`rgba(137,255,241,${.38+pulse*.38})`;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,18+pulse*2,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}
function drawEyes(scared){
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-4,-2,2.4,0,Math.PI*2);ctx.arc(4,-2,2.4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=scared?"#31665f":"#1d273f";ctx.beginPath();ctx.arc(-4,-1.8,1,0,Math.PI*2);ctx.arc(4,-1.8,1,0,Math.PI*2);ctx.fill();
}

function drawPowerOverlay(){
  const p=Math.sin(performance.now()*.012)*.5+.5;
  ctx.fillStyle=`rgba(94,234,212,${.08+p*.045})`;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=`rgba(137,255,241,${.24+p*.24})`;ctx.lineWidth=9;ctx.strokeRect(5,5,W-10,H-10);
}

function loop(now){
  if(!started||paused)return;
  const dt=Math.min(.035,(now-last)/1000);last=now;
  update(dt);draw();animationId=requestAnimationFrame(loop);
}

function startNewGame(){
  online.disconnect();gameMode="solo";duoSession=null;remotePlayer=null;partnerProfile=null;duoRole="one";
  cancelAnimationFrame(animationId);hideAllOverlays();
  level=1;score=0;lives=3;eaten=0;powerTime=0;lastExtraLifeScore=0;paused=false;transitioning=false;
  setScreen("game");buildLevel();started=true;last=performance.now();tone(330,.09,.03);requestAnimationFrame(loop);
}

async function startDuoGame(){
  gameMode="duo";cancelAnimationFrame(animationId);hideAllOverlays();
  $("duoConnectOverlay").classList.add("active");$("duoConnectText").textContent="Buscando a la otra persona de Burbuja...";
  online.disconnect();online=new window.BurbujaHambrientaOnline();
  online.onSession(applyDuoSession);online.onRuntime(applyDuoRuntime);online.onPartner(applyPartner);
  online.onSignal(sig=>{if(sig.type==="respawn")respawnLocal();if(sig.type==="gameover"&&duoSession)applyDuoSession({...duoSession,status:"gameover"})});
  try{
    const res=await online.connect(t=>$("duoConnectText").textContent=t);
    duoRole=res.role;partnerProfile=res.partnerProfile;duoSession=res.session;level=duoSession.level||1;lives=duoSession.lives??5;score=duoSession.score||0;eaten=duoSession.eaten||0;
    lastKnownDuoLevel=level;lastKnownDuoSeed=duoSession.seed>>>0;buildLevel(duoSession.seed>>>0);
    if(res.selfState&&res.selfState.level===level&&res.selfState.seed===currentMazeSeed){
      if(walkable(Math.round(res.selfState.x),Math.round(res.selfState.y))){player.x=res.selfState.x;player.y=res.selfState.y;player.dir=res.selfState.dir||"left";player.next=player.dir}
    }
    applyDuoRuntime(res.runtime,res.isHost);applyDuoSession(res.session);
    $("duoConnectOverlay").classList.remove("active");setScreen("game");started=res.session.status==="playing";paused=false;transitioning=res.session.status!=="playing";last=performance.now();tone(330,.09,.03);
    if(started)requestAnimationFrame(loop);
  }catch(err){
    $("duoConnectOverlay").classList.remove("active");gameMode="solo";online.disconnect();
    const text=err.message==="NO_AUTH"?"Primero inicia sesión en Burbuja desde este mismo dominio y después abre Burbuja Hambrienta.":err.message==="NO_PARTNER"?"Todavía no están creadas las dos cuentas de Burbuja.":"No se pudo conectar el modo dúo. Comprueba tu conexión y vuelve a intentar.";
    $("duoErrorText").textContent=text;$("duoErrorOverlay").classList.add("active");
  }
}

function nextLevel(){
  showOverlay("level",false);
  if(gameMode==="duo"){online.advanceLevel(randomSeed());return}
  level++;if(level>bestLevel)bestLevel=level;storage.set("hambriento_bestlevel",bestLevel);buildLevel();started=true;last=performance.now();requestAnimationFrame(loop);
}
function retry(){
  showOverlay("gameover",false);
  if(gameMode==="duo"){online.resetGame(randomSeed());return}
  startNewGame();
}
function goMenu(){
  cancelAnimationFrame(animationId);started=false;paused=false;transitioning=false;hideAllOverlays();
  if(gameMode==="duo")online.disconnect();saveProgress();gameMode="solo";duoSession=null;remotePlayer=null;setScreen("menu");updateMenuStats();
}
function pause(){if(!started||transitioning)return;paused=true;started=false;showOverlay("pause",true)}
function resume(){showOverlay("pause",false);paused=false;started=true;last=performance.now();requestAnimationFrame(loop)}

// Audio ligero con WebAudio, sin archivos externos.
let audioCtx=null;
function audio(){
  if(!soundEnabled)return null;
  if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==="suspended")audioCtx.resume();
  return audioCtx;
}
function tone(freq,dur=.05,vol=.02){
  const a=audio();if(!a)return;
  const o=a.createOscillator(),g=a.createGain();o.type="sine";o.frequency.value=freq;
  g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+dur);
  o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+dur);
}

$("playBtn").onclick=startNewGame;
$("duoBtn").onclick=startDuoGame;
$("howBtn").onclick=()=>setScreen("how");
$("howBackBtn").onclick=()=>setScreen("menu");
$("pauseBtn").onclick=pause;
$("resumeBtn").onclick=resume;
$("quitBtn").onclick=goMenu;
$("nextLevelBtn").onclick=nextLevel;
$("retryBtn").onclick=retry;
$("gameOverMenuBtn").onclick=goMenu;
$("duoCancelBtn").onclick=()=>{$("duoConnectOverlay").classList.remove("active");online.disconnect();gameMode="solo"};
$("duoErrorOkBtn").onclick=()=>$("duoErrorOverlay").classList.remove("active");
$("soundBtn").onclick=()=>{
  soundEnabled=!soundEnabled;
  $("soundBtn").textContent=soundEnabled?"♪":"×";
  if(soundEnabled)tone(520,.06,.02);
};

addEventListener("keydown",e=>{
  const map={
    ArrowUp:"up",KeyW:"up",ArrowDown:"down",KeyS:"down",
    ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right"
  };
  if(map[e.code]){e.preventDefault();requestedDir=map[e.code]}
  if(e.code==="Escape"||e.code==="KeyP"){
    if(screens.game.classList.contains("active")){
      if(paused)resume();else pause();
    }
  }
});
document.querySelectorAll(".pad-btn").forEach(btn=>{
  const set=e=>{e.preventDefault();requestedDir=btn.dataset.dir;tone(280,.012,.004)};
  btn.addEventListener("pointerdown",set,{passive:false});
  btn.addEventListener("touchstart",set,{passive:false});
});

document.addEventListener("visibilitychange",()=>{
  if(document.hidden&&started&&!paused)pause();
});

if("serviceWorker" in navigator){
  addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

setScreen("menu");
fitBoard();
})();
