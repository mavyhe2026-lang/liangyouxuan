const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

http.createServer((req, res) => {
  proxy.web(req, res, { target: 'http://localhost:8080' });
}).listen(8081, '0.0.0.0', () => {
  console.log('Proxy running on port 8081');
});
