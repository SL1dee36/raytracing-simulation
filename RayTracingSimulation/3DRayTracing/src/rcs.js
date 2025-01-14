const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const lightSourceCountInput = document.getElementById('lightSourceCount');
const lightSourceSettingsDiv = document.getElementById('light-source-settings');
const toggleLightModeButton = document.getElementById('toggleLightMode');
const rotationSpeedInput = document.getElementById('rotationSpeed');
const cameraSpeedInput = document.getElementById('cameraSpeed');


let lightSources = [{
    x: 0, y: 300, z: 0, radius: 10, color: "yellow", numRays: 100, spreadAngle: 360
}];

const objects = [
  {
    vertices: [
      { x: -1000, y: -100, z: -1000 },
      { x: 1000, y: -100, z: -1000 },
        { x: 1000, y: -100, z: 1000 },
        { x: -1000, y: -100, z: 1000 }
    ],
    faces: [[0, 1, 2, 3]],
    color: '#4d4d4d'
  },
    //Стены
  {
      vertices: [
          { x: -100, y: -100, z: -100 },
          { x: 100, y: -100, z: -100 },
          { x: 100, y: 100, z: -100 },
          { x: -100, y: 100, z: -100 }
      ],
      faces: [[0, 1, 2, 3]],
      color: 'white',
     position: { x: 0, y: 0, z: -500}
    },
    {
        vertices: [
            { x: -100, y: -100, z: 100 },
            { x: 100, y: -100, z: 100 },
            { x: 100, y: 100, z: 100 },
            { x: -100, y: 100, z: 100 }
        ],
        faces: [[0, 1, 2, 3]],
        color: 'white',
      position: { x: 0, y: 0, z: 500}
    },
    {
        vertices: [
            { x: 100, y: -100, z: -100 },
            { x: 100, y: -100, z: 100 },
            { x: 100, y: 100, z: 100 },
            { x: 100, y: 100, z: -100 }
        ],
        faces: [[0, 1, 2, 3]],
        color: 'white',
      position: { x: 500, y: 0, z: 0 }
    },
   {
        vertices: [
            { x: -100, y: -100, z: -100 },
            { x: -100, y: -100, z: 100 },
            { x: -100, y: 100, z: 100 },
            { x: -100, y: 100, z: -100 }
        ],
        faces: [[0, 1, 2, 3]],
        color: 'white',
       position: { x: -500, y: 0, z: 0 }
    }
];
let camera = {
    x: 0,
    y: -50,
    z: 0,
    angleY: 0,
    angleX: 0,
};

let keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    x: false,
    y: false
};
let isLightingMode = false;
let prevMouseX = 0;
let prevMouseY = 0;
let isMouseCaptured = false;
let rotationSpeed = 0.002;
let cameraSpeed = 5;

function updateLightSources() {
    const count = parseInt(lightSourceCountInput.value);
    while(lightSources.length < count) {
        lightSources.push({
             x: 0, y: 300, z: 0,
            radius: 10, color: "yellow", numRays: 100, spreadAngle: 360
        });
    }

    while(lightSources.length > count) {
        lightSources.pop();
    }
    renderLightSourceSettings();
}


function renderLightSourceSettings() {
    lightSourceSettingsDiv.innerHTML = "";
    lightSources.forEach((source, index) => {
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('light-controls');
        controlsDiv.innerHTML = `
            <h3>Источник ${index + 1}</h3>
            <label for="radius-${index}">Радиус:</label>
            <input type="number" id="radius-${index}" value="${source.radius}" min="1">
            <label for="color-${index}">Цвет:</label>
            <input type="color" id="color-${index}" value="${source.color}">
            <label for="numRays-${index}">Кол-во лучей:</label>
            <input type="number" id="numRays-${index}" value="${source.numRays}" min="1">
            <label for="spreadAngle-${index}">Угол рассеивания (градусы):</label>
            <input type="number" id="spreadAngle-${index}" value="${source.spreadAngle}" min="0" max="360">
        `;
        lightSourceSettingsDiv.appendChild(controlsDiv);
        //Слушатели событий
        controlsDiv.querySelector(`#radius-${index}`).addEventListener('change', (e) => {
            lightSources[index].radius = parseInt(e.target.value);
        })
        controlsDiv.querySelector(`#color-${index}`).addEventListener('change', (e) => {
            lightSources[index].color = e.target.value;
        });
        controlsDiv.querySelector(`#numRays-${index}`).addEventListener('change', (e) => {
            lightSources[index].numRays = parseInt(e.target.value);
        });
        controlsDiv.querySelector(`#spreadAngle-${index}`).addEventListener('change', (e) => {
            lightSources[index].spreadAngle = parseInt(e.target.value);
        });
    });
}

function animate() {
    updateCamera();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
     if (!isLightingMode) {
        castRays();
    } else {
      drawLight()
    }
      objects.forEach(drawObject);
    //Отображение координат игрока
   ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`X: ${camera.x.toFixed(2)} Y: ${camera.y.toFixed(2)} Z: ${camera.z.toFixed(2)}`, 10, 20);
    requestAnimationFrame(animate);
}
function drawLight() {
    for (const object of objects) {
        for (const face of object.faces) {
            const projected_vertices = [];
            for (const vertexIndex of face) {
                let vertex = object.vertices[vertexIndex];
                 vertex = transformPoint(vertex.x, vertex.y, vertex.z, object.position);
                const projected = project(vertex.x, vertex.y, vertex.z);
                projected_vertices.push(projected);
             }
            const normal = calculateFaceNormal(object, face);
            const lightVector = {
                x: lightSources[0].x - transformPoint(0, 0, 0, object.position).x,
                y: lightSources[0].y - transformPoint(0, 0, 0, object.position).y,
                z: lightSources[0].z - transformPoint(0, 0, 0, object.position).z
            };
            const dotProduct = normal.x * lightVector.x + normal.y * lightVector.y + normal.z * lightVector.z;
            ctx.beginPath();
           ctx.moveTo(projected_vertices[0].x, projected_vertices[0].y);
           for (let i = 1; i < projected_vertices.length; i++) {
              ctx.lineTo(projected_vertices[i].x, projected_vertices[i].y);
           }
           ctx.closePath();
            let brightness;
            if (dotProduct > 0) {
             brightness = Math.min(1, dotProduct / 10000);
             ctx.fillStyle = `rgba(${hexToRgb(object.color).join(', ')}, ${brightness})`;
          } else {
            brightness = 0.2;
            ctx.fillStyle = `rgba(${hexToRgb(object.color).join(', ')}, ${brightness})`;
         }
            ctx.fill();
        }
   }
}

function drawObject(object) {
    ctx.strokeStyle = object.color;
  for (const face of object.faces) {
        ctx.beginPath();
        let projected_vertices = [];
        for (const vertexIndex of face) {
          let vertex = object.vertices[vertexIndex];
            vertex =  transformPoint(vertex.x, vertex.y, vertex.z, object.position);
            const projected = project(vertex.x, vertex.y, vertex.z);
          projected_vertices.push(projected);
      }
        ctx.moveTo(projected_vertices[0].x, projected_vertices[0].y);
        for (let i = 1; i < projected_vertices.length; i++) {
           ctx.lineTo(projected_vertices[i].x, projected_vertices[i].y);
       }
        ctx.closePath();
     if (object === objects[0]) {
       ctx.fillStyle = 'grey'
    } else {
      ctx.fillStyle = object.color
     }
        ctx.fill();
       ctx.stroke();
    }
}
function calculateFaceNormal(object, face) {
  const v1 = object.vertices[face[0]];
  const v2 = object.vertices[face[1]];
    const v3 = object.vertices[face[2]];

  const vector1 = {x: v2.x - v1.x, y: v2.y - v1.y, z: v2.z - v1.z};
    const vector2 = { x: v3.x - v1.x, y: v3.y - v1.y, z: v3.z - v1.z };
  const normal = {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
      y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x,
    };
  const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z)
  return {x: normal.x / length, y: normal.y / length, z: normal.z / length}
}

function castRays() {
    lightSources.forEach(lightSource => {
      for (let i = 0; i < lightSource.numRays; i++) {
        let x = Math.random() * 2 - 1;
       let y = Math.random() * 2 - 1;
        let z = Math.random() * 2 - 1;
        const length = Math.sqrt(x * x + y * y + z * z);
           x /= length;
       y /= length;
        z /= length;
        const ray = {
                start: { x: lightSource.x, y: lightSource.y, z: lightSource.z },
              direction:  {x: x, y: y, z: z}
           };
            const intersection = findClosestIntersection(ray);
            ctx.strokeStyle = `rgba(${hexToRgb(lightSource.color).join(', ')}, 0.3)`;
            ctx.beginPath();
           const projectedStart = project(ray.start.x, ray.start.y, ray.start.z);
            ctx.moveTo(projectedStart.x, projectedStart.y);
           if(intersection) {
              const projectedIntersection = project(intersection.x, intersection.y, intersection.z);
                ctx.lineTo(projectedIntersection.x, projectedIntersection.y);
           } else {
                const end = { x: ray.start.x + ray.direction.x * 5000, y: ray.start.y + ray.direction.y * 5000, z: ray.start.z + ray.direction.z * 5000 }
               const projectedEnd = project(end.x, end.y, end.z);
                ctx.lineTo(projectedEnd.x, projectedEnd.y);
           }
           ctx.stroke();
        }
    });
}
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
    parseInt(result[3], 16)
    ] : [0,0,0];
}
function project(x, y, z) {
    const transformed = transformPoint(x, y, z);
    const fov = 60;
    const cameraDistance = 1/ Math.tan(fov/2 * Math.PI / 180)
    const scale = cameraDistance/ (cameraDistance + transformed.z);
   const projectedX = transformed.x * scale * 300 + canvas.width / 2
   const projectedY = -transformed.y * scale * 300 + canvas.height / 2
    return { x: projectedX, y: projectedY };
}
function transformPoint(x, y, z, position = {x: 0, y: 0, z: 0}) {
   const translated = { x: x - position.x, y: y - position.y, z: z-position.z}
    const rotated = rotateY(rotateX(translated, -camera.angleX), -camera.angleY);
    const translatedX = rotated.x - camera.x;
    const translatedY = rotated.y - camera.y;
    const translatedZ = rotated.z - camera.z;
    return {x: translatedX, y: translatedY, z: translatedZ}
}
function rotateX(point, angle) {
  const cos = Math.cos(angle);
    const sin = Math.sin(angle);
   return {
     x: point.x,
      y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
    }
}
function rotateY(point, angle) {
   const cos = Math.cos(angle);
   const sin = Math.sin(angle);
    return {
       x: point.z * sin + point.x * cos,
        y: point.y,
        z: point.z * cos - point.x * sin,
    }
}
function findClosestIntersection(ray) {
  let closestIntersection = null;
    let minDistance = Infinity;
   for (const object of objects) {
       for(const face of object.faces) {
          let intersection;
         let vertices = face.map(index => object.vertices[index]);
         intersection = triangleIntersection(ray, vertices[0], vertices[1], vertices[2], object.position);
        if (intersection) {
             const distance = Math.sqrt(
              (intersection.x - ray.start.x) ** 2 +
                 (intersection.y - ray.start.y) ** 2 +
                (intersection.z - ray.start.z)**2
            );
             if (distance < minDistance) {
                minDistance = distance;
                 closestIntersection = intersection;
            }
        }
        intersection = triangleIntersection(ray, vertices[0], vertices[2], vertices[3], object.position);
      if (intersection) {
            const distance = Math.sqrt(
               (intersection.x - ray.start.x) ** 2 +
                (intersection.y - ray.start.y) ** 2 +
                (intersection.z - ray.start.z) ** 2
            );
           if (distance < minDistance) {
              minDistance = distance;
                 closestIntersection = intersection;
            }
        }
      }
    }
    return closestIntersection;
}
function triangleIntersection(ray, v1, v2, v3, position) {
  const EPSILON = 0.000001;
    const v1x = v1.x, v1y = v1.y, v1z = v1.z;
  const v2x = v2.x, v2y = v2.y, v2z = v2.z;
    const v3x = v3.x, v3y = v3.y, v3z = v3.z;
  const e1x = v2x - v1x;
    const e1y = v2y - v1y;
  const e1z = v2z - v1z;
    const e2x = v3x - v1x;
    const e2y = v3y - v1y;
   const e2z = v3z - v1z;
    const hx = ray.direction.y * e2z - ray.direction.z * e2y;
  const hy = ray.direction.z * e2x - ray.direction.x * e2z;
    const hz = ray.direction.x * e2y - ray.direction.y * e2x;
    const a = e1x * hx + e1y * hy + e1z * hz;
    if (a > -EPSILON && a < EPSILON) {
       return null;
    }
  const f = 1 / a;
  const start_x = ray.start.x - (position ? position.x : 0)
    const start_y = ray.start.y - (position ? position.y : 0);
   const start_z = ray.start.z - (position ? position.z : 0)
    const sx = start_x - v1x;
    const sy = start_y - v1y;
  const sz = start_z - v1z;
  const u = f * (sx * hx + sy * hy + sz * hz);
    if (u < 0 || u > 1) {
       return null;
   }
    const qx = sy * e1z - sz * e1y;
  const qy = sz * e1x - sx * e1z;
  const qz = sx * e1y - sy * e1x;
    const v = f * (ray.direction.x * qx + ray.direction.y * qy + ray.direction.z * qz)
  if(v < 0 || u + v > 1) {
     return null
  }
  const t = f * (e2x * qx + e2y * qy + e2z * qz);
  if (t > EPSILON) {
    return {
        x: ray.start.x + ray.direction.x * t,
       y: ray.start.y + ray.direction.y * t,
          z: ray.start.z + ray.direction.z * t
        };
    } else {
      return null;
    }
}
function updateCamera() {
    const cos = Math.cos(camera.angleY);
    const sin = Math.sin(camera.angleY);
  if (keys.w) {
        camera.x += cameraSpeed * sin;
        camera.z += cameraSpeed * cos;
   }
  if (keys.s) {
       camera.x -= cameraSpeed * sin;
        camera.z -= cameraSpeed * cos;
  }
   if (keys.a) {
      camera.x -= cameraSpeed * cos;
        camera.z += cameraSpeed * sin;
   }
    if (keys.d) {
        camera.x += cameraSpeed * cos;
        camera.z -= cameraSpeed * sin;
   }
}

// Обработчики событий
document.addEventListener('keydown', (e) => {
   if (e.key === 'Escape' && isMouseCaptured) {
       document.exitPointerLock();
     isMouseCaptured = false;
    return;
    }
  if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
    }
});
document.addEventListener('keyup', (e) => {
   if (keys.hasOwnProperty(e.key)) {
      keys[e.key] = false;
    }
});
canvas.addEventListener('mousedown', (e) => {
  if (!isMouseCaptured) {
        canvas.requestPointerLock();
        isMouseCaptured = true;
    }
   prevMouseX = e.offsetX;
  prevMouseY = e.offsetY;
});
canvas.addEventListener('mousemove', (e) => {
    if (isMouseCaptured) {
       const deltaX = e.movementX;
        const deltaY = e.movementY;
      if (keys.x) {
            camera.angleY -= deltaX * rotationSpeed;
        } else if (keys.y) {
           camera.angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.angleX - deltaY * rotationSpeed));
        }else {
              camera.angleY -= deltaX * rotationSpeed;
             camera.angleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.angleX - deltaY * rotationSpeed));
        }
   }
});

toggleLightModeButton.addEventListener('click', () => {
    isLightingMode = !isLightingMode;
})
lightSourceCountInput.addEventListener('change', updateLightSources);
rotationSpeedInput.addEventListener('change', () => {
    rotationSpeed = parseFloat(rotationSpeedInput.value);
})
cameraSpeedInput.addEventListener('change', () => {
    cameraSpeed = parseFloat(cameraSpeedInput.value);
})

// Инициализация и запуск анимации
updateLightSources();
animate();