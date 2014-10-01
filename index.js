var cluster = require('cluster');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis');
var redisAdapter = require('socket.io-redis');
var sticky = require('sticky-session');
var port = process.env.PORT || 3000;
var workers = process.env.WORKERS || require('os').cpus().length;

var pub = redis.createClient(9278, 'greeneye.redistogo.com', {
  auth_pass: "01c7f8fdd85de3350498b978f41799ac"
});
var sub = redis.createClient(9278, 'greeneye.redistogo.com', {
  detect_buffers: true,
  auth_pass: "01c7f8fdd85de3350498b978f41799ac"
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

function stickyStart() {
  sticky(function() {
    return http;
  }).listen(3000, function() {
    console.log('listening on *:' + port);
  });
}