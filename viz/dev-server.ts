import express from 'express';
import path from 'path';
import * as http from 'http';

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, '.')));

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});