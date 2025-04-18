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
    fireworksContainer: null, // New container for fireworks
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
        this.fireworksContainer = new PIXI.Container(); // Initialize fireworks container
        
        app.stage.addChild(this.boardContainer);
        this.boardContainer.addChild(this.gridContainer);
        this.boardContainer.addChild(this.jewelContainer);
        this.boardContainer.addChild(this.activeColumnContainer);
        this.boardContainer.addChild(this.animationContainer);
        app.stage.addChild(this.fireworksContainer); // Add fireworks container to the stage directly
        
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
            // For smaller screens, ensure everything fits with a consistent scale factor
            scale = Math.min(scaleX, scaleY) * 0.88; // Slight reduction for all mobile devices
        }
        
        // Apply scale immediately
        this.boardContainer.scale.x = scale;
        this.boardContainer.scale.y = scale;
        
        // Center the board in the available space
        // Add a small upward offset on mobile to prevent virtual button overlaps
        const isMobile = window.innerWidth <= 768;
        const verticalOffset = isMobile ? -15 : 0; // Move up by 15px on mobile devices
        
        this.boardContainer.x = Math.max(0, (containerWidth - (this.originalWidth * scale)) / 2);
        this.boardContainer.y = Math.max(0, (containerHeight - (this.originalHeight * scale)) / 2) + verticalOffset;
        
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
        // Properly destroy existing jewels to prevent memory leaks
        for (let i = this.jewelContainer.children.length - 1; i >= 0; i--) {
            const child = this.jewelContainer.children[i];
            child.destroy({children: true, texture: true, baseTexture: true});
        }
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
        // Properly destroy existing column jewels
        for (let i = this.activeColumnContainer.children.length - 1; i >= 0; i--) {
            const child = this.activeColumnContainer.children[i];
            child.destroy({children: true, texture: true, baseTexture: true});
        }
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
        // Properly destroy active column jewels
        for (let i = this.activeColumnContainer.children.length - 1; i >= 0; i--) {
            const child = this.activeColumnContainer.children[i];
            child.destroy({children: true, texture: true, baseTexture: true});
        }
        this.activeColumnContainer.removeChildren();
    },

    // Clear the animation container
    clearAnimationContainer: function() {
        // Properly destroy all children to prevent memory leaks
        for (let i = this.animationContainer.children.length - 1; i >= 0; i--) {
            const child = this.animationContainer.children[i];
            
            // If the child has particles, make sure to clean them up too
            if (child.particles && child.particles.length) {
                child.particles.length = 0;
            }
            
            // Properly destroy the child to free up memory
            child.destroy({children: true, texture: true, baseTexture: true});
        }
        
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
    },
    
    // Create floating text that animates upward
    createFloatingText: function(text, x, y, options = {}) {
        // Default options
        const defaults = {
            fontSize: 40,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: 0xFFFFFF,
            outlineColor: 0x000000,
            outlineThickness: 4,
            duration: 2000, // Animation duration in ms
            rise: 150,      // How far the text rises in pixels
            startScale: 1.5,
            endScale: 1.0,
            maxAlpha: 1.0   // Maximum opacity (1.0 = fully opaque)
        };
        
        // Merge provided options with defaults
        const settings = { ...defaults, ...options };
        
        // Create text object with PIXI
        const textStyle = new PIXI.TextStyle({
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            fontWeight: settings.fontWeight,
            fill: settings.color,
            stroke: settings.outlineColor,
            strokeThickness: settings.outlineThickness,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 4,
            dropShadowDistance: 2
        });
        
        const textObj = new PIXI.Text(text, textStyle);
        textObj.anchor.set(0.5); // Center alignment
        textObj.x = x;
        textObj.y = y;
        textObj.alpha = 0; // Start invisible for fade-in effect
        textObj.scale.set(settings.startScale);
        
        // Create container
        const container = new PIXI.Container();
        container.addChild(textObj);
        
        // Add directly to the main stage for better visibility
        this.app.stage.addChild(container);
        
        // Animation data
        const animation = {
            text: textObj,
            container: container,
            startTime: Date.now(),
            duration: settings.duration,
            startY: y,
            endY: y - settings.rise,
            startScale: settings.startScale,
            endScale: settings.endScale,
            maxAlpha: settings.maxAlpha, // Store max alpha for animation
            active: true
        };
        
        // Add animation to gameState for tracking
        if (!gameState.floatingTextAnimations) {
            gameState.floatingTextAnimations = [];
            
            // Set up the ticker if this is the first floating text
            if (!this.floatingTextTickerSetup) {
                this.app.ticker.add(this.updateFloatingTexts, this);
                this.floatingTextTickerSetup = true;
            }
        }
        
        gameState.floatingTextAnimations.push(animation);
        
        return animation;
    },
    
    // Update all floating text animations
    updateFloatingTexts: function(delta) {
        if (!gameState.floatingTextAnimations || gameState.floatingTextAnimations.length === 0) {
            return;
        }
        
        const now = Date.now();
        
        // Process each animation
        for (let i = gameState.floatingTextAnimations.length - 1; i >= 0; i--) {
            const anim = gameState.floatingTextAnimations[i];
            
            if (!anim.active) continue;
            
            const elapsed = now - anim.startTime;
            const progress = Math.min(elapsed / anim.duration, 1);
            
            if (progress >= 1) {
                // Animation complete, remove text
                anim.active = false;
                this.app.stage.removeChild(anim.container);
                anim.text.destroy();
                anim.container.destroy();
                gameState.floatingTextAnimations.splice(i, 1);
                continue;
            }
            
            // Animation phases:
            // 0.0 - 0.2: Fade in, grow slightly
            // 0.2 - 0.8: Main visibility, rise upward
            // 0.8 - 1.0: Fade out, continue rising
            
            // Calculate alpha (opacity)
            let alpha;
            if (progress < 0.2) {
                // Fade in (0 to maxAlpha over the first 20% of time)
                alpha = (progress / 0.2) * anim.maxAlpha;
            } else if (progress > 0.8) {
                // Fade out (maxAlpha to 0 over the last 20% of time)
                alpha = anim.maxAlpha - ((progress - 0.8) / 0.2) * anim.maxAlpha;
            } else {
                // Full visibility during middle phase
                alpha = anim.maxAlpha;
            }
            
            // Calculate position (smooth rise upward)
            // Use easeOutCubic easing for natural motion
            const t = progress;
            const eased = 1 - Math.pow(1 - t, 3);
            const newY = anim.startY + (anim.endY - anim.startY) * eased;
            
            // Calculate scale (start larger, end at normal size)
            const scaleProgress = Math.min(progress * 2.5, 1); // Complete scale change in first 40% of animation
            const scaleEased = 1 - Math.pow(1 - scaleProgress, 2);
            const newScale = anim.startScale + (anim.endScale - anim.startScale) * scaleEased;
            
            // Apply changes
            anim.text.y = newY;
            anim.text.alpha = alpha;
            anim.text.scale.set(newScale);
            
            // Add a gentle bobbing effect
            const wobbleAmount = 0.05;
            const wobbleSpeed = 5;
            const wobble = Math.sin(progress * Math.PI * wobbleSpeed) * wobbleAmount;
            const baseScale = anim.startScale + (anim.endScale - anim.startScale) * scaleEased;
            anim.text.scale.x = baseScale * (1 + wobble);
            anim.text.scale.y = baseScale * (1 - wobble);
        }
    },
    
    // Clear all floating text animations
    clearFloatingTexts: function() {
        if (gameState.floatingTextAnimations && gameState.floatingTextAnimations.length > 0) {
            for (const anim of gameState.floatingTextAnimations) {
                if (anim.container && !anim.container.destroyed) {
                    this.app.stage.removeChild(anim.container);
                    anim.text.destroy();
                    anim.container.destroy();
                }
            }
            
            gameState.floatingTextAnimations = [];
        }
    },
    
    // Create fireworks for level up celebration
    createFireworks: function() {
        // Clear any existing fireworks
        this.clearFireworks();
        
        // Set up fireworks animation timing
        gameState.fireworksAnimation = {
            active: true,
            startTime: Date.now(),
            duration: 3000, // 3 seconds to match the levelUp sound duration
            fireworks: []
        };
        
        // Create several fireworks that will launch at different times
        const fireworkCount = 8 + Math.floor(Math.random() * 5); // 8-12 fireworks
        
        for (let i = 0; i < fireworkCount; i++) {
            // Random launch timing throughout the animation
            const launchDelay = Math.random() * 2000; // Launch within first 2 seconds
            
            // Create firework
            const firework = this.createFirework(launchDelay);
            gameState.fireworksAnimation.fireworks.push(firework);
        }
        
        // Set up the ticker to update fireworks
        if (!this.fireworksTickerSetup) {
            this.app.ticker.add(this.updateFireworks, this);
            this.fireworksTickerSetup = true;
        }
    },
    
    // Create a single firework
    createFirework: function(launchDelay) {
        // Random position along the width of the game area
        const startX = Math.random() * this.app.renderer.width;
        const startY = this.app.renderer.height;
        const endX = startX + (Math.random() * 200 - 100); // Slight x-variation during launch
        const endY = Math.random() * this.app.renderer.height * 0.6; // Explode in top 60% of screen
        
        // Random colors for the firework
        const colorIndex = Math.floor(Math.random() * 5);
        const colors = [
            0xFF4444, // Red
            0x44FF44, // Green
            0x4444FF, // Blue
            0xFFFF44, // Yellow
            0xFF44FF  // Purple
        ];
        const color = colors[colorIndex];
        
        // Create the firework object
        const firework = {
            x: startX,
            y: startY,
            targetX: endX,
            targetY: endY,
            launchDelay: launchDelay,
            state: 'waiting', // waiting, launching, exploding, or complete
            color: color,
            startTime: Date.now(),
            particles: [],
            container: new PIXI.Container(),
            trailContainer: new PIXI.Container(),
            particleContainer: null
        };
        
        // Add containers to the fireworks container
        this.fireworksContainer.addChild(firework.container);
        firework.container.addChild(firework.trailContainer);
        
        // Create the firework rocket
        const rocket = new PIXI.Graphics();
        rocket.beginFill(color);
        rocket.drawCircle(0, 0, 3);
        rocket.endFill();
        firework.rocket = rocket;
        firework.container.addChild(rocket);
        
        return firework;
    },
    
    // Update all active fireworks
    updateFireworks: function(delta) {
        // If no active fireworks animation, return
        if (!gameState.fireworksAnimation || !gameState.fireworksAnimation.active) {
            return;
        }
        
        const now = Date.now();
        const elapsed = now - gameState.fireworksAnimation.startTime;
        
        // Check if the animation is complete
        if (elapsed >= gameState.fireworksAnimation.duration) {
            this.clearFireworks();
            return;
        }
        
        // Update each firework
        for (const firework of gameState.fireworksAnimation.fireworks) {
            const fireworkElapsed = now - firework.startTime;
            
            switch (firework.state) {
                case 'waiting':
                    if (fireworkElapsed >= firework.launchDelay) {
                        firework.state = 'launching';
                        firework.launchStartTime = now;
                    }
                    break;
                    
                case 'launching':
                    // Calculate launch progress (0.3 seconds for launch)
                    const launchElapsed = now - firework.launchStartTime;
                    const launchDuration = 300 + Math.random() * 400; // 0.3-0.7 second launch
                    const launchProgress = Math.min(launchElapsed / launchDuration, 1);
                    
                    // Move the rocket
                    firework.x = firework.x + (firework.targetX - firework.x) * launchProgress * 0.1 * delta;
                    firework.y = firework.y + (firework.targetY - firework.y) * launchProgress * 0.1 * delta;
                    firework.rocket.x = firework.x;
                    firework.rocket.y = firework.y;
                    
                    // Create trail effect
                    if (Math.random() < 0.3) {
                        const trail = new PIXI.Graphics();
                        trail.beginFill(firework.color, 0.7);
                        trail.drawCircle(0, 0, 2);
                        trail.endFill();
                        trail.x = firework.x;
                        trail.y = firework.y;
                        trail.alpha = 0.7;
                        trail.scale.set(0.8);
                        firework.trailContainer.addChild(trail);
                        
                        // Animate trail particle fade-out
                        const fadeOut = () => {
                            trail.alpha -= 0.05 * delta;
                            trail.scale.x -= 0.01 * delta;
                            trail.scale.y -= 0.01 * delta;
                            if (trail.alpha <= 0) {
                                trail.destroy();
                                firework.trailContainer.removeChild(trail);
                            }
                        };
                        trail.fadeOut = fadeOut;
                    }
                    
                    // Fade out trail particles
                    for (let i = firework.trailContainer.children.length - 1; i >= 0; i--) {
                        const trail = firework.trailContainer.children[i];
                        if (trail.fadeOut) {
                            trail.fadeOut();
                        }
                    }
                    
                    // Check if it's time to explode
                    const distToTarget = Math.sqrt(
                        Math.pow(firework.targetX - firework.x, 2) + 
                        Math.pow(firework.targetY - firework.y, 2)
                    );
                    
                    if (distToTarget < 10 || launchProgress >= 1) {
                        firework.state = 'exploding';
                        firework.explodeStartTime = now;
                        
                        // Remove the rocket
                        firework.container.removeChild(firework.rocket);
                        firework.rocket.destroy();
                        
                        // Create explosion particles
                        this.createExplosion(firework);
                    }
                    break;
                    
                case 'exploding':
                    // Calculate explosion progress (1 second for explosion)
                    const explodeElapsed = now - firework.explodeStartTime;
                    const explodeDuration = 1000;
                    const explodeProgress = Math.min(explodeElapsed / explodeDuration, 1);
                    
                    // Update explosion particles
                    if (firework.particleContainer) {
                        for (const particle of firework.particles) {
                            // Update position
                            particle.x += particle.vx * delta;
                            particle.y += particle.vy * delta;
                            
                            // Apply slight gravity
                            particle.vy += 0.02 * delta;
                            
                            // Fade out based on explosion progress
                            particle.alpha = 1 - explodeProgress;
                            
                            // Apply to sprite
                            particle.sprite.x = particle.x;
                            particle.sprite.y = particle.y;
                            particle.sprite.alpha = particle.alpha;
                        }
                    }
                    
                    // Check if explosion is complete
                    if (explodeProgress >= 1) {
                        firework.state = 'complete';
                        
                        // Cleanup explosion particles
                        if (firework.particleContainer) {
                            firework.container.removeChild(firework.particleContainer);
                            for (const particle of firework.particles) {
                                particle.sprite.destroy();
                            }
                            firework.particles.length = 0;
                            firework.particleContainer.destroy();
                            firework.particleContainer = null;
                        }
                    }
                    break;
            }
        }
    },
    
    // Create explosion for a firework
    createExplosion: function(firework) {
        // Create particle container
        firework.particleContainer = new PIXI.Container();
        firework.container.addChild(firework.particleContainer);
        
        // Particle count depends on device capabilities
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 
            30 + Math.floor(Math.random() * 20) : // 30-50 particles for mobile
            50 + Math.floor(Math.random() * 30);  // 50-80 particles for desktop
        
        // Create explosion particles
        for (let i = 0; i < particleCount; i++) {
            // Create particle sprite
            const particle = new PIXI.Graphics();
            particle.beginFill(firework.color, 0.8);
            
            // Different shapes for particles
            const shapeType = Math.floor(Math.random() * 3);
            if (shapeType === 0) {
                particle.drawCircle(0, 0, 1 + Math.random() * 2);
            } else if (shapeType === 1) {
                this.drawStar(particle, 0, 0, 4, 2 + Math.random() * 1, 1 + Math.random() * 0.5);
            } else {
                this.drawRegularPolygon(particle, 0, 0, 2 + Math.random() * 1, 3 + Math.floor(Math.random() * 3));
            }
            
            particle.endFill();
            
            const particleObj = {
                x: firework.x,
                y: firework.y,
                sprite: particle,
                alpha: 1
            };
            
            // Set random velocity for the particle
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particleObj.vx = Math.cos(angle) * speed;
            particleObj.vy = Math.sin(angle) * speed;
            
            // Add to container
            firework.particleContainer.addChild(particle);
            firework.particles.push(particleObj);
        }
    },
    
    // Clear all fireworks
    clearFireworks: function() {
        if (gameState.fireworksAnimation) {
            // Clean up all fireworks
            for (const firework of gameState.fireworksAnimation.fireworks) {
                if (firework.container) {
                    // First, handle the rocket if it exists (it might have been destroyed already)
                    if (firework.rocket && !firework.rocket.destroyed) {
                        firework.container.removeChild(firework.rocket);
                        firework.rocket.destroy({ children: true });
                        firework.rocket = null;
                    }
                    
                    // Clean up particle container and its children
                    if (firework.particleContainer && !firework.particleContainer.destroyed) {
                        // Remove and destroy all particle sprites first
                        for (const particle of firework.particles) {
                            if (particle.sprite && !particle.sprite.destroyed) {
                                firework.particleContainer.removeChild(particle.sprite);
                                particle.sprite.destroy({ children: true });
                                particle.sprite = null;
                            }
                        }
                        
                        // Now remove the particle container from its parent
                        firework.container.removeChild(firework.particleContainer);
                        firework.particleContainer.destroy({ children: false }); // Children already destroyed
                        firework.particleContainer = null;
                    }
                    
                    // Clear particle array
                    if (firework.particles) {
                        firework.particles.length = 0;
                    }
                    
                    // Clean up trail container and its children
                    if (firework.trailContainer && !firework.trailContainer.destroyed) {
                        // Properly handle all trail particles
                        for (let i = firework.trailContainer.children.length - 1; i >= 0; i--) {
                            const trail = firework.trailContainer.children[i];
                            if (trail && !trail.destroyed) {
                                firework.trailContainer.removeChild(trail);
                                trail.destroy({ children: true });
                            }
                        }
                        
                        // Now destroy the trail container itself
                        firework.container.removeChild(firework.trailContainer);
                        firework.trailContainer.destroy({ children: false }); // Children already destroyed
                        firework.trailContainer = null;
                    }
                    
                    // Finally, destroy the main container
                    if (!firework.container.destroyed) {
                        this.fireworksContainer.removeChild(firework.container);
                        firework.container.destroy({ children: false }); // Children already destroyed
                        firework.container = null;
                    }
                }
            }
            
            // Clear fireworks array
            gameState.fireworksAnimation.fireworks.length = 0;
            gameState.fireworksAnimation.active = false;
        }
        
        // Make sure the fireworks container is empty
        if (this.fireworksContainer) {
            this.fireworksContainer.removeChildren();
        }
    }
};