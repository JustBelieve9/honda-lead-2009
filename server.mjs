import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
    const target=path.resolve(root,relative);
    if(!target.startsWith(root)){res.writeHead(403);res.end('Forbidden');return;}
    const info=await stat(target);if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
    const data=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(data);
  }catch(e){if(e.code==='ENOENT'){res.writeHead(404);res.end('Not found');}else{console.error('HTTP error:',e.message);res.writeHead(500);res.end('Server error');}}
});
server.listen(Number(process.env.LEAD_PORT||4173),'127.0.0.1',()=>console.log('LEAD Garage: http://127.0.0.1:4173'));
