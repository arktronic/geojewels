/**
 * GeoJewels - Renderer Module
 * Handles all rendering and visual effects
 */

// Renderer namespace
const Renderer = {
    // Container references
    boardContainer: null,
    gridContainer: null,
    jewelContainer: null,
    activeColumnContainer: null,
    animationContainer: null,
    app: null,
    
    // Original cell size and board dimensions
    originalCellSize: null,
    originalWidth: null,
    originalHeight: null,

    // Initialize rendering containers
    initialize: function(app) {
        this.app = app;
        
        // Store original dimensions
        this.originalCellSize = CELL_SIZE;
        this.originalWidth = GRID_WIDTH * CELL_SIZE;
        this.originalHeight = GRID_HEIGHT * CELL_SIZE;
        
        // Setup containers
        this.boardContainer = new PIXI.Container();
        this.gridContainer = new PIXI.Container();
        this.jewelContainer = new PIXI.Container();
        this.activeColumnContainer = new PIXI.Container();
        this.animationContainer = new PIXI.Container();
        
        app.stage.addChild(this.boardContainer);
        this.boardContainer.addChild(this.gridContainer);
        this.boardContainer.addChild(this.jewelContainer);
        this.boardContainer.addChild(this.activeColumnContainer);
        this.boardContainer.addChild(this.animationContainer);
        
        // Draw the grid
        this.drawGrid();
        
        // Set up resize listener - use immediate execution without delay
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // Clear any pending resize to prevent multiple calls
            clearTimeout(resizeTimeout);
            
            // Execute resize immediately and schedule another one to catch any additional changes
            this.resizeCanvas();
            
            // Force another resize after a very short delay to ensure UI has updated
            resizeTimeout = setTimeout(() => {
                this.resizeCanvas();
            }, 10);
        });
        
        // Initial resize to fit screen
        this.resizeCanvas();
    },
    
    // Resize canvas and adjust game elements to fit screen
    resizeCanvas: function() {
        if (!this.app) return;
        
        const gameContainer = document.getElementById('game-container');
        
        // Get available dimensions
        const containerWidth = gameContainer.clientWidth || window.innerWidth;
        const containerHeight = gameContainer.clientHeight || window.innerHeight;
        
        // Simply resize the existing renderer - don't recreate the canvas
        this.app.renderer.resize(containerWidth, containerHeight);
        
        // Calculate the appropriate scale factor to fit the game board
        const scaleX = containerWidth / this.originalWidth;
        const scaleY = containerHeight / this.originalHeight;
        
        // Choose the smaller scale to ensure the board fits completely
        let scale;
        
        // For larger screens, we can scale up to a reasonable size
        if (Math.min(scaleX, scaleY) > 1) {
            scale = Math.min(Math.min(scaleX, scaleY), 1.5);
        } else {
            // For smaller screens, ensure everything fits
            scale = Math.min(scaleX, scaleY) * 0.9;
        }
        
        // Apply scale immediately
        this.boardContainer.scale.x = scale;
        this.boardContainer.scale.y = scale;
        
        // Center the board in the available space
        this.boardContainer.x = Math.max(0, (containerWidth - (this.originalWidth * scale)) / 2);
        this.boardContainer.y = Math.max(0, (containerHeight - (this.originalHeight * scale)) / 2);
        
        // Force the stage to update
        this.app.stage.calculateBounds();
        
        // Ensure update happens immediately
        if (this.app.ticker && !this.app.ticker.started) {
            this.app.render();
        }
    },

    // Draw the grid lines
    drawGrid: function() {
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
        
        this.gridContainer.addChild(grid);
        
        // Add a neutral subtle glow to the background of the game board
        const boardBackground = new PIXI.Graphics();
        boardBackground.beginFill(0x222222, 0.1);
        boardBackground.drawRect(0, 0, GRID_WIDTH * CELL_SIZE, GRID_HEIGHT * CELL_SIZE);
        boardBackground.endFill();
        
        // Add the background underneath the grid
        this.gridContainer.addChildAt(boardBackground, 0);
    },

    // Render the placed jewels on the board
    renderBoard: function() {
        this.jewelContainer.removeChildren();
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const jewelType = gameState.board[y][x];
                if (jewelType !== null) {
                    const jewel = Jewels.createJewel(jewelType);
                    jewel.x = x * CELL_SIZE;
                    jewel.y = y * CELL_SIZE;
                    
                    // Store the jewel's grid position for reference
                    jewel.gridX = x;
                    jewel.gridY = y;
                    jewel.jewelType = jewelType;
                    
                    this.jewelContainer.addChild(jewel);
                }
            }
        }
    },

    // Render the current active column
    renderActiveColumn: function() {
        this.activeColumnContainer.removeChildren();
        
        if (!gameState.currentColumn) return;
        
        for (let i = 0; i < gameState.currentColumn.jewels.length; i++) {
            const jewelType = gameState.currentColumn.jewels[i];
            const jewel = Jewels.createJewel(jewelType);
            
            // Position the jewel
            jewel.x = gameState.currentColumn.x * CELL_SIZE;
            jewel.y = (gameState.currentColumn.y + i) * CELL_SIZE;
            
            this.activeColumnContainer.addChild(jewel);
        }
    },

    // Clear the active column container
    clearActiveColumn: function() {
        this.activeColumnContainer.removeChildren();
    },

    // Clear the animation container
    clearAnimationContainer: function() {
        this.animationContainer.removeChildren();
    },

    // Helper function to draw regular polygons
    drawRegularPolygon: function(graphics, centerX, centerY, radius, sides, startAngle = 0) {
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
    },

    // Helper function to draw a star shape
    drawStar: function(graphics, centerX, centerY, points, outerRadius, innerRadius, startAngle = 0) {
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
    },

    // Helper function to draw a flower pattern
    drawFlower: function(graphics, centerX, centerY, petals, radius, innerRadius) {
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
    },

    // Create particles for the match animation
    createMatchParticles: function(jewelType, gridX, gridY) {
        const container = new PIXI.Container();
        container.x = gridX * CELL_SIZE;
        container.y = gridY * CELL_SIZE;
        
        // Define colors for each jewel type
        const colors = [
            0xFF4444, // Red (Triangle)
            0x44FF44, // Green (Square)
            0x4444FF, // Blue (Pentagon)
            0xFFFF44, // Yellow (Hexagon)
            0xFF44FF  // Purple (Octagon)
        ];
        
        // Create 8-12 particles for each jewel
        const particleCount = 8 + Math.floor(Math.random() * 5);
        container.particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            
            // Draw particle
            particle.beginFill(colors[jewelType], 0.8);
            particle.drawCircle(0, 0, 2 + Math.random() * 3);
            particle.endFill();
            
            // Center the particle
            particle.x = CELL_SIZE / 2;
            particle.y = CELL_SIZE / 2;
            
            // Set random velocity for the particle
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            
            // Add to container
            container.addChild(particle);
            container.particles.push(particle);
        }
        
        return container;
    },

    // Update particle positions and properties
    updateParticles: function(particleContainer, delta, progress) {
        // Start particles after a slight delay
        if (progress < 0.2) return;
        
        // Calculate particle alpha based on overall progress
        const particleAlpha = progress < 0.7 ? 1 : 1 - ((progress - 0.7) / 0.3);
        
        for (const particle of particleContainer.particles) {
            // Update position
            particle.x += particle.vx * delta;
            particle.y += particle.vy * delta;
            
            // Apply some gravity
            particle.vy += 0.05 * delta;
            
            // Fade out
            particle.alpha = particleAlpha;
        }
    }
};