var cluster = require('cluster');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var redisAdapter = require('socket.io-redis');

var port = process.env.PORT || 3000;
var workers = process.env.WORKERS || require('os').cpus().length;

var redisUrl = process.env.REDISTOGO_URL || 'redis://127.0.0.1:6379';
var redisOptions = require('parse-redis-url')(redis).parse(redisUrl);
var pub = redis.createClient(redisOptions.port, redisOptions.host, {
  auth_pass: redisOptions.password
});
var sub = redis.createClient(redisOptions.port, redisOptions.host, {
  detect_buffers: true,
  auth_pass: redisOptions.password
});

io.adapter(redisAdapter({
  pubClient: pub,
  subClient: sub
}));

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});

if (cluster.isMaster) {
  //start();
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
  http.listen(port, function() {
    console.log('listening on *:' + port);
  });
}