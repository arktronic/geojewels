/**
 * GeoJewels - Main Game Module
 * Entry point and coordinator for all game modules
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

// Global game state
let gameState = {
    board: [], // 2D array representing the game board
    currentColumn: null, // Current active column
    nextJewels: null, // Pre-generated jewels for the next column
    score: 0,
    status: 'start', // 'start', 'playing', 'paused', 'gameOver', 'animating'
    lastFallTime: 0, // Time of last fall
    fallInterval: FALL_SPEED,
    fastFall: false,
    animatingMatches: false, // Flag to indicate match animation in progress
    matchAnimations: [], // Store animation objects
    columnLock: false // Lock to prevent multiple column spawns
};

// Game namespace
const Game = {
    // Initialize the game
    init: function() {
        // Create Pixi Application
        const app = new PIXI.Application({
            width: GRID_WIDTH * CELL_SIZE,
            height: GRID_HEIGHT * CELL_SIZE,
            backgroundColor: 0x111111,
            backgroundAlpha: 0.2,
            antialias: true
        });
        
        // Add the Pixi canvas to the DOM
        document.getElementById('game-container').appendChild(app.view);
        
        // Initialize all modules
        Sounds.initialize();
        Renderer.initialize(app);
        Board.initialize();
        
        // Pre-generate the first set of jewels
        gameState.nextJewels = Jewels.generateNextJewels();
        
        // Setup input handlers
        Input.setupHandlers();
        
        // Start the game loop
        app.ticker.add((delta) => Game.gameLoop(delta));
        
        // Reset the UI
        Game.updateScoreDisplay();
        
        // Make sure the start screen is showing
        Game.showStartScreen();
        
        // Add generic layout optimizations for mobile devices
        Game.addMobileOptimizations();
    },
    
    // Add layout optimizations for mobile that work across all browsers
    addMobileOptimizations: function() {
        // Listen for orientation changes which can affect layout
        window.addEventListener('orientationchange', () => {
            // Recalculate layout after orientation change with a small delay
            setTimeout(() => {
                if (typeof Input !== 'undefined' && Input.handleOrientation) {
                    Input.handleOrientation();
                }
                if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
                    Renderer.resizeCanvas();
                }
            }, 300);
        });
        
        // Force an immediate layout calculation
        setTimeout(() => {
            if (typeof Input !== 'undefined' && Input.handleOrientation) {
                Input.handleOrientation();
            }
            if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
                Renderer.resizeCanvas();
            }
        }, 100);
    },

    // Start the actual game
    startGame: function() {
        // Hide the start screen
        Game.hideStartScreen();
        
        // Explicitly initialize audio (requires user interaction, which we now have)
        if (typeof Howler !== 'undefined') {
            // Force audio context to resume if it was suspended
            if (Howler.ctx && Howler.ctx.state === 'suspended') {
                Howler.ctx.resume();
            }
            
            // Stop any sounds that might be silently playing
            if (typeof Sounds !== 'undefined') {
                Object.keys(Sounds.sounds).forEach(soundKey => {
                    if (Sounds.sounds[soundKey]) {
                        Sounds.sounds[soundKey].stop();
                    }
                });
            }
        }
        
        // Start background music
        Sounds.play('bgMusic');
        
        // Create and spawn the first column
        Jewels.spawnNewColumn();
        
        // Set game state to playing
        gameState.status = 'playing';
    },

    // Show the start screen
    showStartScreen: function() {
        const startScreenElement = document.getElementById('start-screen');
        startScreenElement.style.display = 'flex';
    },

    // Hide the start screen
    hideStartScreen: function() {
        const startScreenElement = document.getElementById('start-screen');
        startScreenElement.style.display = 'none';
    },

    // Game over handling
    gameOver: function() {
        gameState.status = 'gameOver';
        Sounds.stop('bgMusic');
        Sounds.play('gameOver');
        Game.showGameOverScreen();
    },

    // Show the game over screen
    showGameOverScreen: function() {
        const gameOverElement = document.getElementById('game-over');
        gameOverElement.style.display = 'flex';
    },

    // Hide the game over screen
    hideGameOverScreen: function() {
        const gameOverElement = document.getElementById('game-over');
        gameOverElement.style.display = 'none';
    },

    // Update the score display
    updateScoreDisplay: function() {
        document.getElementById('score-display').textContent = `Score: ${gameState.score}`;
    },

    // Restart the game
    restartGame: function() {
        // Reset game state
        gameState.score = 0;
        gameState.status = 'playing';
        
        // Clear the board
        Board.initialize();
        Renderer.renderBoard();
        
        // Spawn a new column
        Jewels.spawnNewColumn();
        
        // Reset UI
        Game.updateScoreDisplay();
        Game.hideGameOverScreen();
        
        // Restart music
        Sounds.stop('bgMusic');
        Sounds.play('bgMusic');
    },

    // Main game loop
    gameLoop: function(delta) {
        // Update animations regardless of game state
        if (gameState.animatingMatches) {
            // If animations are complete, process the next step
            if (Matching.updateAnimations(delta)) {
                Matching.finishMatchProcess();
            }
            
            // Disable fast fall if it's somehow active during animations
            gameState.fastFall = false;
            
            // Don't render board while animating matches
            return;
        }
        
        // Only process game logic if we're in playing state
        if (gameState.status !== 'playing') return;
        
        const currentTime = Date.now();
        const effectiveFallInterval = gameState.fastFall ? 
            gameState.fallInterval / FAST_FALL_MULTIPLIER : 
            gameState.fallInterval;
        
        if (currentTime - gameState.lastFallTime >= effectiveFallInterval) {
            Jewels.fallOneStep();
            gameState.lastFallTime = currentTime;
        }
        
        // Render the board only when not animating
        Renderer.renderBoard();
    }
};

// Start the game when the page loads
window.addEventListener('load', Game.init);