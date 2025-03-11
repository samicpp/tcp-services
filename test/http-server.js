const http2 = require('http2');
const fs = require('fs');
const WebSocket = require('ws');

// Load TLS credentials
const options = {
  key: fs.readFileSync('../localhost.key'),
  cert: fs.readFileSync('../localhost.crt'),
  allowHTTP1: true, // enables support for HTTP/1.1 along with HTTP/2
};

// Create a secure server that supports HTTP/2 and HTTP/1.1
const server = http2.createSecureServer(options);

// Handle HTTP/2 requests via 'stream' event
server.on('stream', (stream, headers) => {
  stream.respond({ 'content-type': 'text/plain', ':status': 200 });
  stream.end('Hello from HTTP/2!');
});

// Also handle HTTP/1.1 requests via the 'request' event
server.on('request', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from HTTP/1.1!');
});

// Attach a WebSocket server to the same TLS server
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  ws.send('Hello from WebSocket server!');
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Echo the message back
    ws.send(`You said: ${message}`);
  });
});

// Start the HTTPS/HTTP2 server on port 8443
server.listen(8443, () => {
  console.log('HTTPS/HTTP2 server listening on port 8443');
});

//
// OPTIONAL: Experimental HTTP/3 support
// Note: HTTP/3 is still experimental in Node.js. To use it, your Node.js version must support QUIC,
// and you may need to run Node with --experimental-quic.
// The following block uses a hypothetical "http3" module; adjust according to your environment.
//
try {
  const http3 = require('http3');
  const server3 = http3.createSecureServer(options);
  server3.on('session', (session) => {
    session.on('stream', (stream, headers) => {
      stream.respond({ ':status': 200 });
      stream.end('Hello from HTTP/3!');
    });
  });
  server3.listen(8444, () => {
    console.log('HTTP/3 server (experimental) listening on port 8444');
  });
} catch (err) {
  console.error('HTTP/3 support is not available in this Node.js version or module is not installed.');
}
