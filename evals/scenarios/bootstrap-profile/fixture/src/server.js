const http = require('node:http');
const { load } = require('./store');

http.createServer((req, res) => {
  if (req.url === '/links') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(load()));
  } else {
    res.statusCode = 404;
    res.end('not found');
  }
}).listen(process.env.PORT || 3000);
