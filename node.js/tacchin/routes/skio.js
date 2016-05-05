var app = require('../app');
var http = require('http').Server(app);
var io = require('socket.io')(http);

function session_info() {
  // Socket.IO
// http.listen(app.get('port'), function() {
//      console.log('listening!!!');
//  });

  io.on('connection', function(socket){
        console.log('connecttion: ンゴ');
        socket.on('chat message', function(msg){
            console.log('message: ' + msg);
            io.emit('chat message', msg);
      });
  });

  io.on('disconnect', function () {
        console.log('disconnect: ンゴ');
  });
}

module.exports = session_info;
