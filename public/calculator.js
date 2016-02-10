var glCube;
var tree;
var cl;
var bl;

function getRenderData(pos, blocks, callback) {
  var cx = parseInt(pos.x);
  var cy = parseInt(pos.y);
  var cz = parseInt(pos.z);

  var vertexPositions = [];
  var colorVals = [];
  for (var x = cx; x < (cx + cl); x++) {
    // console.log(x);
    for (var y = cy; y < (cy + cl); y++) {
      for (var z = cz; z < (cz + cl); z++) {
        var block = {d: 0};
        try {
          block = blocks[x][y][z];
        } catch(e) {}

        if (block == undefined || block.d == 0) {
          continue;
        }

        var localVertexPositions = glCube.slice();
        localVertexPositions.forEach(function(v) {
          v = v.slice();
          v[0] += (x - cx);
          v[1] += (y - cy);
          v[2] += (z - cz);
          vertexPositions.push(v);
          colorVals.push({r: Math.round(Math.random() * 255), g: Math.round(Math.random() * 255), b: Math.round(Math.random() * 255)});
        });

      }
    }
  }

  // Do vertices caluclations
  var vertices = new Float32Array(vertexPositions.length * 3); // three components per vertex
  var colors = new Float32Array(colorVals.length * 3);

  // components of the position vector for each vertex are stored
  // contiguously in the buffer.
  for (var i = 0; i < vertexPositions.length; i++) {
    vertices[i * 3 + 0] = vertexPositions[i][0];
    vertices[i * 3 + 1] = vertexPositions[i][1];
    vertices[i * 3 + 2] = vertexPositions[i][2];

    colors[i * 3 + 0] = colorVals[i].r;
    colors[i * 3 + 1] = colorVals[i].g;
    colors[i * 3 + 2] = colorVals[i].b;
  }

  callback({'pos': pos, 'vertices': vertices, 'colors': colors});
}

function parseLargeChunkBatch(batchData, renderData) {
  if (batchData.length == 0 || batchData == undefined) {
    return;
  }
  var batch = batchData.pop();
  var blocks = batch.blocks;
  var cx = Object.keys(blocks)[0];
  var cy = Object.keys(blocks[cx])[0];
  var cz = Object.keys(blocks[cx][cy])[0];
  var renderData = getRenderData({x: cx, y: cy, z: cz}, blocks, function(renderData) {
    postMessage(renderData);
    parseLargeChunkBatch(batchData);
  });
}

onmessage = function(e) {

  var type = e.data.type;

  if (type == undefined) {
    return;
  }

  switch(type) {
      case 'init':
        glCube = e.data.cube;
        cl = e.data.cl;
        bl = e.data.bl;
        break;
      case 'getRenderData':
        var renderData = getRenderData(e.data.pos, e.data.blocks, function(renderData) {
          postMessage(renderData);
        });
        break;
      case 'parseLargeChunkBatch':
        parseLargeChunkBatch(e.data.batch);
        break;
  }

}
