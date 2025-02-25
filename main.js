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
const ROTATION_SPEED = 2;

const TEXTS = ['Hello three.js!', 'Goodbye three.js?'];

// --- Shared variables --- //

let camera = null;
let renderer = null;
let scene = null;

let lastRenderTime = 0;

let rotating = false;
let iteration = -1;

let font = null;

let heartObj = null;
let textObj = null;

// --- Functions --- //

function addText(message) {
  const geometry = new TextGeometry(message, {
    font: font,
    size: 80,
    depth: 5,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 10,
    bevelSize: 8,
    bevelOffset: 0,
    bevelSegments: 5
  });

  geometry.center();
  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdfdf
  })
  const mesh = new THREE.Mesh(geometry, pinkMaterial);
  mesh.scale.set(0.008, 0.008, 0.008);

  var pivot = new THREE.Object3D();
  pivot.add(mesh);

  // Move object away from pivot
  mesh.position.z = 1;

  scene.add(pivot);
  textObj = pivot
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
    addText('Hello Three.js!');
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

  if (heartObj && textObj && rotating) {
    let stop = false;
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
    textObj.rotation.y = current;
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