/**
 * GeoJewels - Sounds Module
 * Handles audio playback and management
 */

// Sounds namespace
const Sounds = {
    // Sound effects
    sounds: {
        move: null,
        rotate: null,
        match: null,
        place: null,
        gameOver: null,
        bgMusic: null
    },

    // Audio settings
    settings: {
        musicEnabled: true,
        soundEffectsEnabled: true
    },
    
    // Audio system status
    audioContext: null,
    audioInitialized: false,
    // Track pending sound operations
    pendingSounds: {},

    // Initialize all sound effects
    initialize: function() {
        // Configure sounds with proper settings
        this.sounds = {
            move: new Howl({ 
                src: ['assets/audio/move.mp3'],
                volume: 0.5,
                preload: true,
                onloaderror: () => console.log("Warning: move sound not found")
            }),
            rotate: new Howl({ 
                src: ['assets/audio/rotate.mp3'],
                volume: 0.5,
                preload: true,
                onloaderror: () => console.log("Warning: rotate sound not found")
            }),
            match: new Howl({ 
                src: ['assets/audio/match.mp3'],
                volume: 0.7,
                preload: true,
                onloaderror: () => console.log("Warning: match sound not found")
            }),
            place: new Howl({ 
                // Use the more reliable 'rotate' sound for now (as a test)
                // This helps us determine if it's a file issue or a timing issue
                src: ['assets/audio/rotate.mp3'], 
                volume: 0.5,
                preload: true,
                onloaderror: () => console.log("Warning: place sound not found")
            }),
            gameOver: new Howl({ 
                src: ['assets/audio/gameover.mp3'],
                volume: 0.8,
                preload: true,
                onloaderror: () => console.log("Warning: game over sound not found")
            }),
            bgMusic: new Howl({
                src: ['assets/audio/bgmusic.mp3'],
                loop: true,
                volume: 0.3,
                html5: true, // Keep music as HTML5 since it's long-playing
                preload: true,
                onloaderror: () => console.log("Warning: background music not found")
            })
        };
        
        // Load saved settings from local storage if available
        this.loadSettings();
        
        // Initialize checkbox states
        this.initializeUIElements();
    },
    
    // Initialize UI elements based on settings
    initializeUIElements: function() {
        const musicToggle = document.getElementById('music-toggle');
        const soundEffectsToggle = document.getElementById('sound-effects-toggle');
        
        if (musicToggle && soundEffectsToggle) {
            // Set checkboxes to match current settings
            musicToggle.checked = this.settings.musicEnabled;
            soundEffectsToggle.checked = this.settings.soundEffectsEnabled;
            
            // Add event listeners to checkboxes
            musicToggle.addEventListener('change', () => {
                this.settings.musicEnabled = musicToggle.checked;
                this.saveSettings();
                
                // If music is playing and gets disabled, stop it
                if (!this.settings.musicEnabled) {
                    this.stop('bgMusic');
                }
            });
            
            soundEffectsToggle.addEventListener('change', () => {
                this.settings.soundEffectsEnabled = soundEffectsToggle.checked;
                this.saveSettings();
            });
        }
    },
    
    // Save settings to local storage
    saveSettings: function() {
        try {
            localStorage.setItem('geoJewelsAudioSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Failed to save audio settings to localStorage');
        }
    },
    
    // Load settings from local storage
    loadSettings: function() {
        try {
            const savedSettings = localStorage.getItem('geoJewelsAudioSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
            }
        } catch (e) {
            console.log('Failed to load audio settings from localStorage');
        }
    },

    // Helper function to safely play sounds
    play: function(soundName) {
        try {
            // Only play if the sound exists
            if (!this.sounds[soundName]) return;
            
            // Check if this is background music or a sound effect
            if (soundName === 'bgMusic') {
                // Only play music if music is enabled
                if (this.settings.musicEnabled) {
                    this.sounds[soundName].play();
                }
            } else {
                // Only play sound effects if sound effects are enabled
                if (this.settings.soundEffectsEnabled) {
                    // Clear any pending timeout for this sound
                    if (this.pendingSounds[soundName]) {
                        clearTimeout(this.pendingSounds[soundName]);
                        this.pendingSounds[soundName] = null;
                    }
                    
                    // Special handling for "place" sound which needs more careful handling
                    if (soundName === 'place') {
                        // Schedule the sound with a smaller delay to ensure it plays at the right time
                        this.pendingSounds[soundName] = setTimeout(() => {
                            // Ensure fully stopped before playing again
                            this.sounds[soundName].stop();
                            
                            // Minimal delay to ensure the audio system is ready
                            setTimeout(() => {
                                const id = this.sounds[soundName].play();
                                // Set volume explicitly to ensure it plays audibly
                                this.sounds[soundName].volume(0.5, id);
                                this.pendingSounds[soundName] = null;
                            }, 5);
                        }, 15); // Reduced from 50ms to 15ms
                    } else {
                        // For other sounds, use standard approach but still stop before playing
                        // to ensure clean playback
                        this.sounds[soundName].stop();
                        this.sounds[soundName].play();
                    }
                }
            }
        } catch (e) {
            console.log(`Error playing sound: ${soundName}`, e);
        }
    },

    // Stop a specific sound
    stop: function(soundName) {
        try {
            // Cancel any pending play operations for this sound
            if (this.pendingSounds[soundName]) {
                clearTimeout(this.pendingSounds[soundName]);
                this.pendingSounds[soundName] = null;
            }
            
            if (this.sounds[soundName]) {
                this.sounds[soundName].stop();
            }
        } catch (e) {
            console.log(`Error stopping sound: ${soundName}`, e);
        }
    },
    
    // Feature detection for mobile device based on touch capabilities
    isMobileDevice: function() {
        return (('ontouchstart' in window) || 
                (navigator.maxTouchPoints > 0) || 
                (navigator.msMaxTouchPoints > 0));
    }
};