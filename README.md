# Math Blaster - Spaceship Edition

A fun and engaging math game combined with an interactive spaceship defense game! Practice your arithmetic skills while defending your spaceship from enemy attacks.

## 🚀 Features

### Interactive Spaceship Game
- **Arrow Key Controls**: Move your spaceship left and right
- **Enemy Defense**: Fight off enemy ships with different shield strengths
- **Visual Effects**: Explosions, particles, and shield bubbles
- **Level Progression**: Increasingly difficult levels with more enemies

### Math-Powered Ammunition
- **Math Mode**: Press SPACE to enter math mode and earn ammunition
- **Multiple Difficulty Levels**: Easy, Medium, Hard, and Expert math problems
- **Quality Ammunition**: Higher difficulty problems give more powerful ammo
- **Real-time Feedback**: Instant feedback on correct/incorrect answers

### Game Mechanics
- **Shield System**: Enemy ships have visible shield bubbles that must be destroyed
- **Ammunition Management**: Limited ammo that must be replenished through math
- **Collision Detection**: Precise hit detection between bullets and enemies
- **Score Tracking**: Points for destroying enemies and completing levels

## 🎮 How to Play

### Spaceship Mode
1. Use **Arrow Keys** to move your spaceship left and right
2. Press **ENTER** to shoot at enemy ships
3. Destroy enemy shields to make them flee
4. Complete levels by destroying enough enemies

### Math Mode
1. Press **SPACE** to enter math mode when you need ammunition
2. Select difficulty level (affects ammo quality)
3. Solve math problems to earn ammunition
4. Higher difficulty = more powerful ammunition

### Controls
- **Arrow Keys**: Move spaceship
- **SPACE**: Enter math mode for ammunition
- **ENTER**: Shoot (in spaceship mode) / Submit answer (in math mode)

## 🚀 Getting Started

### Option 1: Full Game with User Accounts (Recommended)
```bash
python start_servers.py
```
This will start both the web server and API server, then open the game ian your browser.

### Option 2: Web Browser Only (No User Accounts)
```bash
python server.py
```
This will start just the web server without user persistence.

### Option 3: Original Python Version
```bash
python main.py
```
Play the original command-line math game.

## 👤 User Account System

### Features
- **Persistent Progress**: Your ammunition banks and game stats are saved automatically
- **Multiple Users**: Each player can have their own account and progress
- **Secure Storage**: Passwords are hashed and stored securely
- **Auto-Save**: Progress is saved automatically as you play

### How to Use
1. **First Time**: Click "Register" to create a new account
2. **Returning**: Click "Login" to access your saved progress
3. **Logout**: Click "Logout" to switch accounts or play as guest

### Data Storage
- User data is stored in `user_data/users.json` (configurable)
- Ammunition banks and game statistics are preserved between sessions
- Each user has their own isolated progress
- Math problem logs are stored in `logs/math_problems.jsonl` (configurable)

## 🎯 Game Modes

### Math Difficulty Levels
- **Easy (1-10)**: Basic green ammunition
- **Medium (1-50)**: Yellow ammunition (2x damage)
- **Hard (1-100)**: Orange ammunition (3x damage)  
- **Expert (1-500)**: Red ammunition (5x damage)

### Enemy Types
- **Small Ships**: 2 shield points, fast movement
- **Medium Ships**: 3 shield points, medium speed
- **Large Ships**: 5 shield points, slow but dangerous

## 🏆 Scoring System

- **Enemy Destruction**: 100 points per enemy
- **Level Completion**: Progress to next level
- **Math Accuracy**: Better accuracy = better ammunition quality
- **Speed Bonus**: Faster math answers = more ammunition

## ⚙️ Configuration

The application supports configurable file paths for shared data storage across multiple instances.

### File Path Configuration

Edit `config.json` to customize where data files are stored:

```json
{
    "file_paths": {
        "user_data_dir": "/shared/path/user_data",
        "logs_dir": "/shared/path/logs"
    }
}
```

### Shared Data Setup

To run multiple instances with shared data:

1. **Create shared directories**:
   ```bash
   mkdir -p /shared/path/user_data
   mkdir -p /shared/path/logs
   ```

2. **Update config.json**:
   ```json
   {
       "file_paths": {
           "user_data_dir": "/shared/path/user_data",
           "logs_dir": "/shared/path/logs"
       }
   }
   ```

3. **Start multiple instances** - they will all use the same data files

### Default Paths
- User data: `user_data/` (relative to app directory)
- Logs: `logs/` (relative to app directory)

## 🛠️ Technical Details

- **Frontend**: HTML5 Canvas with JavaScript
- **Backend**: Python server for local hosting
- **Math Engine**: JavaScript-based problem generation
- **Graphics**: Custom 2D rendering with particle effects

## 📁 File Structure

```
math_blaster/
├── index.html          # Main game interface
├── spaceship_game.js   # Game logic and mechanics
├── server.py          # Python web server
├── main.py            # Original Python math game
├── math_game.py       # Python math game logic
└── README.md          # This file
```

## 🎨 Visual Features

- **Retro Sci-Fi Theme**: Green terminal-style graphics
- **Particle Effects**: Explosions and visual feedback
- **Shield Bubbles**: Visual representation of enemy defenses
- **Ammunition Display**: Color-coded ammo types
- **Level Progression**: Visual level-up notifications

## 🧮 Educational Benefits

- **Math Practice**: Reinforces arithmetic skills
- **Strategic Thinking**: Ammunition management requires planning
- **Hand-Eye Coordination**: Spaceship movement and shooting
- **Problem Solving**: Balancing math practice with game progression

Have fun defending your spaceship with math! 🚀✨
