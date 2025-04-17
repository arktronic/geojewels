/**
 * GeoJewels - Input Module
 * Handles user input for game controls
 */

// Input namespace
const Input = {
    // Set up keyboard input handlers
    setupHandlers: function() {
        // Begin game button
        document.getElementById('begin-button').addEventListener('click', () => Game.startGame());
        
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            if (gameState.status !== 'playing') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    Jewels.moveColumn(-1);
                    break;
                case 'ArrowRight':
                    Jewels.moveColumn(1);
                    break;
                case 'ArrowUp':
                    Jewels.rotateColumn();
                    break;
                case 'ArrowDown':
                    Jewels.setFastFall(true);
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowDown') {
                Jewels.setFastFall(false);
            }
        });
        
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => Game.restartGame());
        
        // Mobile control handlers
        this.setupMobileControls();
        
        // Detect mobile devices and handle responsive layout
        this.detectMobileDevice();
        
        // Prevent unintended browser behaviors on mobile
        this.preventDefaultBehaviors();
    },
    
    // Set up touch controls for mobile
    setupMobileControls: function() {
        // Left button
        const leftButton = document.getElementById('mobile-left');
        leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent default to avoid double actions
            if (gameState.status === 'playing') {
                Jewels.moveColumn(-1);
            }
        });
        
        // Right button
        const rightButton = document.getElementById('mobile-right');
        rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.moveColumn(1);
            }
        });
        
        // Rotate button
        const rotateButton = document.getElementById('mobile-rotate');
        rotateButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.rotateColumn();
            }
        });
        
        // Fast fall button
        const downButton = document.getElementById('mobile-down');
        downButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.setFastFall(true);
            }
        });
        
        downButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.setFastFall(false);
            }
        });
        
        // Add mouse events as fallback for testing on desktop
        leftButton.addEventListener('mousedown', () => {
            if (gameState.status === 'playing') {
                Jewels.moveColumn(-1);
            }
        });
        
        rightButton.addEventListener('mousedown', () => {
            if (gameState.status === 'playing') {
                Jewels.moveColumn(1);
            }
        });
        
        rotateButton.addEventListener('mousedown', () => {
            if (gameState.status === 'playing') {
                Jewels.rotateColumn();
            }
        });
        
        downButton.addEventListener('mousedown', () => {
            if (gameState.status === 'playing') {
                Jewels.setFastFall(true);
            }
        });
        
        downButton.addEventListener('mouseup', () => {
            if (gameState.status === 'playing') {
                Jewels.setFastFall(false);
            }
        });
    },
    
    // Detect if the user is on a mobile device
    detectMobileDevice: function() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                         window.innerWidth <= 768;
        
        // Adjust game container dimensions for mobile
        if (isMobile) {
            const gameContainer = document.getElementById('game-container');
            
            // Set mobile controls to display flex (should also be handled by CSS media query)
            document.getElementById('mobile-controls').style.display = 'flex';
            
            // Additional adjustments if needed based on screen orientation
            this.handleOrientation();
            
            // Listen for orientation changes
            window.addEventListener('resize', () => this.handleOrientation());
        }
    },
    
    // Handle screen orientation changes
    handleOrientation: function() {
        const gameContainer = document.getElementById('game-container');
        const mobileControls = document.getElementById('mobile-controls');
        
        // Calculate available height (screen height minus controls height)
        const controlsHeight = mobileControls.offsetHeight;
        const availableHeight = window.innerHeight - controlsHeight;
        
        // Set game container height
        gameContainer.style.height = `${availableHeight}px`;
        gameContainer.style.marginBottom = `${controlsHeight}px`;
        
        // Force game renderer to resize
        if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
            Renderer.resizeCanvas();
        }
    },
    
    // Prevent default behaviors that can interfere with gameplay
    preventDefaultBehaviors: function() {
        // Prevent page scrolling when touching game elements
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#game-container, #mobile-controls')) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Prevent double-tap zoom
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 300;
            
            if (this.lastTap && (now - this.lastTap) < DOUBLE_TAP_DELAY) {
                e.preventDefault();
            }
            
            this.lastTap = now;
        }, { passive: false });
    }
};