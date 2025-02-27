import * as THREE from 'three';
import {
  OBJLoader
} from 'three/addons/loaders/OBJLoader.js';
import {
  FontLoader
} from 'three/addons/loaders/FontLoader.js';
import {
  TextGeometry
} from 'three/addons/geometries/TextGeometry.js';

// --- Constants --- //

const CANVAS_SELECTOR = '#myCanvas';
const ROTATION_SPEED = 3;

const TEXTS = [
  ['Happy', 'Valentines Day!'],
  ['Roses are red,', 'violets are blue'],
  ['Honey is sweet,', 'and so are you.'],
];

const INSTRUCTIONS = ['Touch to start', 'Touch to continue'];

// --- Shared variables --- //

let camera = null;
let renderer = null;
let scene = null;

let lastRenderTime = 0;

let rotating = false;
let iteration = 0;

let font = null;

let mainPivot = null;
let frontPivot = null;
let backPivot = null;

// --- Functions --- //

function addTexts(messages, instruction, pivot) {
  const mainMeshes = messages.map(function(message, index) {
    const myMesh = createTextMesh(message, 0xe060e0, 0.003)
    myMesh.position.z = 1;
    myMesh.position.y = 0.2 - (0.3 * index)
    return myMesh
  })
  mainMeshes.forEach(function(mainMesh) {
    pivot.add(mainMesh);
  })

  if (instruction) {
    const instructionMesh = createTextMesh(instruction, 0x808000, 0.002)
    instructionMesh.position.z = 1;
    instructionMesh.position.y = -1.3;
    pivot.add(instructionMesh);
  }
}

function animationStart() {
  rotating = true;
  iteration = (iteration + 1) % TEXTS.length;

  const hiddenPivot = mainPivot.rotation.y < Math.PI ? backPivot : frontPivot;
  addTexts(TEXTS[iteration], iteration === 0 ? INSTRUCTIONS[0] : iteration < TEXTS.length - 1 ? INSTRUCTIONS[1] : null, hiddenPivot)
}

function animationStop() {
  rotating = false;

  const hiddenPivot = mainPivot.rotation.y < Math.PI ? backPivot : frontPivot;
  const hiddenChildren = hiddenPivot.children.slice();
  hiddenChildren.forEach(function(child) {
    hiddenPivot.remove(child)
  })
}

function createTextMesh(message, color, size) {
  const material = new THREE.MeshStandardMaterial({
    color: color
  })

  const geometry = new TextGeometry(message, {
    font: font,
    size: 80,
    depth: 5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 10,
    bevelSize: 4,
    bevelOffset: 0,
    bevelSegments: 5
  });
  geometry.center();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(size, size, size);

  return mesh;
}

function initialize() {
  const canvas = document.querySelector(CANVAS_SELECTOR);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas
  });

  // Camera.
  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 500;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.x = 0;
  camera.position.z = 3;
  camera.position.y = 0;
  camera.lookAt(0, 0, 0);

  // Scene.
  scene = new THREE.Scene();
  scene.background = new THREE.Color().setHex(0xFFFFFF);
  renderer.render(scene, camera);

  // Pivots.
  mainPivot = new THREE.Object3D();
  scene.add(mainPivot);

  frontPivot = new THREE.Object3D();
  mainPivot.add(frontPivot);

  backPivot = new THREE.Object3D();
  backPivot.rotation.y = Math.PI;
  mainPivot.add(backPivot);

  // Light.
  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const loader = new OBJLoader();
  loader.load('./models/heart-v2.obj', function(heartObj) {
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000
    })

    heartObj.traverse((mesh) => {
      mesh.material = redMaterial;
    });

    heartObj.position.x = 0;
    heartObj.position.y = -0.4;
    heartObj.position.z = 0;
    heartObj.scale.set(0.15, 0.15, 0.15);

    mainPivot.add(heartObj);
  }, undefined, function(error) {
    console.error(error);
  });

  const fontLoader = new FontLoader();
  fontLoader.load('./assets/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;

    addTexts(TEXTS[0], INSTRUCTIONS[0], frontPivot);
  });

  window.requestAnimationFrame(mainRender);
}

function mainRender(time) {
  time *= 0.001; // Convert time to seconds.

  let delta = time - lastRenderTime;
  lastRenderTime = time

  if (rotating) {
    const rot = delta * ROTATION_SPEED;

    const previous = mainPivot.rotation.y;
    let current = previous + rot;

    // The 180 and 360 degrees positions are breaking points.
    let shouldStop = false;
    if (current >= 2 * Math.PI) {
      current = 0;
      shouldStop = true;
    } else if (previous < Math.PI && current >= Math.PI) {
      current = Math.PI;
      shouldStop = true;
    }

    mainPivot.rotation.y = current;

    if (shouldStop) {
      animationStop();
    }
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(mainRender);
}

function onPointerDown() {
  if (!rotating) {
    animationStart();
  }
}

function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// --- Initialization --- //

window.addEventListener("load", function() {
  window.addEventListener('pointerdown', onPointerDown);
  initialize();
});