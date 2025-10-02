# Math Visual Modules - Standalone Launcher

A standalone application that runs the HTML visual modules independently, designed for future integration with the main math mode.

## Features

- **Problem Generation**: Uses existing fact_ladder and mental_math generators
- **Visual Representations**: 
  - Number Line (for addition/subtraction)
  - Area Model (for multiplication)
  - Quotative Division (for division)
- **Interactive Controls**: Show Hint, Animate, Reset buttons
- **Grade-Appropriate**: Adjusts difficulty based on grade levels
- **API Integration**: Connects to existing math problem API

## Quick Start

### Option 1: Use the Launch Script
```bash
./launch_visual_modules.sh
```

### Option 2: Manual Start
1. Start the API server:
   ```bash
   python3 api_server.py
   ```

2. Open `visual_launcher.html` in your web browser

## Usage

1. **Select Problem Type**: Choose from Addition, Subtraction, Multiplication, or Division
2. **Choose Difficulty**: 
   - Easy (Level 1, Grade 1)
   - Medium (Level 3, Grade 3) 
   - Hard (Level 5, Grade 4)
   - Custom (Level 2, Grade 2)
3. **Generate Problem**: Click "🎲 Generate Problem"
4. **Interact with Visual**:
   - **💡 Show Hint**: Displays helpful hints
   - **▶️ Animate**: Animates the visual representation
   - **🔄 Reset**: Resets to original state

## Visual Types

### Number Line
- Used for addition and subtraction problems
- Shows start position, movement, and result
- Animated highlighting of the result point

### Area Model
- Used for multiplication problems
- Shows rectangular grid with dimensions
- Displays area calculation (Length × Width)

### Quotative Division
- Used for division problems
- Shows groups of items with remainder
- Visualizes "how many groups of X can be made"

## Technical Details

### Files Created
- `visual_launcher.html` - Main interface
- `visual_controller.js` - JavaScript controller
- `launch_visual_modules.sh` - Startup script

### API Integration
- Uses existing `/api/generate_math_problem` endpoint
- Supports fact_ladder and mental_math generators
- Grade-aware problem generation (G1-G5_6)

### Future Integration
The standalone launcher is designed to be easily integrated into the main math mode:
- `VisualController` class can be imported
- Problem generation uses existing API
- Visual rendering functions are modular
- No dependencies on main game code

## Troubleshooting

### API Server Not Running
```bash
# Check if server is running
curl http://localhost:8001/api/generators

# Start server manually
python3 api_server.py
```

### Visual Not Displaying
- Check browser console for errors
- Ensure `shared-utils.js` is loaded
- Verify problem was generated successfully

### Problems Not Generating
- Check API server is running
- Verify network connection to localhost:8001
- Check browser console for API errors

## Development

### Adding New Visual Types
1. Add parsing logic in `generateVisualData()`
2. Create renderer function (e.g., `renderNewType()`)
3. Add to `renderVisual()` switch statement
4. Implement animation in `animateVisual()`

### Modifying Problem Generation
- Update `mapDifficultyToGenerator()` for new mappings
- Modify `callProblemGenerator()` for different API calls
- Adjust visual data parsing in `generateVisualData()`

## Integration Notes

When integrating with the main math mode:
1. Import `VisualController` class
2. Initialize with existing problem data
3. Use `renderVisual()` method directly
4. Connect to existing UI controls
5. Leverage existing `MathVisualUtils` for canvas operations

