import express from 'express';
import { spawn } from 'child_process';
import http from 'http';

const app = express();
const PORT = 3000;
const PYTHON_PORT = 3001;

console.log('Starting Python SmartWare backend child process...');
const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
const pythonProc = spawn(pythonCommand, ['app.py'], {
  env: { ...process.env, PYTHON_PORT: PYTHON_PORT.toString() },
  stdio: 'inherit'
});

pythonProc.on('error', (err) => {
  console.error('Failed to start Python process:', err);
});

pythonProc.on('exit', (code, signal) => {
  console.log(`Python process exited with code ${code} and signal ${signal}`);
});

const cleanup = () => {
  if (pythonProc && !pythonProc.killed) {
    pythonProc.kill('SIGTERM');
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  if (pythonProc && !pythonProc.killed) {
    pythonProc.kill();
  }
});

// Proxy all incoming requests on port 3000 directly to Python backend on port 3001
app.use((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: PYTHON_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error to Python backend:', err.message);
    if (!res.headersSent) {
      res.status(502).send('SmartWare Python backend service starting up... Please refresh in a moment.');
    }
  });

  req.pipe(proxyReq, { end: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SmartWare Node/Python Proxy listening on http://0.0.0.0:${PORT} -> Python 3.10 on port ${PYTHON_PORT}`);
});
