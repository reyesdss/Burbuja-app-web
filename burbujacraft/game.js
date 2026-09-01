(()=>{
"use strict";

const $=id=>document.getElementById(id);
const canvas=$("gameCanvas"),ctx=canvas.getContext("2d"),shell=$("gameShell");
const lightCanvas=document.createElement("canvas"),lctx=lightCanvas.getContext("2d");
const mapCanvas=$("mapCanvas"),mctx=mapCanvas.getContext("2d");
const screens={menu:$("menuScreen"),how:$("howScreen"),game:$("gameScreen")};
const modalIds=["inventoryModal","chestModal","mapModal","furnaceModal","markerModal","pauseModal","messageModal","duoConnectingModal"];
const TILE=54,CAVE_SIZE=64,SPAWN_X=0,SPAWN_Y=0;
let CW=0,CH=0,DPR=1,camera={x:0,y:0},raf=0,last=0;
let running=false,paused=false,gameMode="solo",worldSeed=0,worldTime=120,days=0,layer="surface",caveId=null,surfaceReturn=null;
let mods={},remoteMods={},resourceDamage={},caveCache=new Map(),mobs=[],projectiles=[],particles=[],remotePlayer=null,partnerProfile=null;
let saveTimer=0,onlineTimer=0,spawnTimer=0,dayRewardTimer=0,discoverTimer=0,selectedSlot=0,selectedInventoryItem=null,activeChest=null;
let moveInput={x:0,y:0},keys={},lastAttack=0,lastUse=0,fishing=null,buildCount=0,hostileKills=0,soundOn=true,audioCtx=null;
let craftCategory="all",selectedRecipeIndex=0,pendingMarkerPlacement=null,markerPreset={icon:"🏠",label:"Casa"},lastLavaWarn=0;
let weather={type:"clear",until:0,next:80,flash:0},weatherTimer=0,placeHoldTimer=null,lastMoveSample=null,remoteEmoteUntil=0,partnerPing=null;
const online=new window.BurbujacraftOnline();

const ui={
 menuPoints:$("menuPoints"),menuDays:$("menuDays"),menuTier:$("menuTier"),continueBtn:$("continueBtn"),continueInfo:$("continueInfo"),menuStatus:$("menuStatus"),
 mode:$("modeLabel"),day:$("dayLabel"),world:$("worldLabel"),time:$("timeLabel"),clock:$("clockFill"),points:$("burbujaPointsEl"),
 health:$("healthBar"),healthText:$("healthText"),hunger:$("hungerBar"),hungerText:$("hungerText"),partnerCard:$("partnerCard"),partnerName:$("partnerName"),partnerDistance:$("partnerDistance"),
 hint:$("contextHint"),toast:$("questToast"),hotbar:$("hotbar"),inventoryGrid:$("inventoryGrid"),selectedIcon:$("selectedIcon"),selectedName:$("selectedName"),selectedDesc:$("selectedDesc"),equipBtn:$("equipBtn"),eatBtn:$("eatBtn"),giftItemBtn:$("giftItemBtn"),deleteItemBtn:$("deleteItemBtn"),equipSlotArea:$("equipSlotArea"),equipSlotPicker:$("equipSlotPicker"),
 recipeGrid:$("recipeGrid"),craftContext:$("craftContext"),craftCategories:$("craftCategories"),craftDetail:$("craftDetail"),achievementsGrid:$("achievementsGrid"),furnaceRecipes:$("furnaceRecipes"),chestInventoryGrid:$("chestInventoryGrid"),chestGrid:$("chestGrid"),
 waypointHud:$("waypointHud"),waypointIcon:$("waypointIcon"),waypointName:$("waypointName"),waypointDistance:$("waypointDistance"),waypointArrow:$("waypointArrow"),mapMarkers:$("mapMarkers"),worldEventHud:$("worldEventHud"),weatherIcon:$("weatherIcon"),weatherLabel:$("weatherLabel"),tutorialCard:$("tutorialCard"),tutorialTitle:$("tutorialTitle"),tutorialText:$("tutorialText"),downedOverlay:$("downedOverlay"),downedTimer:$("downedTimer")
};

const ITEM={
 log:{name:"Tronco",icon:"🪵",desc:"Madera sin procesar.",stack:99},
 plank:{name:"Tabla",icon:"🟫",desc:"Madera preparada para fabricar y construir.",stack:99},
 stick:{name:"Palo",icon:"🪵",desc:"Componente para herramientas, antorchas y armas.",stack:99},
 stone:{name:"Piedra",icon:"🪨",desc:"Material resistente.",stack:99},
 sand:{name:"Arena",icon:"🟨",desc:"Puede fundirse para obtener vidrio.",stack:99},
 glass:{name:"Vidrio",icon:"🔷",desc:"Material transparente para ventanas.",stack:99},
 ironOre:{name:"Mineral de hierro",icon:"🪨",desc:"Se funde en un horno.",stack:99},
 iron:{name:"Hierro",icon:"🔩",desc:"Metal para herramientas y objetos avanzados.",stack:99},
 charcoal:{name:"Carbón vegetal",icon:"⚫",desc:"Combustible ligero para fabricar antorchas.",stack:99},
 volcanicStone:{name:"Roca volcánica",icon:"🌋",desc:"Material encontrado en cuevas profundas y zonas de lava.",stack:99},
 crimsonCrystal:{name:"Cristal carmesí",icon:"🔻",desc:"Cristal extraño del Abismo Carmesí.",stack:99},
 string:{name:"Hilo",icon:"🧵",desc:"Drop de arañas. Sirve para arcos y cañas.",stack:99},
 feather:{name:"Pluma",icon:"🪶",desc:"Sirve para flechas.",stack:99},
 wool:{name:"Lana",icon:"🧶",desc:"Sirve para fabricar cama y estandartes.",stack:99},
 bone:{name:"Hueso",icon:"🦴",desc:"Drop de esqueletos; puede convertirse en flechas.",stack:99},
 cloth:{name:"Tela vieja",icon:"🧣",desc:"Drop de zombis; sirve para vendas.",stack:99},
 leather:{name:"Cuero",icon:"🟤",desc:"Drop de vacas; sirve para protección ligera.",stack:99},
 leatherVest:{name:"Pechera de cuero",icon:"🦺",desc:"Reduce 15% del daño recibido.",armor:.15,stack:1},
 voidShard:{name:"Fragmento del vacío",icon:"🔮",desc:"Drop raro del Caminante del Vacío.",stack:99},

 rawBeef:{name:"Carne de vaca",icon:"🥩",desc:"Mejor cocida.",food:12,stack:30},
 rawPork:{name:"Carne de cerdo",icon:"🥓",desc:"Mejor cocida.",food:11,stack:30},
 rawChicken:{name:"Pollo crudo",icon:"🍗",desc:"Mejor cocido.",food:8,stack:30},
 rawMutton:{name:"Carne de oveja",icon:"🥩",desc:"Mejor cocida.",food:10,stack:30},
 fish:{name:"Pescado",icon:"🐟",desc:"Capturado en agua.",food:9,stack:30},
 cookedBeef:{name:"Carne cocida",icon:"🍖",desc:"Restaura mucha hambre.",food:28,stack:30},
 cookedPork:{name:"Cerdo cocido",icon:"🍖",desc:"Restaura hambre.",food:26,stack:30},
 cookedChicken:{name:"Pollo cocido",icon:"🍗",desc:"Restaura hambre.",food:22,stack:30},
 cookedMutton:{name:"Oveja cocida",icon:"🍖",desc:"Restaura hambre.",food:24,stack:30},
 cookedFish:{name:"Pescado cocido",icon:"🐟",desc:"Restaura hambre.",food:22,stack:30},
 bandage:{name:"Venda",icon:"🩹",desc:"Recupera 28 de vida.",heal:28,stack:12},
 voidCharm:{name:"Amuleto del vacío",icon:"💠",desc:"Úsalo para regresar a tu cama o al origen.",teleport:true,stack:5},

 woodSword:{name:"Espada de madera",icon:"🗡️",desc:"Daño 12.",tool:"sword",tier:1,damage:12,stack:1},
 stoneSword:{name:"Espada de piedra",icon:"⚔️",desc:"Daño 18.",tool:"sword",tier:2,damage:18,stack:1},
 ironSword:{name:"Espada de hierro",icon:"⚔️",desc:"Daño 27.",tool:"sword",tier:3,damage:27,stack:1},
 woodAxe:{name:"Hacha de madera",icon:"🪓",desc:"Para cortar árboles y madera.",tool:"axe",tier:1,damage:8,stack:1},
 stoneAxe:{name:"Hacha de piedra",icon:"🪓",desc:"Corta más rápido.",tool:"axe",tier:2,damage:11,stack:1},
 ironAxe:{name:"Hacha de hierro",icon:"🪓",desc:"Hacha resistente.",tool:"axe",tier:3,damage:15,stack:1},
 woodPick:{name:"Pico de madera",icon:"⛏️",desc:"Para piedra.",tool:"pick",tier:1,damage:5,stack:1},
 stonePick:{name:"Pico de piedra",icon:"⛏️",desc:"Extrae hierro y roca volcánica.",tool:"pick",tier:2,damage:7,stack:1},
 ironPick:{name:"Pico de hierro",icon:"⛏️",desc:"Mina rápidamente.",tool:"pick",tier:3,damage:9,stack:1},
 woodBow:{name:"Arco de madera",icon:"🏹",desc:"Usa flechas.",tool:"bow",tier:1,damage:14,stack:1},
 stoneBow:{name:"Arco reforzado",icon:"🏹",desc:"Mayor daño.",tool:"bow",tier:2,damage:20,stack:1},
 ironBow:{name:"Arco de hierro",icon:"🏹",desc:"El mejor arco.",tool:"bow",tier:3,damage:29,stack:1},
 arrow:{name:"Flecha",icon:"🏹",desc:"Munición para arco.",stack:99},
 fishingRod:{name:"Caña de pescar",icon:"🎣",desc:"Pesca junto al agua.",tool:"rod",tier:1,stack:1},

 woodWall:{name:"Bloque de madera",icon:"🟫",desc:"Bloque sólido para paredes y refugios.",place:"woodWall",stack:99},
 stoneWall:{name:"Bloque de piedra",icon:"🧱",desc:"Bloque sólido y resistente.",place:"stoneWall",stack:99},
 glassWall:{name:"Ventana de vidrio",icon:"🪟",desc:"Bloque transparente para ventanas.",place:"glassWall",stack:99},
 door:{name:"Puerta normal",icon:"🚪",desc:"Puerta de madera.",place:"doorClosed",stack:20},
 bubbleDoor:{name:"Puerta de Burbuja",icon:"💜",desc:"Solo tú y tu dúo pueden abrirla.",place:"bubbleDoorClosed",privateDoor:true,stack:20},
 craftingTable:{name:"Mesa de crafteo",icon:"🛠️",desc:"Desbloquea recetas avanzadas.",place:"craftingTable",stack:10},
 furnace:{name:"Horno",icon:"🔥",desc:"Cocina, funde hierro, vidrio y carbón.",place:"furnace",stack:10},
 chest:{name:"Cofre",icon:"📦",desc:"Almacenamiento compartido en dúo.",place:"chest",stack:12},
 bed:{name:"Cama",icon:"🛏️",desc:"Guarda tu punto personal de reaparición.",place:"bed",stack:4},
 torch:{name:"Antorcha",icon:"🔥",desc:"Ilumina cuevas y noches. Se queda colocada.",place:"torch",stack:99},
 marker:{name:"Estandarte de ruta",icon:"🚩",desc:"Marca Casa, Río, Mina u otro lugar. Máximo 3.",place:"marker",stack:6},
 abyssBlock:{name:"Bloque del Abismo",icon:"⬛",desc:"Bloque volcánico para construir el marco del portal.",place:"abyssBlock",stack:99},
 woodHoe:{name:"Azada de madera",icon:"🪏",desc:"Prepara tierra para cultivar.",tool:"hoe",tier:1,stack:1},
 stoneHoe:{name:"Azada de piedra",icon:"🪏",desc:"Azada más resistente.",tool:"hoe",tier:2,stack:1},
 ironHoe:{name:"Azada de hierro",icon:"🪏",desc:"La mejor azada para la granja.",tool:"hoe",tier:3,stack:1},
 seeds:{name:"Semillas de trigo",icon:"🌾",desc:"Plántalas sobre tierra preparada.",seed:"cropWheat",stack:99},
 carrot:{name:"Zanahoria",icon:"🥕",desc:"Se puede comer o volver a plantar.",food:14,seed:"cropCarrot",stack:40},
 potato:{name:"Papa",icon:"🥔",desc:"Se puede comer o volver a plantar.",food:10,seed:"cropPotato",stack:40},
 wheat:{name:"Trigo",icon:"🌾",desc:"Sirve para pan y para reproducir animales.",stack:99},
 bread:{name:"Pan",icon:"🍞",desc:"Comida sencilla hecha con trigo.",food:24,stack:30},
 blueFish:{name:"Pez azul",icon:"🐠",desc:"Pez poco común de aguas abiertas.",food:15,stack:30},
 pearl:{name:"Perla de Burbuja",icon:"🫧",desc:"Tesoro raro encontrado pescando.",stack:20},
 ironArmor:{name:"Armadura de hierro",icon:"🛡️",desc:"Reduce 35% del daño y se ve en tu personaje.",armor:.35,stack:1},
 woodFloor:{name:"Piso de madera",icon:"🟤",desc:"Piso decorativo para casas.",place:"woodFloor",stack:99},
 stoneFloor:{name:"Piso de piedra",icon:"◼️",desc:"Piso resistente y decorativo.",place:"stoneFloor",stack:99},
 fence:{name:"Cerca",icon:"🪵",desc:"Delimita jardines y corrales.",place:"fence",stack:99},
 gate:{name:"Portón",icon:"🚧",desc:"Portón para cercas y corrales.",place:"gateClosed",stack:20},
 roofTile:{name:"Techo",icon:"🏠",desc:"Bloque de techo decorativo.",place:"roofTile",stack:99},
 emberCore:{name:"Corazón Ígneo",icon:"❤️‍🔥",desc:"Activa un marco 4×5 de Bloques del Abismo.",portalActivator:true,stack:5}
};

const RECIPES=[
 {out:"plank",n:4,in:{log:1},basic:true,cat:"materials"},
 {out:"stick",n:4,in:{plank:2},basic:true,cat:"materials"},
 {out:"woodSword",n:1,in:{plank:2,stick:1},basic:true,cat:"combat"},
 {out:"woodAxe",n:1,in:{plank:3,stick:2},basic:true,cat:"tools"},
 {out:"woodPick",n:1,in:{plank:3,stick:2},basic:true,cat:"tools"},
 {out:"craftingTable",n:1,in:{plank:4},basic:true,cat:"build"},
 {out:"woodWall",n:4,in:{plank:4},basic:true,cat:"build"},
 {out:"bandage",n:1,in:{cloth:2},basic:true,cat:"survival"},

 {out:"leatherVest",n:1,in:{leather:6},table:true,cat:"survival"},
 {out:"door",n:2,in:{plank:6},table:true,cat:"build"},
 {out:"bubbleDoor",n:1,in:{plank:6,iron:1},table:true,cat:"build"},
 {out:"chest",n:1,in:{plank:8},table:true,cat:"build"},
 {out:"furnace",n:1,in:{stone:8},table:true,cat:"build"},
 {out:"stoneWall",n:4,in:{stone:4},table:true,cat:"build"},
 {out:"glassWall",n:4,in:{glass:4},table:true,cat:"build"},
 {out:"bed",n:1,in:{plank:3,wool:3},table:true,cat:"survival"},
 {out:"marker",n:1,in:{plank:2,wool:1},table:true,cat:"explore"},
 {out:"torch",n:4,in:{stick:1,charcoal:1},table:true,cat:"explore"},

 {out:"stoneSword",n:1,in:{stone:2,stick:1},table:true,cat:"combat"},
 {out:"stoneAxe",n:1,in:{stone:3,stick:2},table:true,cat:"tools"},
 {out:"stonePick",n:1,in:{stone:3,stick:2},table:true,cat:"tools"},
 {out:"ironSword",n:1,in:{iron:2,stick:1},table:true,cat:"combat"},
 {out:"ironAxe",n:1,in:{iron:3,stick:2},table:true,cat:"tools"},
 {out:"ironPick",n:1,in:{iron:3,stick:2},table:true,cat:"tools"},
 {out:"woodBow",n:1,in:{stick:3,string:2},table:true,cat:"combat"},
 {out:"stoneBow",n:1,in:{stick:3,string:2,stone:2},table:true,cat:"combat"},
 {out:"ironBow",n:1,in:{stick:3,string:2,iron:2},table:true,cat:"combat"},
 {out:"arrow",n:8,in:{stick:2,stone:1,feather:1},table:true,cat:"combat"},
 {out:"arrow",n:4,in:{stick:1,bone:1},table:true,cat:"combat"},
 {out:"fishingRod",n:1,in:{stick:3,string:2},table:true,cat:"survival"},
 {out:"voidCharm",n:1,in:{voidShard:3,iron:1},table:true,cat:"special"},

 {out:"abyssBlock",n:2,in:{volcanicStone:1,stone:1},table:true,cat:"special"},
 {out:"emberCore",n:1,in:{volcanicStone:3,iron:2,voidShard:1},table:true,cat:"special"},
 {out:"woodHoe",n:1,in:{plank:2,stick:2},basic:true,cat:"tools"},
 {out:"stoneHoe",n:1,in:{stone:2,stick:2},table:true,cat:"tools"},
 {out:"ironHoe",n:1,in:{iron:2,stick:2},table:true,cat:"tools"},
 {out:"bread",n:1,in:{wheat:3},basic:true,cat:"survival"},
 {out:"woodFloor",n:6,in:{plank:3},basic:true,cat:"build"},
 {out:"stoneFloor",n:6,in:{stone:3},table:true,cat:"build"},
 {out:"fence",n:4,in:{plank:4,stick:2},table:true,cat:"build"},
 {out:"gate",n:1,in:{plank:2,stick:4},table:true,cat:"build"},
 {out:"roofTile",n:4,in:{plank:5},table:true,cat:"build"},
 {out:"ironArmor",n:1,in:{iron:8,leather:2},table:true,cat:"survival"}
];
const SMELT=[
 {out:"iron",n:1,in:"ironOre",label:"Fundir hierro"},
 {out:"charcoal",n:1,in:"log",label:"Hacer carbón vegetal"},
 {out:"glass",n:1,in:"sand",label:"Fundir vidrio"},
 {out:"cookedBeef",n:1,in:"rawBeef",label:"Cocinar vaca"},
 {out:"cookedPork",n:1,in:"rawPork",label:"Cocinar cerdo"},
 {out:"cookedChicken",n:1,in:"rawChicken",label:"Cocinar pollo"},
 {out:"cookedMutton",n:1,in:"rawMutton",label:"Cocinar oveja"},
 {out:"cookedFish",n:1,in:"fish",label:"Cocinar pescado"}
];
const ACHIEVEMENTS={
 firstTree:{name:"Primer árbol",desc:"Consigue tu primer tronco.",points:3},
 firstCraft:{name:"Manos a la obra",desc:"Fabrica tu primer objeto.",points:3},
 craftingTable:{name:"Constructor",desc:"Coloca una mesa de crafteo.",points:5},
 chest:{name:"Bien guardado",desc:"Coloca tu primer cofre.",points:5},
 shelter:{name:"Hogar",desc:"Coloca 12 bloques y una puerta.",points:10},
 homeBed:{name:"Nuestro hogar",desc:"Establece tu cama como punto de aparición.",points:6},
 waypoint:{name:"No nos perdemos",desc:"Coloca tu primer estandarte de ruta.",points:5},
 firstNight:{name:"Primera noche",desc:"Sobrevive hasta el amanecer.",points:8},
 hunter:{name:"Cazador",desc:"Derrota 10 criaturas hostiles.",points:8},
 fisher:{name:"Pescador",desc:"Pesca tu primer pez.",points:5},
 cave:{name:"Bajo tierra",desc:"Entra a una cueva.",points:5},
 ironAge:{name:"Edad del hierro",desc:"Fabrica una herramienta de hierro.",points:10},
 traveler:{name:"Exploradores",desc:"Aléjate 100 bloques del origen.",points:8},
 structure:{name:"Descubridores",desc:"Encuentra una construcción abandonada.",points:6},
 abyss:{name:"Al otro lado",desc:"Entra al Abismo Carmesí.",points:12},
 duo:{name:"Juntos",desc:"Juega 10 minutos en modo dúo.",points:10},
 farmer:{name:"Primera cosecha",desc:"Cosecha tu primer cultivo.",points:6},
 breeder:{name:"Vida en la granja",desc:"Reproduce tu primer animal.",points:6},
 architect:{name:"Arquitecto",desc:"Coloca 50 piezas de construcción.",points:10},
 crimsonNight:{name:"Noche Carmesí",desc:"Sobrevive a una Noche Carmesí.",points:12},
 rescuer:{name:"Aquí estoy",desc:"Revive a tu persona en modo dúo.",points:8}
};

let state={
 x:SPAWN_X+.5,y:SPAWN_Y+.5,dirX:0,dirY:1,health:100,hunger:100,
 inventory:{},hotbar:Array(9).fill(null),achievements:{},burbujaPoints:0,dailyRewardDate:null,duoMinutes:0,tier:1,armor:null,pendingPointEvents:[],
 spawn:{x:SPAWN_X+.5,y:SPAWN_Y+.5,layer:"surface"},markers:[],activeMarkerId:null,discoveredStructures:{},sleepAt:0,abyssReturn:null,
 worldName:"Nuestro mundo",tutorialStep:0,tutorialDone:false,downed:false,downUntil:0,visitedCaves:[],portals:[],
 stats:{playSeconds:0,distance:0,blocksPlaced:0,treesCut:0,kills:0,fishCaught:0,crafts:0,harvests:0,animalsBred:0,deaths:0,gifts:0}
};

function hash2(x,y,s=worldSeed){let n=(Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s|0,1442695041))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;return ((n^(n>>>16))>>>0)/4294967295}
function noise2(x,y,scale=18,s=worldSeed){const fx=x/scale,fy=y/scale,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,sm=t=>t*t*(3-2*t);const a=hash2(x0,y0,s),b=hash2(x0+1,y0,s),c=hash2(x0,y0+1,s),d=hash2(x0+1,y0+1,s),u=sm(tx),v=sm(ty);return(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v}
function riverCenter(y){return 26+Math.sin((y+(worldSeed%101))*.025)*18+Math.sin((y-(worldSeed%53))*.008)*28}
function surfaceBiomeAt(x,y){
 const t=surfaceTerrainAt(x,y);if(t==="water")return"water";if(t==="sand")return"coast";
 const n=noise2(Math.floor(x)+2500,Math.floor(y)-1600,58,worldSeed^0xB10B1),e=noise2(Math.floor(x)-900,Math.floor(y)+2200,41,worldSeed^0x91);
 if(t==="darkGrass"||e>.76)return"rocky";if(n<.26)return"birch";if(n>.72)return"pine";if(e<.34)return"meadow";return"forest"
}
function biomeLabel(){if(layer==="cave")return"CUEVAS PROFUNDAS";if(layer==="abyss")return"ABISMO CARMESÍ";const b=surfaceBiomeAt(state.x,state.y);return({water:"AGUAS DE BURBUJA",coast:"COSTA DE BURBUJA",rocky:"SIERRAS DE PIEDRA",birch:"BOSQUE DE ABEDULES",pine:"BOSQUE DE PINOS",meadow:"PRADERA DE BURBUJA",forest:"BOSQUE DE BURBUJA"})[b]||"MUNDO DE BURBUJA"}

function surfaceTerrainAt(x,y){
 x=Math.floor(x);y=Math.floor(y);
 if(Math.hypot(x-SPAWN_X,y-SPAWN_Y)<9)return"grass";
 const river=Math.abs(x-riverCenter(y)),elev=noise2(x+1700,y-900,72)*.72+noise2(x-300,y+1100,31)*.28;
 if(river<1.55||elev<.225)return"water";
 if(river<2.8||elev<.285)return"sand";
 if(elev>.71)return"darkGrass";
 return"grass";
}
function abyssTerrainAt(x,y){
 x=Math.floor(x);y=Math.floor(y);
 if(Math.hypot(x,y)<7)return"abyssStone";
 const n=noise2(x+6100,y-4300,21,worldSeed^0xA51B55),h=hash2(x*7+33,y*5-91,worldSeed^0x9911);
 if(n<.245||h<.028)return"lava";
 if(n>.72)return"crimsonGround";
 return"abyssStone";
}
function terrainAt(x,y){
 if(layer==="surface")return surfaceTerrainAt(x,y);
 if(layer==="cave")return caveTerrain(Math.floor(x),Math.floor(y));
 if(layer==="abyss")return abyssTerrainAt(x,y);
 return"grass";
}

function layerKey(){
 if(layer==="surface")return"surface";
 if(layer==="abyss")return"abyss";
 return`cave_${caveId}`;
}
function modKey(x,y){return`${layerKey()}:${Math.floor(x)}:${Math.floor(y)}`}
function getMod(key){return remoteMods[key]||mods[key]||null}
function setModAt(x,y,val){const key=modKey(x,y);mods[key]=val;if(gameMode==="duo"){remoteMods[key]=val;online.syncMod(layerKey(),x,y,val)}}
function isSpawnSafe(x,y){return Math.hypot(x-SPAWN_X,y-SPAWN_Y)<6}
function guaranteedCaveAt(x,y){const spots=[[18,-12],[-23,16],[31,25],[-36,-19]];return spots.some(([cx,cy])=>x===cx&&y===cy)}

function structureDescriptor(cx,cy){
 const grid=38,id=`${cx}_${cy}`,seed=worldSeed^0x57A7C7;
 const chance=hash2(cx*13+7,cy*17-11,seed);
 if(chance>.19)return null;
 const ox=cx*grid+7+Math.floor(hash2(cx+51,cy-19,seed)*20);
 const oy=cy*grid+7+Math.floor(hash2(cx-23,cy+73,seed)*20);
 if(Math.hypot(ox,oy)<17)return null;
 const samples=[[0,0],[-3,-3],[3,-3],[-3,3],[3,3]];
 if(samples.some(([dx,dy])=>["water","sand"].includes(surfaceTerrainAt(ox+dx,oy+dy))))return null;
 const r=hash2(cx*5+101,cy*9-27,seed);
 const kind=r<.25?"cabin":r<.45?"ruins":r<.61?"tower":r<.74?"camp":r<.85?"mine":r<.94?"sanctuary":"fort";
 const label=kind==="cabin"?"Cabaña abandonada":kind==="ruins"?"Ruinas del bosque":kind==="tower"?"Torre antigua":kind==="camp"?"Campamento abandonado":kind==="mine"?"Mina abandonada":kind==="sanctuary"?"Santuario de Burbuja":"Fortaleza antigua";
 return{id,kind,label,x:ox,y:oy};
}
function structureObjectFrom(desc,x,y){
 const dx=x-desc.x,dy=y-desc.y,k=desc.kind,extra={generated:true,structureId:desc.id,structureKind:k,structureLabel:desc.label};
 if(k==="cabin"){
   const w=7,h=6,left=-3,right=3,top=-3,bottom=2;
   if(dy===bottom&&dx===0)return{type:"doorClosed",...extra};
   if((dy===top||dy===bottom)&&dx>=left&&dx<=right)return{type:"woodWall",...extra};
   if((dx===left||dx===right)&&dy>=top&&dy<=bottom)return{type:"woodWall",...extra};
   if(dx===-1&&dy===0)return{type:"chest",lootId:desc.id,...extra};
   if(dx===1&&dy===0)return{type:"craftingTable",...extra};
 }
 if(k==="ruins"){
   if(Math.abs(dx)<=4&&Math.abs(dy)<=3){
     const edge=Math.abs(dx)===4||Math.abs(dy)===3;
     const broken=hash2(x*19,y*23,worldSeed^0x22)<.34;
     if(edge&&!broken)return{type:"stoneWall",...extra};
     if(dx===0&&dy===0)return{type:"chest",lootId:desc.id,...extra};
   }
 }
 if(k==="tower"){
   if(Math.abs(dx)<=2&&Math.abs(dy)<=2){
     if(dy===2&&dx===0)return{type:"doorClosed",...extra};
     if(Math.abs(dx)===2||Math.abs(dy)===2)return{type:"stoneWall",...extra};
     if(dx===0&&dy===0)return{type:"chest",lootId:desc.id,...extra};
   }
 }
 if(k==="camp"){
   if(dx===0&&dy===0)return{type:"campfire",...extra};
   if(dx===2&&dy===0)return{type:"chest",lootId:desc.id,...extra};
   if(dx===-2&&dy===0)return{type:"tent",...extra};
 }
 if(k==="mine"){
   if(dy===-2&&Math.abs(dx)<=3)return{type:"stoneWall",...extra};
   if((Math.abs(dx)===3&&dy>=-2&&dy<=2)||(dy===2&&Math.abs(dx)<=3&&dx!==0))return{type:"stoneWall",...extra};
   if(dx===0&&dy===2)return{type:"cave",...extra};
   if(dx===-1&&dy===0)return{type:"chest",lootId:desc.id,...extra};
 }
 if(k==="sanctuary"){
   if(Math.abs(dx)<=4&&Math.abs(dy)<=4){const edge=Math.abs(dx)===4||Math.abs(dy)===4;if(edge&&!(dy===4&&dx===0))return{type:"glassWall",...extra};if(dx===0&&dy===0)return{type:"chest",lootId:desc.id,...extra};if(Math.abs(dx)===2&&Math.abs(dy)===2)return{type:"torch",...extra}}
 }
 if(k==="fort"){
   if(Math.abs(dx)<=5&&Math.abs(dy)<=4){const edge=Math.abs(dx)===5||Math.abs(dy)===4;if(edge&&!(dy===4&&Math.abs(dx)<=1))return{type:"stoneWall",...extra};if(dx===0&&dy===0)return{type:"chest",lootId:desc.id,...extra};if((dx===-3||dx===3)&&dy===1)return{type:"torch",...extra}}
 }
 return null;
}
function structureObjectAt(x,y){
 const grid=38,cx=Math.floor(x/grid),cy=Math.floor(y/grid);
 for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++){
   const d=structureDescriptor(xx,yy);if(!d)continue;
   const o=structureObjectFrom(d,x,y);if(o)return o;
 }
 return null;
}
function nearbyStructure(range=8){
 if(layer!=="surface")return null;
 const grid=38,cx=Math.floor(state.x/grid),cy=Math.floor(state.y/grid);
 let best=null,bd=range;
 for(let yy=cy-1;yy<=cy+1;yy++)for(let xx=cx-1;xx<=cx+1;xx++){
   const d=structureDescriptor(xx,yy);if(!d)continue;
   const dist=Math.hypot(state.x-d.x,state.y-d.y);
   if(dist<bd){bd=dist;best=d}
 }
 return best;
}

function objectFromMod(m){
 if(!m?.place)return null;
 return{...m,type:m.place,placed:true};
}
function staticObjectAt(x,y){
 x=Math.floor(x);y=Math.floor(y);
 if(layer==="cave")return caveObjectAt(x,y);
 if(layer==="abyss")return abyssObjectAt(x,y);

 const m=getMod(modKey(x,y));
 if(m){
   if(m.removed){
     if(!(m.source==="tree"&&Number.isFinite(m.removedWorldTime)&&worldTime-m.removedWorldTime>1440))return null;
   }else if(m.place)return objectFromMod(m);
 }
 const structure=structureObjectAt(x,y);if(structure)return structure;
 const t=surfaceTerrainAt(x,y);if(t==="water"||t==="sand"||isSpawnSafe(x,y))return null;
 if(guaranteedCaveAt(x,y))return{type:"cave"};
 const h=hash2(x*3+9,y*3+17);
 if(h<.075){const b=surfaceBiomeAt(x,y),k=hash2(x+77,y+33);return{type:"tree",kind:b==="pine"?"pine":b==="birch"?"birch":k<.68?"oak":k<.84?"pine":"birch"}}
 if(h>.078&&h<.098)return{type:"rock"};
 if(h>.098&&h<.102)return{type:"cave"};
 return null;
}

function caveSeed(){return((worldSeed^Math.imul((caveId||1),2654435761))>>>0)}
function buildCave(id){
 if(caveCache.has(id))return caveCache.get(id);
 let s=(worldSeed^Math.imul(id,2246822519))>>>0,rr=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
 const map=Array.from({length:CAVE_SIZE},()=>Array(CAVE_SIZE).fill(1));let x=CAVE_SIZE>>1,y=CAVE_SIZE>>1;
 for(let i=0;i<8500;i++){
   map[y][x]=0;const d=(rr()*4)|0;if(d===0)x++;if(d===1)x--;if(d===2)y++;if(d===3)y--;
   x=Math.max(2,Math.min(CAVE_SIZE-3,x));y=Math.max(2,Math.min(CAVE_SIZE-3,y));
   if(rr()<.22)for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)map[y+yy][x+xx]=0
 }
 const cx=CAVE_SIZE>>1,cy=CAVE_SIZE>>1;
 for(let yy=-3;yy<=3;yy++)for(let xx=-3;xx<=3;xx++)map[cy+yy][cx+xx]=0;
 const out={map,cx,cy};caveCache.set(id,out);return out;
}
function caveTerrain(x,y){
 const c=buildCave(caveId);
 if(x<0||y<0||x>=CAVE_SIZE||y>=CAVE_SIZE)return"caveWall";
 if(c.map[y][x])return"caveWall";
 if(Math.hypot(x-c.cx,y-c.cy)<7)return"caveFloor";
 const h=hash2(x*11+caveId,y*13-caveId,caveSeed()),n=noise2(x+caveId%200,y-caveId%170,10,caveSeed());
 if(h<.022||(h<.075&&n<.31))return"lava";
 return"caveFloor";
}
function caveObjectAt(x,y){
 const m=getMod(modKey(x,y));if(m){if(m.removed)return null;if(m.place)return objectFromMod(m)}
 const c=buildCave(caveId);
 if(x===c.cx&&y===c.cy)return{type:"caveExit"};
 if(caveTerrain(x,y)!=="caveFloor"||Math.hypot(x-c.cx,y-c.cy)<5)return null;
 const h=hash2(x*5+caveId,y*7-caveId,caveSeed());
 if(h<.035)return{type:"volcanicNode"};
 if(h<.080)return{type:"coalNode"};
 if(h<.135)return{type:"ironNode"};
 if(h<.235)return{type:"caveRock"};
 return null;
}
function abyssObjectAt(x,y){
 const m=getMod(modKey(x,y));if(m){if(m.removed)return null;if(m.place)return objectFromMod(m)}
 if(x===0&&y===0)return{type:"portalReturn"};
 if(abyssTerrainAt(x,y)==="lava"||Math.hypot(x,y)<4)return null;
 const h=hash2(x*17+71,y*19-47,worldSeed^0xAB155);
 if(h<.045)return{type:"crimsonCrystalNode"};
 if(h<.095)return{type:"ashRock"};
 if(h<.135)return{type:"emberTree"};
 return null;
}

function applyRemoteChunk(docId,chunkMods){
 const safe=layerKey().replace(/[^a-zA-Z0-9_-]/g,"_");if(!docId.includes(`_${safe}_`))return;
 for(const[k,v]of Object.entries(chunkMods)){const parts=k.split("_");if(parts.length<2)continue;const y=Number(parts.pop()),x=Number(parts.pop());if(Number.isFinite(x)&&Number.isFinite(y))remoteMods[`${layerKey()}:${x}:${y}`]=v}
}
const BLOCKING_TYPES=new Set(["tree","rock","caveRock","ironNode","coalNode","volcanicNode","crimsonCrystalNode","ashRock","emberTree","woodWall","stoneWall","glassWall","abyssBlock","craftingTable","furnace","chest","bed","doorClosed","bubbleDoorClosed","gateClosed","tent","fence","roofTile"]);
function collisionAt(x,y){
 const tx=Math.floor(x),ty=Math.floor(y),t=terrainAt(tx,ty);if(t==="caveWall")return true;
 const o=staticObjectAt(tx,ty);return !!(o&&BLOCKING_TYPES.has(o.type));
}
function movePlayer(dx,dy,dt){
 if(state.downed)return;let l=Math.hypot(dx,dy);if(!l)return;dx/=l;dy/=l;state.dirX=dx;state.dirY=dy;
 const ox=state.x,oy=state.y,terrain=terrainAt(state.x,state.y),swimming=terrain==="water",sp=(swimming?1.85:3.45)*dt,nx=state.x+dx*sp,ny=state.y+dy*sp;
 if(!collisionAt(nx,state.y))state.x=nx;if(!collisionAt(state.x,ny))state.y=ny;
 if(layer==="cave"){state.x=Math.max(1,Math.min(CAVE_SIZE-2,state.x));state.y=Math.max(1,Math.min(CAVE_SIZE-2,state.y))}
 const moved=Math.hypot(state.x-ox,state.y-oy);if(moved>0){state.stats.distance=(state.stats.distance||0)+moved}
 if(layer==="surface"&&Math.hypot(state.x,state.y)>100)unlockAchievement("traveler");
}
function frontTile(){
 let dx=0,dy=0;
 if(Math.abs(state.dirX)>=Math.abs(state.dirY))dx=state.dirX>=0?1:-1;else dy=state.dirY>=0?1:-1;
 return{x:Math.floor(state.x)+dx,y:Math.floor(state.y)+dy,dx,dy};
}
function placementStatus(){
 const id=selectedItem(),it=ITEM[id];if(!it?.place)return null;
 const q=frontTile(),t=terrainAt(q.x,q.y),o=staticObjectAt(q.x,q.y);
 let valid=!o&&t!=="caveWall"&&t!=="lava"&&t!=="water";
 if(it.place==="torch")valid=!o&&t!=="caveWall"&&t!=="lava";
 if(["bed","marker"].includes(it.place)&&layer!=="surface")valid=false;
 if(["woodFloor","stoneFloor"].includes(it.place))valid=!o&&t!=="caveWall"&&t!=="lava"&&t!=="water";
 if(it.place==="abyssBlock"&&layer!=="surface")valid=false;
 return{...q,id,it,t,o,valid};
}

function inventoryDistinct(){return Object.keys(state.inventory).filter(id=>state.inventory[id]>0).length}
function addItem(id,n=1,silent=false){
 if(!ITEM[id])return false;if(!state.inventory[id]&&inventoryDistinct()>=36){if(!silent)toast("Inventario lleno.");return false}
 state.inventory[id]=(state.inventory[id]||0)+n;if(!state.hotbar.includes(id)){const i=state.hotbar.findIndex(v=>!v);if(i>=0)state.hotbar[i]=id}
 if(id==="log")unlockAchievement("firstTree");updateHotbar();updateInventoryUI();return true;
}
function removeItem(id,n=1){if((state.inventory[id]||0)<n)return false;state.inventory[id]-=n;if(state.inventory[id]<=0){delete state.inventory[id];state.hotbar=state.hotbar.map(v=>v===id?null:v)}updateHotbar();updateInventoryUI();return true}
function hasItems(req){return Object.entries(req).every(([id,n])=>(state.inventory[id]||0)>=n)}
function consumeItems(req){for(const[id,n]of Object.entries(req))removeItem(id,n)}
function selectedItem(){return state.hotbar[selectedSlot]||null}
function selectedDef(){return ITEM[selectedItem()]||null}
function useInventoryItem(id){
 const it=ITEM[id];if(!it||!(state.inventory[id]>0))return;
 if(it.food){if(state.hunger>=100)return;removeItem(id,1);state.hunger=Math.min(100,state.hunger+it.food);tone(320,.05,.018)}
 else if(it.heal){if(state.health>=100)return;removeItem(id,1);state.health=Math.min(100,state.health+it.heal);tone(520,.07,.02)}
 else if(it.armor){state.armor=id;toast(`${it.icon} Protección equipada.`,700);haptic(18)}
 else if(it.teleport){removeItem(id,1);layer="surface";caveId=null;const sp=state.spawn||{x:SPAWN_X+.5,y:SPAWN_Y+.5};state.x=sp.x;state.y=sp.y;mobs=[];projectiles=[];toast("El amuleto te devolvió a tu punto de aparición.")}
 updateHud();renderInventorySelection();
}
function toolPower(kind){const it=selectedDef();return it&&it.tool===kind?(it.tier||1):0}
function nearestObject(range=1.45,filter=null){let best=null,bd=range;for(let y=Math.floor(state.y-range);y<=Math.ceil(state.y+range);y++)for(let x=Math.floor(state.x-range);x<=Math.ceil(state.x+range);x++){const o=staticObjectAt(x,y);if(!o||(filter&&!filter(o)))continue;const d=Math.hypot(x+.5-state.x,y+.5-state.y);if(d<bd){bd=d;best={x,y,o,d}}}return best}
function nearestMob(range=1.45){let best=null,bd=range;for(const m of mobs){if(m.dead||m.layer!==layerKey())continue;const d=Math.hypot(m.x-state.x,m.y-state.y);if(d<bd){bd=d;best=m}}return best}
function setMobAggro(m,seconds=6){if(m.hostile)m.aggro=Math.max(m.aggro||0,seconds)}
function breakInfo(o){
 if(!o)return null;
 if(o.type==="tree")return{need:"axe",hits:Math.max(2,6-toolPower("axe")),drop:"log",n:o.kind==="pine"?3:4,source:"tree"};
 if(o.type==="rock"||o.type==="caveRock"||o.type==="ashRock")return{need:"pick",hits:Math.max(2,7-toolPower("pick")),drop:"stone",n:3,source:o.type};
 if(o.type==="ironNode")return{need:"pick",tier:2,hits:Math.max(2,7-toolPower("pick")),drop:"ironOre",n:2,source:o.type};
 if(o.type==="coalNode")return{need:"pick",hits:Math.max(2,6-toolPower("pick")),drop:"charcoal",n:2,source:o.type};
 if(o.type==="volcanicNode")return{need:"pick",tier:2,hits:Math.max(2,8-toolPower("pick")),drop:"volcanicStone",n:2,source:o.type};
 if(o.type==="crimsonCrystalNode")return{need:"pick",tier:2,hits:Math.max(2,8-toolPower("pick")),drop:"crimsonCrystal",n:2,source:o.type};
 if(o.type==="emberTree")return{need:"axe",hits:Math.max(2,7-toolPower("axe")),drop:"log",n:3,source:o.type};
 const placedDrops={
   woodWall:"woodWall",stoneWall:"stoneWall",glassWall:"glassWall",abyssBlock:"abyssBlock",
   doorClosed:"door",doorOpen:"door",bubbleDoorClosed:"bubbleDoor",bubbleDoorOpen:"bubbleDoor",
   craftingTable:"craftingTable",furnace:"furnace",chest:"chest",bed:"bed",torch:"torch",marker:"marker",woodFloor:"woodFloor",stoneFloor:"stoneFloor",fence:"fence",gateClosed:"gate",gateOpen:"gate",roofTile:"roofTile",farmland:"stone"
 };
 if(placedDrops[o.type]||o.generated){
   const woodish=["woodWall","woodFloor","fence","gateClosed","gateOpen","roofTile","doorClosed","doorOpen","bubbleDoorClosed","bubbleDoorOpen","craftingTable","chest","bed","marker","tent","campfire"].includes(o.type);
   const need=woodish?"axe":"pick";
   const fallback=o.type==="stoneWall"?"stoneWall":o.type==="glassWall"?"glassWall":o.type==="abyssBlock"?"abyssBlock":o.type==="furnace"?"furnace":o.type==="chest"?"chest":o.type==="bed"?"bed":o.type==="marker"?"marker":o.type==="torch"?"torch":o.type==="woodFloor"?"woodFloor":o.type==="stoneFloor"?"stoneFloor":o.type==="fence"?"fence":o.type.startsWith("gate")?"gate":o.type==="roofTile"?"roofTile":o.type.includes("Door")||o.type.startsWith("door")?"door":"woodWall";
   return{need,hits:Math.max(2,5-toolPower(need)),drop:placedDrops[o.type]||fallback,n:1,source:o.generated?"structure":o.type,placed:true};
 }
 return null;
}
function removeMarkerByWorldPos(x,y){
 const before=state.markers?.length||0;
 state.markers=(state.markers||[]).filter(m=>!(m.layer===layerKey()&&m.x===x&&m.y===y));
 if(before!==state.markers.length&&state.activeMarkerId&&!state.markers.some(m=>m.id===state.activeMarkerId))state.activeMarkerId=null;
}
function attack(){
 if(state.downed)return;const now=performance.now();if(now-lastAttack<310)return;lastAttack=now;haptic(10);const it=selectedDef();
 if(it&&it.tool==="bow"){shootBow(it);return}

 const target=nearestMob(1.5);
 if(target){const damage=it&&it.damage?it.damage:4;setMobAggro(target,8);if(gameMode==="duo"&&!online.isHost)online.sendAction({type:"hitMob",id:target.id,damage});else damageMob(target,damage,"local");return}

 const no=nearestObject(1.55,o=>!!breakInfo(o));
 if(no){
   const bi=breakInfo(no.o);
   if(bi.tier&&toolPower(bi.need)<bi.tier){briefError(bi.need==="pick"?"Necesitas pico de piedra o hierro.":"Necesitas una herramienta mejor.");return}
   if(bi.need&&toolPower(bi.need)===0){briefError(bi.need==="axe"?"Usa un hacha.":"Usa un pico.");return}
   if(no.o.type==="chest"){
     const contents=chestMod(no.x,no.y).chest||{};
     if(Object.values(contents).some(n=>n>0)){briefError("Vacía el cofre antes de romperlo.");return}
   }
   const key=modKey(no.x,no.y);resourceDamage[key]=(resourceDamage[key]||0)+1;
   tone(115+resourceDamage[key]*14,.035,.012);spawnParticles(no.x+.5,no.y+.5,bi.need==="axe"?"wood":"stone",3);
   if(resourceDamage[key]>=bi.hits){
     delete resourceDamage[key];
     setModAt(no.x,no.y,{removed:true,removedAt:Date.now(),removedWorldTime:worldTime,source:bi.source});
     if(no.o.type==="marker")removeMarkerByWorldPos(no.x,no.y);
     if(no.o.type==="bed"&&state.spawn&&state.spawn.bedX===no.x&&state.spawn.bedY===no.y)state.spawn={x:SPAWN_X+.5,y:SPAWN_Y+.5,layer:"surface"};
     addItem(bi.drop,bi.n);
     spawnParticles(no.x+.5,no.y+.5,bi.need==="axe"?"wood":"stone",10);
     if(no.o.type==="tree"){state.stats.treesCut=(state.stats.treesCut||0)+1;unlockAchievement("firstTree");if(Math.random()<.42)addItem("seeds",1,true)}
   }
   return;
 }

 // Arena de playa: se recoge directamente al picar el bloque frente al jugador.
 const q=frontTile();
 if(layer==="surface"&&surfaceTerrainAt(q.x,q.y)==="sand"&&toolPower("pick")>0){
   const key=`sand:${q.x}:${q.y}`;resourceDamage[key]=(resourceDamage[key]||0)+1;
   if(resourceDamage[key]>=3){resourceDamage[key]=0;addItem("sand",2);tone(160,.04,.012);toast("+2 Arena",550)}
 }
}
function shootBow(it){if((state.inventory.arrow||0)<=0){briefError("No tienes flechas.");return}removeItem("arrow",1);const dx=state.dirX||0,dy=state.dirY||1;projectiles.push({type:"arrow",x:state.x,y:state.y,vx:dx*8,vy:dy*8,life:2.4,damage:it.damage,owner:"player",layer:layerKey()});tone(520,.035,.015)}
function canOpenPrivateDoor(o){
 if(!o?.privateDoor)return true;
 if(gameMode==="solo")return true;
 const me=online.uid||null,partner=partnerProfile?.uid||online.partnerUid||null;
 return !o.ownerUid||o.ownerUid===me||o.ownerUid===partner;
}
function useAction(){
 const now=performance.now();if(now-lastUse<240)return;lastUse=now;haptic(12);
 if(state.downed)return;
 if(gameMode==="duo"&&remotePlayer?.downed&&remotePlayer.layer===layerKey()&&Math.hypot(remotePlayer.x-state.x,remotePlayer.y-state.y)<1.8){online.sendAction({type:"revive"});unlockAchievement("rescuer");toast("💜 Estás ayudando a tu persona…",900);return}
 if(fishing?.done){resolveFishing();return}
 const it=selectedDef();
 const q=frontTile(),qo=staticObjectAt(q.x,q.y),qt=terrainAt(q.x,q.y);
 if(it?.tool==="hoe"&&layer==="surface"&&!qo&&["grass","darkGrass"].includes(qt)){setModAt(q.x,q.y,{place:"farmland",tilledAt:worldTime});tone(185,.04,.014);spawnParticles(q.x+.5,q.y+.5,"stone",4);toast("🪏 Tierra preparada.",600);return}
 if(it?.seed&&qo?.type==="farmland"&&layer==="surface"){if(!removeItem(selectedItem(),1))return;setModAt(q.x,q.y,{place:it.seed,plantedAt:worldTime,seedItem:selectedItem()});toast("🌱 Plantado.",550);return}
 if(qo&&["cropWheat","cropCarrot","cropPotato"].includes(qo.type)){if(cropGrowth(qo)>=1){harvestCrop(q.x,q.y,qo);return}else{toast(`🌱 Creciendo · ${Math.floor(cropGrowth(qo)*100)}%`,650);return}}
 const nearAnimal=nearestMob(1.55);if(nearAnimal?.animal&&selectedItem()==="wheat"&&nearAnimal.breedCd<=0){if(removeItem("wheat",1)){breedAnimal(nearAnimal);return}}

 if(it&&(it.food||it.heal||it.teleport)){useInventoryItem(selectedItem());return}
 if(it&&it.tool==="rod"){tryFish();return}
 if(it?.portalActivator){if(tryActivatePortal())return}

 const no=nearestObject(1.7);
 if(no){
   if(no.o.type==="cave"&&layer==="surface"){enterCave(no.x,no.y);return}
   if(no.o.type==="caveExit"){exitCave();return}
   if(no.o.type==="portal"||no.o.type==="portalReturn"){enterOrExitAbyss(no);return}
   if(["gateClosed","gateOpen"].includes(no.o.type)){const open=no.o.type==="gateClosed";setModAt(no.x,no.y,{...no.o,place:open?"gateOpen":"gateClosed",open});tone(245,.04,.014);return}
   if(["doorClosed","doorOpen","bubbleDoorClosed","bubbleDoorOpen"].includes(no.o.type)){
     if(!canOpenPrivateDoor(no.o)){briefError("Esta puerta pertenece a la Burbuja de otra pareja.");return}
     const isBubble=no.o.type.startsWith("bubbleDoor"),open=no.o.type.endsWith("Closed");
     setModAt(no.x,no.y,{...no.o,place:isBubble?(open?"bubbleDoorOpen":"bubbleDoorClosed"):(open?"doorOpen":"doorClosed"),open,generated:false});
     tone(240,.04,.014);return
   }
   if(no.o.type==="furnace"){showModal("furnaceModal");renderFurnace();return}
   if(no.o.type==="chest"){openChest(no.x,no.y);return}
   if(no.o.type==="bed"){useBed(no.x,no.y);return}
   if(no.o.type==="marker"){followWorldMarker(no.x,no.y,no.o);return}
 }
 if(it&&it.place){placeSelected(it.place,selectedItem());return}
}
function placeAction(){
 const it=selectedDef();if(!it?.place){briefError("Selecciona un bloque u objeto colocable.");return}
 placeSelected(it.place,selectedItem());
}
function placeSelected(place,id){
 const ps=placementStatus();if(!ps||ps.id!==id){briefError("Mira hacia el lugar donde quieres colocarlo.");return}
 if(!ps.valid){briefError("No puedes colocar eso ahí.");return}
 if(place==="marker"){
   if((state.markers||[]).length>=3){briefError("Ya tienes 3 marcadores. Elimina uno desde el mapa.");return}
   pendingMarkerPlacement={x:ps.x,y:ps.y,id};
   markerPreset={icon:"🏠",label:"Casa"};$("markerNameInput").value="";
   document.querySelectorAll(".marker-presets button").forEach((b,i)=>b.classList.toggle("selected",i===0));
   showModal("markerModal");return
 }
 if(!removeItem(id,1))return;
 const val={place,open:false,ownerUid:online.uid||"solo"};
 if(place==="chest")val.chest={};
 if(place==="bubbleDoorClosed")val.privateDoor=true;
 setModAt(ps.x,ps.y,val);
 buildCount++;state.stats.blocksPlaced=(state.stats.blocksPlaced||0)+1;if(state.stats.blocksPlaced>=50)unlockAchievement("architect");
 if(place==="craftingTable")unlockAchievement("craftingTable");
 if(place==="chest")unlockAchievement("chest");
 if(buildCount>=12&&Object.values(mods).some(m=>["doorClosed","doorOpen","bubbleDoorClosed","bubbleDoorOpen"].includes(m.place)))unlockAchievement("shelter");
 tone(180,.04,.014);spawnParticles(ps.x+.5,ps.y+.5,"build",8)
}
function useBed(x,y){
 state.spawn={x:state.x,y:state.y,layer:"surface",bedX:x,bedY:y};
 state.sleepAt=Date.now();unlockAchievement("homeBed");
 toast("🛏️ Punto de aparición establecido.",1000);
 if(!isNightTime())return;
 if(gameMode==="solo"){
   const cycle=Math.floor(worldTime/480);worldTime=cycle*480+480*.18;state.health=Math.min(100,state.health+20);toast("Dormiste hasta la mañana.",1000)
 }else{
   toast("Esperando a que tu persona use una cama…",1300)
 }
}
function cropGrowth(o){return Math.max(0,Math.min(1,(worldTime-(o.plantedAt||worldTime))/170))}
function harvestCrop(x,y,o){const type=o.type;let drops={};if(type==="cropWheat")drops={wheat:2+((Math.random()*2)|0),seeds:1+((Math.random()*2)|0)};if(type==="cropCarrot")drops={carrot:2+((Math.random()*3)|0)};if(type==="cropPotato")drops={potato:2+((Math.random()*3)|0)};for(const[id,n]of Object.entries(drops))addItem(id,n,true);setModAt(x,y,{place:"farmland",tilledAt:worldTime});state.stats.harvests=(state.stats.harvests||0)+1;unlockAchievement("farmer");toast("🌾 Cosecha recogida.",700);tone(530,.05,.014);haptic(16)}
function breedAnimal(m){m.breedCd=70;const a=Math.random()*Math.PI*2,nm=mobTemplate(m.type,m.x+Math.cos(a)*.9,m.y+Math.sin(a)*.9);nm.babyUntil=worldTime+120;nm.breedCd=70;mobs.push(nm);state.stats.animalsBred=(state.stats.animalsBred||0)+1;unlockAchievement("breeder");toast("💞 Nació una nueva criatura.",850);haptic([20,40,20])}
function markerLabelFromObject(o){return{o:o,icon:o.markerIcon||"🚩",label:o.markerLabel||"Marcador"}}
function followWorldMarker(x,y,o){
 const info=markerLabelFromObject(o),id=o.markerId||`${layerKey()}:${x}:${y}`;
 let marker=(state.markers||[]).find(m=>m.id===id);
 if(!marker){
   if((state.markers||[]).length>=3){briefError("Tus 3 marcadores ya están ocupados.");return}
   marker={id,x,y,layer:layerKey(),icon:info.icon,label:info.label};state.markers.push(marker)
 }
 state.activeMarkerId=id;toast(`Siguiendo: ${marker.icon} ${marker.label}`,850);updateWaypoint()
}
function savePendingMarker(){
 if(!pendingMarkerPlacement)return;
 const custom=$("markerNameInput").value.trim(),label=(custom||markerPreset.label||"Marcador").slice(0,18),icon=markerPreset.icon||"🚩";
 if(!removeItem(pendingMarkerPlacement.id,1)){pendingMarkerPlacement=null;hideModal("markerModal");return}
 const markerId=`m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
 const val={place:"marker",markerId,markerLabel:label,markerIcon:icon,ownerUid:online.uid||"solo"};
 setModAt(pendingMarkerPlacement.x,pendingMarkerPlacement.y,val);
 state.markers=state.markers||[];
 state.markers.push({id:markerId,x:pendingMarkerPlacement.x,y:pendingMarkerPlacement.y,layer:layerKey(),label,icon});
 state.activeMarkerId=markerId;pendingMarkerPlacement=null;
 unlockAchievement("waypoint");hideModal("markerModal");toast(`${icon} ${label} guardado.`,900);updateWaypoint()
}
function cancelMarkerPlacement(){pendingMarkerPlacement=null;hideModal("markerModal")}
function activeMarker(){return(state.markers||[]).find(m=>m.id===state.activeMarkerId)||null}
function directionArrow(dx,dy){
 const a=Math.atan2(dy,dx),idx=Math.round(a/(Math.PI/4));
 return(["→","↘","↓","↙","←","↖","↑","↗"][(idx+8)%8])||"↑";
}
function updateWaypoint(){
 const m=activeMarker();
 if(!m){ui.waypointHud?.classList.remove("show");return}
 ui.waypointHud?.classList.add("show");ui.waypointIcon.textContent=m.icon||"🚩";ui.waypointName.textContent=m.label||"Marcador";
 if(m.layer!==layerKey()){ui.waypointDistance.textContent=m.layer==="surface"?"En la superficie":"En otra zona";ui.waypointArrow.textContent="↥";return}
 const dx=m.x+.5-state.x,dy=m.y+.5-state.y,d=Math.round(Math.hypot(dx,dy));
 ui.waypointDistance.textContent=`${d} m`;ui.waypointArrow.textContent=directionArrow(dx,dy)
}
function frameMatches(ox,oy,w,h){
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
   const border=xx===0||yy===0||xx===w-1||yy===h-1,o=staticObjectAt(ox+xx,oy+yy);
   if(border&&o?.type!=="abyssBlock")return false;
   if(!border&&o&&o.type!=="portal")return false;
 }
 return true;
}
function findPortalFrameNear(){
 if(layer!=="surface")return null;
 const px=Math.floor(state.x),py=Math.floor(state.y);
 for(const [w,h] of [[4,5],[5,4]]){
   for(let oy=py-h;oy<=py+1;oy++)for(let ox=px-w;ox<=px+1;ox++){
     const cx=ox+(w-1)/2,cy=oy+(h-1)/2;
     if(Math.hypot(cx-state.x,cy-state.y)>4.2)continue;
     if(frameMatches(ox,oy,w,h))return{ox,oy,w,h}
   }
 }
 return null;
}
function tryActivatePortal(){
 const f=findPortalFrameNear();
 if(!f){briefError("Construye un marco completo de 4×5 con Bloques del Abismo.");return false}
 if(!removeItem("emberCore",1))return false;
 const portalId=`p_${Date.now()}`;
 for(let yy=1;yy<f.h-1;yy++)for(let xx=1;xx<f.w-1;xx++)setModAt(f.ox+xx,f.oy+yy,{place:"portal",portalId,returnX:state.x,returnY:state.y});
 state.portals=state.portals||[];state.portals.push({x:f.ox+Math.floor(f.w/2),y:f.oy+Math.floor(f.h/2),layer:"surface"});toast("❤️‍🔥 El portal al Abismo Carmesí está activo.",1500);tone(95,.35,.03);haptic([25,40,25]);return true
}
function enterOrExitAbyss(no){
 if(no.o.type==="portalReturn"){
   layer="surface";caveId=null;remoteMods={};const r=state.abyssReturn||{x:SPAWN_X+.5,y:SPAWN_Y+.5};state.x=r.x;state.y=r.y;mobs=[];projectiles=[];updateWorldLabel();toast("Regresaste a la superficie.",900);return
 }
 if(layer!=="surface")return;
 state.abyssReturn={x:state.x,y:state.y};layer="abyss";caveId=null;remoteMods={};state.x=.5;state.y=2.5;mobs=[];projectiles=[];unlockAchievement("abyss");updateWorldLabel();toast("Entraste al Abismo Carmesí.",1100)
}
function nearWater(){for(let y=Math.floor(state.y-1.8);y<=Math.ceil(state.y+1.8);y++)for(let x=Math.floor(state.x-1.8);x<=Math.ceil(state.x+1.8);x++)if(terrainAt(x,y)==="water")return{x,y};return null}
function tryFish(){if(fishing){briefError("La línea ya está en el agua.");return}const w=nearWater();if(!w){briefError("Acércate al agua.");return}fishing={start:performance.now(),biteAt:performance.now()+2600+Math.random()*3600,done:false,x:w.x+.5,y:w.y+.5};tone(410,.04,.014)}
function updateFishing(){if(!fishing)return;const now=performance.now();if(now>fishing.biteAt&&!fishing.done){fishing.done=true;toast("¡PICÓ! Pulsa USAR.",1300);tone(760,.07,.025)}if(now-fishing.start>11000){fishing=null}}
function resolveFishing(){if(!fishing?.done)return;const r=Math.random();let label="Pescado";if(r<.055){addItem("pearl",1);label="🫧 ¡Perla de Burbuja!"}else if(r<.23){addItem("blueFish",1);label="🐠 Pez azul"}else{addItem("fish",1+((Math.random()*2)|0));label="🐟 Pescado"}fishing=null;state.stats.fishCaught=(state.stats.fishCaught||0)+1;unlockAchievement("fisher");toast(label,800);tone(620,.06,.02);haptic([15,30,15])}
function enterCave(x,y){state.visitedCaves=state.visitedCaves||[];if(!state.visitedCaves.some(c=>c.x===x&&c.y===y))state.visitedCaves.push({x,y});caveId=((Math.imul(x,73856093)^Math.imul(y,19349663)^worldSeed)>>>0);surfaceReturn={x:state.x,y:state.y};layer="cave";remoteMods={};const c=buildCave(caveId);state.x=c.cx+.5;state.y=c.cy+3.5;mobs=[];projectiles=[];unlockAchievement("cave");updateWorldLabel();toast("Entraste a una cueva.",900)}
function exitCave(){layer="surface";caveId=null;remoteMods={};if(surfaceReturn){state.x=surfaceReturn.x;state.y=surfaceReturn.y}mobs=[];projectiles=[];updateWorldLabel()}
function nearStation(type,range=2.15){return!!nearestObject(range,o=>o.type===type)}
function craft(r){if(r.table&&!nearStation("craftingTable")){briefError("Necesitas una mesa de crafteo cerca.");return}if(!hasItems(r.in)){briefError("Faltan materiales.");return}consumeItems(r.in);addItem(r.out,r.n);state.stats.crafts=(state.stats.crafts||0)+1;unlockAchievement("firstCraft");if(r.out.startsWith("iron")&&["ironSword","ironAxe","ironPick","ironBow"].includes(r.out)){state.tier=3;unlockAchievement("ironAge")}else if(r.out.startsWith("stone")&&state.tier<2)state.tier=2;renderRecipes();updateMenuStats();tone(610,.055,.018)}
function smelt(r){
 if(!nearStation("furnace")){briefError("Acércate al horno.");return}
 if(r.in==="log"){
   if((state.inventory.log||0)<2){briefError("Necesitas 2 troncos: uno se convierte y otro sirve de combustible.");return}
   removeItem("log",2)
 }else{
   if((state.inventory[r.in]||0)<1||(state.inventory.log||0)<1){briefError("Necesitas el ingrediente y 1 tronco de combustible.");return}
   removeItem(r.in,1);removeItem("log",1)
 }
 addItem(r.out,r.n);renderFurnace();renderRecipes();tone(260,.10,.018)
}

function generatedLoot(x,y){
 const o=structureObjectAt(x,y);if(!o?.generated||o.type!=="chest")return{};
 const s=(hash2(x*31,y*37,worldSeed^0xC0FFEE)*1000)|0,loot={};
 loot.log=2+(s%4);loot.stone=2+((s>>2)%5);
 if(s%3===0)loot.ironOre=1+(s%2);if(s%4===0)loot.rawBeef=1;if(s%5===0)loot.charcoal=2;if(s%6===0)loot.seeds=2+(s%3);if(s%9===0)loot.carrot=1;if(s%11===0)loot.potato=1;if(s%17===0)loot.pearl=1;
 return loot
}
function chestMod(x,y){
 const m=getMod(modKey(x,y));if(m)return m;
 const loot=generatedLoot(x,y);return{place:"chest",chest:loot}
}
function openChest(x,y){
 activeChest={x,y};
 if(!getMod(modKey(x,y))){const o=structureObjectAt(x,y);if(o?.type==="chest")setModAt(x,y,{place:"chest",chest:generatedLoot(x,y),generatedClaimed:true})}
 showModal("chestModal");renderChest()
}
function writeChest(contents){if(!activeChest)return;const old=chestMod(activeChest.x,activeChest.y);setModAt(activeChest.x,activeChest.y,{...old,place:"chest",chest:contents});renderChest()}
function chestContents(){return activeChest?(chestMod(activeChest.x,activeChest.y).chest||{}):{}}
function depositToChest(id){if(!activeChest||(state.inventory[id]||0)<=0)return;const c={...chestContents()},n=state.inventory[id];c[id]=(c[id]||0)+n;removeItem(id,n);writeChest(c)}
function withdrawFromChest(id){if(!activeChest)return;const c={...chestContents()},n=c[id]||0;if(n<=0)return;if(!addItem(id,n))return;delete c[id];writeChest(c)}

function mobTemplate(type,x,y,id){
 const base={id:id||`${type}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,type,x,y,layer:layerKey(),dead:false,hit:0,attackCd:0,aggro:0,ai:Math.random()*10,homeX:x,homeY:y,breedCd:0};
 if(type==="cow")return{...base,hp:32,maxHp:32,speed:.52,animal:true};if(type==="sheep")return{...base,hp:26,maxHp:26,speed:.58,animal:true};if(type==="pig")return{...base,hp:28,maxHp:28,speed:.62,animal:true};if(type==="chicken")return{...base,hp:18,maxHp:18,speed:.76,animal:true};
 if(type==="zombie")return{...base,hp:42,maxHp:42,speed:.90,hostile:true,vision:4.7,leash:8.0};if(type==="spider")return{...base,hp:30,maxHp:30,speed:1.20,hostile:true,vision:4.2,leash:7.2};if(type==="skeleton")return{...base,hp:34,maxHp:34,speed:.82,hostile:true,vision:5.3,leash:8.5,shootCd:1+Math.random()*1.5};if(type==="void")return{...base,hp:55,maxHp:55,speed:1.05,hostile:true,vision:1.75,leash:5.8,teleportCd:3+Math.random()*4,passive:true};if(type==="crimson")return{...base,hp:48,maxHp:48,speed:1.18,hostile:true,vision:4.8,leash:8.2};if(type==="abyssGuardian")return{...base,hp:150,maxHp:150,speed:.74,hostile:true,vision:6.2,leash:12,boss:true};return base;
}
function counts(){let animals=0,hostiles=0;for(const m of mobs){if(m.dead||m.layer!==layerKey())continue;if(m.animal)animals++;if(m.hostile)hostiles++}return{animals,hostiles,total:animals+hostiles}}
function spawnMobs(dt){
 spawnTimer-=dt;if(spawnTimer>0)return;spawnTimer=2.2+Math.random()*1.2;if(gameMode==="duo"&&!online.isHost)return;
 const c=counts(),underground=layer!=="surface",night=isNightTime();if(c.total>11)return;
 let type=null;if(layer==="abyss"){if(c.hostiles>=7)return;const r=Math.random();type=(Math.hypot(state.x,state.y)>32&&r>.94)?"abyssGuardian":r<.48?"crimson":r<.78?"skeleton":"void"}else if(underground){if(c.hostiles>=6)return;const r=Math.random();type=r<.36?"zombie":r<.66?"spider":r<.88?"skeleton":"void"}
 else if(night){if(c.hostiles>=(isCrimsonNight()?7:5))return;const r=Math.random();type=r<.38?"zombie":r<.66?"spider":r<.88?"skeleton":"void"}
 else{if(c.animals>=7)return;const r=Math.random();type=r<.28?"cow":r<.52?"sheep":r<.77?"pig":"chicken"}
 let focus={x:state.x,y:state.y};if(gameMode==="duo"&&remotePlayer&&remotePlayer.layer===layerKey()&&Math.random()<.45)focus={x:remotePlayer.x,y:remotePlayer.y};
 for(let tries=0;tries<8;tries++){
   const a=Math.random()*Math.PI*2,d=8+Math.random()*7,x=focus.x+Math.cos(a)*d,y=focus.y+Math.sin(a)*d,t=terrainAt(x,y);
   if(!collisionAt(x,y)&&t!=="water"&&t!=="lava"&&t!=="caveWall"){mobs.push(mobTemplate(type,x,y));break}
 }
}
function isNightTime(){const p=(worldTime%480)/480;return p>.70||p<.12}
function moveMob(m,dx,dy){const t1=terrainAt(m.x+dx,m.y),t2=terrainAt(m.x,m.y+dy);if(!collisionAt(m.x+dx,m.y)&&t1!=="water"&&t1!=="lava")m.x+=dx;if(!collisionAt(m.x,m.y+dy)&&t2!=="water"&&t2!=="lava")m.y+=dy}
function targetForMob(m){let t={x:state.x,y:state.y,local:true,d:Math.hypot(state.x-m.x,state.y-m.y)};if(gameMode==="duo"&&remotePlayer&&remotePlayer.layer===m.layer){const d=Math.hypot(remotePlayer.x-m.x,remotePlayer.y-m.y);if(d<t.d)t={x:remotePlayer.x,y:remotePlayer.y,local:false,d}}return t}
function updateMobs(dt){
 if(gameMode==="duo"&&!online.isHost)return;
 for(const m of mobs){
   if(m.dead||m.layer!==layerKey())continue;m.hit=Math.max(0,m.hit-dt);m.breedCd=Math.max(0,(m.breedCd||0)-dt);m.attackCd=Math.max(0,m.attackCd-dt);m.aggro=Math.max(0,(m.aggro||0)-dt);m.ai+=dt;
   if(m.animal){if(!m.wander||Math.floor(m.ai*1.1)%5===0){const a=Math.random()*Math.PI*2;m.wander={x:Math.cos(a),y:Math.sin(a)}}moveMob(m,m.wander.x*m.speed*dt*.42,m.wander.y*m.speed*dt*.42);continue}
   const t=targetForMob(m);
   if(t.d<=m.vision)m.aggro=Math.max(m.aggro||0,m.passive?3.5:2.5);
   if(t.d>m.leash){m.aggro=0;continue}
   if((m.aggro||0)<=0)continue;
   if(m.type==="skeleton"){
     m.shootCd-=dt;if(t.d<5.6&&t.d>2.8){if(m.shootCd<=0){shootSkeleton(m,t);m.shootCd=2.1+Math.random()*.9}const vx=m.x-t.x,vy=m.y-t.y,l=Math.hypot(vx,vy)||1;moveMob(m,vx/l*m.speed*dt*.35,vy/l*m.speed*dt*.35)}
     else chaseMob(m,t,dt);
   }else{
     if(m.type==="void"){m.teleportCd-=dt;if(m.teleportCd<=0&&t.d<4.8){const a=Math.random()*Math.PI*2,d=2.2+Math.random()*2,nx=t.x+Math.cos(a)*d,ny=t.y+Math.sin(a)*d;if(!collisionAt(nx,ny)&&!["water","lava"].includes(terrainAt(nx,ny))){m.x=nx;m.y=ny;spawnParticles(nx,ny,"void",8)}m.teleportCd=4+Math.random()*4}}
     chaseMob(m,t,dt);
   }
   if(t.d<.72&&m.attackCd<=0){const dmg=m.type==="spider"?8:m.type==="void"?13:m.type==="skeleton"?7:10;if(t.local)damagePlayer(dmg);else if(gameMode==="duo"&&online.isHost)online.sendAction({type:"damagePlayer",damage:dmg});m.attackCd=1.05}
 }
 const foci=[{x:state.x,y:state.y}];if(remotePlayer&&remotePlayer.layer===layerKey())foci.push(remotePlayer);
 mobs=mobs.filter(m=>!m.dead&&m.layer===layerKey()&&Math.min(...foci.map(f=>Math.hypot(m.x-f.x,m.y-f.y)))<23);
}
function chaseMob(m,t,dt){const dx=t.x-m.x,dy=t.y-m.y,l=Math.hypot(dx,dy)||1;moveMob(m,dx/l*m.speed*dt,dy/l*m.speed*dt)}
function shootSkeleton(m,t){const dx=t.x-m.x,dy=t.y-m.y,l=Math.hypot(dx,dy)||1;projectiles.push({type:"boneArrow",x:m.x,y:m.y,vx:dx/l*5.4,vy:dy/l*5.4,life:2.2,damage:8,owner:"mob",layer:m.layer});tone(175,.03,.01)}
function damageMob(m,dmg,killer="local"){m.hp-=dmg;m.hit=.14;setMobAggro(m,8);tone(140,.04,.013);if(m.hp<=0)killMob(m,killer)}
function killMob(m,killer="local"){
 m.dead=true;spawnParticles(m.x,m.y,m.type,10);const drops={};
 if(m.type==="cow"){drops.rawBeef=2;drops.leather=1}if(m.type==="pig")drops.rawPork=2;if(m.type==="sheep"){drops.rawMutton=1;drops.wool=1}if(m.type==="chicken"){drops.rawChicken=1;drops.feather=1}
 if(m.type==="zombie")drops.cloth=1;if(m.type==="spider")drops.string=1+((Math.random()*2)|0);if(m.type==="skeleton"){drops.bone=1;drops.arrow=2+((Math.random()*3)|0)}if(m.type==="void")drops.voidShard=1;if(m.type==="crimson"){drops.crimsonCrystal=1;if(Math.random()<.22)drops.voidShard=1}if(m.type==="abyssGuardian"){drops.crimsonCrystal=8;drops.voidShard=4;drops.emberCore=1}
 if(killer==="remote"&&gameMode==="duo"&&online.isHost)online.sendAction({type:"grant",items:drops,hostileKill:!!m.hostile});
 else{for(const[id,n]of Object.entries(drops))addItem(id,n,true);if(m.hostile){hostileKills++;state.stats.kills=(state.stats.kills||0)+1;if(hostileKills>=10)unlockAchievement("hunter")}}
}
function handleRemoteAction(a){
 if(!a)return;if(a.type==="hitMob"&&online.isHost){const m=mobs.find(x=>x.id===a.id);if(m)damageMob(m,Math.max(1,Math.min(40,a.damage||4)),"remote");return}
 if(a.type==="damagePlayer"&&!online.isHost){damagePlayer(Math.max(1,Math.min(30,a.damage||5)));return}
 if(a.type==="grant"&&!online.isHost){for(const[id,n]of Object.entries(a.items||{}))addItem(id,n,true);if(a.hostileKill){hostileKills++;if(hostileKills>=10)unlockAchievement("hunter")}return}
 if(a.type==="gift"){if(a.id&&ITEM[a.id]){addItem(a.id,Math.max(1,Math.min(20,a.n||1)),true);toast(`🎁 Recibiste ${ITEM[a.id].name}.`,1000);haptic([15,25,15])}return}
 if(a.type==="revive"){reviveSelf();return}
 if(a.type==="emote"){showRemoteEmote(a.emoji||"💜");return}
 if(a.type==="ping"){partnerPing={x:a.x,y:a.y,layer:a.layer,until:Date.now()+15000};toast("📍 Tu persona señaló un lugar.",900);return}
}
function updateProjectiles(dt){
 for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0||collisionAt(p.x,p.y)){p.dead=true;continue}
   if(p.owner==="player"){const m=mobs.find(m=>!m.dead&&m.layer===p.layer&&Math.hypot(m.x-p.x,m.y-p.y)<.44);if(m){setMobAggro(m,8);if(gameMode==="duo"&&!online.isHost)online.sendAction({type:"hitMob",id:m.id,damage:p.damage});else damageMob(m,p.damage,"local");p.dead=true}}
   else if(p.owner==="mob"&&p.layer===layerKey()){if(Math.hypot(state.x-p.x,state.y-p.y)<.42){damagePlayer(p.damage);p.dead=true}else if(gameMode==="duo"&&online.isHost&&remotePlayer&&remotePlayer.layer===p.layer&&Math.hypot(remotePlayer.x-p.x,remotePlayer.y-p.y)<.42){online.sendAction({type:"damagePlayer",damage:p.damage});p.dead=true}}
 }projectiles=projectiles.filter(p=>!p.dead)
}
function damagePlayer(n){if(state.downed)return;const armor=ITEM[state.armor]?.armor||0;n=Math.max(1,n*(1-armor));state.health=Math.max(0,state.health-n);tone(78,.08,.022);haptic(24);if(state.health<=0){if(gameMode==="duo"&&remotePlayer&&remotePlayer.layer===layerKey()){state.health=1;state.downed=true;state.downUntil=Date.now()+12000;toast("💔 Tu persona puede revivirte.",1200)}else respawnPlayer()}updateHud()}
function updateDowned(){if(!state.downed){ui.downedOverlay?.classList.remove("show");return}const left=Math.max(0,Math.ceil((state.downUntil-Date.now())/1000));ui.downedOverlay?.classList.add("show");if(ui.downedTimer)ui.downedTimer.textContent=left;if(left<=0)respawnPlayer()}
function reviveSelf(){if(!state.downed)return;state.downed=false;state.downUntil=0;state.health=55;ui.downedOverlay?.classList.remove("show");toast("💜 Tu persona te revivió.",1200);haptic([25,40,25])}
function respawnPlayer(){
 state.stats.deaths=(state.stats.deaths||0)+1;state.downed=false;state.downUntil=0;state.health=100;state.hunger=Math.max(50,state.hunger);layer="surface";caveId=null;remoteMods={};
 const sp=state.spawn||{x:SPAWN_X+.5,y:SPAWN_Y+.5};state.x=sp.x;state.y=sp.y;mobs=[];projectiles=[];ui.downedOverlay?.classList.remove("show");
 toast(state.spawn?"Reapareciste en tu cama con todo tu inventario.":"Reapareciste en el origen con todo tu inventario.",1100)
}
function updateNeeds(dt){
 const t=terrainAt(state.x,state.y),swim=t==="water";
 state.hunger=Math.max(0,state.hunger-dt*(swim?.16:.09));
 if(t==="lava"){
   state.health=Math.max(0,state.health-dt*18);
   if(performance.now()-lastLavaWarn>1800){lastLavaWarn=performance.now();toast("🔥 ¡La lava quema!",700);tone(72,.08,.02)}
 }
 if(state.hunger<=0)state.health=Math.max(0,state.health-dt*1.2);
 else if(state.hunger>75&&state.health<100&&t!=="lava")state.health=Math.min(100,state.health+dt*.34);
 if(state.health<=0)respawnPlayer()
}
function updateDay(dt){
 const prev=Math.floor(worldTime/480);
 if(gameMode==="duo"&&!online.isHost&&online.world&&typeof online.world.worldTime==="number")worldTime=online.world.worldTime;else worldTime+=dt;
 if(gameMode==="duo"&&online.isHost&&isNightTime()&&Date.now()-(state.sleepAt||0)<9000&&remotePlayer&&Date.now()-(remotePlayer.sleepAt||0)<9000){
   const cycle=Math.floor(worldTime/480);worldTime=cycle*480+480*.18;state.sleepAt=0;toast("💜🩷 Durmieron juntos hasta la mañana.",1200)
 }
 const now=Math.floor(worldTime/480);days=now;if(now>prev&&now>=1){unlockAchievement("firstNight");if(((prev+1)%6===0))unlockAchievement("crimsonNight")}
}
function timeString(){const p=(worldTime%480)/480,mins=Math.floor((p*24*60+6*60)%(24*60));return`${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`}

function updateContextHint(){
 let text="";if(gameMode==="duo"&&remotePlayer?.downed&&remotePlayer.layer===layerKey()&&Math.hypot(remotePlayer.x-state.x,remotePlayer.y-state.y)<1.8)text="💜 USAR · Revivir a tu persona";const no=nearestObject(1.7);
 if(no){
   const t=no.o.type;
   if(t==="tree"||t==="emberTree")text=`🪓 Hacha · Cortar ${no.o.kind==="pine"?"pino":no.o.kind==="birch"?"abedul":"árbol"}`;
   else if(["rock","caveRock","ashRock"].includes(t))text="⛏️ Pico · Picar piedra";
   else if(t==="ironNode")text="⛏️ Pico de piedra/hierro · Extraer hierro";
   else if(t==="coalNode")text="⛏️ Pico · Extraer carbón";
   else if(t==="volcanicNode")text="⛏️ Pico de piedra/hierro · Roca volcánica";
   else if(t==="crimsonCrystalNode")text="⛏️ Pico de piedra/hierro · Cristal carmesí";
   else if(t==="cave")text="✦ USAR · Entrar a cueva";
   else if(t==="caveExit")text="✦ USAR · Salir";
   else if(t==="portal"||t==="portalReturn")text="❤️‍🔥 USAR · Atravesar portal";
   else if(t==="craftingTable")text="🛠️ Abre inventario · Crafteo avanzado";
   else if(t==="furnace")text="🔥 USAR · Abrir horno";
   else if(t==="chest")text="📦 USAR · Abrir cofre";
   else if(t==="bed")text="🛏️ USAR · Guardar spawn / dormir";
   else if(t==="farmland")text=selectedDef()?.seed?"🌱 USAR · Plantar":"🪏 Tierra preparada";
   else if(["cropWheat","cropCarrot","cropPotato"].includes(t))text=cropGrowth(no.o)>=1?"🌾 USAR · Cosechar":"🌱 Cultivo creciendo";
   else if(t==="marker")text=`${no.o.markerIcon||"🚩"} USAR · Seguir ${no.o.markerLabel||"marcador"}`;
   else if(["doorClosed","doorOpen"].includes(t))text="🚪 USAR · Abrir/cerrar";
   else if(["bubbleDoorClosed","bubbleDoorOpen"].includes(t))text="💜🚪 Puerta de Burbuja · USAR";
 }
 const ps=placementStatus();
 if(!text&&ps)text=ps.valid?`▣ COLOCAR · ${ps.it.name}`:`▣ ${ps.it.name} · lugar ocupado`;
 if(!text){const m=nearestMob(2.0);if(m)text=m.type==="void"?"🟪 Espada/Arco · No atacará si mantienes distancia":"⚔️ Espada · 🏹 Arco a distancia"}
 ui.hint.textContent=text;ui.hint.classList.toggle("show",!!text)
}
function updateHud(){
 ui.health.style.width=state.health+"%";ui.healthText.textContent=Math.ceil(state.health);
 ui.hunger.style.width=state.hunger+"%";ui.hungerText.textContent=Math.ceil(state.hunger);
 ui.points.textContent=state.burbujaPoints;ui.day.textContent="DÍA "+(Math.floor(worldTime/480)+1);ui.time.textContent=timeString();ui.clock.style.width=((worldTime%480)/480*100)+"%";
 updateWorldLabel();updatePartnerCard();updateContextHint();updateWaypoint();
 const pb=$("placeBtn"),it=selectedDef();if(pb)pb.classList.toggle("disabled",!it?.place)
}
function updateWorldLabel(){ui.world.textContent=biomeLabel()}
function updatePartnerCard(){if(gameMode!=="duo"){ui.partnerCard.classList.remove("show");$("duoQuickPanel")?.classList.remove("show");return}ui.partnerCard.classList.add("show");ui.partnerName.textContent=partnerProfile?.displayName||partnerProfile?.name||"Tu persona";ui.partnerDistance.textContent=remotePlayer&&remotePlayer.layer===layerKey()?(remotePlayer.downed?"💔 AYUDA":Math.round(Math.hypot(remotePlayer.x-state.x,remotePlayer.y-state.y))+" m"):"lejos"}

function updateHotbar(){
 ui.hotbar.innerHTML="";
 state.hotbar.forEach((id,i)=>{
   const b=document.createElement("button");b.className="hot-slot"+(i===selectedSlot?" selected":"");const count=id?(state.inventory[id]||0):0;
   b.innerHTML=`<span class="slot-key">${i+1}</span>${id?`<span class="item-icon">${ITEM[id]?.icon||"?"}</span><span class="item-count">${count}</span>`:""}`;
   b.onclick=()=>{selectedSlot=i;updateHotbar();renderEquipSlotPicker();updateHud()};ui.hotbar.appendChild(b)
 });
 const pb=$("placeBtn");if(pb)pb.classList.toggle("disabled",!selectedDef()?.place)
}
function updateInventoryUI(){if(!$("inventoryModal").classList.contains("show"))return;renderInventory();renderRecipes();renderAchievements()}
function renderInventory(){
 ui.inventoryGrid.innerHTML="";const ids=Object.keys(state.inventory).filter(id=>state.inventory[id]>0).sort((a,b)=>ITEM[a].name.localeCompare(ITEM[b].name));
 for(let i=0;i<36;i++){
   const id=ids[i],el=document.createElement("button");el.className="inv-slot"+(id&&selectedInventoryItem===id?" selected":"");
   if(id){el.innerHTML=`<span class="item-icon">${ITEM[id].icon}</span><span class="item-count">${state.inventory[id]}</span>`;el.title=ITEM[id].name;el.onclick=()=>{selectedInventoryItem=id;renderInventorySelection();renderInventory()}}
   ui.inventoryGrid.appendChild(el)
 }
 renderInventorySelection()
}
function deleteInventoryItem(id){
 if(!id||!(state.inventory[id]>0))return;
 const n=state.inventory[id];if(!confirm(`¿Eliminar ${ITEM[id].name} ×${n} de tu inventario?`))return;
 delete state.inventory[id];state.hotbar=state.hotbar.map(v=>v===id?null:v);if(state.armor===id)state.armor=null;
 selectedInventoryItem=null;updateHotbar();renderInventory();renderRecipes();toast("Objeto eliminado.",650)
}
function renderEquipSlotPicker(){
 if(!ui.equipSlotPicker)return;
 ui.equipSlotPicker.textContent="";
 for(let i=0;i<9;i++){
   const b=document.createElement("button");
   b.type="button";
   b.className="equip-slot-choice"+(i===selectedSlot?" active":"");
   const id=state.hotbar[i];
   b.textContent=id?(ITEM[id]?.icon||String(i+1)):String(i+1);
   b.title=id?`${i+1}: ${ITEM[id]?.name||id}`:`Espacio ${i+1}`;
   b.onclick=()=>{
     selectedSlot=i;
     updateHotbar();
     renderEquipSlotPicker();
     if(ui.equipBtn&&selectedInventoryItem)ui.equipBtn.textContent=`EQUIPAR EN ${selectedSlot+1}`;
   };
   ui.equipSlotPicker.appendChild(b);
 }
}

function renderInventorySelection(){
 const id=selectedInventoryItem,it=ITEM[id];
 renderEquipSlotPicker();

 if(!it||!(state.inventory[id]>0)){
   ui.selectedIcon.textContent="";
   ui.selectedName.textContent="Selecciona un objeto";
   ui.selectedDesc.textContent="Toca un objeto. Aquí abajo aparecerán EQUIPAR, USAR y ELIMINAR.";
   ui.equipBtn.style.display="none";
   ui.eatBtn.style.display="none";
   ui.deleteItemBtn.style.display="none";if(ui.giftItemBtn)ui.giftItemBtn.style.display="none";
   if(ui.equipSlotArea)ui.equipSlotArea.style.opacity=".45";
   return
 }

 if(ui.equipSlotArea)ui.equipSlotArea.style.opacity="1";
 ui.selectedIcon.textContent=it.icon;
 ui.selectedName.textContent=`${it.name} ×${state.inventory[id]}`;
 ui.selectedDesc.textContent=it.desc;

 ui.equipBtn.style.display="block";
 ui.equipBtn.textContent=`EQUIPAR EN ${selectedSlot+1}`;
 ui.equipBtn.onclick=()=>{
   state.hotbar[selectedSlot]=id;
   updateHotbar();
   renderEquipSlotPicker();
   toast(`${it.icon} ${it.name} equipado en espacio ${selectedSlot+1}.`,850);
 };

 ui.eatBtn.style.display=(it.food||it.heal||it.teleport||it.armor)?"block":"none";
 ui.eatBtn.textContent=it.food?"COMER":it.heal?"USAR":it.armor?"VESTIR":"ACTIVAR";
 ui.eatBtn.onclick=()=>{useInventoryItem(id);renderInventory()};

 if(ui.giftItemBtn){ui.giftItemBtn.style.display=gameMode==="duo"?"block":"none";ui.giftItemBtn.onclick=giftSelectedItem}
 ui.deleteItemBtn.style.display="block";
 ui.deleteItemBtn.onclick=()=>deleteInventoryItem(id);
}

const CRAFT_CATEGORIES=[
 ["all","TODO"],["tools","⛏ HERRAMIENTAS"],["combat","⚔ COMBATE"],["build","🧱 CONSTRUIR"],["survival","🛏 SUPERVIVENCIA"],["explore","🚩 EXPLORAR"],["special","❤️‍🔥 ESPECIAL"],["materials","MATERIALES"]
];
function renderCraftCategories(){
 if(!ui.craftCategories)return;ui.craftCategories.innerHTML="";
 CRAFT_CATEGORIES.forEach(([id,label])=>{
   const b=document.createElement("button");b.type="button";b.className="craft-cat"+(craftCategory===id?" active":"");b.textContent=label;
   b.onclick=()=>{craftCategory=id;selectedRecipeIndex=0;renderRecipes()};ui.craftCategories.appendChild(b)
 })
}
function recipeRequirementHTML(r){
 return Object.entries(r.in).map(([id,n])=>{
   const have=state.inventory[id]||0,ok=have>=n;
   return `<div class="ingredient-row ${ok?"ok":"missing"}"><span class="ing-icon">${ITEM[id].icon}</span><b>${ITEM[id].name}</b><span>${have}/${n} ${ok?"✓":"✕"}</span></div>`
 }).join("")
}
function renderCraftDetail(r){
 if(!r){ui.craftDetail.innerHTML='<div class="craft-detail-empty">Selecciona una receta para ver exactamente qué necesitas.</div>';return}
 const it=ITEM[r.out],table=nearStation("craftingTable"),locked=r.table&&!table,can=hasItems(r.in)&&!locked;
 const missing=Object.entries(r.in).filter(([id,n])=>(state.inventory[id]||0)<n).map(([id,n])=>`${n-(state.inventory[id]||0)} ${ITEM[id].name}`).join(", ");
 const note=locked?"Acércate a una Mesa de crafteo para fabricar esto.":missing?`Te falta: ${missing}.`:"Tienes todos los materiales. El juego los tomará automáticamente.";
 ui.craftDetail.innerHTML=`
   <div class="craft-product"><div class="craft-product-icon">${it.icon}</div><div><h3>${it.name}${r.n>1?` ×${r.n}`:""}</h3><p>${it.desc}</p></div></div>
   <div class="ingredient-list">${recipeRequirementHTML(r)}</div>
   <div class="craft-note">${note}</div>
   <button id="craftNowBtn" class="craft-now" ${can?"":"disabled"}>FABRICAR ${r.n>1?`×${r.n}`:""}</button>`;
 const btn=$("craftNowBtn");if(btn)btn.onclick=()=>craft(r)
}
function renderRecipes(){
 const table=nearStation("craftingTable");
 ui.craftContext.textContent=table?"✓ Mesa de crafteo cercana: todas las recetas disponibles.":"Crafteo básico disponible. Las recetas con 🔒 necesitan una Mesa de crafteo cerca.";
 renderCraftCategories();
 const list=RECIPES.filter(r=>craftCategory==="all"||r.cat===craftCategory);
 if(selectedRecipeIndex>=list.length)selectedRecipeIndex=0;
 ui.recipeGrid.innerHTML="";
 list.forEach((r,i)=>{
   const locked=r.table&&!table,can=hasItems(r.in)&&!locked,it=ITEM[r.out],el=document.createElement("button");
   el.className="recipe craft-choice"+(!can?" locked":"")+(i===selectedRecipeIndex?" selected":"");
   const status=locked?"🔒 MESA":can?"LISTO":"FALTAN";
   el.innerHTML=`<span class="recipe-icon">${it.icon}</span><span><b>${it.name}${r.n>1?` ×${r.n}`:""}</b><small>${Object.keys(r.in).length} ${Object.keys(r.in).length===1?"material":"materiales"} · crafteo automático</small></span><span class="recipe-state">${status}</span>`;
   el.onclick=()=>{selectedRecipeIndex=i;renderRecipes()};ui.recipeGrid.appendChild(el)
 });
 renderCraftDetail(list[selectedRecipeIndex]||null)
}
function renderFurnace(){
 ui.furnaceRecipes.innerHTML="";
 SMELT.forEach(r=>{
   const needed=r.in==="log"?2:1,can=(state.inventory[r.in]||0)>=needed&&(r.in==="log"||(state.inventory.log||0)>0),it=ITEM[r.out],el=document.createElement("button");
   el.className="recipe"+(!can?" locked":"");
   const fuel=r.in==="log"?"Tronco ×2 total":`${ITEM[r.in].name} ×1 · Tronco ×1`;
   el.innerHTML=`<span class="recipe-icon">${it.icon}</span><span><b>${r.label}</b><small>${fuel}</small></span>`;
   el.onclick=()=>smelt(r);ui.furnaceRecipes.appendChild(el)
 })
}
function renderAchievements(){
 ui.achievementsGrid.innerHTML="";for(const[id,a]of Object.entries(ACHIEVEMENTS)){const done=!!state.achievements[id],el=document.createElement("div");el.className="achievement"+(done?" done":"");el.innerHTML=`<b>${done?"✓ ":""}${a.name}</b><p>${a.desc}</p><span>+${a.points} 🫧</span>`;ui.achievementsGrid.appendChild(el)}
}
function renderChest(){
 ui.chestInventoryGrid.innerHTML="";ui.chestGrid.innerHTML="";
 const invIds=Object.keys(state.inventory).filter(id=>state.inventory[id]>0).sort((a,b)=>ITEM[a].name.localeCompare(ITEM[b].name)),ch=chestContents(),chIds=Object.keys(ch).filter(id=>ch[id]>0);
 for(let i=0;i<24;i++){const id=invIds[i],el=document.createElement("button");el.className="storage-slot";if(id){el.innerHTML=`<span class="item-icon">${ITEM[id].icon}</span><span class="item-count">${state.inventory[id]}</span>`;el.onclick=()=>depositToChest(id)}ui.chestInventoryGrid.appendChild(el)}
 for(let i=0;i<24;i++){const id=chIds[i],el=document.createElement("button");el.className="storage-slot";if(id){el.innerHTML=`<span class="item-icon">${ITEM[id]?.icon||"?"}</span><span class="item-count">${ch[id]}</span>`;el.onclick=()=>withdrawFromChest(id)}ui.chestGrid.appendChild(el)}
}
function renderMapMarkers(){
 if(!ui.mapMarkers)return;ui.mapMarkers.innerHTML="";
 const markers=state.markers||[];
 if(!markers.length){ui.mapMarkers.innerHTML='<div class="muted">Aún no has guardado ningún estandarte.</div>';return}
 markers.forEach(m=>{
   const row=document.createElement("div");row.className="map-marker-row";
   const d=m.layer===layerKey()?Math.round(Math.hypot(m.x+.5-state.x,m.y+.5-state.y))+" m":"otra zona";
   row.innerHTML=`<span>${m.icon||"🚩"}</span><div><b>${m.label}</b><small>${d}</small></div>`;
   const follow=document.createElement("button");follow.textContent=state.activeMarkerId===m.id?"SIGUIENDO":"SEGUIR";follow.className=state.activeMarkerId===m.id?"active":"";
   follow.onclick=()=>{state.activeMarkerId=m.id;renderMapMarkers();updateWaypoint()};
   const remove=document.createElement("button");remove.textContent="BORRAR";remove.className="remove";
   remove.onclick=()=>{if(!confirm(`¿Quitar el marcador "${m.label}" de tu mapa?`))return;state.markers=state.markers.filter(x=>x.id!==m.id);if(state.activeMarkerId===m.id)state.activeMarkerId=null;renderMap();updateWaypoint()};
   row.append(follow,remove);ui.mapMarkers.appendChild(row)
 })
}
function renderMap(){
 const size=520;mapCanvas.width=size;mapCanvas.height=size;mctx.clearRect(0,0,size,size);const radius=36,cell=size/(radius*2+1);
 for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
   const wx=Math.floor(state.x)+xx,wy=Math.floor(state.y)+yy,t=terrainAt(wx,wy);let c="#728b6d";
   if(t==="darkGrass")c="#61785d";if(t==="sand")c="#b69a70";if(t==="water")c="#658d92";if(t==="caveFloor")c="#665d53";if(t==="caveWall")c="#343536";
   if(t==="lava")c="#d85222";if(t==="abyssStone")c="#3a333b";if(t==="crimsonGround")c="#6f2d3a";
   mctx.fillStyle=c;mctx.fillRect((xx+radius)*cell,(yy+radius)*cell,cell+1,cell+1)
 }
 // Estructuras descubiertas
 for(const d of Object.values(state.discoveredStructures||{})){
   if(d.layer&&d.layer!==layerKey())continue;const dx=(d.x-state.x)*cell,dy=(d.y-state.y)*cell;if(Math.abs(dx)>size/2||Math.abs(dy)>size/2)continue;
   mctx.fillStyle="#e6c56a";mctx.fillRect(size/2+dx-3,size/2+dy-3,6,6)
 }
 // Cuevas visitadas y portales activados
 if(layer==="surface"){
   for(const c of state.visitedCaves||[]){const dx=(c.x-state.x)*cell,dy=(c.y-state.y)*cell;if(Math.abs(dx)<=size/2&&Math.abs(dy)<=size/2){mctx.fillStyle="#40362e";mctx.fillRect(size/2+dx-3,size/2+dy-3,6,6)}}
   for(const po of state.portals||[]){const dx=(po.x-state.x)*cell,dy=(po.y-state.y)*cell;if(Math.abs(dx)<=size/2&&Math.abs(dy)<=size/2){mctx.fillStyle="#c8425d";mctx.fillRect(size/2+dx-4,size/2+dy-4,8,8)}}
 }
 // Marcadores personales
 for(const m of state.markers||[]){
   if(m.layer!==layerKey())continue;const dx=(m.x-state.x)*cell,dy=(m.y-state.y)*cell;if(Math.abs(dx)>size/2||Math.abs(dy)>size/2)continue;
   mctx.fillStyle="#f0ca62";mctx.fillRect(size/2+dx-4,size/2+dy-4,8,8)
 }
 mctx.fillStyle=varColor("purple");mctx.fillRect(size/2-4,size/2-4,8,8);
 if(remotePlayer&&remotePlayer.layer===layerKey()){const dx=(remotePlayer.x-state.x)*cell,dy=(remotePlayer.y-state.y)*cell;mctx.fillStyle=varColor("pink");mctx.fillRect(size/2+dx-4,size/2+dy-4,8,8)}
 renderMapMarkers()
}
function varColor(name){return name==="pink"?"#f472b6":"#8b5cf6"}
async function unlockAchievement(id){if(state.achievements[id]||!ACHIEVEMENTS[id])return;state.achievements[id]=Date.now();const a=ACHIEVEMENTS[id];await awardPoints(a.points,`ach_${id}`,a.name);toast(`${a.name} · +${a.points} 🫧`,1400);saveGame(false)}
async function awardPoints(amount,eventId,reason){state.burbujaPoints+=amount;ui.points.textContent=state.burbujaPoints;const p=state.pendingPointEvents||(state.pendingPointEvents=[]);if(!p.some(e=>e.id===eventId))p.push({id:eventId,amount,reason});flushPointEvents();updateMenuStats()}
async function flushPointEvents(){if(!state.pendingPointEvents?.length)return;const ok=await online.initPointSync();if(!ok)return;for(const ev of[...state.pendingPointEvents]){const done=await online.awardPoints(ev.id,ev.amount,ev.reason);if(done)state.pendingPointEvents=state.pendingPointEvents.filter(x=>x.id!==ev.id)}saveGame(false)}
function dailyPlayReward(dt){dayRewardTimer+=dt;if(dayRewardTimer<300)return;dayRewardTimer=-999999;const d=new Date().toISOString().slice(0,10);if(state.dailyRewardDate!==d){state.dailyRewardDate=d;awardPoints(5,`play_${d}`,"Jugar Burbujacraft");toast("+5 🫧 por jugar hoy",1200)}}
function duoReward(dt){if(gameMode!=="duo"||state.achievements.duo)return;state.duoMinutes=(state.duoMinutes||0)+dt/60;if(state.duoMinutes>=10)unlockAchievement("duo")}
function saveObject(){return{version:5,worldSeed,worldTime,days,layer,caveId,surfaceReturn,mods,state,buildCount,hostileKills,savedAt:Date.now()}}
function activeBubbleStorageId(){return new URLSearchParams(location.search).get("bubbleId")||localStorage.getItem("burbuja-active-bubble")||"default"}
function craftSaveKey(mode="solo"){return `burbujacraft_v3_${mode==="duo"?"duo_local":"save"}_${activeBubbleStorageId()}`}
function readCraftSave(mode="solo"){try{const key=craftSaveKey(mode);let raw=localStorage.getItem(key);if(!raw&&activeBubbleStorageId()==="legacy-main-v1"){const old=mode==="duo"?"burbujacraft_v3_duo_local":"burbujacraft_v3_save";raw=localStorage.getItem(old);if(raw)localStorage.setItem(key,raw)}return raw?JSON.parse(raw):null}catch{return null}}
function saveGame(show=false){try{localStorage.setItem(craftSaveKey(gameMode),JSON.stringify(saveObject()))}catch{}if(show)toast("Partida guardada.",700);updateMenuStats()}
function loadGame(){return readCraftSave("solo")}
function applySave(s){
 worldSeed=s.worldSeed>>>0;worldTime=s.worldTime||120;days=s.days||0;layer=s.layer||"surface";caveId=s.caveId||null;surfaceReturn=s.surfaceReturn||null;mods=s.mods||{};
 state={...state,...s.state,hotbar:Array.isArray(s.state?.hotbar)?s.state.hotbar.slice(0,9):Array(9).fill(null)};
 while(state.hotbar.length<9)state.hotbar.push(null);
 state.spawn=state.spawn||{x:SPAWN_X+.5,y:SPAWN_Y+.5,layer:"surface"};
 state.markers=Array.isArray(state.markers)?state.markers:[];
 state.activeMarkerId=state.activeMarkerId||null;state.discoveredStructures=state.discoveredStructures||{};state.sleepAt=0;
 buildCount=s.buildCount||0;hostileKills=s.hostileKills||0;remoteMods={};mobs=[];projectiles=[];normalizeStateExtras()
}
function updateMenuStats(){const s=loadGame();ui.continueBtn.disabled=!s;ui.continueInfo.textContent=s?`Día ${Math.floor((s.worldTime||120)/480)+1} · ${new Date(s.savedAt||Date.now()).toLocaleDateString("es-MX")}`:"No hay partida individual guardada";const points=Math.max(state.burbujaPoints||0,s?.state?.burbujaPoints||0);ui.menuPoints.textContent=points+" 🫧";ui.menuDays.textContent=Math.max(days||0,Math.floor((s?.worldTime||120)/480));const tier=Math.max(state.tier||1,s?.state?.tier||1);ui.menuTier.textContent=tier>=3?"Hierro":tier>=2?"Piedra":"Madera"}
function freshState(keepPoints=true){
 const points=keepPoints?(state.burbujaPoints||0):0,pending=state.pendingPointEvents||[];
 state={
  x:SPAWN_X+.5,y:SPAWN_Y+.5,dirX:0,dirY:1,health:100,hunger:100,inventory:{},hotbar:Array(9).fill(null),achievements:{},
  burbujaPoints:points,dailyRewardDate:null,duoMinutes:0,tier:1,armor:null,pendingPointEvents:pending,
  spawn:{x:SPAWN_X+.5,y:SPAWN_Y+.5,layer:"surface"},markers:[],activeMarkerId:null,discoveredStructures:{},sleepAt:0,abyssReturn:null,
  worldName:"Nuestro mundo",tutorialStep:0,tutorialDone:false,downed:false,downUntil:0,visitedCaves:[],portals:[],
  stats:{playSeconds:0,distance:0,blocksPlaced:0,treesCut:0,kills:0,fishCaught:0,crafts:0,harvests:0,animalsBred:0,deaths:0,gifts:0}
 };
 addItem("woodAxe",1,true);addItem("woodSword",1,true);addItem("woodPick",1,true);
 state.hotbar[0]="woodAxe";state.hotbar[1]="woodPick";state.hotbar[2]="woodSword"
}
function startSolo(newWorld){gameMode="solo";online.disconnect();partnerProfile=null;remotePlayer=null;remoteMods={};if(newWorld){worldSeed=crypto.getRandomValues(new Uint32Array(1))[0]>>>0;worldTime=120;days=0;layer="surface";caveId=null;surfaceReturn=null;mods={};resourceDamage={};caveCache.clear();mobs=[];projectiles=[];buildCount=0;hostileKills=0;freshState(true)}else{const s=loadGame();if(!s)return;applySave(s)}enterGame();flushPointEvents()}
async function startDuo(){showModal("duoConnectingModal",false);$("duoConnectText").textContent="Comprobando tu sesión de Burbuja...";try{const res=await online.connectDuo(t=>$("duoConnectText").textContent=t);gameMode="duo";worldSeed=res.seed>>>0;partnerProfile=res.partner;worldTime=online.world?.worldTime||120;layer="surface";caveId=null;surfaceReturn=null;mods={};remoteMods={};mobs=[];projectiles=[];let local=readCraftSave("duo");if(local?.worldSeed===worldSeed){applySave(local);gameMode="duo";worldSeed=res.seed>>>0}else{freshState(true);state.x=SPAWN_X+.5+(Math.random()-.5)*1.4;state.y=SPAWN_Y+.5+(Math.random()-.5)*1.4}online.onPartner((p,profile)=>{remotePlayer=p;partnerProfile=profile;updatePartnerCard()});online.onMods(applyRemoteChunk);online.onMobs((rm,isHost)=>{if(!isHost)mobs=rm.map(v=>({...v}))});online.onAction(handleRemoteAction);hideModal("duoConnectingModal",false);enterGame();flushPointEvents()}catch(e){hideModal("duoConnectingModal",false);const msg=e.message==="NO_AUTH"?"Inicia sesión primero en Burbuja desde el mismo dominio de GitHub Pages y vuelve a entrar al modo dúo.":e.message==="NO_PARTNER"?"No encontré a la segunda persona de Burbuja.":"No pude conectar el mundo dúo.";showMessage("MUNDO DÚO",msg)}}
function preferLandscape(){
  document.body.classList.add("craft-playing");
  try{
    if(screen.orientation && screen.orientation.lock){
      screen.orientation.lock("landscape").catch(()=>{});
    }
  }catch{}
}
function releaseLandscape(){
  document.body.classList.remove("craft-playing");
  try{
    if(screen.orientation && screen.orientation.unlock)screen.orientation.unlock();
  }catch{}
}
function enterGame(){normalizeStateExtras();preferLandscape();setScreen("game");ui.mode.textContent=gameMode==="duo"?"DÚO":"SOLO";paused=false;running=true;saveTimer=0;onlineTimer=0;spawnTimer=0;dayRewardTimer=0;discoverTimer=0;activeChest=null;weather={type:"clear",until:worldTime,next:worldTime+55,flash:0};updateHotbar();updateHud();resize();const lo=$("loadingOverlay");if(lo){$("loadingWorldName").textContent=state.worldName||"Nuestro mundo";const phrases=["Cultivando bosques…","Preparando cuevas…","Despertando criaturas…","Colocando ríos…","Encendiendo antorchas…"];$("loadingPhrase").textContent=phrases[(worldSeed||0)%phrases.length];lo.classList.add("show");setTimeout(()=>lo.classList.remove("show"),700)}cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop)}
function setScreen(name){Object.values(screens).forEach(s=>s.classList.remove("active"));screens[name].classList.add("active")}
function showModal(id,pause=true){$(id).classList.add("show");if(pause)paused=true}
function hideModal(id,resume=true){$(id).classList.remove("show");if(resume&&screens.game.classList.contains("active")&&!document.querySelector(".modal.show"))paused=false}
function closeAllModals(){for(const id of modalIds)$(id).classList.remove("show");paused=false}
function showMessage(title,text){$("messageTitle").textContent=title;$("messageText").textContent=text;showModal("messageModal")}
let toastTimer;function toast(t,ms=1000){ui.toast.textContent=t;ui.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),ms)}
function briefError(t){toast(t,800);tone(95,.05,.012)}

function updateOnline(dt){if(gameMode!=="duo")return;onlineTimer+=dt;if(onlineTimer>.18){onlineTimer=0;online.publishState({x:state.x,y:state.y,layer:layerKey(),health:state.health,hunger:state.hunger,selected:selectedItem(),dirX:state.dirX,dirY:state.dirY,sleepAt:state.sleepAt||0,downed:!!state.downed,worldName:state.worldName||"Nuestro mundo"});online.watchChunks(layerKey(),state.x,state.y);if(online.isHost)online.publishMobs(mobs.map(m=>({id:m.id,type:m.type,x:m.x,y:m.y,hp:m.hp,maxHp:m.maxHp,layer:m.layer,dead:m.dead,animal:m.animal||false,hostile:m.hostile||false,speed:m.speed,vision:m.vision,leash:m.leash,aggro:m.aggro||0,shootCd:m.shootCd||0,teleportCd:m.teleportCd||0,passive:m.passive||false})))}if(online.isHost)online.heartbeat(worldTime)}
function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}particles=particles.filter(p=>p.life>0)}
function spawnParticles(x,y,type,n=8){const c=type==="wood"?"#a77b4e":type==="stone"?"#8b8d88":type==="void"?"#9e73dd":type==="build"?"#d3b466":type==="lava"?"#e65e26":"#6d8a66";for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,life:.5+Math.random()*.2,color:c})}
function updateDiscovery(dt){
 discoverTimer+=dt;if(discoverTimer<.65)return;discoverTimer=0;
 const d=nearbyStructure(7.5);if(!d)return;
 state.discoveredStructures=state.discoveredStructures||{};
 if(!state.discoveredStructures[d.id]){
   state.discoveredStructures[d.id]={id:d.id,kind:d.kind,label:d.label,x:d.x,y:d.y,layer:"surface"};
   toast(`✦ Lugar descubierto: ${d.label}`,1500);unlockAchievement("structure")
 }
}
function isCrimsonNight(){return layer==="surface"&&isNightTime()&&((Math.floor(worldTime/480)+1)%6===0)}
function updateWeather(dt){
 if(layer!=="surface"){weather.type="clear";return}weatherTimer+=dt;if(weatherTimer<1)return;weatherTimer=0;
 if(isCrimsonNight()){weather.type="crimson";weather.until=worldTime+4;return}
 if(worldTime>weather.until&&worldTime>weather.next){const r=hash2(Math.floor(worldTime/45),Math.floor(worldTime/97),worldSeed^0xC10D);weather.type=r<.42?"rain":r<.62?"fog":r<.76?"storm":"clear";weather.until=worldTime+55+Math.floor(r*55);weather.next=weather.until+70+Math.floor(r*100)}
 if(worldTime>weather.until)weather.type="clear";
 if(weather.type==="storm"&&Math.random()<.025)weather.flash=.18;
 weather.flash=Math.max(0,weather.flash-dt);
 updateWeatherHud()
}
function updateWeatherHud(){if(!ui.worldEventHud)return;const d={clear:["☀️","Despejado"],rain:["🌧️","Lluvia"],fog:["🌫️","Niebla"],storm:["⛈️","Tormenta"],crimson:["🌘","Noche Carmesí"]}[weather.type]||["☀️","Despejado"];ui.weatherIcon.textContent=d[0];ui.weatherLabel.textContent=d[1];ui.worldEventHud.classList.toggle("danger",weather.type==="crimson")}
function drawWeather(){if(layer!=="surface")return;const t=performance.now();if(weather.type==="rain"||weather.type==="storm"){ctx.save();ctx.strokeStyle=weather.type==="storm"?"rgba(210,228,238,.48)":"rgba(205,228,236,.33)";ctx.lineWidth=1.2;const n=Math.min(75,Math.floor(CW/11));for(let i=0;i<n;i++){const x=(i*83+(t*.19))%(CW+80)-40,y=(i*47+(t*.48))%(CH+60)-30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke()}ctx.restore()}if(weather.type==="fog"){ctx.fillStyle="rgba(205,214,207,.14)";ctx.fillRect(0,0,CW,CH)}if(weather.type==="crimson"){ctx.fillStyle="rgba(125,18,35,.12)";ctx.fillRect(0,0,CW,CH)}if(weather.flash>0){ctx.fillStyle=`rgba(255,255,255,${weather.flash})`;ctx.fillRect(0,0,CW,CH)}}
function normalizeStateExtras(){state.stats={playSeconds:0,distance:0,blocksPlaced:0,treesCut:0,kills:0,fishCaught:0,crafts:0,harvests:0,animalsBred:0,deaths:0,gifts:0,...(state.stats||{})};state.worldName=state.worldName||"Nuestro mundo";state.visitedCaves=Array.isArray(state.visitedCaves)?state.visitedCaves:[];state.portals=Array.isArray(state.portals)?state.portals:[];state.tutorialStep=Number.isFinite(state.tutorialStep)?state.tutorialStep:0;state.downed=false;state.downUntil=0}
function updateTutorial(){if(state.tutorialDone||!ui.tutorialCard){ui.tutorialCard?.classList.remove("show");return}let s=state.tutorialStep||0,title="",text="",done=false;if(s===0){title="Explora";text="Muévete con el joystick izquierdo.";done=(state.stats.distance||0)>3}else if(s===1){title="Consigue madera";text="Equipa el hacha y corta un árbol.";done=(state.inventory.log||0)>0}else if(s===2){title="Abre tu mochila";text="Toca 🎒 y fabrica tablas o una mesa de crafteo.";done=(state.inventory.plank||0)>0||(state.inventory.craftingTable||0)>0}else if(s===3){title="Construye";text="Equipa un bloque y mantén pulsado COLOCAR para construir rápido.";done=(state.stats.blocksPlaced||0)>0}else{state.tutorialDone=true;ui.tutorialCard.classList.remove("show");toast("✓ Ya conoces lo básico. Explora a tu manera.",1200);return}if(done){state.tutorialStep=s+1;return}ui.tutorialTitle.textContent=title;ui.tutorialText.textContent=text;ui.tutorialCard.classList.add("show")}
function renderStats(){const el=$("statsGrid");if(!el)return;const s=state.stats||{};const vals=[["⏱",Math.floor((s.playSeconds||0)/60)+" min"],["👣",Math.floor(s.distance||0)+" m"],["🧱",s.blocksPlaced||0],["⚔",s.kills||0],["🎣",s.fishCaught||0],["🌾",s.harvests||0]];el.innerHTML=vals.map(([i,v])=>`<div><span>${i}</span><b>${v}</b></div>`).join("");$("seedValue").textContent=String(worldSeed>>>0);$("worldNameInput").value=state.worldName||"Nuestro mundo"}
function showRemoteEmote(e){const el=$("remoteEmote");if(!el)return;el.textContent=e;el.classList.add("show");remoteEmoteUntil=Date.now()+2200;setTimeout(()=>el.classList.remove("show"),2250)}
function sendEmote(emoji){if(gameMode!=="duo")return;online.sendAction({type:"emote",emoji});toast(`${emoji}`,500);haptic(10)}
function pingPartner(){if(gameMode!=="duo")return;online.sendAction({type:"ping",x:state.x,y:state.y,layer:layerKey()});toast("📍 Punto enviado.",650)}
function giftSelectedItem(){if(gameMode!=="duo"||!remotePlayer||remotePlayer.layer!==layerKey()||Math.hypot(remotePlayer.x-state.x,remotePlayer.y-state.y)>2.2){briefError("Acércate a tu persona para darle un objeto.");return}const id=selectedInventoryItem||selectedItem();if(!id||(state.inventory[id]||0)<1){briefError("Selecciona un objeto para regalar.");return}if(removeItem(id,1)){online.sendAction({type:"gift",id,n:1});state.stats.gifts=(state.stats.gifts||0)+1;toast(`🎁 Diste ${ITEM[id].name}.`,800);haptic([15,25,15]);renderInventory()}}
function haptic(pattern=10){try{navigator.vibrate?.(pattern)}catch{}}
function loop(now){
 if(!running)return;const dt=Math.min(.035,(now-last)/1000);last=now;
 if(!paused){
   let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+moveInput.x,dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+moveInput.y;
   if(Math.abs(dx)>.08||Math.abs(dy)>.08)movePlayer(dx,dy,dt);
   updateDay(dt);updateNeeds(dt);updateFishing();updateWeather(dt);updateDowned();updateTutorial();state.stats.playSeconds=(state.stats.playSeconds||0)+dt;spawnMobs(dt);updateMobs(dt);updateProjectiles(dt);updateParticles(dt);updateOnline(dt);updateDiscovery(dt);dailyPlayReward(dt);duoReward(dt);
   saveTimer+=dt;if(saveTimer>6){saveTimer=0;saveGame(false)}updateHud()
 }
 draw();raf=requestAnimationFrame(loop)
}

function resize(){
 const r=shell.getBoundingClientRect();CW=Math.max(320,r.width);CH=Math.max(320,r.height);DPR=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.floor(CW*DPR);canvas.height=Math.floor(CH*DPR);canvas.style.width=CW+"px";canvas.style.height=CH+"px";ctx.setTransform(DPR,0,0,DPR,0,0);
 lightCanvas.width=Math.floor(CW*DPR);lightCanvas.height=Math.floor(CH*DPR);lctx.setTransform(DPR,0,0,DPR,0,0)
}
addEventListener("resize",resize);
function worldToScreen(x,y){return{x:(x-camera.x)*TILE,y:(y-camera.y)*TILE}}
function visibleBounds(){return{x0:Math.floor(camera.x)-2,y0:Math.floor(camera.y)-2,x1:Math.ceil(camera.x+CW/TILE)+2,y1:Math.ceil(camera.y+CH/TILE)+2}}
function draw(){
 if(!worldSeed)return;ctx.clearRect(0,0,CW,CH);camera.x=state.x-CW/(2*TILE);camera.y=state.y-CH/(2*TILE);
 drawTerrain();drawBuildPreview();drawObjects();drawProjectiles();drawMobs();drawPlayers();drawFishing();drawParticles();drawLighting();drawPartnerPing();drawWeather()
}
function drawTerrain(){
 const b=visibleBounds();
 for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){
  const p=worldToScreen(x,y),t=terrainAt(x,y),h=hash2(x,y);
  if(t==="grass"||t==="darkGrass"){
    const bio=layer==="surface"?surfaceBiomeAt(x,y):"";ctx.fillStyle=bio==="pine"?"#477f42":bio==="birch"?"#628f46":bio==="meadow"?"#5b9d45":t==="grass"?"#4f923f":"#427c39";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);
    ctx.fillStyle=bio==="pine"?"#558e4a":bio==="birch"?"#73a451":bio==="meadow"?"#6db354":t==="grass"?"#61a84b":"#529343";ctx.fillRect(p.x+2,p.y+2,TILE-4,TILE-4);
    ctx.fillStyle="rgba(216,238,166,.18)";ctx.fillRect(p.x+7+(h*25)%30,p.y+8+(h*37)%29,3,7)
  }else if(t==="sand"){
    ctx.fillStyle="#b79567";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);ctx.fillStyle="#d1ad79";ctx.fillRect(p.x+2,p.y+2,TILE-4,TILE-4);
    ctx.fillStyle="rgba(78,57,34,.18)";ctx.fillRect(p.x+10+(h*22)%28,p.y+12+(h*17)%22,3,3)
  }else if(t==="water"){
    ctx.fillStyle="#1d86b4";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);ctx.fillStyle="#2b9ec9";ctx.fillRect(p.x+2,p.y+2,TILE-4,TILE-4);
    const wave=(performance.now()*.002+x+y)%1;ctx.fillStyle="rgba(183,235,246,.35)";ctx.fillRect(p.x+5+(wave*9),p.y+11,21,2)
  }else if(t==="caveFloor"){
    ctx.fillStyle="#54514d";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);ctx.fillStyle="#69645e";ctx.fillRect(p.x+2,p.y+2,TILE-4,TILE-4)
  }else if(t==="caveWall"){
    ctx.fillStyle="#292b2c";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);ctx.fillStyle="#3d4040";ctx.fillRect(p.x+3,p.y+3,TILE-6,TILE-6);
    ctx.strokeStyle="#262829";ctx.lineWidth=3;ctx.strokeRect(p.x+5,p.y+5,TILE-10,TILE-10)
  }else if(t==="lava"){
    const pulse=.5+.5*Math.sin(performance.now()*.006+x*.8+y);
    ctx.fillStyle="#8f2b17";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);ctx.fillStyle=`rgb(${210+Math.floor(pulse*35)},${63+Math.floor(pulse*35)},20)`;ctx.fillRect(p.x+3,p.y+3,TILE-6,TILE-6);
    ctx.fillStyle="rgba(255,190,48,.75)";ctx.fillRect(p.x+7+(h*23)%24,p.y+12,22,4);ctx.fillRect(p.x+22,p.y+32,18,3)
  }else if(t==="abyssStone"||t==="crimsonGround"){
    ctx.fillStyle=t==="abyssStone"?"#2c2730":"#552631";ctx.fillRect(p.x,p.y,TILE+1,TILE+1);
    ctx.fillStyle=t==="abyssStone"?"#3b343e":"#71313e";ctx.fillRect(p.x+2,p.y+2,TILE-4,TILE-4);
    ctx.fillStyle="rgba(235,88,91,.16)";ctx.fillRect(p.x+8+(h*20)%28,p.y+10+(h*14)%24,4,4)
  }
 }
}
function drawBuildPreview(){
 const ps=placementStatus();if(!ps)return;
 const p=worldToScreen(ps.x,ps.y);ctx.save();ctx.globalAlpha=.55;ctx.fillStyle=ps.valid?"#75c66b":"#d65c57";ctx.fillRect(p.x+4,p.y+4,TILE-8,TILE-8);
 ctx.globalAlpha=.92;ctx.strokeStyle=ps.valid?"#c3f2a8":"#ffc0b8";ctx.lineWidth=2;ctx.strokeRect(p.x+5,p.y+5,TILE-10,TILE-10);
 ctx.font="21px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(ps.it.icon,p.x+TILE/2,p.y+TILE/2);ctx.restore()
}
function drawObjects(){const b=visibleBounds(),arr=[];for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){const o=staticObjectAt(x,y);if(o)arr.push({x,y,o})}arr.sort((a,b)=>a.y-b.y);for(const q of arr)drawObject(q.x,q.y,q.o)}
function drawObject(x,y,o){
 const p=worldToScreen(x+.5,y+.5);ctx.save();ctx.translate(p.x,p.y);
 if(o.type==="tree"||o.type==="emberTree"){
   ctx.fillStyle="rgba(0,0,0,.20)";ctx.fillRect(-17,17,34,8);
   if(o.type==="emberTree"){
     ctx.fillStyle="#3b2525";ctx.fillRect(-7,-3,14,31);ctx.strokeStyle="#1d1719";ctx.lineWidth=3;ctx.strokeRect(-7,-3,14,31);
     ctx.fillStyle="#7d2938";ctx.fillRect(-24,-32,48,34);ctx.fillStyle="#b23f4c";ctx.fillRect(-16,-25,32,19)
   }else{
     ctx.fillStyle=o.kind==="birch"?"#d9c8a6":"#754a2b";ctx.strokeStyle="#3e2a1d";ctx.lineWidth=3;ctx.fillRect(-6,-5,12,31);ctx.strokeRect(-6,-5,12,31);
     if(o.kind==="birch"){ctx.fillStyle="#554634";ctx.fillRect(-5,3,10,2);ctx.fillRect(-5,12,10,2)}
     if(o.kind==="pine"){
       ctx.fillStyle="#366d38";ctx.strokeStyle="#234828";ctx.lineWidth=3;
       for(const [yy,w]of[[-34,19],[-25,25],[-14,31]]){ctx.beginPath();ctx.moveTo(0,yy-10);ctx.lineTo(-w,yy+13);ctx.lineTo(w,yy+13);ctx.closePath();ctx.fill();ctx.stroke()}
     }else{ctx.fillStyle=o.kind==="oak"?"#4d8539":"#88ad47";ctx.strokeStyle="#2b572a";ctx.lineWidth=3;ctx.fillRect(-25,-33,50,36);ctx.strokeRect(-25,-33,50,36);ctx.fillStyle=o.kind==="oak"?"#69a84b":"#a1c851";ctx.fillRect(-18,-27,36,23)}
   }
 }
 else if(["rock","caveRock","ashRock"].includes(o.type)){ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(-20,17,40,7);ctx.fillStyle=o.type==="ashRock"?"#443b43":o.type==="caveRock"?"#555452":"#737a7b";ctx.strokeStyle="#424746";ctx.lineWidth=3;ctx.fillRect(-20,-16,40,34);ctx.strokeRect(-20,-16,40,34);ctx.fillStyle="rgba(255,255,255,.12)";ctx.fillRect(-13,-9,17,10)}
 else if(o.type==="ironNode"||o.type==="coalNode"||o.type==="volcanicNode"||o.type==="crimsonCrystalNode"){
   ctx.fillStyle="#585654";ctx.strokeStyle="#353432";ctx.lineWidth=3;ctx.fillRect(-21,-20,42,40);ctx.strokeRect(-21,-20,42,40);
   const c=o.type==="ironNode"?"#bd8f66":o.type==="coalNode"?"#242426":o.type==="volcanicNode"?"#c94a2c":"#d74f76";ctx.fillStyle=c;
   for(const [xx,yy]of[[-11,-9],[7,-11],[-2,4],[11,8],[-13,10]])ctx.fillRect(xx,yy,7,7)
 }
 else if(o.type==="cave"){ctx.fillStyle="#5b5d58";ctx.fillRect(-25,-19,50,38);ctx.fillStyle="#232525";ctx.fillRect(-17,-11,34,27);ctx.fillStyle="#090a0a";ctx.fillRect(-11,-5,22,21);ctx.strokeStyle="#777a73";ctx.lineWidth=3;ctx.strokeRect(-25,-19,50,38)}
 else if(o.type==="caveExit"){ctx.fillStyle="#755a2b";ctx.fillRect(-21,-21,42,42);ctx.strokeStyle="#d4b254";ctx.lineWidth=4;ctx.strokeRect(-16,-16,32,32);ctx.fillStyle="#1d2020";ctx.fillRect(-9,-9,18,18)}
 else if(o.type==="woodWall"){ctx.fillStyle="#8e6b49";ctx.strokeStyle="#4b3829";ctx.lineWidth=4;ctx.fillRect(-27,-27,54,54);ctx.strokeRect(-27,-27,54,54);ctx.strokeStyle="#684b34";for(let yy=-18;yy<=18;yy+=12){ctx.beginPath();ctx.moveTo(-25,yy);ctx.lineTo(25,yy);ctx.stroke()}}
 else if(o.type==="stoneWall"){ctx.fillStyle="#747977";ctx.strokeStyle="#414544";ctx.lineWidth=4;ctx.fillRect(-27,-27,54,54);ctx.strokeRect(-27,-27,54,54);ctx.strokeStyle="#555a58";ctx.beginPath();ctx.moveTo(-25,-9);ctx.lineTo(25,-9);ctx.moveTo(-25,9);ctx.lineTo(25,9);ctx.stroke()}
 else if(o.type==="glassWall"){ctx.fillStyle="rgba(151,218,229,.30)";ctx.strokeStyle="#94cbd5";ctx.lineWidth=4;ctx.fillRect(-26,-26,52,52);ctx.strokeRect(-26,-26,52,52);ctx.strokeStyle="rgba(255,255,255,.45)";ctx.beginPath();ctx.moveTo(-18,17);ctx.lineTo(16,-17);ctx.stroke()}
 else if(o.type==="woodFloor"){ctx.fillStyle="#8c6744";ctx.fillRect(-27,-27,54,54);ctx.strokeStyle="#66472f";ctx.lineWidth=2;for(let yy=-20;yy<=20;yy+=13){ctx.beginPath();ctx.moveTo(-26,yy);ctx.lineTo(26,yy);ctx.stroke()}}
 else if(o.type==="stoneFloor"){ctx.fillStyle="#686d6b";ctx.fillRect(-27,-27,54,54);ctx.strokeStyle="#505452";ctx.lineWidth=2;ctx.strokeRect(-25,-25,50,50);ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(0,25);ctx.moveTo(-25,0);ctx.lineTo(25,0);ctx.stroke()}
 else if(o.type==="fence"){ctx.fillStyle="#765235";ctx.fillRect(-24,-7,48,7);ctx.fillRect(-24,8,48,7);ctx.fillRect(-19,-20,7,42);ctx.fillRect(12,-20,7,42)}
 else if(o.type==="gateClosed"||o.type==="gateOpen"){ctx.fillStyle="#765235";ctx.strokeStyle="#3f2d21";ctx.lineWidth=3;if(o.type==="gateClosed"){ctx.fillRect(-23,-18,46,36);ctx.strokeRect(-23,-18,46,36);ctx.clearRect(-17,-10,34,20)}else{ctx.save();ctx.rotate(.9);ctx.fillRect(-4,-23,8,46);ctx.restore()}}
 else if(o.type==="roofTile"){ctx.fillStyle="#74463c";ctx.strokeStyle="#432923";ctx.lineWidth=3;ctx.fillRect(-27,-27,54,54);ctx.strokeRect(-27,-27,54,54);ctx.fillStyle="#96594a";for(let yy=-20;yy<25;yy+=11)ctx.fillRect(-24,yy,48,6)}
 else if(o.type==="farmland"){ctx.fillStyle="#63452f";ctx.fillRect(-27,-27,54,54);ctx.strokeStyle="#3c2d22";ctx.lineWidth=2;for(let xx=-20;xx<=20;xx+=10){ctx.beginPath();ctx.moveTo(xx,-24);ctx.lineTo(xx,24);ctx.stroke()}}
 else if(["cropWheat","cropCarrot","cropPotato"].includes(o.type)){const g=cropGrowth(o);ctx.fillStyle="#63452f";ctx.fillRect(-27,-27,54,54);const h=10+Math.floor(g*24);ctx.strokeStyle=o.type==="cropWheat"?"#9fbc4a":o.type==="cropCarrot"?"#55a154":"#6fa64e";ctx.lineWidth=3;for(const xx of[-14,-5,5,14]){ctx.beginPath();ctx.moveTo(xx,16);ctx.lineTo(xx,16-h);ctx.stroke()}if(g>=.95){ctx.font="17px sans-serif";ctx.textAlign="center";ctx.fillText(o.type==="cropWheat"?"🌾":o.type==="cropCarrot"?"🥕":"🥔",0,-8)}}
 else if(o.type==="abyssBlock"){ctx.fillStyle="#27212a";ctx.strokeStyle="#111015";ctx.lineWidth=4;ctx.fillRect(-27,-27,54,54);ctx.strokeRect(-27,-27,54,54);ctx.fillStyle="#743345";ctx.fillRect(-18,-16,7,6);ctx.fillRect(8,5,8,7)}
 else if(["doorClosed","doorOpen","bubbleDoorClosed","bubbleDoorOpen"].includes(o.type)){
   const bubble=o.type.startsWith("bubbleDoor"),open=o.type.endsWith("Open");
   ctx.fillStyle=bubble?"#69415f":"#704f32";ctx.strokeStyle=bubble?"#342234":"#3d2b1e";ctx.lineWidth=4;
   if(!open){ctx.fillRect(-18,-27,36,54);ctx.strokeRect(-18,-27,36,54);ctx.fillStyle="#d8b461";ctx.fillRect(9,-1,4,4);if(bubble){ctx.fillStyle="#f3b0cf";ctx.font="17px sans-serif";ctx.textAlign="center";ctx.fillText("♥",0,5)}}
   else{ctx.save();ctx.rotate(.9);ctx.fillRect(-5,-27,10,54);ctx.restore()}
 }
 else if(o.type==="craftingTable"){ctx.fillStyle="#865f39";ctx.strokeStyle="#433020";ctx.lineWidth=4;ctx.fillRect(-24,-24,48,48);ctx.strokeRect(-24,-24,48,48);ctx.strokeStyle="#d0aa64";ctx.beginPath();ctx.moveTo(-17,-6);ctx.lineTo(17,-6);ctx.moveTo(0,-18);ctx.lineTo(0,16);ctx.stroke()}
 else if(o.type==="furnace"){ctx.fillStyle="#626765";ctx.strokeStyle="#383b3a";ctx.lineWidth=4;ctx.fillRect(-24,-24,48,48);ctx.strokeRect(-24,-24,48,48);ctx.fillStyle="#242726";ctx.fillRect(-14,3,28,16);ctx.fillStyle="#dd7c2c";ctx.fillRect(-10,8,20,7)}
 else if(o.type==="chest"){ctx.fillStyle="#91673d";ctx.strokeStyle="#49321f";ctx.lineWidth=4;ctx.fillRect(-24,-19,48,38);ctx.strokeRect(-24,-19,48,38);ctx.fillStyle="#b78b54";ctx.fillRect(-22,-17,44,13);ctx.fillStyle="#d7b35e";ctx.fillRect(-4,-5,8,10)}
 else if(o.type==="bed"){ctx.fillStyle="#69493a";ctx.fillRect(-25,10,50,12);ctx.fillStyle="#d6c9ad";ctx.fillRect(-25,-15,16,25);ctx.fillStyle="#8b5cf6";ctx.fillRect(-9,-15,34,25);ctx.strokeStyle="#4d3b32";ctx.lineWidth=3;ctx.strokeRect(-25,-15,50,37)}
 else if(o.type==="torch"){ctx.fillStyle="#6d4a2c";ctx.fillRect(-3,-2,6,25);ctx.fillStyle="#ffb52f";ctx.fillRect(-7,-15,14,14);ctx.fillStyle="#fff1a5";ctx.fillRect(-3,-12,6,7);ctx.shadowColor="#ff8a2b";ctx.shadowBlur=18;ctx.fillStyle="rgba(255,141,43,.45)";ctx.fillRect(-8,-16,16,16);ctx.shadowBlur=0}
 else if(o.type==="marker"){ctx.fillStyle="#785437";ctx.fillRect(-3,-20,6,43);ctx.fillStyle=o.markerIcon==="🌊"?"#5c9fb9":o.markerIcon==="🔥"?"#b84a39":o.markerIcon==="⛏️"?"#777b85":"#8b5cf6";ctx.fillRect(3,-19,23,18);ctx.fillStyle="#fff";ctx.font="11px sans-serif";ctx.textAlign="center";ctx.fillText((o.markerIcon||"🚩").replace("️",""),14,-6)}
 else if(o.type==="portal"||o.type==="portalReturn"){const pulse=.5+.5*Math.sin(performance.now()*.007);ctx.fillStyle=o.type==="portal"?"#741f35":"#4f235d";ctx.fillRect(-22,-25,44,50);ctx.fillStyle=`rgba(255,${50+Math.floor(pulse*50)},${80+Math.floor(pulse*80)},.65)`;ctx.fillRect(-15,-20,30,40);ctx.strokeStyle="#d25363";ctx.lineWidth=3;ctx.strokeRect(-22,-25,44,50)}
 else if(o.type==="campfire"){ctx.fillStyle="#5b3823";ctx.fillRect(-17,9,34,7);ctx.save();ctx.rotate(.7);ctx.fillRect(-17,9,34,7);ctx.restore();ctx.fillStyle="#f0862f";ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(-12,6);ctx.lineTo(12,6);ctx.closePath();ctx.fill();ctx.fillStyle="#ffd45a";ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(-6,5);ctx.lineTo(6,5);ctx.closePath();ctx.fill()}
 else if(o.type==="tent"){ctx.fillStyle="#786242";ctx.strokeStyle="#403422";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(-27,23);ctx.lineTo(27,23);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#2e2923";ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(-7,22);ctx.lineTo(7,22);ctx.closePath();ctx.fill()}
 ctx.restore()
}
function drawPlayers(){
 drawPlayerSprite(state.x,state.y,"purple",false,state.dirX,state.dirY);
 if(gameMode==="duo"&&remotePlayer&&remotePlayer.layer===layerKey())drawPlayerSprite(remotePlayer.x,remotePlayer.y,"pink",true,remotePlayer.dirX||0,remotePlayer.dirY||1)
}
function drawHeldTool(id,dx,dy){
 if(!id||!ITEM[id])return;const it=ITEM[id],a=Math.atan2(dy||1,dx||0)-Math.PI/2;
 ctx.save();ctx.rotate(a);ctx.translate(19,-4);
 if(it.tool==="sword"){ctx.fillStyle="#ddd8c7";ctx.fillRect(-2,-25,5,26);ctx.fillStyle="#8e673c";ctx.fillRect(-6,0,13,4);ctx.fillRect(-2,4,5,9)}
 else if(it.tool==="axe"){ctx.fillStyle="#7a5333";ctx.fillRect(-2,-20,5,29);ctx.fillStyle=it.tier>=3?"#c7c9c5":it.tier===2?"#8e9491":"#b38b5b";ctx.fillRect(-10,-22,17,10)}
 else if(it.tool==="hoe"){ctx.fillStyle="#7a5333";ctx.fillRect(-2,-18,5,28);ctx.fillStyle=it.tier>=3?"#c7c9c5":it.tier===2?"#8e9491":"#b38b5b";ctx.fillRect(-10,-22,18,5)}
 else if(it.tool==="pick"){ctx.fillStyle="#7a5333";ctx.fillRect(-2,-18,5,28);ctx.fillStyle=it.tier>=3?"#c7c9c5":it.tier===2?"#8e9491":"#b38b5b";ctx.fillRect(-13,-22,26,6);ctx.fillRect(-13,-18,5,5)}
 else if(it.tool==="bow"){ctx.strokeStyle="#ad7647";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-9,13,-1.2,1.2);ctx.stroke();ctx.strokeStyle="#ddd2b4";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(5,-21);ctx.lineTo(5,3);ctx.stroke()}
 else if(id==="torch"){ctx.fillStyle="#704828";ctx.fillRect(-2,-17,5,22);ctx.fillStyle="#ff9b2d";ctx.fillRect(-5,-23,11,9)}
 else if(it.place){ctx.fillStyle=id==="stoneWall"?"#777d79":id==="abyssBlock"?"#2d2630":"#98704b";ctx.fillRect(-9,-19,18,18);ctx.strokeStyle="#302822";ctx.lineWidth=2;ctx.strokeRect(-9,-19,18,18)}
 ctx.restore()
}
function drawPlayerSprite(x,y,color,remote,dx,dy){
 const p=worldToScreen(x,y),swim=terrainAt(x,y)==="water",moving=Math.abs(dx||0)+Math.abs(dy||0)>.15,step=moving?Math.sin(performance.now()*.012)*3:0;
 const main=color==="purple"?"#8b5cf6":"#f472b6",dark=color==="purple"?"#503496":"#9d456e",skin="#e8b996";
 ctx.save();ctx.translate(p.x,p.y);
 ctx.fillStyle="rgba(0,0,0,.23)";ctx.fillRect(-15,19,30,7);
 // piernas
 ctx.fillStyle="#2d3340";ctx.fillRect(-11,9+step,8,16);ctx.fillRect(3,9-step,8,16);
 // torso
 ctx.fillStyle=main;ctx.strokeStyle="#302a35";ctx.lineWidth=3;ctx.fillRect(-15,-10,30,25);ctx.strokeRect(-15,-10,30,25);
 ctx.fillStyle=dark;ctx.fillRect(-15,8,30,7);if(!remote&&state.armor){ctx.strokeStyle=state.armor==="ironArmor"?"#c9cecb":"#9d754f";ctx.lineWidth=4;ctx.strokeRect(-13,-8,26,19)}
 // brazos
 ctx.fillStyle=skin;ctx.fillRect(-21,-7,7,20);ctx.fillRect(14,-7,7,20);
 // cabeza
 ctx.fillStyle=skin;ctx.fillRect(-13,-31,26,22);ctx.strokeStyle="#382d32";ctx.strokeRect(-13,-31,26,22);
 ctx.fillStyle=dark;ctx.fillRect(-13,-31,26,6);ctx.fillRect(-13,-27,5,8);
 // cara orientada
 const ex=Math.max(-2,Math.min(2,(dx||0)*2)),ey=Math.max(-1,Math.min(2,(dy||0)*1.4));
 ctx.fillStyle="#fff";ctx.fillRect(-8+ex,-22+ey,5,5);ctx.fillRect(4+ex,-22+ey,5,5);ctx.fillStyle="#2b2730";ctx.fillRect(-6+ex,-20+ey,2,2);ctx.fillRect(6+ex,-20+ey,2,2);
 ctx.fillStyle="#8f5555";ctx.fillRect(-4,-13,8,2);
 const id=remote?remotePlayer?.selected:selectedItem();drawHeldTool(id,dx,dy);
 if(swim){const pulse=Math.sin(performance.now()*.008)*2;ctx.strokeStyle="rgba(207,244,250,.75)";ctx.lineWidth=2;ctx.strokeRect(-25-pulse,-1,50+pulse*2,28+pulse)}
 ctx.restore()
}
function drawMobs(){const list=mobs.filter(m=>!m.dead&&m.layer===layerKey()).sort((a,b)=>a.y-b.y);for(const m of list){const p=worldToScreen(m.x,m.y);if(p.x<-70||p.y<-70||p.x>CW+70||p.y>CH+70)continue;ctx.save();ctx.translate(p.x,p.y);if(m.hit>0)ctx.globalAlpha=.55;drawMobShape(m);ctx.restore()}}
function drawMobShape(m){ctx.fillStyle="rgba(0,0,0,.20)";ctx.fillRect(-17,17,34,7);
 if(m.type==="cow"){ctx.fillStyle="#eee5d5";ctx.strokeStyle="#4c4138";ctx.lineWidth=3;ctx.fillRect(-20,-13,39,29);ctx.strokeRect(-20,-13,39,29);ctx.fillStyle="#725440";ctx.fillRect(-13,-8,9,9);ctx.fillRect(5,2,9,8);ctx.fillStyle="#d9b699";ctx.fillRect(15,-7,12,13)}
 else if(m.type==="sheep"){ctx.fillStyle="#f7f4e9";ctx.strokeStyle="#676359";ctx.lineWidth=3;ctx.fillRect(-20,-14,38,29);ctx.strokeRect(-20,-14,38,29);ctx.fillStyle="#ded9cd";ctx.fillRect(-16,-18,30,7);ctx.fillStyle="#7c7468";ctx.fillRect(15,-7,12,14)}
 else if(m.type==="pig"){ctx.fillStyle="#eb99ac";ctx.strokeStyle="#774d59";ctx.lineWidth=3;ctx.fillRect(-19,-13,37,28);ctx.strokeRect(-19,-13,37,28);ctx.fillStyle="#f4b0bf";ctx.fillRect(14,-6,14,13);ctx.fillStyle="#984f62";ctx.fillRect(18,-2,2,2);ctx.fillRect(23,-2,2,2)}
 else if(m.type==="chicken"){ctx.fillStyle="#fff9ee";ctx.strokeStyle="#6d675e";ctx.lineWidth=3;ctx.fillRect(-14,-13,27,27);ctx.strokeRect(-14,-13,27,27);ctx.fillStyle="#d4aa35";ctx.fillRect(12,-5,12,8);ctx.fillStyle="#d84e4e";ctx.fillRect(-1,-18,8,5)}
 else if(m.type==="zombie"){ctx.fillStyle="#70905f";ctx.strokeStyle="#35442f";ctx.lineWidth=4;ctx.fillRect(-17,-18,34,38);ctx.strokeRect(-17,-18,34,38);ctx.fillStyle="#a3c58e";ctx.fillRect(-11,-12,22,12);ctx.fillStyle="#e7efcf";ctx.fillRect(-7,-9,4,4);ctx.fillRect(4,-9,4,4)}
 else if(m.type==="spider"){ctx.strokeStyle="#2e2929";ctx.lineWidth=5;for(let i=0;i<4;i++){const yy=-13+i*9;ctx.beginPath();ctx.moveTo(-8,yy);ctx.lineTo(-25,yy-7);ctx.moveTo(8,yy);ctx.lineTo(25,yy-7);ctx.stroke()}ctx.fillStyle="#4a3e3d";ctx.fillRect(-14,-13,28,26);ctx.fillStyle="#db6060";ctx.fillRect(-8,-7,4,4);ctx.fillRect(4,-7,4,4)}
 else if(m.type==="skeleton"){ctx.fillStyle="#dedad0";ctx.fillRect(-10,-19,20,15);ctx.fillRect(-4,-4,8,25);ctx.fillRect(-17,2,34,6);ctx.fillRect(-13,19,7,13);ctx.fillRect(6,19,7,13);ctx.fillStyle="#5a5650";ctx.fillRect(-6,-14,4,4);ctx.fillRect(3,-14,4,4);ctx.strokeStyle="#80613f";ctx.lineWidth=3;ctx.strokeRect(14,-12,8,27)}
 else if(m.type==="crimson"){ctx.fillStyle="#732f3c";ctx.strokeStyle="#351821";ctx.lineWidth=4;ctx.fillRect(-17,-16,34,34);ctx.strokeRect(-17,-16,34,34);ctx.fillStyle="#ffb0a0";ctx.fillRect(-9,-8,5,4);ctx.fillRect(4,-8,5,4);ctx.fillStyle="#9e4150";ctx.fillRect(-22,4,44,8)}
 else if(m.type==="abyssGuardian"){ctx.fillStyle="#2a202a";ctx.strokeStyle="#c34255";ctx.lineWidth=5;ctx.fillRect(-25,-30,50,58);ctx.strokeRect(-25,-30,50,58);ctx.fillStyle="#e85b6b";ctx.fillRect(-15,-17,10,7);ctx.fillRect(5,-17,10,7);ctx.fillStyle="#8b2838";ctx.fillRect(-32,2,64,12)}
 else if(m.type==="void"){ctx.fillStyle="#29223a";ctx.strokeStyle="#17131d";ctx.lineWidth=4;ctx.fillRect(-11,-25,22,51);ctx.strokeRect(-11,-25,22,51);ctx.fillStyle="#b58aff";ctx.fillRect(-7,-12,5,3);ctx.fillRect(3,-12,5,3)}
 if(m.hp<m.maxHp){ctx.fillStyle="rgba(0,0,0,.5)";ctx.fillRect(-20,-34,40,4);ctx.fillStyle=m.animal?"#79a975":"#c35654";ctx.fillRect(-20,-34,40*(m.hp/m.maxHp),4)}}
function drawProjectiles(){for(const p of projectiles){if(p.layer!==layerKey())continue;const s=worldToScreen(p.x,p.y);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(p.vy,p.vx));ctx.strokeStyle=p.owner==="player"?"#f1d883":"#ded9cf";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke();ctx.restore()}}
function drawFishing(){if(!fishing)return;const a=worldToScreen(state.x,state.y),b=worldToScreen(fishing.x,fishing.y);ctx.strokeStyle="#f0ebd9";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.fillStyle=fishing.done?"#d85050":"#d4ad3d";ctx.fillRect(b.x-4,b.y-4,8,8)}
function drawParticles(){for(const p of particles){const s=worldToScreen(p.x,p.y);ctx.globalAlpha=Math.max(0,p.life/.7);ctx.fillStyle=p.color;ctx.fillRect(s.x-3,s.y-3,6,6)}ctx.globalAlpha=1}
function drawPartnerPing(){if(!partnerPing||partnerPing.until<Date.now()||partnerPing.layer!==layerKey())return;const p=worldToScreen(partnerPing.x,partnerPing.y),pulse=1+Math.sin(performance.now()*.01)*.12;ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse,pulse);ctx.font="28px sans-serif";ctx.textAlign="center";ctx.fillText("📍",0,-30);ctx.restore()}
function lightHole(x,y,r){
 const g=lctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.55,"rgba(0,0,0,.8)");g.addColorStop(1,"rgba(0,0,0,0)");
 lctx.fillStyle=g;lctx.beginPath();lctx.arc(x,y,r,0,Math.PI*2);lctx.fill()
}
function drawLighting(){
 let alpha=0,color="rgba(5,8,12,.7)";
 if(layer==="surface"){
   const p=(worldTime%480)/480;if(p>.70)alpha=Math.min(.48,(p-.70)/.18*.48);else if(p<.12)alpha=Math.min(.48,(.12-p)/.12*.48)
 }else if(layer==="cave"){alpha=.66;color="rgba(4,5,7,.78)"}
 else if(layer==="abyss"){alpha=.42;color="rgba(24,5,12,.66)"}
 if(alpha<=.01)return;
 lctx.clearRect(0,0,CW,CH);lctx.globalCompositeOperation="source-over";lctx.fillStyle=color.replace(/[\d.]+\)$/,(alpha)+")");lctx.fillRect(0,0,CW,CH);
 lctx.globalCompositeOperation="destination-out";
 const pp=worldToScreen(state.x,state.y);lightHole(pp.x,pp.y,layer==="surface"?90:76);
 const b=visibleBounds();for(let y=b.y0;y<=b.y1;y++)for(let x=b.x0;x<=b.x1;x++){const o=staticObjectAt(x,y);if(o?.type==="torch"||o?.type==="campfire"||o?.type==="portal"||o?.type==="portalReturn"){const p=worldToScreen(x+.5,y+.5);lightHole(p.x,p.y,o.type==="torch"?150:125)}}
 lctx.globalCompositeOperation="source-over";ctx.drawImage(lightCanvas,0,0,lightCanvas.width,lightCanvas.height,0,0,CW,CH)
}

function tone(freq,dur=.05,vol=.014){if(!soundOn)return;try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==="suspended")audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type="triangle";o.frequency.value=freq;g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}

$("continueBtn").onclick=()=>startSolo(false);
$("newSoloBtn").onclick=()=>{if(loadGame()&&!confirm("¿Crear un mundo nuevo? La partida individual anterior será reemplazada."))return;startSolo(true)};
$("duoBtn").onclick=startDuo;$("howBtn").onclick=()=>setScreen("how");$("howCloseBtn").onclick=$("howOkBtn").onclick=()=>setScreen("menu");
$("pauseBtn").onclick=()=>{renderStats();showModal("pauseModal")};$("resumeBtn").onclick=()=>{state.worldName=($("worldNameInput").value.trim()||"Nuestro mundo").slice(0,24);hideModal("pauseModal")};$("saveBtn").onclick=()=>{state.worldName=($("worldNameInput").value.trim()||"Nuestro mundo").slice(0,24);saveGame(true);renderStats()};$("quitBtn").onclick=()=>{saveGame(false);running=false;cancelAnimationFrame(raf);closeAllModals();online.disconnect();releaseLandscape();setScreen("menu");updateMenuStats()};
$("inventoryBtn").onclick=()=>{showModal("inventoryModal");renderInventory();renderEquipSlotPicker();renderRecipes();renderAchievements()};$("inventoryCloseBtn").onclick=()=>hideModal("inventoryModal");
$("chestCloseBtn").onclick=()=>{activeChest=null;hideModal("chestModal")};$("mapBtn").onclick=()=>{showModal("mapModal");renderMap()};$("mapCloseBtn").onclick=()=>hideModal("mapModal");
$("furnaceCloseBtn").onclick=()=>hideModal("furnaceModal");$("messageOkBtn").onclick=()=>hideModal("messageModal");$("cancelDuoBtn").onclick=()=>{hideModal("duoConnectingModal",false);online.disconnect()};
$("markerCloseBtn").onclick=cancelMarkerPlacement;$("markerSaveBtn").onclick=savePendingMarker;
document.querySelectorAll(".marker-presets button").forEach(b=>b.onclick=()=>{markerPreset={icon:b.dataset.markerIcon||"🚩",label:b.dataset.markerLabel||"Marcador"};document.querySelectorAll(".marker-presets button").forEach(x=>x.classList.toggle("selected",x===b))});
$("attackBtn").addEventListener("pointerdown",e=>{e.preventDefault();attack()});$("useBtn").addEventListener("pointerdown",e=>{e.preventDefault();useAction()});
const placeButton=$("placeBtn");const stopPlaceHold=()=>{if(placeHoldTimer){clearInterval(placeHoldTimer);placeHoldTimer=null}};placeButton.addEventListener("pointerdown",e=>{e.preventDefault();placeAction();stopPlaceHold();placeHoldTimer=setInterval(()=>{if(!paused&&selectedDef()?.place)placeAction()},190)});placeButton.addEventListener("pointerup",stopPlaceHold);placeButton.addEventListener("pointercancel",stopPlaceHold);placeButton.addEventListener("pointerleave",stopPlaceHold);
$("soundBtn").onclick=()=>{soundOn=!soundOn;$("soundBtn").textContent=soundOn?"♪":"×"};
$("duoQuickBtn").onclick=e=>{e.stopPropagation();$("duoQuickPanel").classList.toggle("show")};document.querySelectorAll("#duoQuickPanel [data-emote]").forEach(b=>b.onclick=()=>{sendEmote(b.dataset.emote);$("duoQuickPanel").classList.remove("show")});$("pingPartnerBtn").onclick=()=>{pingPartner();$("duoQuickPanel").classList.remove("show")};$("giftPartnerBtn").onclick=()=>{giftSelectedItem();$("duoQuickPanel").classList.remove("show")};$("tutorialSkipBtn").onclick=()=>{state.tutorialDone=true;ui.tutorialCard.classList.remove("show")};

document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-page").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.tab+"Tab").classList.add("active");if(t.dataset.tab==="craft")renderRecipes();if(t.dataset.tab==="achievements")renderAchievements()});
addEventListener("keydown",e=>{keys[e.code]=true;if(/^Digit[1-9]$/.test(e.code)){selectedSlot=Number(e.code.slice(-1))-1;updateHotbar()}if(e.code==="Space"){e.preventDefault();attack()}if(e.code==="KeyE")useAction();if(e.code==="KeyF")placeAction();if(e.code==="KeyI"){$("inventoryModal").classList.contains("show")?hideModal("inventoryModal"):$("inventoryBtn").click()}if(e.code==="Escape"&&screens.game.classList.contains("active"))showModal("pauseModal")});addEventListener("keyup",e=>keys[e.code]=false);
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running){saveGame(false);showModal("pauseModal")}});
function setupStick(){const stick=$("moveStick"),knob=stick.querySelector(".stick-knob");let active=false,pid=null;const center=()=>{const r=stick.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,max:r.width*.34}};const move=e=>{if(!active||e.pointerId!==pid)return;const c=center(),dx=e.clientX-c.x,dy=e.clientY-c.y,l=Math.hypot(dx,dy),k=l?Math.min(1,l/c.max):0;moveInput.x=dx/(l||1)*k;moveInput.y=dy/(l||1)*k;knob.style.transform=`translate(${moveInput.x*c.max}px,${moveInput.y*c.max}px)`};stick.addEventListener("pointerdown",e=>{active=true;pid=e.pointerId;stick.setPointerCapture?.(pid);move(e)});stick.addEventListener("pointermove",move);const up=e=>{if(e.pointerId!==pid)return;active=false;pid=null;moveInput.x=moveInput.y=0;knob.style.transform=""};stick.addEventListener("pointerup",up);stick.addEventListener("pointercancel",up)}
setupStick();
updateMenuStats();updateHotbar();setScreen("menu");
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
addEventListener("pagehide",releaseLandscape);
})();
