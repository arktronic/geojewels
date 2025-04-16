# GeoJewels Game Architecture Document

## Overview
GeoJewels is a browser-based game inspired by classic puzzle games like Columns and NES Magic Jewelry. The unique selling point of GeoJewels is its use of intricate geometric shapes as game pieces instead of traditional jewels.

## Game Concept
Players control falling columns of geometric jewels, which they can move horizontally and rotate. When three or more jewels of the same shape align (horizontally, vertically, or diagonally), they disappear, and the player scores points. The game continues until the game board fills up with jewels, at which point the game ends.

## MVP Features
1. Basic gameplay mechanics:
   - Falling jewel columns (3 jewels per column)
   - Horizontal movement using left/right arrow keys
   - Rotation of jewel order using up arrow key
   - Accelerated drop using down arrow key
   - Match detection (3+ of the same shape)
   - Score tracking
   - Game over detection

2. Visual elements:
   - Game board
   - Geometric jewel shapes (minimum 5 different shapes)
   - Score display
   - Game over screen
   - Basic animations for jewel matching and disappearing

3. Audio elements:
   - Background music
   - Sound effects for movement, rotation, matching, and game over

## Tech Stack
As specified, the implementation will use minimal technologies:
- HTML5 Canvas for rendering (with graphics library support)
- Vanilla JavaScript for game logic
- Direct CDN imports for any required libraries
- No build systems

### External Libraries (via CDN)
- [Pixi.js](https://pixijs.com/) for 2D graphics rendering
- [Howler.js](https://howlerjs.com/) for audio handling
- No other external dependencies required

## Architecture

### File Structure
```
GeoJewels/
├── index.html         # Main HTML file with embedded CSS
├── game.js            # Complete game implementation
├── assets/
│   ├── audio/         # Sound effects and music
│   └── images/        # Any images needed (minimal)
└── Architecture.md    # This document
```

### Component Details

#### Game Loop
The game will run on a standard request animation frame loop:
1. Update game state
2. Render current state
3. Process user input
4. Repeat

#### Game State
The game state will be maintained in a simple object that tracks:
- Current active column
- Game board state (grid of placed jewels)
- Score
- Game status (playing, paused, game over)

#### Board
The game board will be represented as a 2D array (10x16 grid) storing the state of each cell.

#### Jewels
Jewel shapes will be defined as geometric patterns rendered using Pixi.js:
- Triangle
- Square
- Pentagon
- Hexagon
- Octagon

Each shape will have a distinct color for easy visual identification.

#### Columns
A column consists of 3 jewels that fall together. Players can:
- Move the column left or right
- Rotate the order of jewels in the column
- Accelerate the column's downward movement

#### Input Handling
Keyboard input will be captured and mapped to game actions:
- Left Arrow: Move column left
- Right Arrow: Move column right
- Up Arrow: Rotate jewels in column
- Down Arrow: Accelerate downward movement

#### Collision Detection
The game will check for:
- Collision with walls (left/right boundaries)
- Collision with floor (bottom boundary)
- Collision with placed jewels

#### Matching Algorithm
After a column is placed:
1. Check for matches horizontally, vertically, and diagonally
2. Remove matched jewels
3. Shift jewels down to fill empty spaces
4. Check for new matches created by the shifting process
5. Repeat until no more matches are found

#### Rendering
The game will use Pixi.js (a high-performance 2D WebGL renderer) for rendering all game elements:
- Clear the canvas
- Draw the game board grid
- Draw placed jewels
- Draw the active column
- Draw UI elements (score, etc.)
- Handle animations and transitions

## Implementation Roadmap

### Phase 1: Basic Setup
- Create project structure
- Set up HTML with embedded CSS
- Initialize Pixi.js renderer

### Phase 2: Game Mechanics
- Implement game board
- Create jewel shapes using Pixi.js graphics
- Implement column falling logic
- Add user input handling
- Implement collision detection

### Phase 3: Game Logic
- Implement matching algorithm
- Add scoring system
- Implement game over condition

### Phase 4: Polish
- Add audio with Howler.js
- Add animations using Pixi.js tweening
- Implement UI elements
- Final testing and bug fixes

## Performance Considerations
- Use Pixi.js WebGL rendering for improved performance
- Batch similar drawing operations together
- Use Pixi.js built-in animation system
- Limit audio resources to maintain performance
- Utilize sprite sheet for any graphics

## Future Enhancements (Beyond MVP)
- Difficulty levels (increasing speed)
- Special jewels with unique powers
- Combo system for scoring
- Local high score persistence
- Visual effects for matches and combos
- Responsive design for mobile play
- Touch controls for mobile devices