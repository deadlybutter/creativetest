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
var bl = 8;

var calculatorPool = [];

function makeCalculators(t) {
  t++;
  var cube = []
      .concat(cubeTop)
      .concat(cubeBottom)
      .concat(cubeLeft)
      .concat(cubeRight)
      .concat(cubeFront)
      .concat(cubeBack);
  for(var i = 0; i < t; i++) {
    var worker = new Worker('calculator.js');
    calculatorPool.push(worker);
    worker.onmessage = onCalculatorMessage;
    worker.postMessage({'type': 'init', 'cube': cube, 'cl': cl, 'bl': bl});
  }
}

function getCalculator() {
  var worker = calculatorPool.pop();
  calculatorPool.unshift(worker);
  return worker;
}

var queueB = [];
var tempQueue = [];

function getAllChunks() {
  var generator = new Worker('clientgenerator.js');
  generator.onmessage = function(data) {
    recieveBlocks(data.data);
  };
  generator.postMessage({cl: cl, ml: ml, startX: 0, startY: 0, startZ: 0});

  // for (var cx = 0; cx < ml; cx += cl) {
  //   for (var cy = 0; cy< ml; cy += cl) {
  //     for (var cz = 0; cz < ml; cz += cl) {
  //       queueB.unshift({x: cx, y: cy, z: cz});
  //     }
  //   }
  // }

  // for (var i = 0; i < 5; i++) {
  //   socket.emit('get chunk blocks', queueB.pop());
  // }
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
  checkQueue();
  var cx = data.pos.x;
  var cy = data.pos.y;
  var cz = data.pos.z;
  var path = createChunkPath(cx, cy, cz);
  tree[path] = data.blocks;
  updateChunk(data.pos);
}

function recieveBatch(data) {
  getCalculator().postMessage({'type': 'parseLargeChunkBatch', 'batch': data});
  checkQueue();
}

function updateChunk(pos, faces) {
  var path = createChunkPath(pos.x, pos.y, pos.z);
  getCalculator().postMessage({'type': 'getRenderData', 'pos': pos, 'blocks': tree[path]});
}

function addChunkToScene(pos, vertices, colors) {

  var g = new THREE.BufferGeometry();
  g.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
  g.addAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Add to ThreeJS Scene
  var material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
  //var material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
  var cube = new THREE.Mesh(g, material);

  cube.position.x = pos.x;
  cube.position.y = pos.y;
  cube.position.z = pos.z;

  scene.add(cube);
}

var i = 0;
var bG;
function onCalculatorMessage(e) {
  addChunkToScene(e.data.pos, e.data.vertices, e.data.colors);
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

  socket = io.connect(location.host);
  socket.on('chunk blocks', recieveBlocks);
  socket.on('batch chunks', recieveBatch);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = ml * 2;
  camera.position.y = ml / 2;
  camera.position.x = ml / 2;

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

  makeCalculators(8);
  getAllChunks();
  render();
});
