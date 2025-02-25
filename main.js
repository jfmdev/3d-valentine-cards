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
  ['Roses are red,', 'violets are blue'],
  ['Honey is sweet,', 'and so are you.'],
];

const INSTRUCTION = 'Touch to start'

// --- Shared variables --- //

let camera = null;
let renderer = null;
let scene = null;

let lastRenderTime = 0;

let rotating = false;
let iteration = -1;

let font = null;

let heartObj = null;
let frontPivot = null;
let backPivot = null;

// --- Functions --- //

function addText(messages, isBack) {
  const mainMeshes = messages.map(function(message, index) {
    const myMesh = createTextMesh(message, 0xe060e0, 0.003)
    myMesh.position.z = 1;
    myMesh.position.y = 0.2 - (0.3 * index)
    return myMesh
  })

  const instructionMesh = createTextMesh(INSTRUCTION, 0x808000, 0.002)
  instructionMesh.position.z = 1;
  instructionMesh.position.y = -1.3;

  let pivot = new THREE.Object3D();
  mainMeshes.forEach(function(mainMesh) {
    pivot.add(mainMesh);
  })
  pivot.add(instructionMesh);

  scene.add(pivot);

  if (isBack) {
    pivot.rotation.y = Math.PI;
    backPivot = pivot;
  } else {
    frontPivot = pivot;
  }
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

  // Light.
  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const loader = new OBJLoader();
  loader.load('./models/heart-v2.obj', function(loadedObj) {
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000
    })

    loadedObj.traverse((mesh) => {
      mesh.material = redMaterial;
    });

    loadedObj.position.x = 0;
    loadedObj.position.y = -0.4;
    loadedObj.position.z = 0;
    loadedObj.scale.set(0.15, 0.15, 0.15);

    scene.add(loadedObj);
    heartObj = loadedObj;
  }, undefined, function(error) {
    console.error(error);
  });

  const fontLoader = new FontLoader();
  fontLoader.load('./assets/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;
    addText(TEXTS[0]);
    addText(TEXTS[1], true);
  });

  window.requestAnimationFrame(renderAnimation);
}

function onPointerDown() {
  if (!rotating) {
    rotating = true;
    iteration = (iteration + 1) % TEXTS.length;
  } else {
    rotating = false;
  }
}

function renderAnimation(time) {
  time *= 0.001; // convert time to seconds

  let delta = time - lastRenderTime;
  lastRenderTime = time

  if (heartObj && rotating) {
    const rot = delta * ROTATION_SPEED;

    const previous = heartObj.rotation.y;
    let current = previous + rot;

    // The 180 and 360 degrees positions are breaking points.
    if (current >= 2 * Math.PI) {
      current = 0;
      rotating = false;
    } else if (previous < Math.PI && current >= Math.PI) {
      current = Math.PI;
      rotating = false;
    }

    heartObj.rotation.y = current;
    frontPivot.rotation.y = current;
    backPivot.rotation.y = current + Math.PI;
  }

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(renderAnimation);
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