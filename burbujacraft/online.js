class BurbujacraftOnline {
  constructor(){
    this.ready=false;this.mode="offline";this.uid=null;this.partnerUid=null;this.partnerProfile=null;
    this.world=null;this.isHost=false;this.partnerState=null;this.remoteMobs=[];
    this.unsubs=[];this.chunkUnsubs=new Map();this.modsCallback=null;this.partnerCallback=null;this.mobsCallback=null;this.actionCallback=null;
    this.seq=0;this.lastActionSeq=-1;this.lastStateWrite=0;this.lastMobWrite=0;this.lastHeartbeat=0;
  }
  async loadFirebase(){
    if(this.ready)return true;
    const V="12.18.0";
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    this.mods={...appMod,...authMod,...fsMod};
    const apps=appMod.getApps();
    this.app=apps.length?apps[0]:appMod.initializeApp(window.BURBUJA_FIREBASE_CONFIG);
    this.auth=authMod.getAuth(this.app);this.db=fsMod.getFirestore(this.app);
    if(this.auth.authStateReady)await this.auth.authStateReady();
    this.ready=true;return true;
  }
  async currentMember(){
    await this.loadFirebase();const user=this.auth.currentUser;if(!user)return null;this.uid=user.uid;return user;
  }
  async initPointSync(){try{return !!(await this.currentMember())}catch{return false}}
  async connectDuo(statusCb=()=>{}){
    await this.loadFirebase();
    const {doc,getDoc,setDoc,getDocs,collection,onSnapshot,serverTimestamp,updateDoc}=this.mods;
    const user=this.auth.currentUser;if(!user)throw new Error("NO_AUTH");this.uid=user.uid;
    statusCb("Buscando a la otra persona de Burbuja...");
    const profiles=await getDocs(collection(this.db,"profiles"));let partner=null;
    profiles.forEach(s=>{const d=s.data();if(d.uid&&d.uid!==this.uid)partner=d});
    if(!partner)throw new Error("NO_PARTNER");this.partnerUid=partner.uid;this.partnerProfile=partner;

    const worldRef=doc(this.db,"games","burbujacraft_world_v3");
    let snap=await getDoc(worldRef);
    if(!snap.exists()){
      const seed=(Date.now()^Math.floor(Math.random()*0x7fffffff))>>>0;
      await setDoc(worldRef,{seed,hostUid:this.uid,hostHeartbeat:Date.now(),worldTime:0,createdAt:serverTimestamp(),version:3});
      snap=await getDoc(worldRef);
    }
    this.world=snap.data();this.isHost=this.world.hostUid===this.uid;this.mode="duo";

    this.unsubs.push(onSnapshot(worldRef,async s=>{
      if(!s.exists())return;this.world=s.data();const was=this.isHost;this.isHost=this.world.hostUid===this.uid;
      if(!this.isHost&&Date.now()-(this.world.hostHeartbeat||0)>14000){try{await updateDoc(worldRef,{hostUid:this.uid,hostHeartbeat:Date.now()})}catch{}}
      if(was!==this.isHost&&this.mobsCallback)this.mobsCallback(this.remoteMobs,this.isHost);
    }));

    const partnerRef=doc(this.db,"games",`burbujacraft_v3_player_${this.partnerUid}`);
    this.unsubs.push(onSnapshot(partnerRef,s=>{
      this.partnerState=s.exists()?s.data():null;if(this.partnerCallback)this.partnerCallback(this.partnerState,this.partnerProfile);
    }));

    const mobsRef=doc(this.db,"games","burbujacraft_v3_mobs");
    this.unsubs.push(onSnapshot(mobsRef,s=>{
      if(!this.isHost&&s.exists()){this.remoteMobs=s.data().mobs||[];if(this.mobsCallback)this.mobsCallback(this.remoteMobs,false)}
    }));

    const actionRef=doc(this.db,"games",`burbujacraft_v3_action_${this.partnerUid}`);
    this.unsubs.push(onSnapshot(actionRef,s=>{
      if(!s.exists())return;const d=s.data();
      if(typeof d.seq==="number"&&d.seq>this.lastActionSeq){this.lastActionSeq=d.seq;if(this.actionCallback)this.actionCallback(d.action,d.uid)}
    }));

    statusCb(this.isHost?"Tú alojas las criaturas del mundo compartido.":"Entrando al mundo compartido...");
    return {seed:this.world.seed,isHost:this.isHost,partner};
  }
  onPartner(cb){this.partnerCallback=cb} onMobs(cb){this.mobsCallback=cb} onAction(cb){this.actionCallback=cb} onMods(cb){this.modsCallback=cb}
  async publishState(state){
    if(this.mode!=="duo"||!this.uid)return;const now=Date.now();if(now-this.lastStateWrite<550)return;this.lastStateWrite=now;
    const {doc,setDoc}=this.mods;try{await setDoc(doc(this.db,"games",`burbujacraft_v3_player_${this.uid}`),{...state,uid:this.uid,lastSeen:now},{merge:true})}catch{}
  }
  async publishMobs(mobs){
    if(this.mode!=="duo"||!this.isHost)return;const now=Date.now();if(now-this.lastMobWrite<1100)return;this.lastMobWrite=now;
    const {doc,setDoc}=this.mods;try{await setDoc(doc(this.db,"games","burbujacraft_v3_mobs"),{hostUid:this.uid,updatedAt:now,mobs:mobs.slice(0,24)},{merge:true})}catch{}
  }
  async heartbeat(worldTime){
    if(this.mode!=="duo"||!this.isHost)return;const now=Date.now();if(now-this.lastHeartbeat<5000)return;this.lastHeartbeat=now;
    const {doc,updateDoc}=this.mods;try{await updateDoc(doc(this.db,"games","burbujacraft_world_v3"),{hostHeartbeat:now,worldTime})}catch{}
  }
  async sendAction(action){
    if(this.mode!=="duo"||!this.uid)return;const {doc,setDoc}=this.mods;
    try{this.seq++;await setDoc(doc(this.db,"games",`burbujacraft_v3_action_${this.uid}`),{uid:this.uid,seq:this.seq,action,ts:Date.now()},{merge:true})}catch{}
  }
  chunkId(layer,x,y){
    const cx=Math.floor(x/16),cy=Math.floor(y/16),safe=String(layer).replace(/[^a-zA-Z0-9_-]/g,"_");
    return {id:`burbujacraft_v3_chunk_${safe}_${cx}_${cy}`,cx,cy,safe};
  }
  watchChunks(layer,x,y){
    if(this.mode!=="duo")return;const {doc,onSnapshot}=this.mods,center=this.chunkId(layer,x,y),needed=new Set();
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const id=`burbujacraft_v3_chunk_${center.safe}_${center.cx+dx}_${center.cy+dy}`;needed.add(id);
      if(!this.chunkUnsubs.has(id)){
        const unsub=onSnapshot(doc(this.db,"games",id),s=>{if(s.exists()&&this.modsCallback)this.modsCallback(id,s.data().mods||{})});
        this.chunkUnsubs.set(id,unsub);
      }
    }
    for(const [id,unsub] of this.chunkUnsubs){if(!needed.has(id)){try{unsub()}catch{}this.chunkUnsubs.delete(id)}}
  }
  async syncMod(layer,x,y,value){
    if(this.mode!=="duo")return;
    const {doc,setDoc,updateDoc,FieldPath}=this.mods,{id}=this.chunkId(layer,x,y),key=`${Math.floor(x)}_${Math.floor(y)}`,ref=doc(this.db,"games",id);
    try{
      await setDoc(ref,{mods:{},updatedAt:Date.now()},{merge:true});
      await updateDoc(ref,new FieldPath("mods",key),value,"updatedAt",Date.now());
    }catch{}
  }
  async awardPoints(eventId,amount,reason){
    try{
      const user=await this.currentMember();if(!user)return false;const {doc,runTransaction}=this.mods;
      const ref=doc(this.db,"shared","burbujacraftPoints"),uid=user.uid,claimKey=(uid+"_"+eventId).replace(/[^a-zA-Z0-9_-]/g,"_");
      await runTransaction(this.db,async tx=>{
        const s=await tx.get(ref),data=s.exists()?s.data():{},claimed=data.claimed||{};if(claimed[claimKey])return;
        const byUid={...(data.byUid||{})};byUid[uid]=(byUid[uid]||0)+amount;claimed[claimKey]={amount,reason,at:Date.now()};
        tx.set(ref,{byUid,total:(data.total||0)+amount,claimed,updatedAt:Date.now()},{merge:true});
      });return true;
    }catch{return false}
  }
  disconnect(){
    this.mode="offline";this.unsubs.forEach(u=>{try{u()}catch{}});this.unsubs=[];
    for(const [,u] of this.chunkUnsubs){try{u()}catch{}}this.chunkUnsubs.clear();
    this.partnerState=null;this.remoteMobs=[];this.isHost=false;this.world=null;
  }
}
window.BurbujacraftOnline=BurbujacraftOnline;
