const OLD_PREFIXES=["burbuja-shell","burbuja-root-v9","burbuja-v11","burbuja-v12"];
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>{event.waitUntil((async()=>{try{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>OLD_PREFIXES.some(p=>k.startsWith(p))).map(k=>caches.delete(k)));
  await self.registration.unregister();
}catch{}})())});
