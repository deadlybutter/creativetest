var express = require('express');
var app = express();
app.use(express.static('public'));
app.use(express.static('common'));
var server = require('http').Server(app);
var io = require('socket.io')(server);

// TEMP
var tools = require(__dirname + '/common/tools.js');
var secrets = require(__dirname + '/secrets.json');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_PATH || secrets.mongo_path);
var Schema = mongoose.Schema;
var schemas = tools.getMongoSchema(Schema, mongoose);
var Chunk = schemas[0];
var VerticeList = schemas[1];
var ColorList = schemas[2];

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
  socket.on('get render data', function(data) {
    if (data == undefined || data == null) {
      return;
    }
    var cx = data.x;
    var cy = data.y;
    var cz = data.z;
    var chunkKey = tools.createChunkPath(cx, cy, cz);
    VerticeList.findOne({chunkKey: chunkKey}, function(err, verticeListData) {
      if (verticeListData == undefined) {
        verticeListData = {vertices: undefined};
      }
      ColorList.findOne({chunkKey: chunkKey}, function(err, colorListData) {
        if (colorListData == undefined) {
          colorListData = {colors: undefined};
        }
        socket.emit('render data', {"pos": {x: cx, y: cy, z: cz}, "vertices": verticeListData.vertices, "colors": colorListData.colors});
      });
    });
  });
});

server.listen(process.env.PORT || 3000, function () {
  console.log('App listening!');
});
