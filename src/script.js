import "./style.css";
import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
// import SimplexNoise from "simplex-noise";
// import Stats from "stats-js";

/************************************
 Live Fps stats
 ***********************************/

// var stats = new Stats();
// stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
// document.body.appendChild(stats.dom);

// function animate() {
//   stats.begin();

//   stats.end();
//   requestAnimationFrame(animate);
// }
// requestAnimationFrame(animate);

/************************************
 perlin noise
 ***********************************/
var module = (global.noise = {});

function Grad(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

Grad.prototype.dot2 = function (x, y) {
  return this.x * x + this.y * y;
};

Grad.prototype.dot3 = function (x, y, z) {
  return this.x * x + this.y * y + this.z * z;
};

var grad3 = [
  new Grad(1, 1, 0),
  new Grad(-1, 1, 0),
  new Grad(1, -1, 0),
  new Grad(-1, -1, 0),
  new Grad(1, 0, 1),
  new Grad(-1, 0, 1),
  new Grad(1, 0, -1),
  new Grad(-1, 0, -1),
  new Grad(0, 1, 1),
  new Grad(0, -1, 1),
  new Grad(0, 1, -1),
  new Grad(0, -1, -1),
];

var p = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
  27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
  92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
  209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
  164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
  147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
  28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
  155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
  191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
  181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
  61, 156, 180,
];
// To remove the need for index wrapping, double the permutation table length
var perm = new Array(512);
var gradP = new Array(512);

// This isn't a very good seeding function, but it works ok. It supports 2^16
// different seed values. Write something better if you need more seeds.
module.seed = function (seed) {
  if (seed > 0 && seed < 1) {
    // Scale the seed out
    seed *= 65536;
  }

  seed = Math.floor(seed);
  if (seed < 256) {
    seed |= seed << 8;
  }

  for (var i = 0; i < 256; i++) {
    var v;
    if (i & 1) {
      v = p[i] ^ (seed & 255);
    } else {
      v = p[i] ^ ((seed >> 8) & 255);
    }

    perm[i] = perm[i + 256] = v;
    gradP[i] = gradP[i + 256] = grad3[v % 12];
  }
};

module.seed(0);

/*
 for(var i=0; i<256; i++) {
   perm[i] = perm[i + 256] = p[i];
   gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
 }*/

// Skewing and unskewing factors for 2, 3, and 4 dimensions
var F2 = 0.5 * (Math.sqrt(3) - 1);
var G2 = (3 - Math.sqrt(3)) / 6;

var F3 = 1 / 3;
var G3 = 1 / 6;

// 2D simplex noise
module.simplex2 = function (xin, yin) {
  var n0, n1, n2; // Noise contributions from the three corners
  // Skew the input space to determine which simplex cell we're in
  var s = (xin + yin) * F2; // Hairy factor for 2D
  var i = Math.floor(xin + s);
  var j = Math.floor(yin + s);
  var t = (i + j) * G2;
  var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
  var y0 = yin - j + t;
  // For the 2D case, the simplex shape is an equilateral triangle.
  // Determine which simplex we are in.
  var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
  if (x0 > y0) {
    // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    i1 = 1;
    j1 = 0;
  } else {
    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
    i1 = 0;
    j1 = 1;
  }
  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
  // c = (3-sqrt(3))/6
  var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
  var y1 = y0 - j1 + G2;
  var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
  var y2 = y0 - 1 + 2 * G2;
  // Work out the hashed gradient indices of the three simplex corners
  i &= 255;
  j &= 255;
  var gi0 = gradP[i + perm[j]];
  var gi1 = gradP[i + i1 + perm[j + j1]];
  var gi2 = gradP[i + 1 + perm[j + 1]];
  // Calculate the contribution from the three corners
  var t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 < 0) {
    n0 = 0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * gi0.dot2(x0, y0); // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 < 0) {
    n1 = 0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * gi1.dot2(x1, y1);
  }
  var t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 < 0) {
    n2 = 0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * gi2.dot2(x2, y2);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 70 * (n0 + n1 + n2);
};

// 3D simplex noise
module.simplex3 = function (xin, yin, zin) {
  var n0, n1, n2, n3; // Noise contributions from the four corners

  // Skew the input space to determine which simplex cell we're in
  var s = (xin + yin + zin) * F3; // Hairy factor for 2D
  var i = Math.floor(xin + s);
  var j = Math.floor(yin + s);
  var k = Math.floor(zin + s);

  var t = (i + j + k) * G3;
  var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
  var y0 = yin - j + t;
  var z0 = zin - k + t;

  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
  // Determine which simplex we are in.
  var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
  var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
  if (x0 >= y0) {
    if (y0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    } else if (x0 >= z0) {
      i1 = 1;
      j1 = 0;
      k1 = 0;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 1;
      j2 = 0;
      k2 = 1;
    }
  } else {
    if (y0 < z0) {
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else if (x0 < z0) {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else {
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    }
  }
  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
  // c = 1/6.
  var x1 = x0 - i1 + G3; // Offsets for second corner
  var y1 = y0 - j1 + G3;
  var z1 = z0 - k1 + G3;

  var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
  var y2 = y0 - j2 + 2 * G3;
  var z2 = z0 - k2 + 2 * G3;

  var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
  var y3 = y0 - 1 + 3 * G3;
  var z3 = z0 - 1 + 3 * G3;

  // Work out the hashed gradient indices of the four simplex corners
  i &= 255;
  j &= 255;
  k &= 255;
  var gi0 = gradP[i + perm[j + perm[k]]];
  var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
  var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
  var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

  // Calculate the contribution from the four corners
  var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
  if (t0 < 0) {
    n0 = 0;
  } else {
    t0 *= t0;
    n0 = t0 * t0 * gi0.dot3(x0, y0, z0); // (x,y) of grad3 used for 2D gradient
  }
  var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
  if (t1 < 0) {
    n1 = 0;
  } else {
    t1 *= t1;
    n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
  }
  var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
  if (t2 < 0) {
    n2 = 0;
  } else {
    t2 *= t2;
    n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
  }
  var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
  if (t3 < 0) {
    n3 = 0;
  } else {
    t3 *= t3;
    n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
  }
  // Add contributions from each corner to get the final noise value.
  // The result is scaled to return values in the interval [-1,1].
  return 32 * (n0 + n1 + n2 + n3);
};

// ##### Perlin noise stuff

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

// 2D Perlin Noise
module.perlin2 = function (x, y) {
  // Find unit grid cell containing point
  var X = Math.floor(x),
    Y = Math.floor(y);
  // Get relative xy coordinates of point within that cell
  x = x - X;
  y = y - Y;
  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
  X = X & 255;
  Y = Y & 255;

  // Calculate noise contributions from each of the four corners
  var n00 = gradP[X + perm[Y]].dot2(x, y);
  var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
  var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
  var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

  // Compute the fade curve value for x
  var u = fade(x);

  // Interpolate the four results
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
};

// 3D Perlin Noise
module.perlin3 = function (x, y, z) {
  // Find unit grid cell containing point
  var X = Math.floor(x),
    Y = Math.floor(y),
    Z = Math.floor(z);
  // Get relative xyz coordinates of point within that cell
  x = x - X;
  y = y - Y;
  z = z - Z;
  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
  X = X & 255;
  Y = Y & 255;
  Z = Z & 255;

  // Calculate noise contributions from each of the eight corners
  var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
  var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
  var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
  var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
  var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
  var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
  var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
  var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

  // Compute the fade curve value for x, y, z
  var u = fade(x);
  var v = fade(y);
  var w = fade(z);

  // Interpolate
  return lerp(
    lerp(lerp(n000, n100, u), lerp(n001, n101, u), w),
    lerp(lerp(n010, n110, u), lerp(n011, n111, u), w),
    v
  );
};

noise.seed(Math.random());

// value2d = noise.simplex2(x, y);

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
    map: textureLoader.load("/textures/color.jpg"),
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
  400
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
/************************************
 Clouds
 ***********************************/

let cloudsGeometry = new THREE.Geometry();
let cloudSize = {
  width: 20,
  height: 5,
  depth: 20,
};
var yzoff = 0;
for (let x = 0; x < 100; x++) {
  var xyoff = 0;
  for (let z = 0; z < 100; z++) {
    let value = noise.simplex2(xyoff * 3, yzoff * 3);
    xyoff = xyoff + inc;
    if (Math.abs(value) > 0.2) continue;
    let geometry = new THREE.BoxGeometry(
      cloudSize.width,
      cloudSize.height,
      cloudSize.depth
    );
    let cube = new THREE.Mesh(geometry);
    cube.position.z = z * cloudSize.depth;
    cube.position.x = x * cloudSize.width;
    cube.position.y = 30 * cloudSize.height;
    cube.updateMatrix();
    cloudsGeometry.merge(cube.geometry, cube.matrix);
  }
  yzoff = yzoff + inc;
}

scene.add(
  new THREE.Mesh(
    cloudsGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
    })
  )
);

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
      var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
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
    var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
    blocks.push(new Block(x * 5, v, z * 5));
    xoff = xoff + inc;
  }
  zoff = zoff + inc;
}
var blocksBottomRight = [];
for (var x = 0; x < 20; x++) {
  xoff = 0;
  for (var z = 0; z < 20; z++) {
    var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
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
    var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
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
    var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
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
        var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
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
var canJump = false;
var controlOptions = {
  forward: "w",
  backward: "s",
  right: "d",
  left: "a",
  placeBlock: "q",
  space: " ",
};
var placedBlock = [];
var chunkMap = [];
for (var x = 0; x < renderDistance; x++) {
  for (var z = 0; z < renderDistance; z++) {
    chunkMap.push({
      x: x,
      z: z,
    });
  }
}

function identifyChunk(x, z) {
  var lowestX = lowestXBlock();
  var lowestZ = lowestZBlock();
  var difX = x - lowestX;
  var difZ = z - lowestZ;
  var divX = Math.floor(difX / (chunkSize * 5));
  var divZ = Math.floor(difZ / (chunkSize * 5));
  var index = undefined;
  for (var i = 0; i < chunkMap.length; i++) {
    if (chunkMap[i].x === divX && chunkMap[i].z === divZ) {
      index = i;
      break;
    }
  }
  return index;
}

//EventListener
document.addEventListener("keydown", function (e) {
  keys.push(e.key);
  if (e.key == " ") {
    ySpeed = -0.9;
    canJump = false;
  }
  if (e.key == controlOptions.placeBlock) {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    pointer.x = 0.5 * 2 - 1;
    pointer.z = -1 * 0.5 * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var intersection = raycaster.intersectObject(instancedChunk);

    if (intersection[0] != undefined && intersection[0].distance < 40) {
      var materialIndex = intersection[0].face.materialIndex;
      var position = intersection[0].point;
      var x = 0;
      var y = 0;
      var z = 0;
      const inc = 2.5;
      switch (materialIndex) {
        case 0: // right
          x = position.x + inc;
          y = Math.round(position.y / 5) * 5;
          z = Math.round(position.z / 5) * 5;
          break;
        case 1: //left
          x = position.x - inc;
          y = Math.round(position.y / 5) * 5;
          z = Math.round(position.z / 5) * 5;
          break;
        case 2: //top
          x = Math.round(position.x / 5) * 5;
          y = position.y + inc;
          z = Math.round(position.z / 5) * 5;
          break;
        case 3: //bottom
          x = Math.round(position.x / 5) * 5;
          y = position.y - inc;
          z = Math.round(position.z / 5) * 5;
          break;
        case 4: //front
          x = Math.round(position.x / 5) * 5;
          y = Math.round(position.y / 5) * 5;
          z = position.z + inc;
          break;
        case 5: //back
          x = Math.round(position.x / 5) * 5;
          y = Math.round(position.y / 5) * 5;
          z = position.z - inc;
          break;
      }
      chunks[identifyChunk(x, z)].push(new Block(x, y, z));
      placedBlock.push({ x: x, y: y, z: z });
      scene.remove(instancedChunk);
      instancedChunk = new THREE.InstancedMesh(
        blockBox,
        materialArray,
        renderDistance * renderDistance * chunkSize * chunkSize +
          placedBlock.length
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
    }
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

var movingSpeed = 0.7;
var ySpeed = 0;
var acc = 0.065;
const update = () => {
  /************Movements************/
  if (keys.includes(controlOptions.forward)) {
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
  if (keys.includes(controlOptions.left)) {
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
  if (keys.includes(controlOptions.backward)) {
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
  if (keys.includes(controlOptions.right)) {
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
          canJump = false;
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
          var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
          for (var b = 0; b < placedBlock.length; b++) {
            if (placedBlock[b].x == x && placedBlock[b].z == z) {
              chunk.push(
                new Block(placedBlock[b].x, placedBlock[b].y, placedBlock[b].z)
              );
            }
          }
        }
      }
      newChunks.splice(i * renderDistance, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize +
        placedBlock.length
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
          var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
          for (var b = 0; b < placedBlock.length; b++) {
            if (placedBlock[b].x == x && placedBlock[b].z == z) {
              chunk.push(
                new Block(placedBlock[b].x, placedBlock[b].y, placedBlock[b].z)
              );
            }
          }
        }
      }
      newChunks.splice((i + 1) * renderDistance - 1, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize +
        placedBlock.length
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
          var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
          for (var b = 0; b < placedBlock.length; b++) {
            if (placedBlock[b].x == x && placedBlock[b].z == z) {
              chunk.push(
                new Block(placedBlock[b].x, placedBlock[b].y, placedBlock[b].z)
              );
            }
          }
        }
      }
      newChunks.splice(chunks.length - (renderDistance - i), 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize +
        placedBlock.length
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
          var v = Math.round((noise.simplex2(xoff, zoff) * amplitude) / 5) * 5;
          chunk.push(new Block(x, v, z));
          for (var b = 0; b < placedBlock.length; b++) {
            if (placedBlock[b].x == x && placedBlock[b].z == z) {
              chunk.push(
                new Block(placedBlock[b].x, placedBlock[b].y, placedBlock[b].z)
              );
            }
          }
        }
      }
      newChunks.splice(i, 0, chunk);
    }
    chunks = newChunks;
    scene.remove(instancedChunk);
    instancedChunk = new THREE.InstancedMesh(
      blockBox,
      materialArray,
      renderDistance * renderDistance * chunkSize * chunkSize +
        placedBlock.length
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
