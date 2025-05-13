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

const COLORS = [0xe060e0, 0x60e0e0, 0x60e080];

const HEARTS_POSITIONS = [
  { 
    end: { x: -1, y: 0, z: -1},
    start: { x: 3, y: 0, z: 3},
  },
  { 
    end: { x: 1, y: 0, z: -1},
    start: { x: -3, y: 0, z: 3},
  },
]

const ANIMATION_DURATION = 2_000;
const ROTATION_SPEED = 1.2;

const INSTRUCTION = 'Touch to open';
const TITLE = 'Happy Valentines Day!';

const TEXTS = [
  'Roses are red,',
  'violets are blue',
  'Honey is sweet,',
  'and so are you.',
];

// --- Shared variables --- //

let camera = null;
let renderer = null;
let scene = null;

let startTime = 0;
let lastRenderTime = 0;

let animating = false;
let reversing = false;

let font = null;

let mainPivot = null;
let introPivot = null;
let textPivot = null;
let heartsPivots = null;

// --- Functions --- //

// TODO: Update this.
function addTexts(messages, pivot) {
  const textMeshes = messages.map(function(message, index) {
    const myMesh = createTextMesh(message, COLORS[index % COLORS.length], 0.003)
    myMesh.position.z = 1;
    myMesh.position.y = 0.2 - (0.3 * index)
    return myMesh
  });
  textMeshes.forEach(function(textMesh) {
    pivot.add(textMesh);
  });
}

function animationStart() {
  animating = true;
  startTime = new Date().getTime();
}

function animationStop() {
  animating = false;
  reversing = !reversing;
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
  introPivot = new THREE.Object3D();
  mainPivot.add(introPivot);
  textPivot = new THREE.Object3D();
  mainPivot.add(textPivot);
  heartsPivots = HEARTS_POSITIONS.map(item => {
    const heartPivot = new THREE.Object3D();
    heartPivot.position.x = item.start.x;
    heartPivot.position.y = item.start.y;
    heartPivot.position.z = item.start.z;
    mainPivot.add(heartPivot);
    return heartPivot;
  })

  // Light.
  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  // Hearts.
  const loader = new OBJLoader();
  loader.load('./models/heart-v2.obj', function(heartObj) {
    const redMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000
    });

    heartsPivots?.forEach((pivot, index) => {
      const mainObj = index === 0 ? heartObj : heartObj.clone();

      mainObj.traverse((mesh) => {
        mesh.material = redMaterial;
      });

      mainObj.scale.set(0.15, 0.15, 0.15);
      pivot.add(mainObj);
    });
  }, undefined, function(error) {
    console.error(error);
  });

  // Fonts and texts.
  const fontLoader = new FontLoader();
  fontLoader.load('./fonts/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;

    // Add introduction texts.
    const instructionMesh = createTextMesh(INSTRUCTION, 0xa0a040, 0.002)
    instructionMesh.position.z = 1;
    instructionMesh.position.y = -1;
    introPivot.add(instructionMesh);
    const titleMesh = createTextMesh(TITLE, 0xff8080, 0.0022)
    titleMesh.position.z = 1;
    titleMesh.position.y = 0.5;
    introPivot.add(titleMesh);

    // TODO: Add only the 'touch to open' message.
    addTexts(TEXTS, textPivot);
    textPivot.visible = false;
  });

  window.requestAnimationFrame(mainRender);
}

function mainRender(time) {
  time *= 0.001; // Convert time to seconds.

  let delta = time - lastRenderTime;
  lastRenderTime = time

  // Rotate hearts.
  const rot = delta * ROTATION_SPEED;
  heartsPivots?.forEach(pivot => {
    const previous = pivot.rotation.y;
    let current = previous + rot;
    if (current > 2 * Math.PI) {
      current -= 2 * Math.PI;
    }
    pivot.rotation.y = current;
  })

  // Move hearts and hide/show messages.
  if (animating) {
    const progress = (new Date().getTime() - startTime) / ANIMATION_DURATION;
    
    if (progress > 1) {
      animationStop();
    } else {
      heartsPivots?.forEach((pivot, index) => {
        const position = HEARTS_POSITIONS[index];
        pivot.position.x = position.start.x + (position.end.x - position.start.x) * progress;
        pivot.position.y = position.start.y + (position.end.y - position.start.y) * progress;
        pivot.position.z = position.start.z + (position.end.z - position.start.z) * progress;
      })

      if(progress > 0.5) {
        textPivot.visible = !reversing;
        introPivot.visible = reversing;
      }
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
  if (!animating) {
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