/**
 * GeoJewels - Sounds Module
 * Handles audio playback and management
 */

// Sounds namespace
const Sounds = {
    // Sound effects
    sounds: {
        rotate: null,
        match: null,
        place: null,
        levelUp: null
    },
    
    // Background music tracks
    bgMusic: {
        tracks: [],
        currentTrackIndex: 0,
        isPlaying: false
    },

    // Audio settings
    settings: {
        musicEnabled: true,
        soundEffectsEnabled: true
    },
    
    // Audio system status
    audioContext: null,
    audioInitialized: false,

    // Initialize all sound effects
    initialize: function() {
        // Configure sounds with proper settings
        this.sounds = {
            rotate: new Howl({ 
                src: ['assets/audio/rotate.mp3'],
                volume: 0.3,
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
                src: ['assets/audio/place.mp3'],
                volume: 0.5,
                preload: true,
                onloaderror: () => console.log("Warning: place sound not found")
            }),
            levelUp: new Howl({
                src: ['assets/audio/levelup.mp3'],
                volume: 0.6,
                preload: true,
                onloaderror: () => console.log("Warning: level up sound not found")
            })
        };
        
        // Initialize background music tracks
        this.initializeBgMusic();
        
        // Load saved settings from local storage if available
        this.loadSettings();
        
        // Initialize checkbox states
        this.initializeUIElements();
    },
    
    // Initialize background music tracks
    initializeBgMusic: function() {
        // Create all 7 background music tracks
        for (let i = 1; i <= 7; i++) {
            const track = new Howl({
                src: [`assets/audio/bgmusic${i}.mp3`],
                volume: 0.3,
                html5: true, // Keep music as HTML5 since it's long-playing
                preload: true,
                onend: () => {
                    // When track ends, play the next one
                    this.playNextTrack();
                },
                onloaderror: () => console.log(`Warning: background music track ${i} not found`)
            });
            this.bgMusic.tracks.push(track);
        }
    },
    
    // Play the current background music track
    playBgMusic: function() {
        if (!this.settings.musicEnabled || this.bgMusic.isPlaying) return;
        
        const currentTrack = this.bgMusic.tracks[this.bgMusic.currentTrackIndex];
        if (currentTrack) {
            this.bgMusic.isPlaying = true;
            currentTrack.play();
        }
    },
    
    // Play the next track in the sequence
    playNextTrack: function() {
        // Stop the current track if it's still playing
        const currentTrack = this.bgMusic.tracks[this.bgMusic.currentTrackIndex];
        if (currentTrack && currentTrack.playing()) {
            currentTrack.stop();
        }
        
        // Move to the next track (with wraparound to the beginning)
        this.bgMusic.currentTrackIndex = (this.bgMusic.currentTrackIndex + 1) % this.bgMusic.tracks.length;
        
        // Only start the next track if music is enabled and we were playing
        if (this.settings.musicEnabled && this.bgMusic.isPlaying) {
            const nextTrack = this.bgMusic.tracks[this.bgMusic.currentTrackIndex];
            if (nextTrack) {
                nextTrack.play();
            }
        }
    },
    
    // Stop all background music
    stopBgMusic: function() {
        // Stop the current track
        const currentTrack = this.bgMusic.tracks[this.bgMusic.currentTrackIndex];
        if (currentTrack) {
            currentTrack.stop();
        }
        this.bgMusic.isPlaying = false;
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
            // Handle special case for background music
            if (soundName === 'bgMusic') {
                this.playBgMusic();
                return;
            }
            
            // Only play if the sound exists
            if (!this.sounds[soundName]) return;
            
            // Only play sound effects if sound effects are enabled
            if (this.settings.soundEffectsEnabled) {
                // On mobile devices, ensure clean playback by stopping previous instances
                if (this.isMobileDevice()) {
                    this.sounds[soundName].stop();
                }
                
                // Play the sound effect
                this.sounds[soundName].play();
            }
        } catch (e) {
            console.log(`Error playing sound: ${soundName}`, e);
        }
    },

    // Stop a specific sound
    stop: function(soundName) {
        try {
            if (soundName === 'bgMusic') {
                this.stopBgMusic();
                return;
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