const OLD_PREFIX="burbuja-shell";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>{event.waitUntil((async()=>{try{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith(OLD_PREFIX)).map(k=>caches.delete(k)));await self.registration.unregister();const clientsList=await self.clients.matchAll({type:"window"});clientsList.forEach(c=>c.navigate(c.url));}catch{}})())});
