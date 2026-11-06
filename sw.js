// Taco çevrimdışı çalışma dosyası (service worker)
// İnternet varken her zaman en yeni sürümü indirir; internet yokken telefondaki kopyayı açar.
const C="taco-cache-v1";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
function put(req,res){if(res&&res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(req,cp))}return res}
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  const app=u.origin===self.location.origin;
  const lib=/gstatic\.com\/firebasejs|cdn\.jsdelivr\.net/.test(u.href);
  if(!app&&!lib)return;
  if(app){
    // önce internet (4 sn), olmazsa telefondaki kopya
    e.respondWith(new Promise(res=>{
      let done=false;const fb=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match("./")).then(m=>{if(!done){done=true;res(m||Response.error())}});
      const t=setTimeout(()=>caches.match(r,{ignoreSearch:true}).then(m=>{if(m&&!done){done=true;res(m)}}),4000);
      fetch(r).then(x=>{clearTimeout(t);put(r,x);if(!done){done=true;res(x)}}).catch(()=>{clearTimeout(t);fb()});
    }));
  }else{
    // sürümlü kütüphaneler: önce telefondaki kopya
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>put(r,x))));
  }
});
