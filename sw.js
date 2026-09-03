self.addEventListener("install",()=>self.skipWaiting());

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>{
        const n=k.toLowerCase();
        return n.startsWith("burbuja-root")||n.startsWith("burbuja-shell");
      }).map(k=>caches.delete(k)));

      await self.registration.unregister();
      const clientsList=await self.clients.matchAll({type:"window",includeUncontrolled:true});
      for(const client of clientsList){
        try{client.postMessage({type:"BURBUJA_SW_REMOVED"})}catch{}
      }
    }catch{}
  })());
});

/* Intencionalmente NO hay listener fetch. */
