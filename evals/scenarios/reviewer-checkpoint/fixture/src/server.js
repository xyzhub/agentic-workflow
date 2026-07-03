const http = require('node:http');
const { load } = require('./store');

http.createServer((req, res) => {
  if (req.url === '/notes') {
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify(load()));
  }
  res.statusCode = 404;
  res.end('not found');
}).listen(process.env.PORT || 3000);
