var express = require('express');
var app = express();
app.use(express.static('public'));
app.use(express.static('common'));
var server = require('http').Server(app);
var io = require('socket.io')(server);

// TEMP
var tools = require(__dirname + '/common/tools.js');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_PATH);
var Schema = mongoose.Schema;
var schemas = tools.getMongoSchema(Schema, mongoose);
var Chunk = schemas[0];

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.on('get chunk blocks', function(data) {
    if (data == undefined || data == null) {
      return;
    }
    var cx = data.x;
    var cy = data.y;
    var cz = data.z;
    var chunkKey = tools.createChunkPath(cx, cy, cz);
    Chunk.findOne({chunkKey: chunkKey}, function(err, chunkData) {
      if (chunkData == undefined) {
        chunkData = {blocks: undefined};
      }
      socket.emit('chunk blocks', {"pos": {x: cx, y: cy, z: cz}, "blocks": chunkData.blocks});
    });
  });
});

server.listen(process.env.PORT || 3000, function () {
  console.log('App listening!');
});
