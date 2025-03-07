# F1 Monaco Racing Game

A Formula 1 racing game inspired by the Monaco Grand Prix circuit, built with Three.js, JavaScript, and CSS.

## Features

- Monaco-inspired racing circuit with hairpin turns and challenging corners
- Formula 1 style cars with realistic 3D models
- Race start countdown sequence
- Multiple AI competitors with varying speeds and performance
- Realistic racing controls (acceleration, braking, steering)
- Collision detection between cars
- Score tracking based on race progress
- Game over state when collisions occur
- Dynamic camera that follows the player's car
- Monaco-style environment with buildings alongside the track
- Responsive design that adapts to window size

## How to Run

1. Clone or download this repository
2. Open `index.html` in your web browser
3. No build steps required! (Three.js is loaded from CDN)

## How to Play

- Use the **Arrow Keys** to control your car:
  - **Up Arrow**: Accelerate
  - **Down Arrow**: Brake/Reverse
  - **Left/Right Arrows**: Steer
- Wait for the countdown to complete before the race starts
- Navigate the Monaco-inspired circuit, avoiding collisions with other cars
- Your score increases as you progress through the race
- When you crash, click the "Race Again" button to restart

## Game Components

- **HTML**: Basic structure with Three.js canvas and overlays
- **CSS**: Styling for the game elements and overlays
- **JavaScript**: 3D game logic using Three.js including:
  - Monaco-inspired track creation using curve-based geometry
  - Formula 1 car models with detailed components
  - Race start sequence with countdown
  - AI competitor behavior along the track
  - Camera following player with realistic perspective
  - 3D collision detection
  - Racing physics and controls

## Technical Details

- **Three.js**: Used for 3D rendering and scene management
- **Curve-based Track**: Track created using CatmullRomCurve3 for smooth corners
- **WebGL**: Underlying technology for hardware-accelerated graphics
- **Responsive Design**: Adapts to different screen sizes
- **Object-Oriented Approach**: Modular code structure for game entities

## Browser Compatibility

This game works best in modern browsers that support WebGL:
- Chrome
- Firefox
- Safari
- Edge

## License

Feel free to use and modify this code for your own projects! 