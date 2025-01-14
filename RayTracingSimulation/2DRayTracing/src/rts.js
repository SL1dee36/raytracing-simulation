const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const lightSourceCountInput = document.getElementById('lightSourceCount');
const lightSourceSettingsDiv = document.getElementById('light-source-settings');


let lightSources = [{
    x: 300, y: 200, radius: 10, color: "#ffffff", numRays: 100, spreadAngle: 360
}];


const objects = [
    { x1: 100, y1: 100, x2: 200, y2: 200 },
    { x1: 400, y1: 100, x2: 500, y2: 100 },
    { x1: 100, y1: 300, x2: 500, y2: 300 },
    { x: 150, y: 150, radius: 30 },
    { x: 450, y: 250, radius: 20 },
];

let isDraggingLight = false;
let draggingLightIndex = -1;


function updateLightSources() {
    const count = parseInt(lightSourceCountInput.value);
    while(lightSources.length < count) {
        lightSources.push({
             x: Math.random() * canvas.width, y: Math.random() * canvas.height,
             radius: 10, color: "#ffffff", numRays: 100, spreadAngle: 360
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lightSources.forEach(drawLightSource);
    castRays();
    drawObjects();
    requestAnimationFrame(animate);
}

function drawLightSource(source) {
    ctx.fillStyle = source.color;
    ctx.beginPath();
    ctx.arc(source.x, source.y, source.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawObjects() {
    ctx.strokeStyle = "white";
    objects.forEach(object => {
        ctx.beginPath();
        if (object.x1) {
            ctx.moveTo(object.x1, object.y1);
            ctx.lineTo(object.x2, object.y2);
         } else {
            ctx.arc(object.x, object.y, object.radius, 0, Math.PI * 2);
        }
        ctx.stroke();
    });
}

function castRays() {
    lightSources.forEach(lightSource => {
         for (let i = 0; i < lightSource.numRays; i++) {
            const angle = (i / lightSource.numRays) * (lightSource.spreadAngle * Math.PI / 180) - (lightSource.spreadAngle * Math.PI / 360);
            const ray = {
                start: { x: lightSource.x, y: lightSource.y },
                direction: { x: Math.cos(angle), y: Math.sin(angle) }
            };
            const intersection = findClosestIntersection(ray);
             ctx.strokeStyle = `rgba(${hexToRgb(lightSource.color).join(', ')}, 0.3)`;
            ctx.beginPath();
            ctx.moveTo(ray.start.x, ray.start.y);
            if(intersection) {
                ctx.lineTo(intersection.x, intersection.y);
             } else {
                const end = { x: ray.start.x + ray.direction.x * 1000, y: ray.start.y + ray.direction.y * 1000 }
                ctx.lineTo(end.x, end.y);
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

function findClosestIntersection(ray) {
    let closestIntersection = null;
    let minDistance = Infinity;

    for (const object of objects) {
        let intersection;
        if(object.x1) {
            intersection = lineIntersection(ray, object);
        } else {
            intersection = circleIntersection(ray, object);
        }

        if (intersection) {
            const distance = Math.sqrt( (intersection.x - ray.start.x)**2 + (intersection.y - ray.start.y)**2 );
            if(distance < minDistance) {
                minDistance = distance;
                closestIntersection = intersection;
            }
        }
    }

    return closestIntersection;
}

function lineIntersection(ray, line) {
    const x1 = line.x1;
    const y1 = line.y1;
    const x2 = line.x2;
    const y2 = line.y2;
    const x3 = ray.start.x;
    const y3 = ray.start.y;
    const x4 = ray.start.x + ray.direction.x;
    const y4 = ray.start.y + ray.direction.y;

    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) { return null; }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t >= 0 && t <= 1 && u >= 0) {
      return {x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1)};
    }

    return null;
}


function circleIntersection(ray, circle) {
    const cx = circle.x;
    const cy = circle.y;
    const radius = circle.radius;
    const ox = ray.start.x;
    const oy = ray.start.y;
    const dx = ray.direction.x;
    const dy = ray.direction.y;
  
  
     const a = dx * dx + dy * dy;
     const b = 2 * (dx * (ox - cx) + dy * (oy - cy));
     const c = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy) - radius * radius;
  
    const discriminant = b * b - 4 * a * c;
  
    if (discriminant < 0) {
          return null; 
    }
    
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);

    let t = Math.min(t1,t2);
    if (t < 0) {
       t = Math.max(t1,t2);
    }

    if (t > 0) {
          return {x: ox + t * dx, y: oy + t * dy};
    }
    return null;
}

// Обработчики событий
canvas.addEventListener('mousedown', (e) => {
     const mouseX = e.offsetX;
     const mouseY = e.offsetY;

     for(let i = 0; i < lightSources.length; i++) {
       const source = lightSources[i];
       const dist = Math.sqrt((mouseX - source.x)**2 + (mouseY - source.y)**2);
       if(dist < source.radius) {
           isDraggingLight = true;
           draggingLightIndex = i;
           break;
       }
     }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDraggingLight && draggingLightIndex > -1) {
        lightSources[draggingLightIndex].x = e.offsetX;
        lightSources[draggingLightIndex].y = e.offsetY;
    }
});

canvas.addEventListener('mouseup', () => {
    isDraggingLight = false;
    draggingLightIndex = -1;
});
lightSourceCountInput.addEventListener('change', updateLightSources);


// Инициализация и запуск анимации
updateLightSources();
animate();