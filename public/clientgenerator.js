var cl;
var ml;
var startX, startY, startZ;
var queueB = [];

function makeChunks() {
  for (var cx = startX; cx < ml; cx += cl) {
    for (var cy = startY; cy < ml; cy += cl) {
      for (var cz = startZ; cz < ml; cz += cl) {
        queueB.unshift({x: cx, y: cy, z: cz});
      }
    }
  }

  queueB.forEach(function(e) {
    makeChunk(e);
  });
}

function makeChunk(pos) {
  var cx = pos.x;
  var cy = pos.y;
  var cz = pos.z;

  var blocks = {};

  for (var x = cx; x < (cx + cl); x++) {
    blocks[x] = {};
    for (var y = cy; y < (cy + cl); y++) {
      blocks[x][y] = {};
      for (var z = cz; z < (cz + cl); z++) {
        var value = Math.abs(Math.ceil(noise.perlin3(x / 100, y / 100, z / 100)));
        // Add to world tree
        blocks[x][y][z] = {
          c: [getRandomInt(50, 200), getRandomInt(50, 200), getRandomInt(50, 200)],
          d: value
        };
      }
    }
  }
  postMessage({'pos': pos, 'blocks': blocks});
}

onmessage = function(e) {
  cl = e.data.cl;
  ml = e.data.ml;
  startX = e.data.startX;
  startY = e.data.startY;
  startZ = e.data.startZ;
  makeChunks();
}

importScripts('perlin.js', 'tools.js');
