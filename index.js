var cluster = require('cluster');
var app = require('express')();
var http = require('http');
var io = require('socket.io');
var redis = require('redis');
var redisAdapter = require('socket.io-redis');

var port = process.env.PORT || 3000;
var workers = process.env.WORKERS || require('os').cpus().length;

var redisUrl = process.env.REDISTOGO_URL || 'redis://127.0.0.1:6379';


app.get('/', function(req, res) {
  res.sendfile('index.html');
});


if (cluster.isMaster) {
  console.log('start cluster with %s workers', workers - 1);
  workers--;
  for (var i = 0; i < workers; ++i) {
    var worker = cluster.fork();
    console.log('worker %s started.', worker.process.pid);
  }

  cluster.on('death', function(worker) {
    console.log('worker %s died. restart...', worker.process.pid);
  });
} else {
  start();
}

function start() {
  var httpServer = http.createServer( app );
  var server = httpServer.listen( port );
  io = io.listen(server);
  io.adapter(redisAdapter({ host: 'localhost' , port : 6379 }));
  io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});

console.log('Redis adapter started with url: ' + redisUrl);

}