import { WebSocketServer } from 'ws';
import * as http from 'http';
import * as fs from 'fs';

const PORT = 8080;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else if (req.url === '/client.js') {
    fs.readFile('client.js', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Error');
  }
});

// WebSocket server for real-time data
const wss = new WebSocketServer({ server });

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
