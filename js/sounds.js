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
    },

    // Helper function to safely play sounds
    play: function(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].play();
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