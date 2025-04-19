/**
 * GeoJewels - Input Module
 * Handles user input for game controls
 */

// Input namespace
const Input = {
    // Flag to track if mobile controls are active
    isMobileControlsActive: false,
    
    // Layout configuration
    layoutConfig: {
        controlsHeight: {
            portrait: 90,
            landscape: 70
        },
        buttonSize: {
            portrait: 60,
            landscape: 50  
        },
        minButtonSpacing: 10
    },
    
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
        
        // Set up all touch controls and layout
        this.setupTouchControls();
        
        // Add resize handler to update layout
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial layout adjustment
        this.handleResize();
    },
    
    // Set up touch controls for devices that support them
    setupTouchControls: function() {
        // Check if touch is supported using feature detection
        this.isMobileControlsActive = this.isTouchSupported();
        
        // If touch isn't supported, don't set up mobile controls
        if (!this.isMobileControlsActive) {
            document.getElementById('mobile-controls').style.display = 'none';
            return;
        }
        
        // Get control elements
        const leftButton = document.getElementById('mobile-left');
        const rightButton = document.getElementById('mobile-right');
        const rotateButton = document.getElementById('mobile-rotate');
        const downButton = document.getElementById('mobile-down');
        
        // Left button - move column left
        this.setupTouchButton(leftButton, 
            () => Jewels.moveColumn(-1), 
            null,
            'Control button: move left');
        
        // Right button - move column right
        this.setupTouchButton(rightButton, 
            () => Jewels.moveColumn(1), 
            null,
            'Control button: move right');
        
        // Rotate button - rotate column
        this.setupTouchButton(rotateButton, 
            () => Jewels.rotateColumn(), 
            null,
            'Control button: rotate');
        
        // Down button - toggle fast fall
        this.setupTouchButton(downButton, 
            () => Jewels.setFastFall(true),  // touchstart
            () => Jewels.setFastFall(false), // touchend/cancel
            'Control button: fast fall');

        // Show controls
        document.getElementById('mobile-controls').style.display = 'flex';
        
        // Prevent default behaviors
        this.preventDefaultBehaviors();
    },
    
    // Helper to set up a touch button with proper event handling
    setupTouchButton: function(button, startAction, endAction, ariaLabel) {
        if (!button) return;
        
        // Add accessibility label
        if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
        
        // Add touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState.status === 'playing' && startAction) {
                startAction();
            }
        });
        
        // Only add touch end events if we have an end action
        if (endAction) {
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (gameState.status === 'playing') {
                    endAction();
                }
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                if (gameState.status === 'playing') {
                    endAction();
                }
            });
            
            button.addEventListener('touchleave', (e) => {
                e.preventDefault();
                if (gameState.status === 'playing') {
                    endAction();
                }
            });
        }
        
        // Also add mouse events for desktop testing
        button.addEventListener('mousedown', () => {
            if (gameState.status === 'playing' && startAction) {
                startAction();
            }
        });
        
        if (endAction) {
            button.addEventListener('mouseup', () => {
                if (gameState.status === 'playing') {
                    endAction();
                }
            });
            
            button.addEventListener('mouseleave', () => {
                if (gameState.status === 'playing') {
                    endAction();
                }
            });
        }
    },
    
    // Use feature detection to reliably check for touch support
    isTouchSupported: function() {
        return (
            ('ontouchstart' in window) || 
            (navigator.maxTouchPoints > 0) || 
            (navigator.msMaxTouchPoints > 0)
        );
    },
    
    // Handle window resize events
    handleResize: function() {
        // Skip if mobile controls aren't active
        if (!this.isMobileControlsActive) {
            this.setDesktopLayout();
            return;
        }

        // Determine orientation based on window dimensions
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Apply appropriate layout
        this.updateMobileLayout(isLandscape);
        
        // Force a canvas resize to update game rendering
        if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
            Renderer.resizeCanvas();
        }
    },
    
    // Update mobile layout based on orientation
    updateMobileLayout: function(isLandscape) {
        const mobileControls = document.getElementById('mobile-controls');
        const buttons = document.querySelectorAll('.control-button');
        
        // Set controls height based on orientation
        const controlsHeight = isLandscape ? 
            this.layoutConfig.controlsHeight.landscape : 
            this.layoutConfig.controlsHeight.portrait;
        
        // Set button size based on orientation
        const buttonSize = isLandscape ? 
            this.layoutConfig.buttonSize.landscape : 
            this.layoutConfig.buttonSize.portrait;
        
        // Apply controls height
        if (mobileControls) {
            mobileControls.style.height = `${controlsHeight}px`;
        }
        
        // Apply button sizes
        buttons.forEach(button => {
            button.style.width = `${buttonSize}px`;
            button.style.height = `${buttonSize}px`;
        });
        
        // Adjust the game area height to account for controls
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.style.height = `calc(100vh - ${controlsHeight}px)`;
        }
        
        // Update the button area height to match
        const buttonArea = document.querySelector('.button-area');
        if (buttonArea) {
            buttonArea.style.height = `${controlsHeight}px`;
        }
    },
    
    // Set desktop layout (no mobile controls)
    setDesktopLayout: function() {
        // Hide mobile controls
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.display = 'none';
        }
        
        // Give game area full height
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.style.height = '100vh';
        }
        
        // Remove button area height
        const buttonArea = document.querySelector('.button-area');
        if (buttonArea) {
            buttonArea.style.height = '0';
        }
    },
    
    // Prevent default browser behaviors
    preventDefaultBehaviors: function() {
        // Prevent scrolling when touching game elements
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
        
        // Prevent pinch zoom on game container
        document.getElementById('game-container').addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
    },
    
    // Clean up event handlers (called when game is destroyed)
    cleanup: function() {
        // Any specific cleanup needed
    }
};