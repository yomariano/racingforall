    // Game variables
    let scene, camera, renderer;
    let road, roadSegments = [];
    let player;
    let competitors = []; // Changed from enemyCars to competitors
    let score = 0;
    let isGameOver = false;
    let animationId;
    let raceStarted = false;
    let raceFinished = false;
    let finishLine;
    let playerPosition = 1; // Current race position
    let roadTexture;
    
    // Game settings
    const ROAD_LENGTH = 300;
    const ROAD_WIDTH = 15;
    const LANE_COUNT = 3;
    const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
    const ROAD_SEGMENTS = 20;
    const SEGMENT_LENGTH = ROAD_LENGTH / ROAD_SEGMENTS;
    const PLAYER_SPEED = 0.15; // Lane change speed
    const COMPETITOR_COUNT = 3; // Fixed number of competitors
    const RACE_DISTANCE = 500; // Distance to finish line
    const CAR_SPEED_MIN = 0.8; // Minimum car speed
    const CAR_SPEED_MAX = 1.2; // Maximum car speed
    const ACCELERATION = 0.005; // How quickly cars accelerate
    
    // Camera settings
    const CAMERA_HEIGHT = 5;
    const CAMERA_DISTANCE = 8;
    
    // Environment
    let sky, trees = [];
    
    // Keyboard state
    const keys = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false
    };
    
    // Initialize the game
    function init() {
        // Create scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x87CEEB, 0.01);
        
        // Create camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        positionCamera();
        
        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87CEEB);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById("game-container").prepend(renderer.domElement);
        renderer.domElement.id = "game-canvas";
        
        // Create lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        scene.add(directionalLight);
        
        // Create environment
        createSky();
        createGround();
        createRoad();
        createTrees();
        createFinishLine();
        
        // Create player car
        createPlayerCar();
        
        // Create competitor cars
        createCompetitors();
        
        // Set up event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('resize', handleResize);
        document.getElementById('restart-button').addEventListener('click', restartGame);
        
        // Start game loop
        animate();
        
        // Start countdown
        startRace();
    }
    
    function positionCamera() {
        // Position camera behind and above player
        camera.position.set(0, CAMERA_HEIGHT, CAMERA_DISTANCE);
        camera.lookAt(new THREE.Vector3(0, 0, -30));
    }
    
    function createSky() {
        // Create a large sphere for the sky
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        // Invert the geometry so that we see the inside
        skyGeometry.scale(-1, 1, 1);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
        });
        sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        
        // Add distant mountains
        createMountains();
    }
    
    function createMountains() {
        // Create mountains in the distance
        for (let i = 0; i < 10; i++) {
            const height = 40 + Math.random() * 60;
            const geometry = new THREE.ConeGeometry(30 + Math.random() * 20, height, 4);
            const material = new THREE.MeshPhongMaterial({
                color: 0x4B6455, // Mountain green
                flatShading: true,
            });
            const mountain = new THREE.Mesh(geometry, material);
            
            const angle = (i / 10) * Math.PI * 2;
            const radius = 400;
            mountain.position.x = Math.cos(angle) * radius;
            mountain.position.y = height / 2 - 15;
            mountain.position.z = Math.sin(angle) * radius;
            mountain.rotation.y = Math.random() * Math.PI;
            
            scene.add(mountain);
        }
    }
    
    function createGround() {
        // Create a flat ground plane
        const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x3C9900, // Grass green
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }
    
    function createRoad() {
        // Create a group for the whole road
        road = new THREE.Group();
        scene.add(road);
        
        // Create segmented road for better 3D effect
        for (let i = 0; i < ROAD_SEGMENTS; i++) {
            createRoadSegment(i);
        }
    }
    
    function createRoadSegment(index) {
        const z = -index * SEGMENT_LENGTH;
        
        // Create road segment
        const segmentGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
        const segmentMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333, // Dark gray road
            shininess: 30
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.rotation.x = -Math.PI / 2;
        segment.position.set(0, 0.01, z - SEGMENT_LENGTH / 2);
        segment.receiveShadow = true;
        road.add(segment);
        roadSegments.push(segment);
        
        // Create lane markings for this segment
        const laneMarkingsGroup = new THREE.Group();
        
        // Create dashed center lines
        for (let lane = 1; lane < LANE_COUNT; lane++) {
            const xPos = -ROAD_WIDTH / 2 + lane * LANE_WIDTH;
            
            // Multiple dashes per segment
            for (let j = 0; j < 4; j++) {
                const dashZ = z - j * (SEGMENT_LENGTH / 4) - SEGMENT_LENGTH / 8;
                
                const dashGeometry = new THREE.PlaneGeometry(0.15, SEGMENT_LENGTH / 10);
                const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
                const dash = new THREE.Mesh(dashGeometry, dashMaterial);
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(xPos, 0.02, dashZ);
                laneMarkingsGroup.add(dash);
            }
        }
        
        // Create solid side lines
        const leftLineGeometry = new THREE.PlaneGeometry(0.3, SEGMENT_LENGTH);
        const rightLineGeometry = new THREE.PlaneGeometry(0.3, SEGMENT_LENGTH);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        const leftLine = new THREE.Mesh(leftLineGeometry, lineMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-ROAD_WIDTH / 2, 0.02, z - SEGMENT_LENGTH / 2);
        laneMarkingsGroup.add(leftLine);
        
        const rightLine = new THREE.Mesh(rightLineGeometry, lineMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(ROAD_WIDTH / 2, 0.02, z - SEGMENT_LENGTH / 2);
        laneMarkingsGroup.add(rightLine);
        
        road.add(laneMarkingsGroup);
        segment.laneMarkings = laneMarkingsGroup;
    }
    
    function createTrees() {
        // Add trees on both sides of the road
        for (let i = 0; i < 80; i++) {
            createTree(i);
        }
    }
    
    function createTree(index) {
        const side = Math.random() > 0.5 ? 1 : -1; // Left or right side
        const z = -index * 10 - Math.random() * 5;
        const x = (ROAD_WIDTH / 2 + 5 + Math.random() * 20) * side;
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        // Tree top (cone shape)
        const topGeometry = new THREE.ConeGeometry(3, 7, 8);
        const topMaterial = new THREE.MeshPhongMaterial({ color: 0x2E8B57 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(0, 5.5, 0);
        top.castShadow = true;
        top.receiveShadow = true;
        trunk.add(top);
        
        scene.add(trunk);
        trees.push(trunk);
    }
    
    function createPlayerCar() {
        // Create car group
        const carGroup = new THREE.Group();
        
        // Create car body
        const carBodyGeometry = new THREE.BoxGeometry(2, 0.75, 4);
        const carMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000, // Red car
            shininess: 70
        });
        const carBody = new THREE.Mesh(carBodyGeometry, carMaterial);
        carBody.position.y = 0.75;
        carBody.castShadow = true;
        carBody.receiveShadow = true;
        carGroup.add(carBody);
        
        // Create car cabin (windshield and roof)
        const cabinGeometry = new THREE.BoxGeometry(1.8, 0.7, 2);
        const cabinMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 90,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 1.6, -0.5);
        cabin.castShadow = true;
        carGroup.add(cabin);
        
        // Create front windshield
        const windshieldGeometry = new THREE.PlaneGeometry(1.7, 0.7);
        const windshieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 100,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
        windshield.position.set(0, 1.6, 0.5);
        windshield.rotation.x = Math.PI / 4;
        carGroup.add(windshield);
        
        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const wheelPositions = [
            [-0.9, 0.4, 1.2],  // front left
            [0.9, 0.4, 1.2],   // front right
            [-0.9, 0.4, -1.2], // rear left
            [0.9, 0.4, -1.2]   // rear right
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            wheel.castShadow = true;
            carGroup.add(wheel);
        });
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.7, 0.7, 2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.7, 0.7, 2);
        carGroup.add(rightHeadlight);
        
        // Add taillights
        const taillightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const taillightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5
        });
        
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.7, 0.7, -2);
        carGroup.add(leftTaillight);
        
        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.7, 0.7, -2);
        carGroup.add(rightTaillight);
        
        // Set initial position
        carGroup.position.set(0, 0, 0);
        
        // Add to scene
        scene.add(carGroup);
        player = carGroup;
        
        // Create collision box
        player.collisionBox = new THREE.Box3();
        updatePlayerCollisionBox();
        
        // Store lane information
        player.currentLane = 1; // Middle lane (0, 1, 2)
        
        // Racing properties
        player.speed = 0; // Current forward speed
        player.maxSpeed = CAR_SPEED_MAX + 0.2; // Slightly faster than competitors
        player.distance = 0; // Distance traveled
    }
    
    function updatePlayerCollisionBox() {
        player.collisionBox.setFromObject(player);
        // Make it slightly smaller for better gameplay
        player.collisionBox.min.x += 0.3;
        player.collisionBox.max.x -= 0.3;
        player.collisionBox.min.z += 0.3;
        player.collisionBox.max.z -= 0.3;
    }
    
    function handlePlayerMovement() {
        if (isGameOver || !raceStarted) return;
        
        // Calculate target x position based on lane
        const targetX = -ROAD_WIDTH/2 + (player.currentLane + 0.5) * LANE_WIDTH;
        
        // Move left
        if (keys.ArrowLeft && player.currentLane > 0) {
            player.currentLane--;
            keys.ArrowLeft = false; // Reset key to prevent continuous movement
        }
        
        // Move right
        if (keys.ArrowRight && player.currentLane < LANE_COUNT - 1) {
            player.currentLane++;
            keys.ArrowRight = false; // Reset key to prevent continuous movement
        }
        
        // Accelerate
        if (keys.ArrowUp && player.speed < player.maxSpeed) {
            player.speed += ACCELERATION * 2;
            if (player.speed > player.maxSpeed) {
                player.speed = player.maxSpeed;
            }
        }
        
        // Brake
        if (keys.ArrowDown && player.speed > 0) {
            player.speed -= ACCELERATION * 3;
            if (player.speed < 0) {
                player.speed = 0;
            }
        }
        
        // Natural deceleration when not accelerating
        if (!keys.ArrowUp && !keys.ArrowDown && player.speed > 0) {
            player.speed -= ACCELERATION / 2;
            if (player.speed < 0) {
                player.speed = 0;
            }
        }
        
        // Smoothly move player to target lane
        player.position.x += (targetX - player.position.x) * PLAYER_SPEED;
        
        // Move player forward based on speed
        player.position.z -= player.speed;
        player.distance += player.speed;
        
        // Update collision box
        updatePlayerCollisionBox();
        
        // Add slight tilt when turning for better visuals
        const targetTilt = (targetX - player.position.x) * 0.2;
        player.rotation.z += (targetTilt - player.rotation.z) * 0.1;
    }
    
    function createCompetitorCar(index) {
        // Choose a lane for this competitor
        const lane = index % LANE_COUNT;
        const xPos = -ROAD_WIDTH/2 + (lane + 0.5) * LANE_WIDTH;
        
        // Create car group
        const carGroup = new THREE.Group();
        
        // Competitor car colors
        const colors = [0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFA500, 0x800080];
        const carColor = colors[index % colors.length];
        
        // Create car body
        const carBodyGeometry = new THREE.BoxGeometry(2, 0.75, 4);
        const carMaterial = new THREE.MeshPhongMaterial({
            color: carColor,
            shininess: 70
        });
        const carBody = new THREE.Mesh(carBodyGeometry, carMaterial);
        carBody.position.y = 0.75;
        carBody.castShadow = true;
        carBody.receiveShadow = true;
        carGroup.add(carBody);
        
        // Create car cabin
        const cabinGeometry = new THREE.BoxGeometry(1.8, 0.7, 2);
        const cabinMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 90,
            transparent: true,
            opacity: 0.7
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, 1.6, -0.5);
        cabin.castShadow = true;
        carGroup.add(cabin);
        
        // Create wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        const wheelPositions = [
            [-0.9, 0.4, 1.2],
            [0.9, 0.4, 1.2],
            [-0.9, 0.4, -1.2],
            [0.9, 0.4, -1.2]
        ];
        
        wheelPositions.forEach(position => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...position);
            wheel.castShadow = true;
            carGroup.add(wheel);
        });
        
        // Add headlights
        const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 0.5
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.7, 0.7, 2);
        carGroup.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.7, 0.7, 2);
        carGroup.add(rightHeadlight);
        
        // Add taillights
        const taillightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const taillightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF0000,
            emissiveIntensity: 0.5
        });
        
        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        leftTaillight.position.set(-0.7, 0.7, -2);
        carGroup.add(leftTaillight);
        
        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        rightTaillight.position.set(0.7, 0.7, -2);
        carGroup.add(rightTaillight);
        
        // Set initial position (same starting line as player)
        carGroup.position.set(xPos, 0, 0);
        
        // Add to scene
        scene.add(carGroup);
        
        // Create collision box
        carGroup.collisionBox = new THREE.Box3();
        carGroup.collisionBox.setFromObject(carGroup);
        // Make it slightly smaller for better gameplay
        carGroup.collisionBox.min.x += 0.3;
        carGroup.collisionBox.max.x -= 0.3;
        carGroup.collisionBox.min.z += 0.3;
        carGroup.collisionBox.max.z -= 0.3;
        
        // Racing properties
        carGroup.speed = 0; // Current forward speed
        carGroup.maxSpeed = CAR_SPEED_MIN + (Math.random() * (CAR_SPEED_MAX - CAR_SPEED_MIN)); // Random max speed
        carGroup.distance = 0; // Distance traveled
        carGroup.currentLane = lane;
        carGroup.index = index; // Store index for identification
        
        // Add to competitors array
        competitors.push(carGroup);
    }
    
    function updateEnemyCars() {
        const now = Date.now();
        
        // Spawn new enemy car at intervals
        if (now - lastEnemySpawnTime > SPAWN_INTERVAL && !isGameOver) {
            createEnemyCar();
            lastEnemySpawnTime = now;
        }
        
        // Move enemy cars and check for out of bounds
        for (let i = competitors.length - 1; i >= 0; i--) {
            const competitor = competitors[i];
            
            // Move enemy car forward (towards player/camera)
            competitor.position.z += ENEMY_SPEED;
            
            // Update collision box
            competitor.collisionBox.setFromObject(competitor);
            competitor.collisionBox.min.x += 0.3;
            competitor.collisionBox.max.x -= 0.3;
            competitor.collisionBox.min.z += 0.3;
            competitor.collisionBox.max.z -= 0.3;
            
            // Remove cars that have passed the player
            if (competitor.position.z > 20) {
                scene.remove(competitor);
                competitors.splice(i, 1);
            }
            
            // Check collision with player
            if (competitor.collisionBox.intersectsBox(player.collisionBox)) {
                gameOver();
            }
        }
    }
    
    function updateCompetitors() {
        if (!raceStarted || isGameOver) return;
        
        // Update each competitor
        for (let i = 0; i < competitors.length; i++) {
            const competitor = competitors[i];
            
            // Accelerate to max speed
            if (competitor.speed < competitor.maxSpeed) {
                competitor.speed += ACCELERATION;
                if (competitor.speed > competitor.maxSpeed) {
                    competitor.speed = competitor.maxSpeed;
                }
            }
            
            // Move competitor forward
            competitor.position.z -= competitor.speed;
            competitor.distance += competitor.speed;
            
            // Update collision box
            competitor.collisionBox.setFromObject(competitor);
            competitor.collisionBox.min.x += 0.3;
            competitor.collisionBox.max.x -= 0.3;
            competitor.collisionBox.min.z += 0.3;
            competitor.collisionBox.max.z -= 0.3;
            
            // Check collision with player
            if (competitor.collisionBox.intersectsBox(player.collisionBox)) {
                // Slow down both cars
                player.speed *= 0.5;
                competitor.speed *= 0.5;
            }
            
            // Check if competitor has reached finish line
            if (competitor.distance >= RACE_DISTANCE && !raceFinished) {
                raceFinished = true;
                gameOver(`Competitor ${competitor.index + 1} wins!`);
            }
        }
        
        // Check if player has reached finish line
        if (player.distance >= RACE_DISTANCE && !raceFinished) {
            raceFinished = true;
            gameOver("You win!");
        }
    }
    
    function updateRacePositions() {
        // Create array of all racers
        const racers = [player, ...competitors];
        
        // Sort by distance traveled (descending)
        racers.sort((a, b) => b.distance - a.distance);
        
        // Find player's position
        const playerPosition = racers.findIndex(racer => racer === player) + 1;
        
        // Update position display
        document.getElementById('score-display').innerText = `Position: ${playerPosition}/${racers.length}`;
    }
    
    function updateCamera() {
        // Position camera behind player
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + CAMERA_DISTANCE;
        camera.lookAt(new THREE.Vector3(player.position.x, 0, player.position.z - 30));
    }
    
    function updateRoad() {
        // No need to move road segments in race mode
        // The camera follows the player instead
    }
    
    function updateScore() {
        // Replaced by updateRacePositions
    }
    
    function animate() {
        animationId = requestAnimationFrame(animate);
        
        handlePlayerMovement();
        updateCompetitors();
        updateCamera();
        updateRacePositions();
        
        renderer.render(scene, camera);
    }
    
    function gameOver(message) {
        isGameOver = true;
        document.getElementById('final-score').innerText = message || "Game Over";
        document.getElementById('game-over').style.display = 'block';
        // Don't cancel animation frame to keep rendering the scene
    }
    
    function restartGame() {
        // Reset game state
        score = 0;
        isGameOver = false;
        raceStarted = false;
        raceFinished = false;
        document.getElementById('score-display').innerText = 'Position: 1/4';
        document.getElementById('game-over').style.display = 'none';
        
        // Remove all competitors
        competitors.forEach(car => scene.remove(car));
        competitors = [];
        
        // Reset player position and properties
        player.position.set(0, 0, 0);
        player.rotation.set(0, 0, 0);
        player.currentLane = 1;
        player.speed = 0;
        player.distance = 0;
        
        // Create new competitors
        createCompetitors();
        
        // Start countdown
        startRace();
    }
    
    function handleKeyDown(event) {
        if (event.key in keys) {
            keys[event.key] = true;
            event.preventDefault();
        }
    }
    
    function handleKeyUp(event) {
        if (event.key in keys) {
            keys[event.key] = false;
            event.preventDefault();
        }
    }
    
    function handleResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    function createFinishLine() {
        // Create a finish line at the race distance
        const finishGeometry = new THREE.PlaneGeometry(ROAD_WIDTH, 3);
        const finishMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            side: THREE.DoubleSide
        });
        
        // Create checkered pattern
        const textureSize = 512;
        const squareSize = 64;
        const canvas = document.createElement('canvas');
        canvas.width = textureSize;
        canvas.height = textureSize;
        const context = canvas.getContext('2d');
        
        // Draw checkered pattern
        for (let x = 0; x < textureSize; x += squareSize) {
            for (let y = 0; y < textureSize; y += squareSize) {
                const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0;
                context.fillStyle = isEven ? '#FFFFFF' : '#000000';
                context.fillRect(x, y, squareSize, squareSize);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        finishMaterial.map = texture;
        
        finishLine = new THREE.Mesh(finishGeometry, finishMaterial);
        finishLine.rotation.x = -Math.PI / 2;
        finishLine.position.set(0, 0.02, -RACE_DISTANCE);
        scene.add(finishLine);
    }
    
    function createCompetitors() {
        // Create fixed number of competitor cars
        for (let i = 0; i < COMPETITOR_COUNT; i++) {
            createCompetitorCar(i);
        }
    }
    
    function startRace() {
        // Display countdown
        const countdownElement = document.createElement('div');
        countdownElement.id = 'countdown';
        countdownElement.style.position = 'absolute';
        countdownElement.style.top = '50%';
        countdownElement.style.left = '50%';
        countdownElement.style.transform = 'translate(-50%, -50%)';
        countdownElement.style.fontSize = '5rem';
        countdownElement.style.color = 'white';
        countdownElement.style.textShadow = '2px 2px 4px #000000';
        document.getElementById('game-container').appendChild(countdownElement);
        
        // Countdown sequence
        countdownElement.textContent = '3';
        setTimeout(() => {
            countdownElement.textContent = '2';
            setTimeout(() => {
                countdownElement.textContent = '1';
                setTimeout(() => {
                    countdownElement.textContent = 'GO!';
                    raceStarted = true;
                    setTimeout(() => {
                        countdownElement.remove();
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }
    
    // Start the game when the page loads
    window.onload = init;