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

    // Initialize all sound effects
    initialize: function() {
        this.sounds = {
            move: new Howl({ 
                src: ['assets/audio/move.mp3'],
                html5: true,
                volume: 0.5,
                onloaderror: () => console.log("Warning: move sound not found")
            }),
            rotate: new Howl({ 
                src: ['assets/audio/rotate.mp3'],
                html5: true,
                volume: 0.5,
                onloaderror: () => console.log("Warning: rotate sound not found")
            }),
            match: new Howl({ 
                src: ['assets/audio/match.mp3'],
                html5: true,
                volume: 0.7,
                onloaderror: () => console.log("Warning: match sound not found")
            }),
            place: new Howl({ 
                src: ['assets/audio/place.mp3'],
                html5: true,
                volume: 0.5,
                onloaderror: () => console.log("Warning: place sound not found")
            }),
            gameOver: new Howl({ 
                src: ['assets/audio/gameover.mp3'],
                html5: true,
                volume: 0.8,
                onloaderror: () => console.log("Warning: game over sound not found")
            }),
            bgMusic: new Howl({
                src: ['assets/audio/bgmusic.mp3'],
                loop: true,
                volume: 0.3,
                html5: true,
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
                    this.sounds[soundName].play();
                }
            }
        } catch (e) {
            console.log(`Error playing sound: ${soundName}`);
        }
    },

    // Stop a specific sound
    stop: function(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].stop();
            }
        } catch (e) {
            console.log(`Error stopping sound: ${soundName}`);
        }
    }
};