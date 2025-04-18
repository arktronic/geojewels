/**
 * GeoJewels - Matching Module
 * Handles match detection, scoring, and animations
 */

// Matching namespace
const Matching = {
    // Check for and process matches on the board
    processMatches: function() {
        // Find all matches
        const matchedCells = this.findMatches();
        
        if (matchedCells.length > 0) {
            // Play match sound
            Sounds.play('match');
            
            // Start match animations
            this.animateMatchedJewels(matchedCells);
            
            // Score points (10 points per jewel)
            gameState.score += matchedCells.length * 10;
            Game.updateScoreDisplay(); // This will also trigger level check
            
            // The rest of the match processing will happen when animations complete
            return true;
        }
        
        return false;
    },

    // Find all matches on the board
    findMatches: function() {
        const matchedCells = new Set();
        const result = [];
        
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
        
        // Convert Set to array of objects and store the jewel type
        for (const cellStr of matchedCells) {
            const [x, y] = cellStr.split(',').map(Number);
            result.push({ 
                x, 
                y, 
                type: gameState.board[y][x] // Store the jewel type
            });
        }
        
        return result;
    },

    // Animate jewels falling to fill empty spaces
    animateFallingJewels: function() {
        // If already animating, don't start another animation
        if (gameState.animatingMatches) return false;
        
        // Find all jewels that need to fall and their destination
        const fallingJewels = [];
        const boardCopy = [];
        
        // Create a copy of the current board state
        for (let y = 0; y < GRID_HEIGHT; y++) {
            boardCopy[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                boardCopy[y][x] = gameState.board[y][x];
            }
        }
        
        // Calculate where each jewel will fall to (similar to applyGravity but without modifying the board)
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (let y = GRID_HEIGHT - 2; y >= 0; y--) {
                if (boardCopy[y][x] !== null) {
                    // Find how far this jewel can fall
                    let dropDistance = 0;
                    let newY = y;
                    
                    while (newY + 1 < GRID_HEIGHT && boardCopy[newY + 1][x] === null) {
                        dropDistance++;
                        newY++;
                        boardCopy[newY][x] = boardCopy[newY - 1][x];
                        boardCopy[newY - 1][x] = null;
                    }
                    
                    if (dropDistance > 0) {
                        fallingJewels.push({
                            x: x,
                            startY: y,
                            endY: y + dropDistance,
                            type: gameState.board[y][x]
                        });
                    }
                }
            }
        }
        
        // If no jewels need to fall, return false
        if (fallingJewels.length === 0) return false;
        
        // Set the animating state
        gameState.animatingMatches = true;
        gameState.status = 'animating';
        
        // Clear any previous animations
        Renderer.clearAnimationContainer();
        gameState.matchAnimations = [];
        
        // Create a animation for each falling jewel
        for (const fallingJewel of fallingJewels) {
            // Create a jewel sprite for animation
            const jewel = Jewels.createJewel(fallingJewel.type);
            jewel.x = fallingJewel.x * CELL_SIZE;
            jewel.y = fallingJewel.startY * CELL_SIZE;
            
            // Remove the jewel from the board during animation
            gameState.board[fallingJewel.startY][fallingJewel.x] = null;
            
            // Add jewel to animation container
            Renderer.animationContainer.addChild(jewel);
            
            // Define the animation
            const animation = {
                jewel,
                startY: fallingJewel.startY,
                endY: fallingJewel.endY,
                x: fallingJewel.x,
                type: fallingJewel.type,
                progress: 0,
                complete: false,
                update: (delta) => {
                    // Animation progress from 0 to 1
                    animation.progress += delta * 0.05; // Speed of animation (slower than match animation)
                    
                    if (animation.progress >= 1) {
                        animation.progress = 1;
                        animation.complete = true;
                        
                        // Once animation is complete, place the jewel at its destination
                        gameState.board[animation.endY][animation.x] = animation.type;
                    }
                    
                    // Cubic easing for natural falling motion
                    const t = animation.progress;
                    const easedProgress = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                    
                    // Calculate the Y position with easing
                    const currentY = fallingJewel.startY + (fallingJewel.endY - fallingJewel.startY) * easedProgress;
                    jewel.y = currentY * CELL_SIZE;
                }
            };
            
            gameState.matchAnimations.push(animation);
        }
        
        // Re-render the board to update jewel positions
        Renderer.renderBoard();
        
        return true;
    },

    // Create animation for matched jewels
    animateMatchedJewels: function(matchedCells) {
        // If there are no matched cells, return false
        if (matchedCells.length === 0) return false;
        
        // Set the animating state
        gameState.animatingMatches = true;
        gameState.status = 'animating';
        
        // Clear any previous animations
        Renderer.clearAnimationContainer();
        gameState.matchAnimations = [];
        
        // First, remove all matched jewels from the board immediately
        // This ensures they don't show up in the board rendering
        for (const cell of matchedCells) {
            gameState.board[cell.y][cell.x] = null;
        }
        
        // Re-render the board immediately to remove matched jewels
        Renderer.renderBoard();
        
        // Define colors for each jewel type for the animations
        const colors = [
            0xFF4444, // Red (Triangle)
            0x44FF44, // Green (Square)
            0x4444FF, // Blue (Pentagon)
            0xFFFF44, // Yellow (Hexagon)
            0xFF44FF  // Purple (Octagon)
        ];
        
        // Create an animation for each matched cell
        for (const cell of matchedCells) {
            const jewelType = cell.type; // Use the stored type since we've cleared the board
            
            // Create a jewel sprite for animation
            const jewel = Jewels.createJewel(jewelType);
            jewel.x = cell.x * CELL_SIZE;
            jewel.y = cell.y * CELL_SIZE;
            jewel.alpha = 1;
            jewel.scale.set(1, 1);
            
            // Add a particle effect for the jewel
            const particles = Renderer.createMatchParticles(jewelType, cell.x, cell.y);
            Renderer.animationContainer.addChild(particles);
            
            // Create glow around the jewel
            const glow = new PIXI.Graphics();
            glow.beginFill(colors[jewelType], 0.3);
            glow.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.6);
            glow.endFill();
            glow.x = cell.x * CELL_SIZE;
            glow.y = cell.y * CELL_SIZE;
            glow.alpha = 0;
            
            // Add jewel and glow to animation container
            Renderer.animationContainer.addChild(glow);
            Renderer.animationContainer.addChild(jewel);
            
            // Define the animation using PIXI's ticker
            const animation = {
                jewel,
                glow,
                particles,
                progress: 0,
                complete: false,
                update: (delta) => {
                    // Animation progress from 0 to 1
                    animation.progress += delta * 0.03; // Speed of animation
                    
                    if (animation.progress >= 1) {
                        animation.progress = 1;
                        animation.complete = true;
                    }
                    
                    // First phase: grow and glow (0 to 0.4)
                    if (animation.progress < 0.4) {
                        const phase = animation.progress / 0.4;
                        const scale = 1 + phase * 0.5; // Grow up to 1.5x
                        jewel.scale.set(scale, scale);
                        glow.alpha = phase;
                    }
                    // Second phase: shrink and fade (0.4 to 1)
                    else {
                        const phase = (animation.progress - 0.4) / 0.6;
                        const scale = 1.5 - phase * 1.5; // Shrink from 1.5x to 0
                        jewel.scale.set(scale, scale);
                        jewel.alpha = 1 - phase;
                        glow.alpha = 1 - phase;
                    }
                    
                    // Update particles
                    Renderer.updateParticles(particles, delta, animation.progress);
                }
            };
            
            gameState.matchAnimations.push(animation);
        }
        
        return true;
    },

    // Update all active animations
    updateAnimations: function(delta) {
        if (!gameState.animatingMatches) return false;
        
        // Update all animations
        let allComplete = true;
        for (const animation of gameState.matchAnimations) {
            if (!animation.complete) {
                animation.update(delta);
                allComplete = false;
            }
        }
        
        // If all animations are complete
        if (allComplete) {
            // Clean up animations
            Renderer.clearAnimationContainer();
            
            // Clean up animation objects to prevent memory leaks
            for (const animation of gameState.matchAnimations) {
                // Remove references to PIXI objects to help garbage collection
                if (animation.jewel) {
                    animation.jewel = null;
                }
                
                if (animation.glow) {
                    animation.glow = null;
                }
                
                if (animation.particles) {
                    if (animation.particles.particles) {
                        animation.particles.particles.length = 0;
                    }
                    animation.particles = null;
                }
            }
            
            // Clear the animation array
            gameState.matchAnimations.length = 0;
            gameState.animatingMatches = false;
            
            // Return to playing state if we were animating
            if (gameState.status === 'animating') {
                gameState.status = 'playing';
            }
            
            // Add a small delay before checking for next step
            // This makes cascading effects more visible
            setTimeout(() => {
                // Check for next step in the cascade
                if (gameState.status === 'playing') {
                    this.processNextAnimationStep();
                }
            }, 150); // Short delay to make cascade more visible
            
            return true; // Animations completed
        }
        
        return false; // Animations still in progress
    },

    // Finish processing matches after animations complete
    finishMatchProcess: function() {
        // Since matched jewels are already removed in animateMatchedJewels,
        // we now need to animate the falling jewels
        
        // Start falling animation
        const jewelsFalling = this.animateFallingJewels();
        
        // If no jewels are falling (or animation didn't start), check for more matches or spawn a new column
        if (!jewelsFalling) {
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                // Process new matches
                Sounds.play('match');
                gameState.score += newMatches.length * 10;
                Game.updateScoreDisplay();
                this.animateMatchedJewels(newMatches);
            } else {
                // No more matches, spawn a new column
                Jewels.spawnNewColumn();
            }
        }
        // If jewels are falling, the falling animation completion will handle further match checking
    },

    // Process the next step in the animation sequence
    processNextAnimationStep: function() {
        // If we're animating, wait until animations are complete
        if (gameState.animatingMatches) {
            return;
        }
        
        // Check for new matches after jewels have fallen
        const newMatches = this.findMatches();
        
        if (newMatches.length > 0) {
            // We have new matches to process
            Sounds.play('match');
            gameState.score += newMatches.length * 10;
            Game.updateScoreDisplay(); // This will also trigger level check
            
            // Start a new match animation
            this.animateMatchedJewels(newMatches);
        } else {
            // Check if there are jewels that need to fall
            const jewelsFalling = this.animateFallingJewels();
            
            // If no jewels are falling and no matches, add delay before spawning a new column
            if (!jewelsFalling) {
                // Make sure we don't already have an active column before trying to spawn
                if (!gameState.currentColumn && gameState.status === 'playing' && !gameState.columnLock) {
                    // Set columnLock to prevent multiple scheduled spawns
                    gameState.columnLock = true;
                    
                    // Add a short delay before spawning the next column to make the sequence clearer
                    setTimeout(() => {
                        // Only spawn a new column if we're still in playing state and don't already have one
                        if (gameState.status === 'playing' && !gameState.currentColumn) {
                            Jewels.spawnNewColumn();
                        }
                        gameState.columnLock = false;
                    }, 300);
                }
            }
        }
    }
};