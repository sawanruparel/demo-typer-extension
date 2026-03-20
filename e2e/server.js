const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = 4173;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const requestedPath = urlPath === '/' ? '/demo-page.html' : urlPath;
  const filePath = path.resolve(ROOT_DIR, `.${requestedPath}`);

  if (!filePath.startsWith(ROOT_DIR)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === 'ENOENT') {
        send(res, 404, 'Not found');
        return;
      }

      send(res, 500, error.message);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME_TYPES[ext] || 'application/octet-stream');
  });
}).listen(PORT, HOST, () => {
  console.log(`Demo Typer E2E server listening at http://${HOST}:${PORT}`);
});
