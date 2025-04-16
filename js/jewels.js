/**
 * GeoJewels - Jewels Module
 * Handles all jewel and column mechanics
 */

// Jewels namespace
const Jewels = {
    // Generate a set of random jewels for the next column
    generateNextJewels: function() {
        const jewels = [];
        for (let i = 0; i < COLUMN_SIZE; i++) {
            jewels.push(Math.floor(Math.random() * JEWEL_TYPES));
        }
        return jewels;
    },

    // Create a new falling column with random jewel types
    spawnNewColumn: function() {
        // If already animating or column is locked, don't try to spawn again
        if (gameState.animatingMatches || gameState.columnLock) {
            return;
        }
        
        // Don't spawn if we already have an active column
        if (gameState.currentColumn) {
            return;
        }
        
        // Check if the spawn area is already occupied (game over condition)
        for (let i = 0; i < COLUMN_SIZE; i++) {
            if (gameState.board[i][Math.floor(GRID_WIDTH / 2)] !== null) {
                Game.gameOver();
                return;
            }
        }
        
        // Lock the column spawn
        gameState.columnLock = true;
        
        // Create the new column
        const column = {
            x: Math.floor(GRID_WIDTH / 2),
            y: 0,
            jewels: []
        };
        
        // Use pre-generated jewels if available, or generate new ones
        if (gameState.nextJewels) {
            column.jewels = [...gameState.nextJewels]; // Use a copy of the pre-generated jewels
        } else {
            // Generate random jewel types for the column (first time only)
            for (let i = 0; i < COLUMN_SIZE; i++) {
                column.jewels.push(Math.floor(Math.random() * JEWEL_TYPES));
            }
        }
        
        // Generate jewels for the next column
        gameState.nextJewels = this.generateNextJewels();
        
        gameState.currentColumn = column;
        gameState.lastFallTime = Date.now();
        gameState.fastFall = false;
        
        // Update the visual representation
        Renderer.renderActiveColumn();
        
        // Unlock the column spawn
        gameState.columnLock = false;
    },

    // Move the current column left or right
    moveColumn: function(direction) {
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
        Sounds.play('move');
        Renderer.renderActiveColumn();
    },

    // Rotate the jewels in the current column
    rotateColumn: function() {
        if (gameState.status !== 'playing' || !gameState.currentColumn) return;
        
        // Rotate the jewels (move the first jewel to the end)
        const firstJewel = gameState.currentColumn.jewels.shift();
        gameState.currentColumn.jewels.push(firstJewel);
        
        Sounds.play('rotate');
        Renderer.renderActiveColumn();
    },

    // Make the column fall faster when down key is pressed
    setFastFall: function(fast) {
        // Don't allow fast fall during animation
        if (gameState.animatingMatches || gameState.status !== 'playing') {
            gameState.fastFall = false;
            return;
        }
        
        gameState.fastFall = fast;
    },

    // Move the current column down by one cell
    fallOneStep: function() {
        if (gameState.status !== 'playing' || !gameState.currentColumn) return false;
        
        const newY = gameState.currentColumn.y + 1;
        
        // Check if the column has reached the bottom or collided with placed jewels
        if (Board.hasCollision(gameState.currentColumn.x, newY)) {
            Board.placeColumn();
            return true; // Column was placed
        }
        
        // Move the column down
        gameState.currentColumn.y = newY;
        Renderer.renderActiveColumn();
        return false; // Column continues falling
    },

    // Create a jewel graphics object based on type
    createJewel: function(type) {
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
                Renderer.drawRegularPolygon(jewel, center, center, radius, 3, Math.PI / 2);
                
                // Fill with main color
                jewel.beginFill(colors[type], 0.8);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.95, 3, Math.PI / 2);
                jewel.endFill();
                
                // Inner design
                jewel.beginFill(accentColors[type], 0.6);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.6, 3, Math.PI / 2);
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
                Renderer.drawRegularPolygon(jewel, center, center, radius, 5, -Math.PI / 2);
                
                // Main pentagon fill
                jewel.beginFill(colors[type], 0.8);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.95, 5, -Math.PI / 2);
                jewel.endFill();
                
                // Star pattern inside
                jewel.beginFill(accentColors[type], 0.7);
                Renderer.drawStar(jewel, center, center, 5, radius * 0.9, radius * 0.45, -Math.PI / 2);
                jewel.endFill();
                
                // Center circle
                jewel.beginFill(colors[type], 0.9);
                jewel.drawCircle(center, center, radius * 0.2);
                jewel.endFill();
                break;
                
            case 3: // Intricate Hexagon (honeycomb-like)
                // Outer hexagon outline
                jewel.lineStyle(2, accentColors[type], 1);
                Renderer.drawRegularPolygon(jewel, center, center, radius, 6, 0);
                
                // Main hexagon fill
                jewel.beginFill(colors[type], 0.8);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.95, 6, 0);
                jewel.endFill();
                
                // Inner hexagon
                jewel.beginFill(accentColors[type], 0.6);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.7, 6, 0);
                jewel.endFill();
                
                // Smallest hexagon
                jewel.beginFill(colors[type], 0.9);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.4, 6, 0);
                jewel.endFill();
                
                // Center dot
                jewel.beginFill(accentColors[type], 0.9);
                jewel.drawCircle(center, center, radius * 0.15);
                jewel.endFill();
                break;
                
            case 4: // Intricate Octagon (flower-like)
                // Outer octagon outline
                jewel.lineStyle(2, accentColors[type], 1);
                Renderer.drawRegularPolygon(jewel, center, center, radius, 8, 0);
                
                // Main octagon fill
                jewel.beginFill(colors[type], 0.8);
                Renderer.drawRegularPolygon(jewel, center, center, radius * 0.95, 8, 0);
                jewel.endFill();
                
                // Flower pattern inside
                jewel.beginFill(accentColors[type], 0.7);
                Renderer.drawFlower(jewel, center, center, 8, radius * 0.7, radius * 0.4);
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
};