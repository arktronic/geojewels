/**
 * GeoJewels - Board Module
 * Manages the game board representation and cell state
 */

// Board namespace
const Board = {
    // Board initialization
    initialize: function() {
        gameState.board = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                row.push(null); // null means empty cell
            }
            gameState.board.push(row);
        }
    },

    // Check if the column would collide at the given position
    hasCollision: function(x, y) {
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
    },

    // Place the current column on the board
    placeColumn: function() {
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
        
        Sounds.play('place');
        
        // Clear the active column container immediately
        Renderer.clearActiveColumn();
        gameState.currentColumn = null;
        
        // Render the board with the newly placed column
        Renderer.renderBoard();
        
        // Check for matches
        if (Matching.processMatches()) {
            // If matches were found, animations will handle spawning the next column
            return;
        }
        
        // If no matches, spawn a new column
        Jewels.spawnNewColumn();
    },

    // Apply gravity to make jewels fall into empty spaces
    applyGravity: function() {
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
            Renderer.renderBoard();
        }
        
        return jewelsDropped;
    }
};