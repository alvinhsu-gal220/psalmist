'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const port=8765;
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method!=='GET'||!['/','/psalmist.html','/health'].includes(url.pathname)){res.writeHead(404);res.end('Not found');return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(url.pathname==='/health'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end('psalmist-local-v2');return;}
  try{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(__dirname,'psalmist.html')));}
  catch{res.writeHead(500);res.end('Psalmist could not be read.');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log('Psalmist: http://localhost:8765/psalmist.html'));
