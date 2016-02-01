var tree = {};

//faces
// 0 = right-
// 1 = left-
// 2 = top-
// 3 = bottom-
// 4 = front-
// 5 = back-

var scene;
var renderer;
var camera;
var controls;
var clock;

var chunkLength = 2;
var mapLength = 2;

function generateChunk(cx, cy, cz) {
  var chunk = tree[cx][cy][cz];
  for (var x = 0; x < chunkLength; x++) {
    chunk[x] = new Array(chunkLength);
    for (var y = 0; y < chunkLength; y++) {
      chunk[x][y] = new Array(chunkLength);
      for (var z = 0; z < chunkLength; z++) {
        chunk[x][y][z] = {c: Math.random() * 0xffffff, d: 1};
      }
    }
  }
}

function generateMap() {
  for (var x = 0; x < mapLength; x++) {
    tree[x] = new Array(mapLength);
    for (var y = 0; y < mapLength; y++) {
      tree[x][y] = new Array(mapLength);
      for (var z = 0; z < mapLength; z++) {
        tree[x][y][z] = new Array(mapLength);
        generateChunk(x, y, z);
      }
    }
  }
}

function getChunkCoords(x, y, z) {
  var cx = Math.floor(x / chunkLength) * chunkLength;
  var cy = Math.floor(y / chunkLength) * chunkLength;
  var cz = Math.floor(z / chunkLength) * chunkLength;
  return [cx, cy, cz];
}

var i = 0;
function getVoxelAt(cx, cy, cz, x, y, z) {
  if (cx == undefined || cy == undefined || cz == undefined) {
    chunkC = getChunkCoords(x, y, z);
    cx = chunkC[0];
    cy = chunkC[1];
    cz = chunkC[2];
  }
  try {
    var block = tree[cx][cy][cz][x][y][z];
    if (block == undefined) {
      block = {d: 0};
    }
    return block;
  }
  catch(e) {
    i++;
    console.log(e);
    console.log(x, y, z, i);
    console.log(chunkC);
    console.log("\n");
    return {d: 0};
  }
}

generateMap();
var stringified = JSON.stringify(tree);
// console.log(stringified);

function render() {
	requestAnimationFrame(render);
	renderer.render(scene, camera);

  var delta = clock.getDelta();
  controls.update(delta);
}

function setup() {
  camera.position.z = 20;

  for (var cx = 0; cx < mapLength; cx++) {
    for (var cy = 0; cy < mapLength; cy++) {
      for (var cz = 0; cz < mapLength; cz++) {
        var chunk = tree[cx][cy][cz];
        var distance = Math.round(Math.sqrt(Math.pow(cx - camera.position.x, 2) + Math.pow(cy - camera.position.y, 2) + Math.pow(cz - camera.position.z, 2)));
        //console.log(distance);
        for (var x = 0; x < chunkLength; x++) {
          for (var y = 0; y < chunkLength; y++) {
            for (var z = 0; z < chunkLength; z++) {
              var block = chunk[x][y][z];
              var vertexPositions = [];

              if (getVoxelAt(undefined, undefined, undefined, x, y, z + 1).d < block.d) {
                // console.log(getVoxelAt(cx, cy, cz, x, y, z + 1).d);
                vertexPositions.push(
                  [-0.5, -0.5,  0.5],
                  [ 0.5, -0.5,  0.5],
                  [ 0.5,  0.5,  0.5],

                  [ 0.5,  0.5,  0.5],
                  [-0.5,  0.5,  0.5],
                  [-0.5, -0.5,  0.5]
                );
              }
              else if (getVoxelAt(cx, cy, cz, x, y, z + 1).d < block.d) {
                // vertexPositions.push(
                //   [-0.5, -0.5,  -1.5],
                //   [ 0.5, -0.5,  -1.5],
                //   [ 0.5,  0.5,  -1.5],
                //
                //   [ 0.5,  0.5,  -1.5],
                //   [-0.5,  0.5,  -1.5],
                //   [-0.5, -0.5,  -1.5]
                // );
              }

              var vertices = new Float32Array(vertexPositions.length * 3);
              for (var i = 0; i < vertexPositions.length; i++){
              	vertices[i * 3 + 0] = vertexPositions[i][0];
              	vertices[i * 3 + 1] = vertexPositions[i][1];
              	vertices[i * 3 + 2] = vertexPositions[i][2];
              }

              var geometry = new THREE.BufferGeometry();
              geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

              var material = new THREE.MeshBasicMaterial({color: block.c});
              var cube = new THREE.Mesh(geometry, material);

              scene.add(cube);
              cube.position.x = (cx * chunkLength) + x;
              cube.position.y = (cy * chunkLength) + y;
              cube.position.z = (cz * chunkLength) + z;
              cube.scale.set(block.d, block.d, block.d);
            }
          }
        }
      }
    }
  }

  // console.log(scene);
}

$(document).on('ready', function() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  $('body').prepend(renderer.domElement);

  clock = new THREE.Clock();

  controls = new THREE.FlyControls(camera);
  controls.movementSpeed = 10;
  controls.domElement = renderer.domElement;
  controls.rollSpeed = Math.PI / 34;
  controls.autoForward = false;
  controls.dragToLook = false;

  setup();
  render();
});
