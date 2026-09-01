class BurbujaHambrientaOnline {
  constructor(){
    this.ready=false;this.uid=null;this.partnerUid=null;this.role="one";this.isHost=false;
    this.session=null;this.runtime=null;this.partner=null;this.profile=null;this.partnerProfile=null;
    this.unsubs=[];this.signalSeq=-1;this.lastStateWrite=0;this.lastRuntimeWrite=0;this.lastHostCheck=0;
    this.onSessionCb=null;this.onRuntimeCb=null;this.onPartnerCb=null;this.onSignalCb=null;
  }
  async load(){
    if(this.ready)return;
    const V="12.18.0";
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
    ]);
    this.mods={...appMod,...authMod,...fsMod};
    const apps=appMod.getApps();
    this.app=apps.length?apps[0]:appMod.initializeApp(window.BURBUJA_FIREBASE_CONFIG);
    this.auth=authMod.getAuth(this.app);
    if(this.auth.authStateReady)await this.auth.authStateReady();
    this.db=fsMod.getFirestore(this.app);this.ready=true;
  }
  async connect(statusCb=()=>{}){
    await this.load();
    const {doc,getDoc,getDocs,collection,setDoc,onSnapshot,serverTimestamp}=this.mods;
    const user=this.auth.currentUser;if(!user)throw new Error("NO_AUTH");
    this.uid=user.uid;
    statusCb("Comprobando a los dos miembros de Burbuja...");

    const [oneSnap,twoSnap]=await Promise.all([
      getDoc(doc(this.db,"slots","one")),getDoc(doc(this.db,"slots","two"))
    ]);
    if(!oneSnap.exists()||!twoSnap.exists())throw new Error("NO_PARTNER");
    const oneUid=oneSnap.data().uid,twoUid=twoSnap.data().uid;
    if(this.uid!==oneUid&&this.uid!==twoUid)throw new Error("NOT_MEMBER");
    this.role=this.uid===oneUid?"one":"two";
    this.partnerUid=this.uid===oneUid?twoUid:oneUid;

    const [meSnap,partnerSnap]=await Promise.all([
      getDoc(doc(this.db,"profiles",this.uid)),getDoc(doc(this.db,"profiles",this.partnerUid))
    ]);
    this.profile=meSnap.exists()?meSnap.data():{};
    this.partnerProfile=partnerSnap.exists()?partnerSnap.data():{};

    const sessionRef=doc(this.db,"games","burbuja_hambrienta_session");
    const runtimeRef=doc(this.db,"games","burbuja_hambrienta_runtime");
    const myPlayerRef=doc(this.db,"games",`burbuja_hambrienta_player_${this.uid}`);
    const partnerPlayerRef=doc(this.db,"games",`burbuja_hambrienta_player_${this.partnerUid}`);
    const signalRef=doc(this.db,"games",`burbuja_hambrienta_signal_${this.uid}`);
    const existingSignal=await getDoc(signalRef);
    if(existingSignal.exists()&&typeof existingSignal.data().seq==="number")this.signalSeq=existingSignal.data().seq;

    let sessionSnap=await getDoc(sessionRef);
    if(!sessionSnap.exists()){
      const seed=crypto.getRandomValues(new Uint32Array(1))[0]>>>0;
      await setDoc(sessionRef,{version:1,seed,level:1,score:0,lives:5,eaten:0,status:"playing",pellets:[],powerups:[],powerUntil:0,bonus:0,updatedAt:Date.now(),createdAt:serverTimestamp()});
      sessionSnap=await getDoc(sessionRef);
    }
    let runtimeSnap=await getDoc(runtimeRef);
    if(!runtimeSnap.exists()){
      await setDoc(runtimeRef,{hostUid:this.uid,hostHeartbeat:Date.now(),level:sessionSnap.data().level,enemies:[],updatedAt:Date.now()});
      runtimeSnap=await getDoc(runtimeRef);
    }
    this.session=sessionSnap.data();this.runtime=runtimeSnap.data();this.isHost=this.runtime.hostUid===this.uid;
    const selfSnap=await getDoc(myPlayerRef);const selfState=selfSnap.exists()?selfSnap.data():null;

    statusCb(this.isHost?"Tú controlas las entidades de esta partida.":"Entrando al templo compartido...");

    this.unsubs.push(onSnapshot(sessionRef,s=>{if(s.exists()){this.session=s.data();this.onSessionCb?.(this.session)}}));
    this.unsubs.push(onSnapshot(runtimeRef,s=>{if(s.exists()){this.runtime=s.data();this.isHost=this.runtime.hostUid===this.uid;this.onRuntimeCb?.(this.runtime,this.isHost)}}));
    this.unsubs.push(onSnapshot(partnerPlayerRef,s=>{this.partner=s.exists()?s.data():null;this.onPartnerCb?.(this.partner,this.partnerProfile)}));
    this.unsubs.push(onSnapshot(signalRef,s=>{
      if(!s.exists())return;const d=s.data();
      if(typeof d.seq==="number"&&d.seq>this.signalSeq){this.signalSeq=d.seq;this.onSignalCb?.(d)}
    }));

    return {session:this.session,runtime:this.runtime,isHost:this.isHost,role:this.role,partnerProfile:this.partnerProfile,selfState};
  }
  onSession(cb){this.onSessionCb=cb}
  onRuntime(cb){this.onRuntimeCb=cb}
  onPartner(cb){this.onPartnerCb=cb}
  onSignal(cb){this.onSignalCb=cb}

  async publishPlayer(state){
    if(!this.uid)return;const now=Date.now();if(now-this.lastStateWrite<260)return;this.lastStateWrite=now;
    const {doc,setDoc}=this.mods;
    try{await setDoc(doc(this.db,"games",`burbuja_hambrienta_player_${this.uid}`),{...state,uid:this.uid,role:this.role,updatedAt:now},{merge:true})}catch{}
  }
  async publishRuntime(enemies,level){
    if(!this.isHost||!this.uid)return;const now=Date.now();if(now-this.lastRuntimeWrite<420)return;this.lastRuntimeWrite=now;
    const {doc,setDoc}=this.mods;
    try{await setDoc(doc(this.db,"games","burbuja_hambrienta_runtime"),{hostUid:this.uid,hostHeartbeat:now,level,enemies,updatedAt:now},{merge:true})}catch{}
  }
  async collect(kind,key,total,level,bonus){
    if(!this.uid)return false;
    const {doc,runTransaction}=this.mods;const ref=doc(this.db,"games","burbuja_hambrienta_session");
    try{
      let won=false;
      await runTransaction(this.db,async tx=>{
        const s=await tx.get(ref);if(!s.exists())return;const d=s.data();
        if(d.status!=="playing"||d.level!==level)return;
        const pellets=[...(d.pellets||[])],powerups=[...(d.powerups||[])];
        const arr=kind==="power"?powerups:pellets;if(arr.includes(key))return;
        arr.push(key);let score=(d.score||0)+(kind==="power"?75:10);let powerUntil=d.powerUntil||0;
        if(kind==="power")powerUntil=Math.max(powerUntil,Date.now()+Math.max(6000,8800-level*150));
        const patch={pellets,powerups,score,powerUntil,updatedAt:Date.now()};
        if(pellets.length+powerups.length>=total){patch.status="levelComplete";patch.bonus=bonus;patch.score=score+bonus;won=true}
        tx.update(ref,patch);
      });
      return true;
    }catch{return false}
  }
  async awardEnemy(points=250){
    const {doc,runTransaction}=this.mods;const ref=doc(this.db,"games","burbuja_hambrienta_session");
    try{await runTransaction(this.db,async tx=>{const s=await tx.get(ref);if(!s.exists())return;const d=s.data();if(d.status!=="playing")return;tx.update(ref,{score:(d.score||0)+points,eaten:(d.eaten||0)+1,updatedAt:Date.now()})})}catch{}
  }
  async damage(victimUid){
    if(!this.isHost)return;
    const {doc,runTransaction,setDoc}=this.mods;const ref=doc(this.db,"games","burbuja_hambrienta_session");
    let newLives=null,status="playing";
    try{
      await runTransaction(this.db,async tx=>{const s=await tx.get(ref);if(!s.exists())return;const d=s.data();if(d.status!=="playing")return;newLives=Math.max(0,(d.lives||0)-1);status=newLives<=0?"gameover":"playing";tx.update(ref,{lives:newLives,status,updatedAt:Date.now()})});
      if(newLives!==null){const sig=doc(this.db,"games",`burbuja_hambrienta_signal_${victimUid}`);await setDoc(sig,{seq:Date.now(),type:status==="gameover"?"gameover":"respawn",at:Date.now()},{merge:true})}
    }catch{}
  }
  async advanceLevel(seed){
    const {doc,runTransaction}=this.mods;const ref=doc(this.db,"games","burbuja_hambrienta_session");
    try{await runTransaction(this.db,async tx=>{const s=await tx.get(ref);if(!s.exists())return;const d=s.data();if(d.status!=="levelComplete")return;tx.update(ref,{level:(d.level||1)+1,seed:seed>>>0,status:"playing",pellets:[],powerups:[],powerUntil:0,bonus:0,updatedAt:Date.now()})})}catch{}
  }
  async resetGame(seed){
    if(!this.uid)return;
    const {doc,setDoc}=this.mods;
    try{
      await setDoc(doc(this.db,"games","burbuja_hambrienta_session"),{version:1,seed:seed>>>0,level:1,score:0,lives:5,eaten:0,status:"playing",pellets:[],powerups:[],powerUntil:0,bonus:0,updatedAt:Date.now()},{merge:true});
      await setDoc(doc(this.db,"games","burbuja_hambrienta_runtime"),{hostUid:this.uid,hostHeartbeat:Date.now(),level:1,enemies:[],updatedAt:Date.now()},{merge:true});
    }catch{}
  }
  async tickHost(){
    if(!this.uid||this.isHost)return;const now=Date.now();if(now-this.lastHostCheck<2500)return;this.lastHostCheck=now;
    if(!this.runtime||now-(this.runtime.hostHeartbeat||0)<12000)return;
    const {doc,runTransaction}=this.mods;const ref=doc(this.db,"games","burbuja_hambrienta_runtime");
    try{await runTransaction(this.db,async tx=>{const s=await tx.get(ref);if(!s.exists())return;const d=s.data();if(Date.now()-(d.hostHeartbeat||0)<12000)return;tx.update(ref,{hostUid:this.uid,hostHeartbeat:Date.now(),updatedAt:Date.now()})})}catch{}
  }
  disconnect(){
    this.unsubs.forEach(u=>{try{u()}catch{}});this.unsubs=[];this.uid=null;this.partnerUid=null;this.partner=null;this.session=null;this.runtime=null;this.isHost=false;
  }
}
window.BurbujaHambrientaOnline=BurbujaHambrientaOnline;
