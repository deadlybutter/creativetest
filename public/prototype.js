var tree = {};

var scene;
var renderer;
var camera;
var controls;
var clock;

// Vertices for each face of the cube
var cubeFront = [
  [-0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5],
  [0.5, 0.5, 0.5],

  [0.5,  0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, -0.5, 0.5],
];

var cubeBack = [
  [-0.5, -0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [0.5, -0.5, -0.5],
  [-0.5, -0.5, -0.5],
];

var cubeTop = [
  [-0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5],
  [-0.5, 0.5, 0.5],
];

var cubeBottom = [
  [-0.5, -0.5, 0.5],
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],

  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
];

var cubeRight = [
  [0.5, -0.5, 0.5],
  [0.5, -0.5, -0.5],
  [0.5, 0.5, -0.5],

  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [0.5, -0.5, 0.5],
];

var cubeLeft = [
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, 0.5],
  [-0.5, 0.5, -0.5],

  [-0.5, 0.5, -0.5],
  [-0.5, -0.5, -0.5],
  [-0.5, -0.5, 0.5],
];

var cl = 16;
var ml = 2 * cl;

function getChunkCoords(x, y, z) {
  var cx = Math.floor(x / cl) * cl;
  var cy = Math.floor(y / cl) * cl;
  var cz = Math.floor(z / cl) * cl;
  return [cx, cy, cz];
}

function getVoxelAt(x, y, z) {
  var cc = getChunkCoords(x, y, z);
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
        tree[cx][cy][cz] = {};

        // Create blocks
        for (var x = cx; x < (cx + cl); x++) {
          tree[cx][cy][cz][x] = {};
          for (var y = cy; y < (cy + cl); y++) {
            tree[cx][cy][cz][x][y] = {};
            for (var z = cz; z < (cz + cl); z++) {

              // Add to world tree
              var block = {c: Math.random() * 0xffffff, d: 1};
              tree[cx][cy][cz][x][y][z] = block;
            }
          }
        }

      }
    }
  }

  console.log(tree);
  buildScene();

}
function buildScene() {

  for (var cx = 0; cx < ml; cx += cl) {
    for (var cy = 0; cy< ml; cy += cl) {
      for (var cz = 0; cz < ml; cz += cl) {
        for (var x = cx; x < (cx + cl); x++) {
          for (var y = cy; y < (cy + cl); y++) {
            for (var z = cz; z < (cz + cl); z++) {

              var block = tree[cx][cy][cz][x][y][z];
              var geometry = new THREE.BufferGeometry();
              var vertexPositions = [];

              if (getVoxelAt(x, y + 1, z).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeTop);
              }

              if (getVoxelAt(x, y - 1, z).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeBottom);
              }

              if (getVoxelAt(x, y, z + 1).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeFront);
              }

              if (getVoxelAt(x, y, z - 1).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeBack);
              }

              if (getVoxelAt(x + 1, y, z).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeRight);
              }

              if (getVoxelAt(x - 1, y, z).d < block.d) {
                vertexPositions = vertexPositions.concat(cubeLeft);
              }

              if (vertexPositions.length == 0) {
                continue;
              }

              // Do vertices caluclations
              var vertices = new Float32Array(vertexPositions.length * 3); // three components per vertex

              // components of the position vector for each vertex are stored
              // contiguously in the buffer.
              for (var i = 0; i < vertexPositions.length; i++) {
                vertices[i * 3 + 0] = vertexPositions[i][0];
                vertices[i * 3 + 1] = vertexPositions[i][1];
                vertices[i * 3 + 2] = vertexPositions[i][2];
              }

              // itemSize = 3 because there are 3 values (components) per vertex
              geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

              // Add to ThreeJS Scene
              var material = new THREE.MeshBasicMaterial({color: block.c});
              var cube = new THREE.Mesh(geometry, material);
              scene.add(cube);

              // Position and scale it
              cube.position.x = x;
              cube.position.y = y;
              cube.position.z = z;
              //cube.scale.set(block.d, block.d, block.d);

            }
          }
        }
      }
    }
  }
}

function render() {
  requestAnimationFrame(render);
	renderer.render(scene, camera);

  var delta = clock.getDelta();
  controls.update(delta);
}

$(document).on('ready', function() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 40;

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

  buildMap();
  //test();
  render();
});
