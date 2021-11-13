import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import SimplexNoise from "simplex-noise";

//perlin noise
const simplex = new SimplexNoise();
// value2d = simplex.noise2D(x, y);

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const materialArray = [
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/side4.png"),
  }),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/side1.png"),
  }),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/top.png"),
  }),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/bottom.png"),
  }),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/side2.png"),
  }),
  new THREE.MeshBasicMaterial({
    map: textureLoader.load("/textures/side3.png"),
  }),
];
//side3
const fog = new THREE.Fog();
const near = 20;
const far = 150;
scene.fog = new THREE.Fog(0xffffff, near, far);
function Block(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;

  this.display = function () {
    var blockBox = new THREE.BoxBufferGeometry(5, 5, 5);
    // var blockMesh = new THREE.MeshStandardMaterial({
    //   color: 0x00ff00,
    //   // wireframe: true,
    // });
    this.mesh = new THREE.Mesh(blockBox, materialArray);
    scene.add(this.mesh);
    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y - 10;
    this.mesh.position.z = this.z;

    var edges = new THREE.EdgesGeometry(blockBox);
    this.line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 })
    );
    this.line.position.x = this.x;
    this.line.position.y = this.y - 10;
    this.line.position.z = this.z;
    scene.add(this.line);
  };
}

//BLOCKS

/*
var blocks = [];
var amplitude = 10;
var xoff = 0;
var zoff = 0;
var inc = 0.05;
for (var j = 1; j < 5; j++) {
  if (j > 2) {
    var exponent = Math.pow(-1, j);
    var exponent1 = Math.pow(-1, j);
  } else {
    var exponent = Math.pow(-1, j);
    var exponent1 = Math.pow(-1, j + 1);
  }
  for (var x = 0; x < 20; x++) {
    xoff = 0;
    for (var z = 0; z < 20; z++) {
      var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
      blocks.push(new Block(x * 5 * exponent, v, z * 5 * exponent1));
      xoff = xoff + inc;
    }
    zoff = zoff + inc;
  }
}
// }
// for (var x = 0; x < 20; x++) {
//   xoff = 0;
//   for (var z = 0; z < 20; z++) {
//     var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
//     blocks.push(new Block(x * 5, v, z * 5));
//     xoff = xoff + inc;
//   }
//   zoff = zoff + inc;
// }
*/

// var blocksBottomRight = [];
// for (var x = 0; x < 20; x++) {
//   xoff = 0;
//   for (var z = 0; z < 20; z++) {
//     var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
//     blocksBottomRight.push(new Block(x * 5, v, -z * 5));
//     xoff = xoff + inc;
//   }
//   zoff = zoff + inc;
// }
// for (var i = 0; i < blocksBottomRight.length; i++) {
//   blocksBottomRight[i].display();
// }

// var blocksBottomLeft = [];
// for (var x = 0; x < 20; x++) {
//   xoff = 0;
//   for (var z = 0; z < 20; z++) {
//     var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
//     blocksBottomLeft.push(new Block(-x * 5, v, -z * 5));
//     xoff = xoff + inc;
//   }
//   zoff = zoff + inc;
// }
// for (var i = 0; i < blocksBottomLeft.length; i++) {
//   blocksBottomLeft[i].display();
// }

// var blocksTopLeft = [];
// for (var x = 0; x < 20; x++) {
//   xoff = 0;
//   zoff = 0;
//   for (var z = 0; z < 20; z++) {
//     var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
//     blocksTopLeft.push(new Block(-x * 5, v, z * 5));
//     xoff = xoff + inc;
//   }
//   zoff = zoff + inc;
// }
// for (var i = 0; i < blocksTopLeft.length; i++) {
//   blocksTopLeft[i].display();
// }

//Chunks

var chunks = [];
var xoff = 0;
var zoff = 0;
var inc = 0.025;
var amplitude = 10;
var renderDistance = 3;
var chunkSize = 10;
for (var i = 0; i < renderDistance; i++) {
  for (var j = 0; j < renderDistance; j++) {
    var chunk = [];
    for (var x = i * chunkSize; x < i * chunkSize + chunkSize; x++) {
      for (var z = j * chunkSize; z < j * chunkSize + chunkSize; z++) {
        xoff = inc * x;
        zoff = inc * z;
        var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
        chunk.push(new Block(x * 5, v, z * 5));
      }
    }
    chunks.push(chunk);
  }
}

for (var i = 0; i < chunks.length; i++) {
  for (var j = 0; j < chunks[i].length; j++) {
    chunks[i][j].display();
  }
}
console.log(chunks[0][0].mesh, chunks[0][1].line);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#36C7F2");

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
//Light
var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(4, 5, -2);
scene.add(directionalLight);

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.x = ((renderDistance * chunkSize) / 2) * 5;
camera.position.z = ((renderDistance * chunkSize) / 2) * 5;
camera.position.y = 40;
scene.add(camera);

// Controls
const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", function () {
  controls.lock();
});
controls.addEventListener("lock", function () {});
controls.addEventListener("unlock", function () {});
/**
 * Renderer
 */

/**
 * Animate
 */
//keys

var keys = [];
var canJump = true;
document.addEventListener("keydown", function (e) {
  keys.push(e.key);
  if (e.key == " ") {
    ySpeed = -1.2;
    // canJump = false;
  }
});
document.addEventListener("keyup", function (e) {
  var newArray = [];
  for (var i = 0; i < keys.length; i++) {
    if (keys[i] != e.key) {
      newArray.push(keys[i]);
    }
    keys = newArray;
  }
});

var movingSpeed = 0.5;
var ySpeed = 0;
var acc = 0.08;
const update = () => {
  if (keys.includes("w")) {
    controls.moveForward(movingSpeed);
    for (i = 0; i < chunks.length; i++) {
      for (j = 0; j < chunks[i].length; j++) {
        if (
          camera.position.x <= chunks[i][j].x + 2.5 &&
          camera.position.x >= chunks[i][j].x - 2.5 &&
          camera.position.z <= chunks[i][j].z + 2.5 &&
          camera.position.z >= chunks[i][j].z - 2.5
        ) {
          if (camera.position.y == chunks[i][j].y - 2.5) {
            controls.moveForward(-1 * movingSpeed);
          }
        }
      }
    }
  }

  if (keys.includes("a")) {
    controls.moveRight(-1 * movingSpeed);
    for (i = 0; i < chunks.length; i++) {
      for (j = 0; j < chunks[i].length; j++) {
        if (
          camera.position.x <= chunks[i][j].x + 2.5 &&
          camera.position.x >= chunks[i][j].x - 2.5 &&
          camera.position.z <= chunks[i][j].z + 2.5 &&
          camera.position.z >= chunks[i][j].z - 2.5
        ) {
          if (camera.position.y == chunks[i][j].y - 2.5) {
            controls.moveRight(movingSpeed);
          }
        }
      }
    }
  }
  if (keys.includes("s")) {
    controls.moveForward(-1 * movingSpeed);
    for (i = 0; i < chunks.length; i++) {
      for (j = 0; j < chunks[i].length; j++) {
        if (
          camera.position.x <= chunks[i][j].x + 2.5 &&
          camera.position.x >= chunks[i][j].x - 2.5 &&
          camera.position.z <= chunks[i][j].z + 2.5 &&
          camera.position.z >= chunks[i][j].z - 2.5
        ) {
          if (camera.position.y == chunks[i][j].y - 2.5) {
            controls.moveForward(movingSpeed);
          }
        }
      }
    }
  }
  if (keys.includes("d")) {
    controls.moveRight(movingSpeed);
    for (i = 0; i < chunks.length; i++) {
      for (j = 0; j < chunks[i].length; j++) {
        if (
          camera.position.x <= chunks[i][j].x + 2.5 &&
          camera.position.x >= chunks[i][j].x - 2.5 &&
          camera.position.z <= chunks[i][j].z + 2.5 &&
          camera.position.z >= chunks[i][j].z - 2.5
        ) {
          if (camera.position.y == chunks[i][j].y - 2.5) {
            controls.moveRight(-1 * movingSpeed);
          }
        }
      }
    }
  }
  camera.position.y = camera.position.y - ySpeed;
  ySpeed = ySpeed + acc;
  for (i = 0; i < chunks.length; i++) {
    for (j = 0; j < chunks[i].length; j++) {
      if (
        camera.position.x <= chunks[i][j].x + 2.5 &&
        camera.position.x >= chunks[i][j].x - 2.5 &&
        camera.position.z <= chunks[i][j].z + 2.5 &&
        camera.position.z >= chunks[i][j].z - 2.5
      ) {
        if (
          camera.position.y <= chunks[i][j].y + 2.5 &&
          camera.position.y >= chunks[i][j].y - 2.5
        ) {
          camera.position.y = chunks[i][j].y + 2.5;
          ySpeed = 0;
          canJump = true;
          break;
        }
      }
    }
  }
  //decreasing z
  if (camera.position.z <= lowestZBlock() + 15) {
    //remove chunks
    for (i = 0; i < chunks.length; i++) {
      if ((i + 1) % renderDistance == 0) {
        for (j = 0; j < chunks[i].length; j++) {
          scene.remove(chunks[i][j].mesh);
          scene.remove(chunks[i][j].line);
        }
      }
    }
    var newChunks = [];
    for (i = 0; i < chunks.length; i++) {
      if ((i + 1) % renderDistance != 0) {
        newChunks.push(chunks[i]);
      }
    }
    //Add
    var lowestX = lowestXBlock();
    var lowestZ = lowestZBlock();
    for (var i = 0; i < renderDistance; i++) {
      var chunk = [];
      for (
        var x = lowestX + i * chunkSize * 5;
        x < lowestX + i * chunkSize * 5 + chunkSize * 5;
        x = x + 5
      ) {
        for (var z = lowestZ - chunkSize * 5; z < lowestZ; z = z + 5) {
          xoff = inc * x;
          zoff = inc * z;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(i * renderDistance, 0, chunk);
    }
    chunks = newChunks;
    for (i = 0; i < chunks.length; i++) {
      if (i % renderDistance == 0) {
        for (var j = 0; j < chunks[i].length; j++) {
          chunks[i][j].display();
        }
      }
    }
  }
  //increasing z
  if (camera.position.z >= highestZBlock() - 15) {
    //remove chunks
    for (i = 0; i < chunks.length; i++) {
      if (i % renderDistance == 0) {
        for (j = 0; j < chunks[i].length; j++) {
          scene.remove(chunks[i][j].mesh);
          scene.remove(chunks[i][j].line);
        }
      }
    }
    var newChunks = [];
    for (i = 0; i < chunks.length; i++) {
      if (i % renderDistance != 0) {
        newChunks.push(chunks[i]);
      }
    }
    //Add
    var lowestX = lowestXBlock();
    var highestZ = highestZBlock();
    for (var i = 0; i < renderDistance; i++) {
      var chunk = [];
      for (
        var x = lowestX + i * chunkSize * 5;
        x < lowestX + i * chunkSize * 5 + chunkSize * 5;
        x = x + 5
      ) {
        for (
          var z = highestZ + 5;
          z < highestZ + 5 + chunkSize * 5;
          z = z + 5
        ) {
          xoff = inc * x;
          zoff = inc * z;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(i * renderDistance + 2, 0, chunk);
    }
    chunks = newChunks;
    for (i = 0; i < chunks.length; i++) {
      if ((i + 1) % renderDistance == 0) {
        for (var j = 0; j < chunks[i].length; j++) {
          chunks[i][j].display();
        }
      }
    }
  }
  //decreasing x
  if (camera.position.z >= highestZBlock() - 15) {
    //remove chunks
    for (i = 0; i < chunks.length; i++) {
      if (i % renderDistance == 0) {
        for (j = 0; j < chunks[i].length; j++) {
          scene.remove(chunks[i][j].mesh);
          scene.remove(chunks[i][j].line);
        }
      }
    }
    var newChunks = [];
    for (i = 0; i < chunks.length; i++) {
      if (i % renderDistance != 0) {
        newChunks.push(chunks[i]);
      }
    }
    //Add
    var lowestX = lowestXBlock();
    var highestZ = highestZBlock();
    for (var i = 0; i < renderDistance; i++) {
      var chunk = [];
      for (
        var x = lowestX + i * chunkSize * 5;
        x < lowestX + i * chunkSize * 5 + chunkSize * 5;
        x = x + 5
      ) {
        for (
          var z = highestZ + 5;
          z < highestZ + 5 + chunkSize * 5;
          z = z + 5
        ) {
          xoff = inc * x;
          zoff = inc * z;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(i * renderDistance + 2, 0, chunk);
    }
    chunks = newChunks;
    for (i = 0; i < chunks.length; i++) {
      if ((i + 1) % renderDistance == 0) {
        for (var j = 0; j < chunks[i].length; j++) {
          chunks[i][j].display();
        }
      }
    }
  }
};

function lowestXBlock() {
  var xPosArray = [];
  for (var i = 0; i < chunks.length; i++) {
    for (var j = 0; j < chunks[i].length; j++) {
      xPosArray.push(chunks[i][j].x);
    }
  }
  return Math.min.apply(null, xPosArray);
}
function highestXBlock() {
  var xPosArray = [];
  for (var i = 0; i < chunks.length; i++) {
    for (var j = 0; j < chunks[i].length; j++) {
      xPosArray.push(chunks[i][j].x);
    }
  }
  return Math.max.apply(null, xPosArray);
}

function lowestZBlock() {
  var zPosArray = [];
  for (var i = 0; i < chunks.length; i++) {
    for (var j = 0; j < chunks[i].length; j++) {
      zPosArray.push(chunks[i][j].z);
    }
  }
  return Math.min.apply(null, zPosArray);
}

function highestZBlock() {
  var zPosArray = [];
  for (var i = 0; i < chunks.length; i++) {
    for (var j = 0; j < chunks[i].length; j++) {
      zPosArray.push(chunks[i][j].z);
    }
  }
  return Math.max.apply(null, zPosArray);
}

const render = () => {
  renderer.render(scene, camera);
};

const clock = new THREE.Clock();

const GameLoop = () => {
  requestAnimationFrame(GameLoop);
  update();
  render();
};
GameLoop();
