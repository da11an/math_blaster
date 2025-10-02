# HTML Visual Modules for Math Blaster

This folder contains interactive HTML/CSS/JavaScript components that render visual math problems in the browser. These modules complement the Python visual modules and provide the frontend graphics for Math Blaster.

## 📁 File Structure

```
html_visual_modules/
├── index.html              # Demo page showing all modules
├── shared-styles.css       # Common CSS styles for all modules
├── shared-utils.js         # Common JavaScript utilities
├── numberline.html         # Number line visualizations
├── arrays.html            # Array visualizations
├── area_models.html       # Area model visualizations
├── quotative.html         # Quotative division visualizations
└── README.md              # This file
```

## 🎯 Visual Modules

### 1. Number Line Module (`numberline.html`)
**Purpose**: Interactive number line for addition and subtraction

**Features**:
- Animated movement along number line
- Tick marks and labels
- Start/end position highlighting
- Step-by-step animation controls
- Answer validation with feedback

**Usage**:
```javascript
const visualizer = new NumberLineVisualizer('canvasId');
visualizer.loadProblem(problemData);
```

### 2. Arrays Module (`arrays.html`)
**Purpose**: Rectangular arrays for multiplication and division

**Features**:
- Interactive grid display
- Group highlighting for division
- Counting animations
- Row/column grouping
- Alternative representations

**Usage**:
```javascript
const visualizer = new ArraysVisualizer('canvasId');
visualizer.loadProblem(problemData);
```

### 3. Area Models Module (`area_models.html`)
**Purpose**: Area models for multiplication with decomposition

**Features**:
- Rectangular area visualization
- Partial products highlighting
- Decomposition animations
- Step-by-step breakdown
- Multiple strategies (standard, partial products, distributive)

**Usage**:
```javascript
const visualizer = new AreaModelsVisualizer('canvasId');
visualizer.loadProblem(problemData);
```

### 4. Quotative Module (`quotative.html`)
**Purpose**: Quotative division with measurement contexts

**Features**:
- Visual grouping of items
- Multiple measurement types (length, capacity, groups, money)
- Remainder handling
- Real-world context descriptions
- Grouping animations

**Usage**:
```javascript
const visualizer = new QuotativeVisualizer('canvasId');
visualizer.loadProblem(problemData);
```

## 🛠️ Shared Components

### `shared-styles.css`
Common CSS styles including:
- Math Blaster theme colors and fonts
- Responsive design patterns
- Animation keyframes
- Button and input styling
- Grid and canvas styling

### `shared-utils.js`
Common JavaScript utilities including:
- Canvas creation and management
- Drawing functions (grids, arrows, text with glow)
- Animation helpers
- Input validation
- Feedback message creation
- Coordinate scaling

## 🚀 Quick Start

1. **Include shared resources**:
```html
<link rel="stylesheet" href="shared-styles.css">
<script src="shared-utils.js"></script>
```

2. **Include specific module**:
```html
<script src="numberline.html"></script>
```

3. **Initialize visualizer**:
```javascript
const visualizer = new NumberLineVisualizer('myCanvas');
```

4. **Load problem data**:
```javascript
visualizer.loadProblem(problemData);
```

## 📊 Data Format

All modules expect problem data in this standardized format:

```javascript
{
    type: "number_line|array|area_model|quotative",
    operation: "addition|subtraction|multiplication|division",
    problem_statement: "5 + 3 = ?",
    // Module-specific visual data
    visual_data: {
        // Specific to each module type
    },
    answer: 8
}
```

## 🎨 Customization

### Theme Colors
Override CSS custom properties:
```css
:root {
    --primary-color: #00ff00;
    --secondary-color: #00cc00;
    --background-color: #0a0a0a;
    --text-color: #00ff00;
}
```

### Canvas Size
Set canvas dimensions:
```javascript
visualizer.canvas.width = 600;
visualizer.canvas.height = 400;
```

## 🔗 Backend Integration

Connect with Python visual modules:

```python
# Python backend
from visual_modules import NumberLineModule

module = NumberLineModule()
problem = module.generate_addition_problem()
visual_data = module.get_visual_description(problem)

# Send to frontend
return json.dumps(visual_data)
```

## 📱 Responsive Design

All modules are responsive and work on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## ♿ Accessibility Features

- Keyboard navigation support
- High contrast colors
- Clear visual feedback
- Screen reader friendly labels
- Focus management

## 🧪 Testing

Open `index.html` in a browser to see all modules in action. Each module includes:
- Example problem data
- Interactive controls
- Answer validation
- Visual feedback

## 🔧 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 Development Notes

- Uses HTML5 Canvas for smooth graphics
- ES6+ JavaScript features
- CSS Grid and Flexbox for layout
- RequestAnimationFrame for animations
- Modular architecture for easy maintenance

## 🚀 Future Enhancements

- Touch gesture support for mobile
- Voice input for answers
- Multi-language support
- Advanced animation options
- Export capabilities
- Performance optimizations
