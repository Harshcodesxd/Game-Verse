import http from 'http';
import fs from 'fs';
import path from 'path';
const __dirname = path.resolve();
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
http.createServer((req, res) => {
  let fp = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.slice(1));
  try {
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(8080, () => console.log('Server: http://localhost:8080'));
