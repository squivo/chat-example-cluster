var cluster = require('cluster');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('socket.io-redis');
var sticky = require('sticky-session');
var port = process.env.NODE_PORT || 3000;
var workers = process.env.WORKERS || require('os').cpus().length;

//io.adapter(redis(process.env.REDISTOGO_URL));

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
});

if (cluster.isMaster) {
  stickyStart();
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
  stickyStart();
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