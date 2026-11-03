const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); const res=[];
for (let i=0;i<5;i++){
const ctx=await b.newContext({viewport:{width:390,height:800},isMobile:true,hasTouch:true}); const p=await ctx.newPage();
const cdp=await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6e6/8,uploadThroughput:750e3/8});
let bytes=0; cdp.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength);
await p.addInitScript(()=>{ window.__lt=0; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt+=Math.max(0,e.duration-50))).observe({type:'longtask',buffered:true}); window.__lcp=0; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true}); });
await p.goto(process.argv[2],{waitUntil:'load'}); await p.waitForTimeout(1500);
const m=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0]; const fcp=performance.getEntriesByName('first-contentful-paint')[0]; return {dcl:Math.round(n.domContentLoadedEventEnd), load:Math.round(n.loadEventEnd), fcp:Math.round(fcp?fcp.startTime:0), lcp:Math.round(window.__lcp), tbt:Math.round(window.__lt), nodes:document.getElementsByTagName('*').length}});
m.kb=Math.round(bytes/1024); res.push(m); await ctx.close(); }
const med=k=>res.map(r=>r[k]).sort((a,b)=>a-b)[2];
console.log(JSON.stringify(Object.fromEntries(Object.keys(res[0]).map(k=>[k,med(k)])))); await b.close();})();
