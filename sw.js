/* 走你 · Service Worker · 离线缓存（cache-first） */
const CACHE='zouni-v20';
const ASSETS=['./','./index.html','./privacy.html','./manifest.webmanifest','./icon.svg','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  const isDoc = e.request.mode==='navigate' || /\.(html|md|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if(isDoc){
    /* 文档 network-first：先拿线上最新，失败再回缓存（避免旧版长期驻留） */
    e.respondWith(fetch(e.request).then(r=>{
      const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return r;
    }).catch(()=>caches.match(e.request)));
  }else{
    /* 静态资源 cache-first */
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      const cp=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return r;
    })));
  }
});
