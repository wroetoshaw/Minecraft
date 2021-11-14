import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import SimplexNoise from "simplex-noise";
import Stats from "stats-js";

/************************************
 Live Fps stats
 ***********************************/

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();

  stats.end();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

/************************************
 perlin noise
 ***********************************/

const simplex = new SimplexNoise();
// value2d = simplex.noise2D(x, y);

/************************************
 Base
 ***********************************/

const canvas = document.querySelector("canvas.webgl");
// Scene
const scene = new THREE.Scene();

/************************************
 Texture Loader
 ***********************************/

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

var faces = [
  {
    dir: [-5, 0, 0, "left"],
  },
  {
    dir: [5, 0, 0, "right"],
  },
  {
    dir: [0, -5, 0, "bottom"],
  },
  {
    dir: [0, 5, 0, "top"],
  },
  {
    dir: [0, 0, -5, "back"],
  },
  {
    dir: [0, 0, 5, "front"],
  },
];

/************************************
 Gobal constants
 ***********************************/

const fog = new THREE.Fog();
const near = 10;
const far = 250;
const color = new THREE.Color("#DCDBDF");
scene.fog = new THREE.Fog(color, near, far);
//Window sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
//renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor("#36C7F2");

/************************************
 Gobal Variable
 ***********************************/

var chunks = []; //refer line 276
var xoff = 0;
var zoff = 0;
var inc = 0.05;
var amplitude = 20 + Math.random() * 10;
var renderDistance = 5;
var chunkSize = 10;
var blockBox = new THREE.BoxGeometry(5, 5, 5);
var instancedChunk = new THREE.InstancedMesh(
  blockBox,
  materialArray,
  chunkSize * chunkSize * renderDistance * renderDistance
);
var count = 0;

/************************************
 Resize function 
 ***********************************/

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

/************************************
 Light 
 ***********************************/
var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(4, 5, -2);
scene.add(directionalLight);

/************************************
 Camera
 ***********************************/
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

/************************************
 Blocks function
 ***********************************/

function Block(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;

  //Voxel function
  this.getVoxel = function (x, y, z) {
    for (var i = 0; i < chunks.length; i++) {
      for (var j = 0; j < chunks[i].length; j++) {
        if (chunks[i][j].x == x && chunks[i][j].y == y && chunks[i][j].z == z) {
          return true;
        }
      }
    }
    return false;
  };

  this.directions = [];
  this.adjustFaces = function () {
    for (const { dir } of faces) {
      const neighbour = this.getVoxel(
        this.x + dir[0],
        this.y + dir[1],
        this.z + dir[2]
      );
      if (neighbour) {
        switch (dir[3]) {
          case "right":
            this.directions.push("right");
            break;
          case "left":
            this.directions.push("left");
            break;
          case "bottom":
            this.directions.push("bottom");
            break;
          case "top":
            this.directions.push("top");
            break;
          case "back":
            this.directions.push("back");
            break;
          case "front":
            this.directions.push("front");
            break;
        }
      }
    }
  };

  // this.display = function () {
  //   this.adjustFaces();
  //   var blockBox = new THREE.BoxBufferGeometry(5, 5, 5);
  //   // var blockMesh = new THREE.MeshStandardMaterial({
  //   //   color: 0x00ff00,
  //   //   // wireframe: true,
  //   // });
  //   this.mesh = new THREE.Mesh(blockBox, [
  //     this.directions.includes("right") ? null : materialArray[0], //right
  //     this.directions.includes("left") ? null : materialArray[1], //left
  //     this.directions.includes("top") ? null : materialArray[2], //top
  //     this.directions.includes("bottom") ? null : materialArray[3], //bottom
  //     this.directions.includes("front") ? null : materialArray[4], //front
  //     this.directions.includes("back") ? null : materialArray[5], //back
  //   ]);
  //   scene.add(this.mesh);
  //   this.mesh.position.x = this.x;
  //   this.mesh.position.y = this.y - 10;
  //   this.mesh.position.z = this.z;

  //   var edges = new THREE.EdgesGeometry(blockBox);
  //   this.line = new THREE.LineSegments(
  //     edges,
  //     new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 })
  //   );
  //   this.line.position.x = this.x;
  //   this.line.position.y = this.y - 10;
  //   this.line.position.z = this.z;
  //   scene.add(this.line);
  // };
}

/***********************************
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
}
for (var x = 0; x < 20; x++) {
  xoff = 0;
  for (var z = 0; z < 20; z++) {
    var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
    blocks.push(new Block(x * 5, v, z * 5));
    xoff = xoff + inc;
  }
  zoff = zoff + inc;
}
var blocksBottomRight = [];
for (var x = 0; x < 20; x++) {
  xoff = 0;
  for (var z = 0; z < 20; z++) {
    var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
    blocksBottomRight.push(new Block(x * 5, v, -z * 5));
    xoff = xoff + inc;
  }
  zoff = zoff + inc;
}
for (var i = 0; i < blocksBottomRight.length; i++) {
  blocksBottomRight[i].display();
}
var blocksBottomLeft = [];
for (var x = 0; x < 20; x++) {
  xoff = 0;
  for (var z = 0; z < 20; z++) {
    var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
    blocksBottomLeft.push(new Block(-x * 5, v, -z * 5));
    xoff = xoff + inc;
  }
  zoff = zoff + inc;
}
for (var i = 0; i < blocksBottomLeft.length; i++) {
  blocksBottomLeft[i].display();
}
var blocksTopLeft = [];
for (var x = 0; x < 20; x++) {
  xoff = 0;
  zoff = 0;
  for (var z = 0; z < 20; z++) {
    var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
    blocksTopLeft.push(new Block(-x * 5, v, z * 5));
    xoff = xoff + inc;
  }
  zoff = zoff + inc;
}
for (var i = 0; i < blocksTopLeft.length; i++) {
  blocksTopLeft[i].display();
}
**********************************/

/************************************
 Chunks
 ***********************************/

for (var i = 0; i < renderDistance; i++) {
  for (var j = 0; j < renderDistance; j++) {
    var chunk = [];
    for (var x = i * chunkSize; x < i * chunkSize + chunkSize; x++) {
      for (var z = j * chunkSize; z < j * chunkSize + chunkSize; z++) {
        xoff = (inc * x) / 5;
        zoff = (inc * z) / 5;
        var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
        chunk.push(new Block(x * 5, v, z * 5));
        let matrix = new THREE.Matrix4().makeTranslation(x * 5, v, z * 5);
        instancedChunk.setMatrixAt(count, matrix);
        count++;
      }
    }
    chunks.push(chunk);
  }
}
scene.add(instancedChunk);

/************************************
 PointerLockControls 
 ***********************************/

const controls = new PointerLockControls(camera, document.body);
document.addEventListener("click", function () {
  controls.lock();
});
controls.addEventListener("lock", function () {});
controls.addEventListener("unlock", function () {});

/************************************
 Keys
 ***********************************/

var keys = [];
var canJump = true;

//EventListener
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

/************************************
 Update function (gravity, collisions, Infinite world generation)
 ***********************************/
var movingSpeed = 0.5;
var ySpeed = 0;
var acc = 0.08;
const update = () => {
  /************Movements************/
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
          if (camera.position.y == chunks[i][j].y + 5) {
            controls.moveForward(movingSpeed * -1);
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
          if (camera.position.y == chunks[i][j].y + 5) {
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
          if (camera.position.y == chunks[i][j].y + 5) {
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
          if (camera.position.y == chunks[i][j].y + 5) {
            controls.moveRight(-1 * movingSpeed);
          }
        }
      }
    }
  }
  /************Gravity************/
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
          camera.position.y <= chunks[i][j].y + 10 &&
          camera.position.y >= chunks[i][j].y
        ) {
          camera.position.y = chunks[i][j].y + 10;
          ySpeed = 0;
          canJump = true;
          break;
        }
      }
    }
  }
  /************Infinite World generation function************/
  var worldSize = chunkSize * renderDistance * 5;
  var ratio = 0.4;
  if (camera.position.z <= lowestZBlock() + worldSize * ratio) {
    //decreasing z

    //remove chunks
    // for (i = 0; i < chunks.length; i++) {
    //   if ((i + 1) % renderDistance == 0) {
    //     for (j = 0; j < chunks[i].length; j++) {
    //       scene.remove(chunks[i][j].mesh);
    //       scene.remove(chunks[i][j].line);
    //     }
    //   }
    // }
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
          xoff = (inc * x) / 5;
          zoff = (inc * z) / 5;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(i * renderDistance, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize
    );
    var count = 0;
    for (var i = 0; i < chunks.length; i++) {
      for (var j = 0; j < chunks[i].length; j++) {
        let matrix = new THREE.Matrix4().makeTranslation(
          chunks[i][j].x,
          chunks[i][j].y,
          chunks[i][j].z
        );
        instancedChunk.setMatrixAt(count, matrix);
        count++;
      }
      scene.add(instancedChunk);
    }

    // for (
    //   i = 0;
    //   i < chunks.length - renderDistance + 1;
    //   i = i + renderDistance
    // ) {
    //   for (var j = 0; j < chunks[i].length; j++) {
    //     chunks[i][j].display();
    //   }
    // }
  }
  //increasing z
  if (camera.position.z >= highestZBlock() - worldSize * ratio) {
    //remove chunks
    // for (i = 0; i < chunks.length; i++) {
    //   if (i % renderDistance == 0) {
    //     for (j = 0; j < chunks[i].length; j++) {
    //       scene.remove(chunks[i][j].mesh);
    //       scene.remove(chunks[i][j].line);
    //     }
    //   }
    // }
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
          xoff = (inc * x) / 5;
          zoff = (inc * z) / 5;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice((i + 1) * renderDistance - 1, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize
    );
    var count = 0;
    for (var i = 0; i < chunks.length; i++) {
      for (var j = 0; j < chunks[i].length; j++) {
        let matrix = new THREE.Matrix4().makeTranslation(
          chunks[i][j].x,
          chunks[i][j].y,
          chunks[i][j].z
        );
        instancedChunk.setMatrixAt(count, matrix);
        count++;
      }
      scene.add(instancedChunk);
    }
    // for (i = renderDistance - 1; i < chunks.length; i = i + renderDistance) {
    //   for (var j = 0; j < chunks[i].length; j++) {
    //     chunks[i][j].display();
    //   }
    // }
  }
  // //increasing x
  if (camera.position.x >= highestXBlock() - worldSize * ratio) {
    //remove chunksw
    // for (i = 0; i < renderDistance; i++) {
    //   for (j = 0; j < chunks[i].length; j++) {
    //     scene.remove(chunks[i][j].mesh);
    //     scene.remove(chunks[i][j].line);
    //   }
    // }
    var newChunks = [];
    for (i = renderDistance; i < chunks.length; i++) {
      newChunks.push(chunks[i]);
    }

    //Add
    var highestX = highestXBlock();
    var lowestZ = lowestZBlock();
    for (var i = 0; i < renderDistance; i++) {
      var chunk = [];
      for (
        var z = lowestZ + i * chunkSize * 5;
        z < lowestZ + i * chunkSize * 5 + chunkSize * 5;
        z = z + 5
      ) {
        for (
          var x = highestX + 5;
          x < highestX + 5 + chunkSize * 5;
          x = x + 5
        ) {
          xoff = (inc * x) / 5;
          zoff = (inc * z) / 5;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(chunks.length - (renderDistance - i), 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize
    );
    var count = 0;
    for (var i = 0; i < chunks.length; i++) {
      for (var j = 0; j < chunks[i].length; j++) {
        let matrix = new THREE.Matrix4().makeTranslation(
          chunks[i][j].x,
          chunks[i][j].y,
          chunks[i][j].z
        );
        instancedChunk.setMatrixAt(count, matrix);
        count++;
      }
      scene.add(instancedChunk);
    }
    // for (i = chunks.length - renderDistance; i < chunks.length; i++) {
    //   for (var j = 0; j < chunks[i].length; j++) {
    //     chunks[i][j].display();
    //   }
    // }
  }
  // decreasing x
  if (camera.position.x <= lowestXBlock() + worldSize * ratio) {
    //remove chunks
    // for (i = chunks.length - renderDistance; i < chunks.length; i++) {
    //   for (j = 0; j < chunks[i].length; j++) {
    //     scene.remove(chunks[i][j].mesh);
    //     scene.remove(chunks[i][j].line);
    //   }
    // }
    var newChunks = [];
    for (i = 0; i < chunks.length - renderDistance; i++) {
      newChunks.push(chunks[i]);
    }

    // Add;
    var lowestX = lowestXBlock();
    var lowestZ = lowestZBlock();
    for (var i = 0; i < renderDistance; i++) {
      var chunk = [];
      for (
        var z = lowestZ + i * chunkSize * 5;
        z < lowestZ + i * chunkSize * 5 + chunkSize * 5;
        z = z + 5
      ) {
        for (var x = lowestX - chunkSize * 5; x < lowestX; x = x + 5) {
          xoff = (inc * x) / 5;
          zoff = (inc * z) / 5;
          var v = Math.round((simplex.noise2D(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
        }
      }
      newChunks.splice(i, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize
    );
    var count = 0;
    for (var i = 0; i < chunks.length; i++) {
      for (var j = 0; j < chunks[i].length; j++) {
        let matrix = new THREE.Matrix4().makeTranslation(
          chunks[i][j].x,
          chunks[i][j].y,
          chunks[i][j].z
        );
        instancedChunk.setMatrixAt(count, matrix);
        count++;
      }
      scene.add(instancedChunk);
    }
    // for (i = 0; i < renderDistance; i++) {
    //   for (var j = 0; j < chunks[i].length; j++) {
    //     chunks[i][j].display();
    //   }
    // }
  }
};

/************************************
 Block functions for update function
 ***********************************/

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

/************************************
 Raycaster
 ***********************************/

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
pointer.x = 0.5 * 2 - 1;
pointer.y = -1 * 0.5 * 2 + 1;

var plane;
/********Render function********/
const render = () => {
  raycaster.setFromCamera(pointer, camera);
  var intersection = raycaster.intersectObject(instancedChunk);
  if (intersection[0] != undefined && intersection[0].distance < 40) {
    if (!scene.children.includes(plane)) {
      var planeG = new THREE.PlaneGeometry(5, 5);
      var planeM = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      });
      planeM.transparent = true;
      planeM.opacity = 0.5;
      plane = new THREE.Mesh(planeG, planeM);
      scene.add(plane);
    } else {
      plane.visible = true;
      var materialIndex = intersection[0].face.materialIndex;
      var position = intersection[0].point;
      var x = 0;
      var y = 0;
      var z = 0;
      const inc = 0.1;
      switch (materialIndex) {
        case 0: // right
          plane.rotation.x = 0;
          plane.rotation.y = Math.PI / 2;
          plane.rotation.z = 0;
          x = position.x + inc;
          y = Math.round(position.y / 5) * 5;
          z = Math.round(position.z / 5) * 5;
          break;
        case 1: //left
          plane.rotation.x = 0;
          plane.rotation.y = Math.PI / 2;
          plane.rotation.z = 0;
          x = position.x - inc;
          y = Math.round(position.y / 5) * 5;
          z = Math.round(position.z / 5) * 5;
          break;
        case 2: //top
          plane.rotation.x = Math.PI / 2;
          plane.rotation.y = 0;
          plane.rotation.z = 0;
          x = Math.round(position.x / 5) * 5;
          y = position.y + inc;
          z = Math.round(position.z / 5) * 5;
          break;
        case 3: //bottom
          plane.rotation.x = Math.PI / 2;
          plane.rotation.y = 0;
          plane.rotation.z = 0;
          x = Math.round(position.x / 5) * 5;
          y = position.y - inc;
          z = Math.round(position.z / 5) * 5;
          break;
        case 4: //front
          plane.rotation.x = 0;
          plane.rotation.y = 0;
          plane.rotation.z = Math.PI / 2;
          x = Math.round(position.x / 5) * 5;
          y = Math.round(position.y / 5) * 5;
          z = position.z + inc;
          break;
        case 5: //back
          plane.rotation.x = 0;
          plane.rotation.y = 0;
          plane.rotation.z = Math.PI / 2;
          x = Math.round(position.x / 5) * 5;
          y = Math.round(position.y / 5) * 5;
          z = position.z - inc;
          break;
      }
      plane.position.x = x;
      plane.position.y = y;
      plane.position.z = z;
    }
  } else {
    if (plane) {
      plane.visible = false;
    }
  }
  renderer.render(scene, camera);
};

const clock = new THREE.Clock();

/************************************
 GameLoop
 ***********************************/

const GameLoop = () => {
  requestAnimationFrame(GameLoop);
  update();
  render();
};

GameLoop();
