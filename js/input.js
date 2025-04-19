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
    
    // Detect if the user is on a mobile device and set up controls accordingly
    detectMobileDevice: function() {
        // Check for actual mobile device using user agent
        const isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Get control elements
        const mobileControls = document.getElementById('mobile-controls');
        
        if (isTouchDevice) {
            // Set up mobile device with controls
            this.isMobileDevice = true;
            
            // Show controls - they'll automatically go in the reserved 100px space
            mobileControls.style.display = 'flex';
            
            // Force immediate layout update
            this.handleOrientation();
            
            // Listen for orientation changes specifically
            window.addEventListener('orientationchange', () => {
                // Need slight delay after orientation change to get accurate dimensions
                setTimeout(() => {
                    this.handleOrientation();
                }, 250);
            });
        } else {
            // Desktop mode - no controls needed
            this.isMobileDevice = false;
            mobileControls.style.display = 'none';
            
            // Force layout update for desktop
            this.handleDesktopLayout();
        }
    },
    
    // Handle screen orientation changes
    handleOrientation: function() {
        if (!this.isMobileDevice) return;
        
        const isLandscape = window.innerWidth > window.innerHeight;
        const mobileControls = document.getElementById('mobile-controls');
        const buttonArea = document.querySelector('.button-area');
        
        // Adjust control sizes based on orientation
        if (isLandscape) {
            // Landscape mode - smaller controls
            if (mobileControls) mobileControls.style.height = '80px';
            if (buttonArea) buttonArea.style.height = '80px';
            
            // Make control buttons smaller in landscape
            document.querySelectorAll('.control-button').forEach(button => {
                button.style.width = '50px';
                button.style.height = '50px';
            });
        } else {
            // Portrait mode - standard controls
            if (mobileControls) mobileControls.style.height = '90px';
            if (buttonArea) buttonArea.style.height = '100px';
            
            // Reset control buttons to normal size in portrait
            document.querySelectorAll('.control-button').forEach(button => {
                button.style.width = '60px';
                button.style.height = '60px';
            });
        }
        
        // Force canvas resize after layout changes
        if (typeof Renderer !== 'undefined' && Renderer.resizeCanvas) {
            Renderer.resizeCanvas();
        }
    },
    
    // Handle desktop layout
    handleDesktopLayout: function() {
        const buttonArea = document.querySelector('.button-area');
        const gameArea = document.querySelector('.game-area');
        
        // Remove button area height on desktop
        if (buttonArea) buttonArea.style.height = '0';
        
        // Give game area full height on desktop
        if (gameArea) gameArea.style.height = '100vh';
        
        // Force canvas resize for desktop layout
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