self.addEventListener("install",()=>self.skipWaiting());

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>{
        const n=k.toLowerCase();
        return n.startsWith("burbuja-shell");
      }).map(k=>caches.delete(k)));
      await self.registration.unregister();
    }catch{}
  })());
});

/* Intencionalmente NO hay listener fetch. */
