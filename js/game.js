// =====================================
// F1 LEGENDS — GAME ENGINE (PART 1/6)
// Scene Setup + Camera System
// =====================================

// Global Three.js variables
let scene, renderer;
let chaseCamera, hoodCamera, tvCamera;
let activeCamera = "chase"; // default
let cameraObject;

// Player + AI placeholders (filled later)
let playerCar;
let aiCars = [];

// Track data
let trackPoints = [];
let aiLine = [];
let pitEntry = 0;
let pitExit = 0;

// Timing + race state
let lap = 1;
let lapStartTime = performance.now();
let bestLap = 0;
let raceFinished = false;

// =====================================
// INITIALIZE SCENE
// =====================================

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101018);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Resize handler
    window.addEventListener("resize", () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        chaseCamera.aspect = window.innerWidth / window.innerHeight;
        hoodCamera.aspect = window.innerWidth / window.innerHeight;
        tvCamera.aspect = window.innerWidth / window.innerHeight;
        chaseCamera.updateProjectionMatrix();
        hoodCamera.updateProjectionMatrix();
        tvCamera.updateProjectionMatrix();
    });

    initLighting();
    initCameras();
    initGround();
}

// =====================================
// LIGHTING
// =====================================

function initLighting() {
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(200, 500, 300);
    sun.castShadow = true;
    scene.add(sun);

    const ambient = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambient);
}

// =====================================
// CAMERA SYSTEM (CHASE, HOOD, TV)
// =====================================

function initCameras() {
    // Chase camera
    chaseCamera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );

    // Hood camera
    hoodCamera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );

    // TV camera (cinematic)
    tvCamera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        8000
    );

    cameraObject = chaseCamera;
}

// Switch camera on key press
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "c") {
        if (activeCamera === "chase") {
            activeCamera = "hood";
            cameraObject = hoodCamera;
        } else if (activeCamera === "hood") {
            activeCamera = "tv";
            cameraObject = tvCamera;
        } else {
            activeCamera = "chase";
            cameraObject = chaseCamera;
        }
    }
});

// =====================================
// GROUND + SKY
// =====================================

function initGround() {
    const groundGeo = new THREE.PlaneGeometry(20000, 20000);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0f });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(8000, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
        color: 0x202040,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
}

// =====================================
// START ENGINE
// =====================================

initScene();
// =====================================
// F1 LEGENDS — GAME ENGINE (PART 2/6)
// Track Builder System
// =====================================

// Load track data from JSON
async function loadTrack() {
    const res = await fetch("data/tracks.json");
    const json = await res.json();

    const trackId = save.chosenTrack;
    const track = json.tracks.find(t => t.id === trackId);

    if (!track) {
        console.error("Track not found:", trackId);
        return;
    }

    trackPoints = track.points;
    aiLine = track.aiLine;
    pitEntry = track.pitEntry;
    pitExit = track.pitExit;

    buildTrackMesh();
    buildWalls();
    buildAILine();
    buildStartLine();
}

// =====================================
// BUILD TRACK MESH (ROAD)
// =====================================

function buildTrackMesh() {
    const shape = new THREE.Shape();

    // Convert points to 2D shape
    trackPoints.forEach((p, i) => {
        const x = p[0];
        const z = p[2];

        if (i === 0) shape.moveTo(x, z);
        else shape.lineTo(x, z);
    });

    const extrudeSettings = {
        depth: 1,
        bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhongMaterial({
        color: 0x222222,
        shininess: 10
    });

    const road = new THREE.Mesh(geometry, material);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);
}

// =====================================
// BUILD WALLS
// =====================================

function buildWalls() {
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });

    for (let i = 0; i < trackPoints.length - 1; i++) {
        const p1 = trackPoints[i];
        const p2 = trackPoints[i + 1];

        const dx = p2[0] - p1[0];
        const dz = p2[2] - p1[2];
        const length = Math.sqrt(dx * dx + dz * dz);

        const wallGeo = new THREE.BoxGeometry(length, 20, 2);
        const wall = new THREE.Mesh(wallGeo, wallMaterial);

        wall.position.set(
            (p1[0] + p2[0]) / 2,
            10,
            (p1[2] + p2[2]) / 2
        );

        wall.rotation.y = Math.atan2(dz, dx);
        wall.castShadow = true;

        scene.add(wall);
    }
}

// =====================================
// AI RACING LINE (INVISIBLE)
// =====================================

function buildAILine() {
    const points = aiLine.map(p => new THREE.Vector3(p[0], 0, p[2]));
    aiCurve = new THREE.CatmullRomCurve3(points, true);
}

// =====================================
// START/FINISH LINE
// =====================================

function buildStartLine() {
    const p = trackPoints[0];

    const geo = new THREE.PlaneGeometry(40, 4);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    const line = new THREE.Mesh(geo, mat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(p[0], 0.1, p[2]);

    scene.add(line);
}

// =====================================
// CALL TRACK LOADER
// =====================================

loadTrack();
// =====================================
// F1 LEGENDS — GAME ENGINE (PART 3/6)
// Player Car System
// =====================================

// Player physics
let playerSpeed = 0;
let playerAngle = 0;
let maxSpeed = 200;
let acceleration = 1.2;
let braking = 2.5;
let handling = 0.03;

// Keyboard input
let keys = {
    forward: false,
    back: false,
    left: false,
    right: false
};

// =====================================
// LOAD PLAYER CAR MODEL
// =====================================

async function loadPlayerCar() {
    const teamId = save.chosenTeam;

    // Load team stats
    const res = await fetch("data/teams.json");
    const json = await res.json();
    const team = json.teams.find(t => t.id === teamId);

    // Apply stats
    maxSpeed = 150 + team.stats.speed;
    acceleration = 0.8 + team.stats.acceleration * 0.02;
    handling = 0.02 + team.stats.handling * 0.0005;

    // Simple placeholder car (box)
    const carGeo = new THREE.BoxGeometry(20, 8, 40);
    const carMat = new THREE.MeshPhongMaterial({
        color: team.color
    });

    playerCar = new THREE.Mesh(carGeo, carMat);
    playerCar.castShadow = true;
    playerCar.position.set(trackPoints[0][0], 4, trackPoints[0][2]);

    scene.add(playerCar);
}

// =====================================
// PLAYER INPUT
// =====================================

window.addEventListener("keydown", (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = true;
    if (e.key === "s" || e.key === "ArrowDown") keys.back = true;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = true;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "w" || e.key === "ArrowUp") keys.forward = false;
    if (e.key === "s" || e.key === "ArrowDown") keys.back = false;
    if (e.key === "a" || e.key === "ArrowLeft") keys.left = false;
    if (e.key === "d" || e.key === "ArrowRight") keys.right = false;
});

// =====================================
// PLAYER PHYSICS UPDATE
// =====================================

function updatePlayer() {
    if (!playerCar) return;

    // Acceleration
    if (keys.forward) {
        playerSpeed += acceleration;
        if (playerSpeed > maxSpeed) playerSpeed = maxSpeed;
    }

    // Braking / reverse
    if (keys.back) {
        playerSpeed -= braking;
        if (playerSpeed < -40) playerSpeed = -40;
    }

    // Natural slowdown
    if (!keys.forward && !keys.back) {
        playerSpeed *= 0.98;
    }

    // Steering
    if (keys.left) playerAngle += handling * (playerSpeed / maxSpeed);
    if (keys.right) playerAngle -= handling * (playerSpeed / maxSpeed);

    // Movement
    const rad = playerAngle;
    playerCar.position.x += Math.sin(rad) * playerSpeed * 0.3;
    playerCar.position.z += Math.cos(rad) * playerSpeed * 0.3;

    playerCar.rotation.y = -rad;

    updateCamera();
    updateSpeedHUD();
}

// =====================================
// CAMERA FOLLOW SYSTEM
// =====================================

function updateCamera() {
    if (!playerCar) return;

    if (activeCamera === "chase") {
        chaseCamera.position.set(
            playerCar.position.x - Math.sin(playerAngle) * 80,
            playerCar.position.y + 40,
            playerCar.position.z - Math.cos(playerAngle) * 80
        );
        chaseCamera.lookAt(playerCar.position);
        cameraObject = chaseCamera;
    }

    if (activeCamera === "hood") {
        hoodCamera.position.set(
            playerCar.position.x,
            playerCar.position.y + 10,
            playerCar.position.z
        );
        hoodCamera.rotation.y = -playerAngle;
        cameraObject = hoodCamera;
    }

    if (activeCamera === "tv") {
        tvCamera.position.set(
            playerCar.position.x + 200,
            playerCar.position.y + 150,
            playerCar.position.z + 200
        );
        tvCamera.lookAt(playerCar.position);
        cameraObject = tvCamera;
    }
}

// =====================================
// SPEED HUD
// =====================================

function updateSpeedHUD() {
    const speedKmh = Math.abs(playerSpeed * 2);
    document.getElementById("speed").textContent = `Speed: ${speedKmh.toFixed(0)} km/h`;
}

// =====================================
// LOAD PLAYER CAR
// =====================================

loadPlayerCar();
// =====================================
// F1 LEGENDS — GAME ENGINE (PART 4/6)
// AI Cars System
// =====================================

// AI settings
let aiCount = 7; // total 8 cars including player
let aiCurve;     // created in PART 2
let aiProgress = [];
let aiSpeed = [];
let aiMeshes = [];

// Difficulty multipliers
const difficultySettings = {
    easy: 0.85,
    normal: 1.0,
    hard: 1.15
};

// =====================================
// LOAD AI CARS
// =====================================

function loadAICars() {
    const diff = difficultySettings[getDifficulty()];

    for (let i = 0; i < aiCount; i++) {
        const geo = new THREE.BoxGeometry(20, 8, 40);
        const mat = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${Math.random() * 360}, 80%, 50%)`)
        });

        const aiCar = new THREE.Mesh(geo, mat);
        aiCar.castShadow = true;

        // Start slightly behind player
        aiCar.position.set(
            trackPoints[0][0] - 30 * (i + 1),
            4,
            trackPoints[0][2] - 30 * (i + 1)
        );

        scene.add(aiCar);
        aiMeshes.push(aiCar);

        // AI progress along racing line (0–1)
        aiProgress.push(i * 0.02);

        // AI base speed
        aiSpeed.push((Math.random() * 0.5 + 0.8) * diff);
    }
}

// =====================================
// UPDATE AI CARS
// =====================================

function updateAI() {
    if (!aiCurve) return;

    for (let i = 0; i < aiMeshes.length; i++) {
        const car = aiMeshes[i];

        // Move forward along racing line
        aiProgress[i] += 0.0015 * aiSpeed[i];

        if (aiProgress[i] > 1) aiProgress[i] -= 1;

        const pos = aiCurve.getPointAt(aiProgress[i]);
        const next = aiCurve.getPointAt((aiProgress[i] + 0.01) % 1);

        car.position.set(pos.x, 4, pos.z);

        // Rotate toward next point
        const angle = Math.atan2(next.x - pos.x, next.z - pos.z);
        car.rotation.y = -angle;

        // Simple overtaking: random wiggle
        car.position.x += Math.sin(performance.now() * 0.001 + i) * 0.5;
    }
}

// =====================================
// AI PIT LANE LOGIC (BASIC)
// =====================================

function updateAIPitLane() {
    for (let i = 0; i < aiMeshes.length; i++) {
        if (aiProgress[i] > pitEntry && aiProgress[i] < pitExit) {
            // Slow down in pit lane
            aiSpeed[i] *= 0.999;
        } else {
            // Resume normal speed
            aiSpeed[i] *= 1.0005;
            if (aiSpeed[i] > 1.3) aiSpeed[i] = 1.3;
        }
    }
}

// =====================================
// INITIALIZE AI
// =====================================

loadAICars();
// =====================================
// F1 LEGENDS — GAME ENGINE (PART 5/6)
// Race Logic: Laps, Timing, Position
// =====================================

// Lap + timing
let lastLapTime = 0;
let lapTimes = [];
let totalLaps = 3;

// For lap detection
let lastPlayerDistance = 0;

// =====================================
// GET DISTANCE ALONG TRACK
// =====================================

function getPlayerProgress() {
    if (!aiCurve) return 0;

    let closest = 0;
    let closestDist = Infinity;

    for (let t = 0; t <= 1; t += 0.001) {
        const p = aiCurve.getPointAt(t);
        const dx = p.x - playerCar.position.x;
        const dz = p.z - playerCar.position.z;
        const dist = dx * dx + dz * dz;

        if (dist < closestDist) {
            closestDist = dist;
            closest = t;
        }
    }

    return closest;
}

// =====================================
// LAP DETECTION
// =====================================

function updateLapLogic() {
    const progress = getPlayerProgress();

    // Detect crossing start line
    if (progress < 0.1 && lastPlayerDistance > 0.9) {
        const now = performance.now();
        const lapTime = (now - lapStartTime) / 1000;

        lapTimes.push(lapTime);
        lastLapTime = lapTime;

        // Save best lap
        recordBestLap(save.chosenTrack, lapTime);

        lap++;
        lapStartTime = now;

        if (lap > totalLaps) {
            finishRace();
        }
    }

    lastPlayerDistance = progress;

    // Update HUD
    document.getElementById("lap").textContent = `Lap: ${Math.min(lap, totalLaps)} / ${totalLaps}`;
    document.getElementById("lap-time").textContent = `Lap Time: ${((performance.now() - lapStartTime) / 1000).toFixed(2)}`;
    document.getElementById("best-lap").textContent = save.bestLaps[save.chosenTrack]
        ? `Best: ${save.bestLaps[save.chosenTrack].toFixed(2)}`
        : "Best: --";
}

// =====================================
// POSITION TRACKING
// =====================================

function updatePosition() {
    const playerProg = getPlayerProgress();
    let ahead = 0;

    for (let i = 0; i < aiMeshes.length; i++) {
        if (aiProgress[i] < playerProg) ahead++;
    }

    const position = aiMeshes.length + 1 - ahead;

    document.getElementById("pos").textContent =
        `Position: ${position} / ${aiMeshes.length + 1}`;

    return position;
}

// =====================================
// RACE FINISH
// =====================================

function finishRace() {
    if (raceFinished) return;
    raceFinished = true;

    const position = updatePosition();

    // Save win if 1st place
    if (position === 1) {
        recordWin();
    }

    // Unlock special teams
    if (position === aiMeshes.length + 1) {
        unlockTeam("chaos_gp"); // finish last unlock
    }

    // Unlock MemeSpeed if track is Dragon's Spine
    if (save.chosenTrack === "dragons_spine" && position === 1) {
        unlockTeam("meme_speed");
    }

    // Show finish screen
    document.getElementById("finish-screen").style.display = "flex";
    document.getElementById("finish-position").textContent =
        `You finished: ${position} / ${aiMeshes.length + 1}`;
    document.getElementById("finish-best-lap").textContent =
        `Best Lap: ${save.bestLaps[save.chosenTrack].toFixed(2)}s`;
}

// =====================================
// RETURN TO MENU
// =====================================

function returnToMenu() {
    window.location.href = "index.html";
}
// =====================================
// F1 LEGENDS — GAME ENGINE (PART 6/6)
// Main Game Loop + Rendering
// =====================================

// MAIN UPDATE LOOP
function animate() {
    requestAnimationFrame(animate);

    if (!raceFinished) {
        updatePlayer();
        updateAI();
        updateAIPitLane();
        updateLapLogic();
        updatePosition();
    }

    renderer.render(scene, cameraObject);
}

// START GAME AFTER EVERYTHING LOADS
setTimeout(() => {
    animate();
}, 500);
