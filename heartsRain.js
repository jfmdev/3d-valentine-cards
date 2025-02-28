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

const HEART_FALL_SPEED = 2;
const HEART_ROTATION_SPEED = 2;

const PIVOT_ROTATION_SPEED = 4;

const MATERIALS = [
  new THREE.MeshStandardMaterial({
    color: 0xff0000
  }),
  new THREE.MeshStandardMaterial({
    color: 0xff80d0
  }),
  new THREE.MeshStandardMaterial({
    color: 0xff0080
  }),
];

const HEARTS_DEPTHS = [
  { xRange: [-14, 14], yRange: [-15.8, 15.5], z: -16, limit: 6 },
  { xRange: [-8, 8], yRange: [-9.7, 9.4], z: -8, limit: 4 },
  { xRange: [-3.5, 3.5], yRange: [-5.1, 4.8], z: -2, limit: 2 },
];

const LETTER_DEPTH = 1;

const LETTER_TEXT = [
  'Happy', 'Valentines Day!',
  'Roses are red,', 'violets are blue',
  'Honey is sweet,', 'and so are you.'
];

const INTRO_TEXT = 'Touch to open';

// --- Shared variables --- //

let camera = null;
let renderer = null;
let scene = null;

let lastRenderTime = 0;

let rotating = false;
let animate = false;

let font = null;
let hearts = [];

let backPivot = null;
let mainPivot = null;

// --- Functions --- //

async function addHeart(position) {
  let newHeart;
  if(hearts.length === 0) {
    newHeart = await loadHeartModel()
  } else {
    newHeart = hearts[0].clone()
  }

  const material = MATERIALS[Math.floor(Math.random()*MATERIALS.length)];
  newHeart.traverse((mesh) => {
    mesh.material = material;
  });

  newHeart.position.x = position.x;
  newHeart.position.y = position.y;
  newHeart.position.z = position.z;

  newHeart.rotation.y = Math.random()*Math.PI;

  scene.add(newHeart);
  hearts.push(newHeart)
}

function loadHeartModel() {
  return new Promise(function(resolve, reject) {
    const loader = new OBJLoader();
    loader.load('./models/heart-v2.obj', function(newHeart) {  
      newHeart.scale.set(0.1, 0.1, 0.1);
  
      resolve(newHeart);
    }, undefined, function(error) {
      reject(error);
    });
  });
}

function animationStart() {
  animate = true;
  rotating = true;
}

function animationStop() {
  rotating = false;
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

async function initialize() {
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

  // PivotS.
  mainPivot = new THREE.Object3D();
  mainPivot.position.z = LETTER_DEPTH;
  scene.add(mainPivot);

  backPivot = new THREE.Object3D();
  backPivot.rotation.y = Math.PI;
  mainPivot.add(backPivot);

  // Light.
  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  // Font and texts.
  const fontLoader = new FontLoader();
  fontLoader.load('./fonts/helvetiker_regular.typeface.json', function(loadedFont) {
    font = loadedFont;

    const letterMeshes = LETTER_TEXT.map(function(message, index) {
      const letterMesh = createTextMesh(message, 0xff0080, 0.0015);
      letterMesh.position.z = 0.1;
      letterMesh.position.y = 0.2 * (LETTER_TEXT.length/2 - (index + 0.5));
      return letterMesh;
    })
    letterMeshes.forEach(function(letterMesh) {
      backPivot.add(letterMesh);
    })
  
    const introMesh = createTextMesh(INTRO_TEXT, 0x808000, 0.002)
    introMesh.position.z = 0.1;
    mainPivot.add(introMesh);
  });

  // Hearts.
  for(let i=0; i<HEARTS_DEPTHS.length; i++) {
    const depth = HEARTS_DEPTHS[i];
    const ySubrangeLength = (depth.xRange[1] - depth.xRange[0])/depth.limit;
    for(let j=0; j<depth.limit; j++) {
      const ySubrange = [
        j*ySubrangeLength + depth.xRange[0],
        (j+1)*ySubrangeLength + depth.xRange[0]
      ];

      await addHeart({
        x: randomBetween(depth.xRange[0], depth.xRange[1]),
        y: randomBetween(ySubrange[0], ySubrange[1]),
        z: depth.z
      });
    }    
  }  

  // Letter.
  const geometry = new THREE.BoxGeometry(2, 1.5, 0.05); 
  const material = new THREE.MeshStandardMaterial( {color: 0xe8e8e8} ); 
  const cube = new THREE.Mesh(geometry, material);
  mainPivot.add(cube);

  window.requestAnimationFrame(mainRender);
}

function mainRender(time) {
  time *= 0.001; // Convert time to seconds.

  let delta = time - lastRenderTime;
  lastRenderTime = time

  // Letter.
  if (rotating) {
    const previous = mainPivot.rotation.y;
    let current = previous + delta * PIVOT_ROTATION_SPEED;

    // Note that the 180 and 360 degrees positions are breaking points.
    if (current >= 2 * Math.PI) {
      current = 0;
      animationStop();
    } else if (previous < Math.PI && current >= Math.PI) {
      current = Math.PI;
      animationStop();
    }
    mainPivot.rotation.y = current;
  }

  // Hearts.
  if(animate) {
    const deltaRot = delta * HEART_ROTATION_SPEED;
    const deltaMov = delta * HEART_FALL_SPEED;
    hearts.forEach(function(heart) {
      heart.rotation.y = heart.rotation.y + deltaRot;
      if(heart.rotation.y > 2*Math.PI) {
        heart.rotation.y -= 2*Math.PI;
      }

      heart.position.y = heart.position.y + deltaMov;
      const depth = HEARTS_DEPTHS.find(item => item.z === heart.position.z);
      if(depth && heart.position.y > depth.yRange[1]) {
        heart.position.y = depth.yRange[0];
        heart.position.x = randomBetween(depth.xRange[0], depth.xRange[1]);
      }
    });
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

function randomBetween(min, max) {
  return Math.random()*(max - min) + min;
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