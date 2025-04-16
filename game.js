/**
 * GeoJewels - A geometric puzzle game
 * Inspired by classics like Columns and Magic Jewelry
 */

// Game constants
const GRID_WIDTH = 10;
const GRID_HEIGHT = 16;
const CELL_SIZE = 40;
const JEWEL_TYPES = 5; // Number of different geometric shapes
const COLUMN_SIZE = 3; // Number of jewels in a column
const MATCH_REQUIRED = 3; // Number of same jewels required for a match
const FALL_SPEED = 500; // Base speed in ms for jewel column to fall one cell
const FAST_FALL_MULTIPLIER = 10; // How much faster when pressing down

// Game variables
let gameState = {
    board: [], // 2D array representing the game board
    currentColumn: null, // Current active column
    score: 0,
    status: 'start', // 'start', 'playing', 'paused', 'gameOver'
    lastFallTime: 0, // Time of last fall
    fallInterval: FALL_SPEED,
    fastFall: false
};

// Create Pixi Application
const app = new PIXI.Application({
    width: GRID_WIDTH * CELL_SIZE,
    height: GRID_HEIGHT * CELL_SIZE,
    backgroundColor: 0x111111,
    backgroundAlpha: 0.2,
    antialias: true
});

// Sound effects with error handling
const sounds = {
    move: new Howl({ 
        src: ['assets/audio/move.mp3'],
        html5: true,
        volume: 0.5,
        onloaderror: () => console.log("Warning: move sound not found")
    }),
    rotate: new Howl({ 
        src: ['assets/audio/rotate.mp3'],
        html5: true,
        volume: 0.5,
        onloaderror: () => console.log("Warning: rotate sound not found")
    }),
    match: new Howl({ 
        src: ['assets/audio/match.mp3'],
        html5: true,
        volume: 0.7,
        onloaderror: () => console.log("Warning: match sound not found")
    }),
    place: new Howl({ 
        src: ['assets/audio/place.mp3'],
        html5: true,
        volume: 0.5,
        onloaderror: () => console.log("Warning: place sound not found")
    }),
    gameOver: new Howl({ 
        src: ['assets/audio/gameover.mp3'],
        html5: true,
        volume: 0.8,
        onloaderror: () => console.log("Warning: game over sound not found")
    }),
    bgMusic: new Howl({
        src: ['assets/audio/bgmusic.mp3'],
        loop: true,
        volume: 0.3,
        html5: true,
        onloaderror: () => console.log("Warning: background music not found")
    })
};

// Helper function to safely play sounds
function playSound(soundName) {
    try {
        if (sounds[soundName]) {
            sounds[soundName].play();
        }
    } catch (e) {
        console.log(`Error playing sound: ${soundName}`);
    }
}

// Containers for game elements
const boardContainer = new PIXI.Container();
const gridContainer = new PIXI.Container();
const jewelContainer = new PIXI.Container();
const activeColumnContainer = new PIXI.Container();

// Initialize the game
function init() {
    // Add the Pixi canvas to the DOM
    document.getElementById('game-container').appendChild(app.view);
    
    // Setup containers
    app.stage.addChild(boardContainer);
    boardContainer.addChild(gridContainer);
    boardContainer.addChild(jewelContainer);
    boardContainer.addChild(activeColumnContainer);
    
    // Initialize the game board
    initializeBoard();
    
    // Draw the grid
    drawGrid();
    
    // Setup input handlers including the begin button
    setupInputHandlers();
    
    // Start the game loop (will handle different game states)
    app.ticker.add(gameLoop);
    
    // Reset the UI
    updateScoreDisplay();
    
    // Make sure the start screen is showing
    showStartScreen();
}

// Start the actual game
function startGame() {
    // Hide the start screen
    hideStartScreen();
    
    // Start background music
    playSound('bgMusic');
    
    // Create and spawn the first column
    spawnNewColumn();
    
    // Set game state to playing
    gameState.status = 'playing';
}

// Show the start screen
function showStartScreen() {
    const startScreenElement = document.getElementById('start-screen');
    startScreenElement.style.display = 'flex';
}

// Hide the start screen
function hideStartScreen() {
    const startScreenElement = document.getElementById('start-screen');
    startScreenElement.style.display = 'none';
}

// Initialize the game board (empty 2D array)
function initializeBoard() {
    gameState.board = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < GRID_WIDTH; x++) {
            row.push(null); // null means empty cell
        }
        gameState.board.push(row);
    }
}

// Draw the grid lines
function drawGrid() {
    const grid = new PIXI.Graphics();
    
    // Use a more neutral gray color with low opacity for the grid
    grid.lineStyle(0.5, 0x888888, 0.2);
    
    // Draw vertical lines
    for (let x = 0; x <= GRID_WIDTH; x++) {
        grid.moveTo(x * CELL_SIZE, 0);
        grid.lineTo(x * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        grid.moveTo(0, y * CELL_SIZE);
        grid.lineTo(GRID_WIDTH * CELL_SIZE, y * CELL_SIZE);
    }
    
    gridContainer.addChild(grid);
    
    // Add a neutral subtle glow to the background of the game board
    const boardBackground = new PIXI.Graphics();
    boardBackground.beginFill(0x222222, 0.1);
    boardBackground.drawRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
    boardBackground.endFill();
    
    // Add the background underneath the grid
    gridContainer.addChildAt(boardBackground, 0);
}

// Create a jewel graphics object based on type
function createJewel(type) {
    const jewel = new PIXI.Graphics();
    const radius = CELL_SIZE * 0.4;
    const center = CELL_SIZE / 2;
    
    // Define colors for each jewel type
    const colors = [
        0xFF4444, // Red (Triangle)
        0x44FF44, // Green (Square)
        0x4444FF, // Blue (Pentagon)
        0xFFFF44, // Yellow (Hexagon)
        0xFF44FF  // Purple (Octagon)
    ];
    
    // Define secondary/accent colors for details
    const accentColors = [
        0xFFCCCC, // Light red
        0xCCFFCC, // Light green
        0xCCCCFF, // Light blue
        0xFFFFCC, // Light yellow
        0xFFCCFF  // Light purple
    ];
    
    // Draw the main shape
    switch (type) {
        case 0: // Intricate Triangle
            // Main triangle outline
            jewel.lineStyle(2, accentColors[type], 1);
            drawRegularPolygon(jewel, center, center, radius, 3, Math.PI / 2);
            
            // Fill with main color
            jewel.beginFill(colors[type], 0.8);
            drawRegularPolygon(jewel, center, center, radius * 0.95, 3, Math.PI / 2);
            jewel.endFill();
            
            // Inner design
            jewel.beginFill(accentColors[type], 0.6);
            drawRegularPolygon(jewel, center, center, radius * 0.6, 3, Math.PI / 2);
            jewel.endFill();
            
            // Center small circle
            jewel.beginFill(colors[type], 0.9);
            jewel.drawCircle(center, center, radius * 0.2);
            jewel.endFill();
            break;
            
        case 1: // Intricate Square (gem-like)
            // Outer square with line style
            jewel.lineStyle(2, accentColors[type], 1);
            jewel.drawRect(center - radius * 0.7, center - radius * 0.7, radius * 1.4, radius * 1.4);
            
            // Main square fill
            jewel.beginFill(colors[type], 0.8);
            jewel.drawRect(center - radius * 0.65, center - radius * 0.65, radius * 1.3, radius * 1.3);
            jewel.endFill();
            
            // Diamond inside
            jewel.beginFill(accentColors[type], 0.7);
            jewel.moveTo(center, center - radius * 0.4);
            jewel.lineTo(center + radius * 0.4, center);
            jewel.lineTo(center, center + radius * 0.4);
            jewel.lineTo(center - radius * 0.4, center);
            jewel.lineTo(center, center - radius * 0.4);
            jewel.endFill();
            
            // Center dot
            jewel.beginFill(colors[type], 0.9);
            jewel.drawCircle(center, center, radius * 0.15);
            jewel.endFill();
            break;
            
        case 2: // Intricate Pentagon (star-like)
            // Outer pentagon outline
            jewel.lineStyle(2, accentColors[type], 1);
            drawRegularPolygon(jewel, center, center, radius, 5, -Math.PI / 2);
            
            // Main pentagon fill
            jewel.beginFill(colors[type], 0.8);
            drawRegularPolygon(jewel, center, center, radius * 0.95, 5, -Math.PI / 2);
            jewel.endFill();
            
            // Star pattern inside
            jewel.beginFill(accentColors[type], 0.7);
            drawStar(jewel, center, center, 5, radius * 0.9, radius * 0.45, -Math.PI / 2);
            jewel.endFill();
            
            // Center circle
            jewel.beginFill(colors[type], 0.9);
            jewel.drawCircle(center, center, radius * 0.2);
            jewel.endFill();
            break;
            
        case 3: // Intricate Hexagon (honeycomb-like)
            // Outer hexagon outline
            jewel.lineStyle(2, accentColors[type], 1);
            drawRegularPolygon(jewel, center, center, radius, 6, 0);
            
            // Main hexagon fill
            jewel.beginFill(colors[type], 0.8);
            drawRegularPolygon(jewel, center, center, radius * 0.95, 6, 0);
            jewel.endFill();
            
            // Inner hexagon
            jewel.beginFill(accentColors[type], 0.6);
            drawRegularPolygon(jewel, center, center, radius * 0.7, 6, 0);
            jewel.endFill();
            
            // Smallest hexagon
            jewel.beginFill(colors[type], 0.9);
            drawRegularPolygon(jewel, center, center, radius * 0.4, 6, 0);
            jewel.endFill();
            
            // Center dot
            jewel.beginFill(accentColors[type], 0.9);
            jewel.drawCircle(center, center, radius * 0.15);
            jewel.endFill();
            break;
            
        case 4: // Intricate Octagon (flower-like)
            // Outer octagon outline
            jewel.lineStyle(2, accentColors[type], 1);
            drawRegularPolygon(jewel, center, center, radius, 8, 0);
            
            // Main octagon fill
            jewel.beginFill(colors[type], 0.8);
            drawRegularPolygon(jewel, center, center, radius * 0.95, 8, 0);
            jewel.endFill();
            
            // Flower pattern inside
            jewel.beginFill(accentColors[type], 0.7);
            drawFlower(jewel, center, center, 8, radius * 0.7, radius * 0.4);
            jewel.endFill();
            
            // Center circle
            jewel.beginFill(colors[type], 0.9);
            jewel.drawCircle(center, center, radius * 0.25);
            jewel.endFill();
            break;
    }
    
    jewel.jewelType = type; // Store the jewel type for later reference
    
    return jewel;
}

// Helper function to draw regular polygons
function drawRegularPolygon(graphics, centerX, centerY, radius, sides, startAngle = 0) {
    const angleStep = (Math.PI * 2) / sides;
    
    graphics.moveTo(
        centerX + radius * Math.cos(startAngle),
        centerY + radius * Math.sin(startAngle)
    );
    
    for (let i = 1; i <= sides; i++) {
        const angle = startAngle + angleStep * i;
        graphics.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        );
    }
}

// Helper function to draw a star shape
function drawStar(graphics, centerX, centerY, points, outerRadius, innerRadius, startAngle = 0) {
    const angleStep = Math.PI / points;
    
    graphics.moveTo(
        centerX + outerRadius * Math.cos(startAngle),
        centerY + outerRadius * Math.sin(startAngle)
    );
    
    for (let i = 1; i <= points * 2; i++) {
        const angle = startAngle + angleStep * i;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        
        graphics.lineTo(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        );
    }
}

// Helper function to draw a flower pattern
function drawFlower(graphics, centerX, centerY, petals, radius, innerRadius) {
    const angleStep = (Math.PI * 2) / petals;
    
    // Draw petals
    for (let i = 0; i < petals; i++) {
        const angle = angleStep * i;
        const petalTipX = centerX + radius * Math.cos(angle);
        const petalTipY = centerY + radius * Math.sin(angle);
        
        const leftAngle = angle - angleStep * 0.3;
        const rightAngle = angle + angleStep * 0.3;
        
        const leftControlX = centerX + innerRadius * 1.5 * Math.cos(leftAngle);
        const leftControlY = centerY + innerRadius * 1.5 * Math.sin(leftAngle);
        
        const rightControlX = centerX + innerRadius * 1.5 * Math.cos(rightAngle);
        const rightControlY = centerY + innerRadius * 1.5 * Math.sin(rightAngle);
        
        // Starting point for the petal
        if (i === 0) {
            graphics.moveTo(centerX + innerRadius * Math.cos(angle), 
                           centerY + innerRadius * Math.sin(angle));
        }
        
        // Draw the petal with bezier curves
        graphics.bezierCurveTo(
            leftControlX, leftControlY,
            leftControlX, leftControlY,
            petalTipX, petalTipY
        );
        
        graphics.bezierCurveTo(
            rightControlX, rightControlY,
            rightControlX, rightControlY,
            centerX + innerRadius * Math.cos(angle + angleStep), 
            centerY + innerRadius * Math.sin(angle + angleStep)
        );
    }
}

// Create a new falling column with random jewel types
function spawnNewColumn() {
    // Check if the spawn area is already occupied (game over condition)
    for (let i = 0; i < COLUMN_SIZE; i++) {
        if (gameState.board[i][Math.floor(GRID_WIDTH / 2)] !== null) {
            gameOver();
            return;
        }
    }
    
    // Create the new column
    const column = {
        x: Math.floor(GRID_WIDTH / 2),
        y: 0,
        jewels: []
    };
    
    // Generate random jewel types for the column
    for (let i = 0; i < COLUMN_SIZE; i++) {
        column.jewels.push(Math.floor(Math.random() * JEWEL_TYPES));
    }
    
    gameState.currentColumn = column;
    gameState.lastFallTime = Date.now();
    gameState.fastFall = false;
    
    // Update the visual representation
    renderActiveColumn();
}

// Render the current active column
function renderActiveColumn() {
    activeColumnContainer.removeChildren();
    
    if (!gameState.currentColumn) return;
    
    for (let i = 0; i < gameState.currentColumn.jewels.length; i++) {
        const jewelType = gameState.currentColumn.jewels[i];
        const jewel = createJewel(jewelType);
        
        // Position the jewel
        jewel.x = gameState.currentColumn.x * CELL_SIZE;
        jewel.y = (gameState.currentColumn.y + i) * CELL_SIZE;
        
        activeColumnContainer.addChild(jewel);
    }
}

// Render the placed jewels on the board
function renderBoard() {
    jewelContainer.removeChildren();
    
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const jewelType = gameState.board[y][x];
            if (jewelType !== null) {
                const jewel = createJewel(jewelType);
                jewel.x = x * CELL_SIZE;
                jewel.y = y * CELL_SIZE;
                jewelContainer.addChild(jewel);
            }
        }
    }
}

// Move the current column left or right
function moveColumn(direction) {
    if (gameState.status !== 'playing' || !gameState.currentColumn) return;
    
    const newX = gameState.currentColumn.x + direction;
    
    // Check if the new position is valid
    if (newX < 0 || newX >= GRID_WIDTH) return;
    
    // Check for collisions with placed jewels
    for (let i = 0; i < COLUMN_SIZE; i++) {
        const y = gameState.currentColumn.y + i;
        if (y >= 0 && y < GRID_HEIGHT && gameState.board[y][newX] !== null) {
            return; // Collision detected
        }
    }
    
    // Move the column
    gameState.currentColumn.x = newX;
    playSound('move');
    renderActiveColumn();
}

// Rotate the jewels in the current column
function rotateColumn() {
    if (gameState.status !== 'playing' || !gameState.currentColumn) return;
    
    // Rotate the jewels (move the first jewel to the end)
    const firstJewel = gameState.currentColumn.jewels.shift();
    gameState.currentColumn.jewels.push(firstJewel);
    
    playSound('rotate');
    renderActiveColumn();
}

// Make the column fall faster when down key is pressed
function setFastFall(fast) {
    gameState.fastFall = fast;
}

// Move the current column down by one cell
function fallOneStep() {
    if (gameState.status !== 'playing' || !gameState.currentColumn) return false;
    
    const newY = gameState.currentColumn.y + 1;
    
    // Check if the column has reached the bottom or collided with placed jewels
    if (hasCollision(gameState.currentColumn.x, newY)) {
        placeColumn();
        return true; // Column was placed
    }
    
    // Move the column down
    gameState.currentColumn.y = newY;
    renderActiveColumn();
    return false; // Column continues falling
}

// Check if the column would collide at the given position
function hasCollision(x, y) {
    for (let i = 0; i < COLUMN_SIZE; i++) {
        const checkY = y + i;
        
        // Check if the jewel has reached the bottom of the grid
        if (checkY >= GRID_HEIGHT) {
            return true;
        }
        
        // Check if the jewel has collided with a placed jewel
        if (checkY >= 0 && gameState.board[checkY][x] !== null) {
            return true;
        }
    }
    
    return false;
}

// Place the current column on the board
function placeColumn() {
    if (!gameState.currentColumn) return;
    
    // Add each jewel in the column to the board
    for (let i = 0; i < COLUMN_SIZE; i++) {
        const y = gameState.currentColumn.y + i;
        const x = gameState.currentColumn.x;
        
        // Only place jewels that are within the grid
        if (y >= 0 && y < GRID_HEIGHT) {
            gameState.board[y][x] = gameState.currentColumn.jewels[i];
        }
    }
    
    playSound('place');
    
    // Check for matches
    processMatches();
    
    // Spawn a new column
    spawnNewColumn();
}

// Check for and process matches on the board
function processMatches() {
    let matchFound = false;
    const matchedCells = findMatches();
    
    if (matchedCells.length > 0) {
        matchFound = true;
        
        // Remove matched jewels
        for (const cell of matchedCells) {
            gameState.board[cell.y][cell.x] = null;
        }
        
        // Score points (10 points per jewel)
        gameState.score += matchedCells.length * 10;
        updateScoreDisplay();
        
        playSound('match');
        
        // Render the updated board
        renderBoard();
        
        // Let jewels fall to fill empty spaces
        applyGravity();
        
        // Check for additional matches created after jewels fell
        setTimeout(() => {
            processMatches();
        }, 300);
    }
    
    return matchFound;
}

// Find all matches on the board
function findMatches() {
    const matchedCells = new Set();
    
    // Check for horizontal matches
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x <= GRID_WIDTH - MATCH_REQUIRED; x++) {
            const jewelType = gameState.board[y][x];
            if (jewelType === null) continue;
            
            let match = true;
            for (let i = 1; i < MATCH_REQUIRED; i++) {
                if (gameState.board[y][x + i] !== jewelType) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                for (let i = 0; i < MATCH_REQUIRED; i++) {
                    matchedCells.add(`${x + i},${y}`);
                }
            }
        }
    }
    
    // Check for vertical matches
    for (let y = 0; y <= GRID_HEIGHT - MATCH_REQUIRED; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const jewelType = gameState.board[y][x];
            if (jewelType === null) continue;
            
            let match = true;
            for (let i = 1; i < MATCH_REQUIRED; i++) {
                if (gameState.board[y + i][x] !== jewelType) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                for (let i = 0; i < MATCH_REQUIRED; i++) {
                    matchedCells.add(`${x},${y + i}`);
                }
            }
        }
    }
    
    // Check for diagonal matches (top-left to bottom-right)
    for (let y = 0; y <= GRID_HEIGHT - MATCH_REQUIRED; y++) {
        for (let x = 0; x <= GRID_WIDTH - MATCH_REQUIRED; x++) {
            const jewelType = gameState.board[y][x];
            if (jewelType === null) continue;
            
            let match = true;
            for (let i = 1; i < MATCH_REQUIRED; i++) {
                if (gameState.board[y + i][x + i] !== jewelType) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                for (let i = 0; i < MATCH_REQUIRED; i++) {
                    matchedCells.add(`${x + i},${y + i}`);
                }
            }
        }
    }
    
    // Check for diagonal matches (top-right to bottom-left)
    for (let y = 0; y <= GRID_HEIGHT - MATCH_REQUIRED; y++) {
        for (let x = MATCH_REQUIRED - 1; x < GRID_WIDTH; x++) {
            const jewelType = gameState.board[y][x];
            if (jewelType === null) continue;
            
            let match = true;
            for (let i = 1; i < MATCH_REQUIRED; i++) {
                if (gameState.board[y + i][x - i] !== jewelType) {
                    match = false;
                    break;
                }
            }
            
            if (match) {
                for (let i = 0; i < MATCH_REQUIRED; i++) {
                    matchedCells.add(`${x - i},${y + i}`);
                }
            }
        }
    }
    
    // Convert Set to array of objects
    const result = [];
    for (const cellStr of matchedCells) {
        const [x, y] = cellStr.split(',').map(Number);
        result.push({ x, y });
    }
    
    return result;
}

// Apply gravity to make jewels fall into empty spaces
function applyGravity() {
    let jewelsDropped = false;
    
    for (let x = 0; x < GRID_WIDTH; x++) {
        for (let y = GRID_HEIGHT - 2; y >= 0; y--) {
            if (gameState.board[y][x] !== null && gameState.board[y + 1][x] === null) {
                // Find how far this jewel can fall
                let dropDistance = 1;
                while (y + dropDistance < GRID_HEIGHT - 1 && 
                       gameState.board[y + dropDistance + 1][x] === null) {
                    dropDistance++;
                }
                
                // Move the jewel down
                gameState.board[y + dropDistance][x] = gameState.board[y][x];
                gameState.board[y][x] = null;
                jewelsDropped = true;
            }
        }
    }
    
    if (jewelsDropped) {
        renderBoard();
    }
    
    return jewelsDropped;
}

// Set up keyboard input handlers
function setupInputHandlers() {
    // Begin game button
    document.getElementById('begin-button').addEventListener('click', startGame);
    
    // Keyboard input
    document.addEventListener('keydown', (e) => {
        if (gameState.status !== 'playing') return;
        
        switch (e.key) {
            case 'ArrowLeft':
                moveColumn(-1);
                break;
            case 'ArrowRight':
                moveColumn(1);
                break;
            case 'ArrowUp':
                rotateColumn();
                break;
            case 'ArrowDown':
                setFastFall(true);
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowDown') {
            setFastFall(false);
        }
    });
    
    // Restart button
    document.getElementById('restart-button').addEventListener('click', restartGame);
}

// Game over handling
function gameOver() {
    gameState.status = 'gameOver';
    if (sounds.bgMusic) {
        sounds.bgMusic.stop();
    }
    playSound('gameOver');
    showGameOverScreen();
}

// Update the score display
function updateScoreDisplay() {
    document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
}

// Show the game over screen
function showGameOverScreen() {
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'flex';
}

// Hide the game over screen
function hideGameOverScreen() {
    const gameOverElement = document.getElementById('game-over');
    gameOverElement.style.display = 'none';
}

// Restart the game
function restartGame() {
    // Reset game state
    gameState.score = 0;
    gameState.status = 'playing';
    
    // Clear the board
    initializeBoard();
    renderBoard();
    
    // Spawn a new column
    spawnNewColumn();
    
    // Reset UI
    updateScoreDisplay();
    hideGameOverScreen();
    
    // Restart music
    if (sounds.bgMusic) {
        sounds.bgMusic.stop();
        sounds.bgMusic.play();
    }
}

// Main game loop
function gameLoop(delta) {
    // Only process game logic if we're in playing state
    if (gameState.status !== 'playing') return;
    
    const currentTime = Date.now();
    const effectiveFallInterval = gameState.fastFall ? 
        gameState.fallInterval / FAST_FALL_MULTIPLIER : 
        gameState.fallInterval;
    
    if (currentTime - gameState.lastFallTime >= effectiveFallInterval) {
        fallOneStep();
        gameState.lastFallTime = currentTime;
    }
    
    // Ensure board is rendered every frame to prevent jewels from disappearing
    renderBoard();
}

// Start the game
window.addEventListener('load', init);