var tools = require(__dirname + '/common/tools.js');
var secrets = require(__dirname + '/secrets.json');

var mongoose = require('mongoose');
mongoose.connect(secrets.mongo_path);
var Schema = mongoose.Schema;
var schemas = tools.getMongoSchema(Schema, mongoose);
var Chunk = schemas[0];
var VerticeList = schemas[1];
var ColorList = schemas[2];

var tree = {};
var queue = [];

var cl = 8;
var ml = (process.argv[2] || 4) * cl;
console.log("Chunk size is " + cl);
console.log("Map size is " + ml);

function getVoxelAt(x, y, z) {
  var cc = tools.getChunkCoords(x, y, z, cl);
  var block = {d: 0, c: 0};
  try {
    block = tree[cc[0]][cc[1]][cc[2]][x][y][z];
  } catch(e) {}
  return block;
}

function buildMap() {
  // Create chunks
  for (var cx = 0; cx < ml; cx += cl) {
    tree[cx] = {};
    for (var cy = 0; cy< ml; cy += cl) {
      tree[cx][cy] = {};
      for (var cz = 0; cz < ml; cz += cl) {
        // Chunk container
        tree[cx][cy][cz] = {};
        queue.push([cx, cy, cz]);

        // Create blocks
        for (var x = cx; x < (cx + cl); x++) {
          tree[cx][cy][cz][x] = {};
          for (var y = cy; y < (cy + cl); y++) {
            tree[cx][cy][cz][x][y] = {};
            for (var z = cz; z < (cz + cl); z++) {
              // Add to world tree
              var block = {
                c: [tools.getRandomInt(50, 200), tools.getRandomInt(50, 200), tools.getRandomInt(50, 200)],
                d: Math.random() >= 0.5 ? 1 : 0
              };
              tree[cx][cy][cz][x][y][z] = block;
            }
          }
        }
      }
    }
  }

  console.log("Done building");
  var start = queue.pop();
  createVertexData(start[0], start[1], start[2]);
  start = queue.pop();
  createVertexData(start[0], start[1], start[2]);
  start = queue.pop();
  createVertexData(start[0], start[1], start[2]);
}

function createVertexData(cx, cy, cz) {
  console.log("Creating vertex data for " + cx + ", " + cy + ", " + cz);

  // Prepare buffers
  var vertexPositions = [];
  var colorVals = [];

  for (var x = cx; x < (cx + cl); x++) {
    for (var y = cy; y < (cy + cl); y++) {
      for (var z = cz; z < (cz + cl); z++) {

        var block = tree[cx][cy][cz][x][y][z];
        var localVertexPositions = [];

        if (getVoxelAt(x, y + 1, z).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeTop);
        }

        if (getVoxelAt(x, y - 1, z).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeBottom);
        }

        if (getVoxelAt(x, y, z + 1).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeFront);
        }

        if (getVoxelAt(x, y, z - 1).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeBack);
        }

        if (getVoxelAt(x + 1, y, z).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeRight);
        }

        if (getVoxelAt(x - 1, y, z).d < block.d) {
          localVertexPositions = localVertexPositions.concat(tools.cubeLeft);
        }

        if (localVertexPositions.length == 0) {
          continue;
        }

        localVertexPositions.forEach(function(v) {
          v = v.slice();
          v[0] += (x - cx);
          v[1] += (y - cy);
          v[2] += (z - cz);
          vertexPositions.push(v);
          colorVals.push(block.c);
        });

      }
    }
  }

  // Do vertices caluclations
  var vertices = [];
  var colors = [];

  // components of the position vector for each vertex are stored
  // contiguously in the buffer.
  for (var i = 0; i < vertexPositions.length; i++) {
    vertices[i * 3 + 0] = vertexPositions[i][0];
    vertices[i * 3 + 1] = vertexPositions[i][1];
    vertices[i * 3 + 2] = vertexPositions[i][2];

    colors[i * 3 + 0] = colorVals[i][0];
    colors[i * 3 + 1] = colorVals[i][1];
    colors[i * 3 + 2] = colorVals[i][2];
  }

  var path = tools.createChunkPath(cx, cy, cz);
  console.log("Done building vertex data");//vertices: vertices, colors: colors

  var mongoChunk = new Chunk({chunkKey: path, blocks: tree[cx][cy][cz]});
  mongoChunk.save(function(err) {
    if (err) {
      console.log(cx + "," + cy + "," + cz + " blocks");
      console.log(err);
      return;
    }

    var mongoVertices = new VerticeList({chunkKey: path, vertices: vertices});
    mongoVertices.save(function(err) {
      if (err) {
        console.log(cx + "," + cy + "," + cz + " vertices");
        console.log(err);
        return;
      }

      var mongoColors = new ColorList({chunkKey: path, colors: colors});
      mongoColors.save(function(err) {
        if (err) {
          console.log(cx + "," + cy + "," + cz + " colors");
          console.log(err);
          return;
        }

        console.log("All data saved, " + queue.length + " chunks left");
        var nextChunk = queue.pop();
        if (nextChunk != undefined) {
          createVertexData(nextChunk[0], nextChunk[1], nextChunk[2]);
        }
        else {
          console.log("DONE!");
        }
      });

    });
  });
}

console.log("Spinning up the voxel generator....");
buildMap();
