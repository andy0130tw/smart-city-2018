const restify = require('restify');
const plugins = require('restify-plugins');
const route = require('./route');
const method = require('./module');

// 创建服务器
const server = restify.createServer({
  name: 'restify',
  version: '1.0.0',
  // key: fs.readFileSync('/etc/ssl/self-signed/server.key'),
  // certificate: fs.readFileSync('/etc/ssl/self-signed/server.crt')

});

server.use(plugins.acceptParser(server.acceptable));
server.use(plugins.queryParser());
server.use(plugins.fullResponse()); // handles disappeared CORS headers
server.use(plugins.bodyParser());
server.use(plugins.jsonp());
server.use(plugins.gzipResponse());
server.use(plugins.bodyParser());

server.use(method.log.dev);
server.use(method.log.logStream);

//route
server.post('/api/get', route.getdata);

server.on('restifyError', function(req, res, err, callback) {
  res.send(404, null);
  console.error({
    name: err.name,
    message: err.message
  })
  return callback();
});

//error handle
server.on('uncaughtException', function(req, res, route, err) {
  console.error('uncaughtException', err.stack);
});

// 监听客户端请求
server.listen(3000);