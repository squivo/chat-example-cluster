var cluster = require('cluster');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('socket.io-redis');

io.adapter(redis({
  host: 'localhost',
  port: 6379
}));

var workers = process.env.WORKERS || require('os').cpus().length;

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

io.on('connection', function(socket) {
  socket.on('chat message', function(msg) {
    io.emit('chat message', msg);
  });
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
    //cluster.fork();
  });
} else {
  http.listen(3000, function() {
    console.log('listening on *:3000');
  });
}