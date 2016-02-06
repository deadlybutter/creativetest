var tree = {};

var socket;
var stats;

var scene;
var renderer;
var camera;
var controls;
var clock;

var cl = 8;
var ml = 16 * cl;

var queueB = [];

function getAllChunks() {
  for (var cx = 0; cx < ml; cx += cl) {
    for (var cy = 0; cy< ml; cy += cl) {
      for (var cz = 0; cz < ml; cz += cl) {
        queueB.unshift({x: cx, y: cy, z: cz});
      }
    }
  }

  for (var i = 0; i < 10; i++) {
    socket.emit('get chunk blocks', queueB.pop());
  }
}

function checkQueue() {
  if (queueB.length == 0) {
    return;
  }
  socket.emit('get chunk blocks', queueB.pop());
}

function recieveBlocks(data) {
  if (data.blocks == undefined) {
    return;
  }
  var cx = data.pos.x;
  var cy = data.pos.y;
  var cz = data.pos.z;
  var path = createChunkPath(cx, cy, cz);
  tree[path] = data.blocks;
  updateChunk(data.pos);
  checkQueue();
}

function updateChunk(pos, faces) {
  var path = createChunkPath(pos.x, pos.y, pos.z);
  var renderData = getRenderData(pos, tree[path]);
  // later -- check if we need to remove it/update it
  addChunkToScene(pos, renderData.vertices, renderData.colors);
}

function getRenderData(pos, blocks) {
  var cx = pos.x;
  var cy = pos.y;
  var cz = pos.z;

  var vertexPositions = [];
  var colorVals = [];
  var chunkPath = createChunkPath(pos.x, pos.y, pos.z);

  var localVertexPositions = []
    .concat(cubeTop)
    .concat(cubeBottom)
    .concat(cubeLeft)
    .concat(cubeRight)
    .concat(cubeFront)
    .concat(cubeBack);

  for (var x = cx; x < (cx + cl); x++) {
    for (var y = cy; y < (cy + cl); y++) {
      for (var z = cz; z < (cz + cl); z++) {

        try {
          var block = tree[chunkPath][x][y][z];
        }
        catch(e) {
          continue;
        }

        if (block.d == 0) {
          continue;
        }

        localVertexPositions.forEach(function(v) {
          v = v.slice();
          v[0] += (x - cx);
          v[1] += (y - cy);
          v[2] += (z - cz);
          vertexPositions.push(v);
          colorVals.push(new THREE.Color(Math.random() * 0xffffff));
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

  return {vertices: vertices, colors: colors};
}

function addChunkToScene(pos, vertices, colors) {
  var cx = pos.x;
  var cy = pos.y;
  var cz = pos.z;
  // console.log("Adding " + cx + ', ' + cy + ', ' + cz);
  // console.log(vertices);

  var geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Add to ThreeJS Scene
  //var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
  var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Position and scale it
  cube.position.x = cx;
  cube.position.y = cy;
  cube.position.z = cz;
  //cube.scale.set(block.d, block.d, block.d);

}

function render() {
  stats.begin();
  requestAnimationFrame(render);
	renderer.render(scene, camera);

  var delta = clock.getDelta();
  controls.update(delta);
  stats.end();
}

$(document).on('ready', function() {

  stats = new Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  socket = io.connect('http://localhost:5000');
  socket.on('chunk blocks', recieveBlocks);

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

  getAllChunks();

  // buildMap();
  render();
});
