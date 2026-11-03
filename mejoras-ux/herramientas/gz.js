const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=process.argv[2], port=+process.argv[3];
const T={'.html':'text/html; charset=utf-8','.png':'image/png','.css':'text/css','.js':'text/javascript'};
http.createServer((q,r)=>{ let f=path.join(root,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
 fs.readFile(f,(e,d)=>{ if(e){r.writeHead(404);return r.end();} const t=T[path.extname(f)]||'application/octet-stream';
 if(/gzip/.test(q.headers['accept-encoding']||'') && !/png/.test(t)){ r.writeHead(200,{'Content-Type':t,'Content-Encoding':'gzip'}); r.end(zlib.gzipSync(d,{level:6})); } else { r.writeHead(200,{'Content-Type':t}); r.end(d);} }); }).listen(port);
