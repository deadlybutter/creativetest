// Vertices for each face of the cube
var cubeFront = [
  [-0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5],

  [0.5,  0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, -0.5, 0.5],
];
this.cubeFront = cubeFront;

var cubeBack = [
  [-0.5, -0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [0.5, -0.5, -0.5],
  [-0.5, -0.5, -0.5],
];
this.cubeBack = cubeBack;

var cubeTop = [
  [-0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, 0.5, 0.5],
];
this.cubeTop = cubeTop;

var cubeBottom = [
  [-0.5, -0.5, 0.5],
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],

  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
];
this.cubeBottom = cubeBottom;

var cubeRight = [
  [0.5, -0.5, 0.5],
  [0.5, -0.5, -0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5],
];
this.cubeRight = cubeRight;

var cubeLeft = [
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, 0.5, -0.5],

  [-0.5, 0.5, -0.5],
  [-0.5, -0.5, -0.5],
  [-0.5, -0.5, 0.5],
];
this.cubeLeft = cubeLeft;

function getChunkCoords(x, y, z, cl) {
  var cx = Math.floor(x / cl) * cl;
  var cy = Math.floor(y / cl) * cl;
  var cz = Math.floor(z / cl) * cl;
  return [cx, cy, cz];
}
this.getChunkCoords = getChunkCoords;

function getVoxelAt(x, y, z, chunk) {
  var block = {d: 0, c: 0};
  try {
    block = chunk[x][y][z];
  } catch(e) {}
  return block;
}
this.getVoxelAt = getVoxelAt;

function faceTest(x, y, z, tree, compareD) {
  var testCC = getChunkCoords(x, y, z);
  var testPath = createChunkPath(testCC[0], testCC[1], testCC[2]);
  return getVoxelAt(x, y + 1, z, tree[testPath]).d < compareD;
}

function createChunkPath(cx, cy, cz) {
  var fileName = '' + cx + cy + cz;
  return fileName;
}
this.createChunkPath = createChunkPath;

function getRandomInt(min, max) { //http://stackoverflow.com/a/1527820
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
this.getRandomInt = getRandomInt;

this.getMongoSchema = function(Schema, mongoose) {
  var Chunk = mongoose.model('Chunk', new Schema({
    chunkKey: {type: String, index: true},
    blocks: Schema.Types.Mixed,
  },
    {
      collection: 'chunks'
    }
  ));
  return [Chunk];
}
