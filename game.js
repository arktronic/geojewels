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
const POINTS_PER_LEVEL = 1000; // Points needed to increase level
const SPEED_INCREASE_PER_LEVEL = 0.10; // 10% speed increase per level

// Global game state
let gameState = {
    board: [], // 2D array representing the game board
    currentColumn: null, // Current active column
    nextJewels: null, // Pre-generated jewels for the next column
    score: 0,
    level: 1, // Current difficulty level
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
        
        // Store app reference for potential cleanup
        this.app = app;
        
        // Reset the UI
        Game.updateScoreDisplay();
        Game.updateLevelDisplay();
        
        // Make sure the start screen is showing
        Game.showStartScreen();
        
        // Add generic layout optimizations for mobile devices
        Game.addMobileOptimizations();
    },
    
    // Add layout optimizations for mobile devices that work across all browsers
    addMobileOptimizations: function() {
        // Use a simpler, more reliable approach to layout updates
        const updateLayout = () => {
            // Always get actual device dimensions
            const gameContainer = document.getElementById('game-container');
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Handle different device capabilities
            const isTouchDevice = (('ontouchstart' in window) || 
                                  (navigator.maxTouchPoints > 0) || 
                                  (navigator.msMaxTouchPoints > 0));
            
            // Disable all browser scroll/zoom behaviors on game container
            if (isTouchDevice) {
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';
                
                // Ensure proper viewport settings for mobile
                const viewport = document.querySelector('meta[name="viewport"]');
                if (viewport) {
                    viewport.setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, ' + 
                        'user-scalable=no, viewport-fit=cover');
                }
            }
            
            // Update the game canvas size
            if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
                Renderer.resizeCanvas();
            }
            
            // Update mobile controls if present
            if (typeof Input !== 'undefined' && Input.handleResize) {
                Input.handleResize();
            }
        };

        // Handle initial layout setup
        updateLayout();
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            // Update layout when orientation changes
            setTimeout(updateLayout, 250);
        });
        
        // Handle regular window resize events
        window.addEventListener('resize', () => {
            updateLayout();
        });
        
        // Force layout update after page is fully loaded
        window.addEventListener('load', () => {
            updateLayout();
            
            // Secondary layout update after a short delay 
            setTimeout(updateLayout, 300);
        });
    },

    // Clean up resources to prevent memory leaks
    cleanup: function() {
        // Clean up PIXI application
        if (this.app) {
            // Stop the ticker
            this.app.ticker.stop();
            
            // Destroy the renderer
            this.app.renderer.destroy(true);
            
            // Remove all references
            this.app = null;
        }
        
        // Clean up animations
        if (gameState.matchAnimations) {
            gameState.matchAnimations.length = 0;
        }
        
        // Clean up fireworks if they're active
        if (typeof Renderer !== 'undefined' && Renderer.clearFireworks) {
            Renderer.clearFireworks();
        }
        
        // Clean up floating text if active
        if (typeof Renderer !== 'undefined' && Renderer.clearFloatingTexts) {
            Renderer.clearFloatingTexts();
        }
        
        // Additional cleanup
        if (typeof Renderer !== 'undefined') {
            Renderer.clearAnimationContainer();
            Renderer.clearActiveColumn();
        }
        
        // Clear board references
        if (typeof Board !== 'undefined' && Board.initialize) {
            Board.initialize();
        }
        
        // Clean up input handlers if applicable
        if (typeof Input !== 'undefined' && Input.cleanup) {
            Input.cleanup();
        }
        
        // Clean up sounds if applicable
        if (typeof Sounds !== 'undefined' && Sounds.cleanup) {
            Sounds.cleanup();
        }
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
        
        // Check if level should increase
        this.checkLevelUp();
    },
    
    // Update the level display
    updateLevelDisplay: function() {
        document.getElementById('level-display').textContent = `Level: ${gameState.level}`;
    },
    
    // Check if level should increase and handle level up
    checkLevelUp: function() {
        const newLevel = Math.floor(gameState.score / POINTS_PER_LEVEL) + 1;
        
        if (newLevel > gameState.level) {
            // Store the previous level
            const previousLevel = gameState.level;
            
            // Update the level
            gameState.level = newLevel;
            this.adjustFallSpeed();
            this.updateLevelDisplay();
            
            // Play level up sound instead of match sound
            Sounds.play('levelUp');
            
            // Trigger fireworks celebration
            Renderer.createFireworks();
            
            // Show level-up floating text - use Renderer's app reference, not Game's
            if (Renderer.app) {
                const centerX = Renderer.app.renderer.width / 2;
                const centerY = Renderer.app.renderer.height / 2;
                
                // Create floating text with level number - more translucent with even shorter duration
                Renderer.createFloatingText(`LEVEL ${newLevel}!`, centerX, centerY, {
                    fontSize: 48,
                    color: 0xFFFF44, // Yellow color
                    outlineColor: 0xFF6600, // Orange outline
                    outlineThickness: 5,
                    duration: 1500, // Even shorter duration (1.5 seconds)
                    rise: 150,      // Moderate rise
                    startScale: 2.0,
                    endScale: 1.2,
                    maxAlpha: 0.5   // More translucent (50% opacity)
                });
            }
            
            // Add a brief pause in game action to emphasize the level up
            const wasPlaying = gameState.status === 'playing';
            
            if (wasPlaying) {
                // Only pause briefly if we're going from level 1 to 2 or higher
                // This prevents pausing when starting a new game
                if (previousLevel >= 1) {
                    gameState.status = 'animating'; // Use animating state to pause gameplay
                    
                    // Resume the game after a short delay (1 second)
                    setTimeout(() => {
                        // Only resume if we're still in the animating state from the level-up
                        if (gameState.status === 'animating') {
                            gameState.status = 'playing';
                        }
                    }, 1000);
                }
            }
        }
    },
    
    // Adjust fall speed based on current level
    adjustFallSpeed: function() {
        // Calculate speed reduction factor based on level (higher level = faster falling)
        // Formula: base speed * (1 - (level-1) * speed increase per level)
        // This ensures the fall interval decreases as level increases
        const speedFactor = Math.max(0.2, 1 - ((gameState.level - 1) * SPEED_INCREASE_PER_LEVEL));
        gameState.fallInterval = FALL_SPEED * speedFactor;
    },

    // Restart the game
    restartGame: function() {
        // Reset game state
        gameState.score = 0;
        gameState.level = 1;
        gameState.status = 'playing';
        gameState.fallInterval = FALL_SPEED; // Reset falling speed
        
        // Clear the board
        Board.initialize();
        Renderer.renderBoard();
        
        // Spawn a new column
        Jewels.spawnNewColumn();
        
        // Reset UI
        Game.updateScoreDisplay();
        Game.updateLevelDisplay();
        Game.hideGameOverScreen();
        
        // We no longer restart the music, allowing it to continue playing
        // through the rotation of tracks
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
        
        // Use a more responsive fall interval during fast fall
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