// Taco çevrimdışı çalışma dosyası (service worker) · v2
// Uygulama her açılışta telefondaki kopyadan ANINDA açılır.
// Arka planda internetten yeni sürüm kontrol edilir; yeni sürüm varsa uygulamada "Yenile" uyarısı çıkar.
const C="taco-cache-v1";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
function put(req,res){if(res&&res.ok){const cp=res.clone();return caches.open(C).then(c=>c.put(req,cp)).then(()=>res)}return Promise.resolve(res)}
let fresh=false;
async function tell(){fresh=true;for(let i=0;i<8;i++){await new Promise(z=>setTimeout(z,700));const cs=await self.clients.matchAll({type:"window"});if(cs.length){cs.forEach(c=>c.postMessage({t:"upd"}));return}}}
self.addEventListener("message",e=>{if(e.data&&e.data.t==="q"&&fresh&&e.source)e.source.postMessage({t:"upd"})});
async function refresh(r,old){
  try{
    const x=await fetch(r.url,{cache:"no-cache",credentials:"same-origin"});if(!x||!x.ok)return;
    const html=(x.headers.get("content-type")||"").includes("text/html");
    if(old&&html){const[a,b]=await Promise.all([old.clone().text(),x.clone().text()]);await put(r,x);if(a!==b)tell()}
    else await put(r,x);
  }catch(_){}
}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  const app=u.origin===self.location.origin;
  const lib=/gstatic\.com\/firebasejs|cdn\.jsdelivr\.net/.test(u.href);
  if(!app&&!lib)return;
  if(app){
    e.respondWith((async()=>{
      const m=await caches.match(r,{ignoreSearch:true})||(r.mode==="navigate"?await caches.match("./"):null);
      if(m){e.waitUntil(refresh(r,m.clone()));return m}           // telefondaki kopya: anında
      try{const x=await fetch(r);await put(r,x);return x}catch(_){return Response.error()}
    })());
  }else{
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>put(r,x))));
  }
});
