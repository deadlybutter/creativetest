var tree = {};

var socket;

var scene;
var renderer;
var camera;
var controls;
var clock;

var cl = 16;
var ml = 8 * cl;

var queueB = [];
var queueR = [];
function getAllChunks() {
  for (var cx = 0; cx < ml; cx += cl) {
    for (var cy = 0; cy< ml; cy += cl) {
      for (var cz = 0; cz < ml; cz += cl) {
        var path = createChunkPath(cx, cy, cz);
        queueR.push({x: cx, y: cy, z: cz});
        queueB.push({x: cx, y: cy, z: cz});
      }
    }
  }
  socket.emit('get chunk blocks', queueB.pop());

  socket.emit('get render data', queueR.pop());
  socket.emit('get render data', queueR.pop());
  socket.emit('get render data', queueR.pop());
}

function checkQueue(type) {
  if (type == "b") {
    socket.emit('get chunk blocks', queueB.pop());
  }
  else {
    socket.emit('get render data', queueR.pop());
  }
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
  checkQueue('b');
}

function recieveRenderData(data) {
  if (data.vertices == undefined || data.colors == undefined) {
    return;
  }
  addChunkToScene(data.pos, data.vertices, data.colors);
  checkQueue('r');
}

function addChunkToScene(pos, rawVertices, rawColors) {
  console.log(pos.x);
  var cx = pos.x;
  var cy = pos.y;
  var cz = pos.z;
  var path = createChunkPath(cx, cy, cz);

  var vertices = new Float32Array(rawVertices.length);
  var colors = new Float32Array(rawColors.length);

  for (var i = 0; i < rawVertices.length; i++) {
    vertices[i] = rawVertices[i];
    colors[i] = rawColors[i];
  }

  // rawVertices.forEach(function(e, i) {
  //   vertices[i] = e;
  // });
  //
  // rawColors.forEach(function(e, i) {
  //   colors[i] = e;
  // });

  // delete rawColors;
  // delete rawVertices;
  var geometry = new THREE.BufferGeometry();

  geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Add to ThreeJS Scene
  var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
  //var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Position and scale it
  cube.position.x = cx;
  cube.position.y = cy;
  cube.position.z = cz;
  //cube.scale.set(block.d, block.d, block.d);

}


function render() {
  requestAnimationFrame(render);
	renderer.render(scene, camera);

  var delta = clock.getDelta();
  controls.update(delta);
}

$(document).on('ready', function() {

  socket = io.connect('http://localhost:5000');
  socket.on('chunk blocks', recieveBlocks);
  socket.on('render data', recieveRenderData);

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
