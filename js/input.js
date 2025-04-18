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
        
        // Fast fall button - improve handling for this specific button
        const downButton = document.getElementById('mobile-down');
        
        // On touchstart, enable fast fall
        downButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.setFastFall(true);
            }
        });
        
        // On touchend, disable fast fall
        downButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.setFastFall(false);
            }
        });
        
        // Also handle touchcancel (occurs when touch is interrupted)
        downButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing') {
                Jewels.setFastFall(false);
            }
        });
        
        // Handle touchleave as well (for completeness)
        downButton.addEventListener('touchleave', (e) => {
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
        
        downButton.addEventListener('mouseleave', () => {
            if (gameState.status === 'playing') {
                Jewels.setFastFall(false);
            }
        });
    },
    
    // Clean up event handlers
    cleanup: function() {
        if (this.eventHandlers) {
            this.eventHandlers.forEach(({ element, events }) => {
                events.forEach(({ type, handler }) => {
                    element.removeEventListener(type, handler);
                });
            });
            this.eventHandlers = [];
        }
    },
    
    // Detect if the user is on a mobile device
    detectMobileDevice: function() {
        // Check for actual mobile device using user agent
        const isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for small screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        // Controls should only be shown for actual mobile devices, not just small desktop windows
        if (isTouchDevice) {
            const gameContainer = document.getElementById('game-container');
            
            // Set mobile controls to display flex
            document.getElementById('mobile-controls').style.display = 'flex';
            
            // Additional adjustments based on screen orientation
            this.handleOrientation();
            
            // Listen for orientation changes
            window.addEventListener('resize', () => this.handleOrientation());
        } else if (isSmallScreen) {
            // For desktop at lower resolutions, just handle the scaling
            this.handleLowResolutionDesktop();
            
            // Listen for resize events on desktop
            window.addEventListener('resize', () => this.handleLowResolutionDesktop());
        }
    },
    
    // Handle desktop at lower resolutions
    handleLowResolutionDesktop: function() {
        const gameContainer = document.getElementById('game-container');
        
        // Make sure the mobile controls are hidden on desktop
        document.getElementById('mobile-controls').style.display = 'none';
        
        // Force game renderer to resize
        if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
            Renderer.resizeCanvas();
        }
    },
    
    // Handle screen orientation changes
    handleOrientation: function() {
        const gameContainer = document.getElementById('game-container');
        const mobileControls = document.getElementById('mobile-controls');
        const mobileWrapper = document.querySelector('.mobile-wrapper');
        
        // Calculate available height with additional buffer for virtual buttons
        const controlsHeight = mobileControls.offsetHeight;
        const standardBufferZone = 30; // Reduced buffer zone for cleaner look
        
        // Calculate available game area height
        const availableHeight = window.innerHeight - controlsHeight - standardBufferZone;
        
        // Update game container size
        gameContainer.style.height = `${availableHeight}px`;
        
        // Enable pointer events on mobile controls
        mobileControls.style.pointerEvents = 'auto';
        
        // Update wrapper height to make sure it covers the entire viewport
        mobileWrapper.style.pointerEvents = 'none';
        
        // Position the game container with appropriate space from the bottom
        // This creates a natural gap without adding any additional elements
        mobileWrapper.style.paddingBottom = `${controlsHeight + standardBufferZone}px`;
        
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