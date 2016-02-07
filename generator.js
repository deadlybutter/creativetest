var tools = require(__dirname + '/common/tools.js');
var secrets = require(__dirname + '/secrets.json');

var mongoose = require('mongoose');
mongoose.connect(secrets.mongo_path);
mongoose.connection.on("error", function(err) {
  console.log("Could not connect to mongo server!");
  console.log(err);
});
mongoose.connection.on("open", function(ref) {
  console.log("Connected to mongo server.");
  console.log("Spinning up the voxel generator....");
  makeAllChunks();
});

var Schema = mongoose.Schema;
var schemas = tools.getMongoSchema(Schema, mongoose);
var Chunk = schemas[0];

var queueB = [];

var cl = 8;
var ml = (process.argv[2] || 4) * cl;
console.log("Chunk size is " + cl);
console.log("Map size is " + ml);

function makeAllChunks() {
  for (var cx = 0; cx < ml; cx += cl) {
    for (var cy = 0; cy< ml; cy += cl) {
      for (var cz = 0; cz < ml; cz += cl) {
        queueB.unshift({x: cx, y: cy, z: cz});
      }
    }

    if (cx == 0) {
      for (var i = 0; i < 3; i++) {
        makeChunk(queueB.pop());
      }
    }

    console.log(cx + ' ... ' + ml);
  }
}

function makeChunk(pos) {
  if (pos == undefined) {
    return;
  }
  var cx = pos.x;
  var cy = pos.y;
  var cz = pos.z;
  var path = tools.createChunkPath(cx, cy, cz);
  var blocks = {};

  for (var x = cx; x < (cx + cl); x++) {
    blocks[x] = {};
    for (var y = cy; y < (cy + cl); y++) {
      blocks[x][y] = {};
      for (var z = cz; z < (cz + cl); z++) {
        // Add to world tree
        blocks[x][y][z] = {
          c: [tools.getRandomInt(50, 200), tools.getRandomInt(50, 200), tools.getRandomInt(50, 200)],
          d: Math.random() >= 0.5 ? 1 : 0
        };
      }
    }
  }
  // console.log(blocks);
  var mongoChunk = new Chunk({chunkKey: path, blocks: blocks});
  mongoChunk.save(function(err, obj) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(queueB.length + " chunks left");
      makeChunk(queueB.pop())
    }
  });
}
