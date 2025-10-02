/**
 * Visual Controller for Math Visual Modules
 * Integrates with existing problem generators (fact_ladder, mental_math)
 * Designed for future integration with math mode
 */

class VisualController {
    constructor() {
        this.currentProblem = null;
        this.currentVisualData = null;
        this.currentVisualizer = null;
        this.apiBaseUrl = 'http://localhost:8001/api';
        
        // Initialize UI
        this.initializeUI();
        this.updateStatus('Ready to generate problems');
    }

    initializeUI() {
        // Show/hide custom range inputs based on difficulty selection
        const difficultySelect = document.getElementById('difficulty');
        const customRange = document.getElementById('customRange');
        
        difficultySelect.addEventListener('change', () => {
            if (difficultySelect.value === 'custom') {
                customRange.style.display = 'block';
            } else {
                customRange.style.display = 'none';
            }
        });

        // Set default values
        document.getElementById('problemType').value = 'addition';
        document.getElementById('difficulty').value = 'easy';
    }

    async generateProblem() {
        try {
            this.updateStatus('Generating problem...');
            this.setControlsEnabled(false);

            const problemType = document.getElementById('problemType').value;
            const difficulty = document.getElementById('difficulty').value;
            
            // Map difficulty to level and grade
            const { level, gradeLevel, generatorType } = this.mapDifficultyToGenerator(difficulty, problemType);
            
            // Generate problem using existing API
            const problem = await this.callProblemGenerator(level, gradeLevel, generatorType);
            
            if (problem) {
                this.currentProblem = problem;
                this.displayProblem(problem);
                this.generateVisualData(problem);
                this.updateStatus(`Generated ${problemType} problem (Level ${level})`);
            } else {
                throw new Error('Failed to generate problem');
            }

        } catch (error) {
            console.error('Error generating problem:', error);
            this.updateStatus(`Error: ${error.message}`);
            this.showFeedback('Failed to generate problem. Please try again.', 'error');
        } finally {
            this.setControlsEnabled(true);
        }
    }

    mapDifficultyToGenerator(difficulty, problemType) {
        const mappings = {
            'easy': { level: 1, gradeLevel: 'G1', generatorType: 'fact_ladder' },
            'medium': { level: 3, gradeLevel: 'G3', generatorType: 'fact_ladder' },
            'hard': { level: 5, gradeLevel: 'G4', generatorType: 'fact_ladder' },
            'custom': { level: 2, gradeLevel: 'G2', generatorType: 'fact_ladder' }
        };

        // Adjust based on problem type
        let config = mappings[difficulty];
        
        if (problemType === 'multiplication' || problemType === 'division') {
            // Use higher levels for multiplication/division
            config.level = Math.max(config.level, 5);
            config.gradeLevel = 'G3';
        }

        return config;
    }

    async callProblemGenerator(level, gradeLevel, generatorType) {
        const response = await fetch(`${this.apiBaseUrl}/generate_math_problem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                level: level,
                grade_level: gradeLevel,
                generator_type: generatorType,
                username: 'visual_launcher'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            return {
                question: data.problem.question,
                answer: data.problem.answer,
                problem_type: data.problem.type,
                level: level,
                grade_level: gradeLevel,
                generator_type: generatorType
            };
        } else {
            throw new Error(data.message || 'Failed to generate problem');
        }
    }

    displayProblem(problem) {
        document.getElementById('currentProblem').textContent = problem.question;
        document.getElementById('currentAnswer').textContent = problem.answer;
        document.getElementById('visualTitle').textContent = `${problem.problem_type} Visual`;
    }

    generateVisualData(problem) {
        console.log('Generating visual data for:', problem);
        
        // Parse the problem to extract numbers and operation
        const problemStr = problem.question;
        console.log('Problem string:', problemStr);
        
        // Try to match different problem formats
        const additionMatch = problemStr.match(/(\d+)\s*\+\s*(\d+)/);
        const subtractionMatch = problemStr.match(/(\d+)\s*-\s*(\d+)/);
        const multiplicationMatch = problemStr.match(/(\d+)\s*[×*]\s*(\d+)/);
        const divisionMatch = problemStr.match(/(\d+)\s*[÷/]\s*(\d+)/);
        
        let visualData = null;
        
        if (additionMatch) {
            const a = parseInt(additionMatch[1]);
            const b = parseInt(additionMatch[2]);
            console.log('Addition match:', { a, b });
            
            visualData = this.createNumberLineData(a, b, 'addition', problem);
        } else if (subtractionMatch) {
            const a = parseInt(subtractionMatch[1]);
            const b = parseInt(subtractionMatch[2]);
            console.log('Subtraction match:', { a, b });
            
            visualData = this.createNumberLineData(a, b, 'subtraction', problem);
        } else if (multiplicationMatch) {
            const a = parseInt(multiplicationMatch[1]);
            const b = parseInt(multiplicationMatch[2]);
            console.log('Multiplication match:', { a, b });
            
            visualData = this.createAreaModelData(a, b, problem);
        } else if (divisionMatch) {
            const a = parseInt(divisionMatch[1]);
            const b = parseInt(divisionMatch[2]);
            console.log('Division match:', { a, b });
            
            visualData = this.createQuotativeData(a, b, problem);
        }
        
        if (visualData) {
            console.log('Created visual data:', visualData);
            this.currentVisualData = visualData;
            this.renderVisual(visualData);
        } else {
            console.log('No matching problem type found');
            this.showFeedback('Visual not available for this problem type', 'warning');
        }
    }

    createNumberLineData(a, b, operation, problem) {
        const minVal = Math.min(a, operation === 'addition' ? a + b : a - b) - 2;
        const maxVal = Math.max(a, operation === 'addition' ? a + b : a - b) + 2;
        const tickPositions = [];
        for (let i = minVal; i <= maxVal; i++) {
            tickPositions.push(i);
        }

        return {
            type: 'number_line',
            module: 'numberline.html',
            data: {
                type: "number_line",
                operation: operation,
                orientation: "horizontal",
                range: { min: minVal, max: maxVal },
                tick_interval: 1,
                tick_positions: tickPositions,
                start_position: a,
                change_amount: b,
                result_position: operation === 'addition' ? a + b : a - b,
                show_labels: true,
                highlight_result: true,
                problem_statement: `${a} ${operation === 'addition' ? '+' : '-'} ${b} = ?`,
                steps: this.generateNumberLineSteps(a, b, operation)
            },
            problem: problem
        };
    }

    createAreaModelData(a, b, problem) {
        const totalArea = a * b;
        const coordinates = [];
        for (let i = 0; i < a; i++) {
            for (let j = 0; j < b; j++) {
                coordinates.push([i, j]);
            }
        }

        // Generate partial products
        const partialProducts = this.generatePartialProducts(a, b);

        return {
            type: 'area_model',
            module: 'area_models.html',
            data: {
                type: "area_model",
                strategy: "partial_products",
                dimensions: { length: a, width: b },
                total_area: totalArea,
                coordinates: coordinates,
                partial_products: partialProducts,
                problem_statement: `${a} × ${b} = ?`,
                decomposition_steps: this.generateAreaModelSteps(a, b)
            },
            problem: problem
        };
    }

    createQuotativeData(a, b, problem) {
        const numberOfGroups = Math.floor(a / b);
        const remainderCount = a % b;
        const groups = [];
        const remainderItems = [];

        // Create groups
        for (let i = 0; i < numberOfGroups; i++) {
            const group = [];
            for (let j = 0; j < b; j++) {
                group.push(i * b + j + 1);
            }
            groups.push(group);
        }

        // Create remainder items
        for (let i = 0; i < remainderCount; i++) {
            remainderItems.push(numberOfGroups * b + i + 1);
        }

        return {
            type: 'quotative',
            module: 'quotative.html',
            data: {
                type: "quotative",
                measurement_type: "groups",
                total_amount: a,
                group_size: b,
                number_of_groups: numberOfGroups,
                groups: groups,
                remainder_items: remainderItems,
                remainder_count: remainderCount,
                units: { total_unit: "items", group_unit: "items" },
                show_units: true,
                show_remainder: true,
                highlight_groups: true,
                show_labels: true,
                problem_statement: `How many groups of ${b} can be made from ${a} items?`,
                context_description: `How many groups of ${b} can be made from ${a} items?`
            },
            problem: problem
        };
    }

    generateNumberLineSteps(start, change, operation) {
        const steps = [];
        if (operation === 'addition') {
            steps.push(`Start at ${start}`);
            steps.push(`Add ${change} (move ${change} steps to the right)`);
            steps.push(`Result: ${start + change}`);
        } else {
            steps.push(`Start at ${start}`);
            steps.push(`Subtract ${change} (move ${change} steps to the left)`);
            steps.push(`Result: ${start - change}`);
        }
        return steps;
    }

    generateAreaModelSteps(length, width) {
        const steps = [];
        steps.push(`Draw a rectangle with length ${length} and width ${width}`);
        steps.push(`Count the total number of squares`);
        steps.push(`Area = Length × Width = ${length} × ${width} = ${length * width}`);
        return steps;
    }

    generateAreaModelCoordinates(length, width) {
        const coordinates = [];
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < width; j++) {
                coordinates.push([i, j]);
            }
        }
        return coordinates;
    }

    generatePartialProducts(length, width) {
        // Break down into tens and ones for partial products
        const lengthTens = Math.floor(length / 10);
        const lengthOnes = length % 10;
        const widthTens = Math.floor(width / 10);
        const widthOnes = width % 10;
        
        const partials = [];
        
        if (lengthTens > 0 && widthTens > 0) {
            partials.push({ area: lengthTens * widthTens * 100, label: `${lengthTens * 10} × ${widthTens * 10}` });
        }
        if (lengthTens > 0 && widthOnes > 0) {
            partials.push({ area: lengthTens * widthOnes * 10, label: `${lengthTens * 10} × ${widthOnes}` });
        }
        if (lengthOnes > 0 && widthTens > 0) {
            partials.push({ area: lengthOnes * widthTens * 10, label: `${lengthOnes} × ${widthTens * 10}` });
        }
        if (lengthOnes > 0 && widthOnes > 0) {
            partials.push({ area: lengthOnes * widthOnes, label: `${lengthOnes} × ${widthOnes}` });
        }
        
        return partials;
    }

    renderVisual(visualData) {
        console.log('Rendering visual:', visualData);
        const container = document.getElementById('visualContent');
        
        // Clear the container
        container.innerHTML = '';
        
        if (visualData.module) {
            this.loadVisualModule(container, visualData);
        } else {
            this.createSimpleVisualizer(container, visualData);
        }
    }

    loadVisualModule(container, visualData) {
        console.log('Loading visual module:', visualData.module);
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = `html_visual_modules/${visualData.module}`;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '5px';
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.display = 'flex';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.height = '400px';
        loadingDiv.style.color = '#00ff00';
        loadingDiv.style.fontSize = '16px';
        loadingDiv.textContent = 'Loading visual module...';
        
        container.appendChild(loadingDiv);
        
        // Wait for iframe to load, then send data
        iframe.onload = () => {
            console.log('Iframe loaded, sending data:', visualData.data);
            
            // Remove loading indicator
            container.removeChild(loadingDiv);
            container.appendChild(iframe);
            
            // Wait a bit for the visualizer to be initialized, then load the problem
            setTimeout(() => {
                try {
                    this.loadProblemInIframe(iframe, visualData);
                    
                    this.currentVisualizer = {
                        iframe: iframe,
                        visualData: visualData,
                        container: container
                    };
                    
                    this.showFeedback(`Loaded ${visualData.type} visual module`, 'info');
                } catch (error) {
                    console.error('Error loading problem in visual module:', error);
                    this.showFeedback('Error loading visual module', 'error');
                }
            }, 100);
        };
        
        iframe.onerror = () => {
            console.error('Error loading iframe:', visualData.module);
            container.removeChild(loadingDiv);
            this.showFeedback(`Error loading ${visualData.module}`, 'error');
        };
    }

    loadProblemInIframe(iframe, visualData) {
        console.log('Loading problem in iframe:', visualData.type);
        
        const iframeWindow = iframe.contentWindow;
        
        try {
            if (visualData.type === 'number_line') {
                if (iframeWindow.numberLineVisualizer) {
                    iframeWindow.numberLineVisualizer.loadProblem(visualData.data);
                    console.log('✅ Number line problem loaded');
                } else {
                    throw new Error('numberLineVisualizer not found');
                }
            } else if (visualData.type === 'area_model') {
                if (iframeWindow.areaModelsVisualizer) {
                    iframeWindow.areaModelsVisualizer.loadProblem(visualData.data);
                    console.log('✅ Area model problem loaded');
                } else {
                    throw new Error('areaModelsVisualizer not found');
                }
            } else if (visualData.type === 'quotative') {
                if (iframeWindow.quotativeVisualizer) {
                    iframeWindow.quotativeVisualizer.loadProblem(visualData.data);
                    console.log('✅ Quotative problem loaded');
                } else {
                    throw new Error('quotativeVisualizer not found');
                }
            } else {
                throw new Error(`Unknown visual type: ${visualData.type}`);
            }
        } catch (error) {
            console.error('Error calling visualizer:', error);
            throw error;
        }
    }

    createSimpleVisualizer(container, visualData) {
        console.log('Creating simple visualizer for:', visualData.type);
        
        const visualDiv = document.createElement('div');
        visualDiv.style.display = 'flex';
        visualDiv.style.flexDirection = 'column';
        visualDiv.style.height = '100%';
        visualDiv.style.alignItems = 'center';
        visualDiv.style.justifyContent = 'center';
        
        const messageDiv = document.createElement('div');
        messageDiv.style.color = '#00ff00';
        messageDiv.style.fontSize = '18px';
        messageDiv.style.textAlign = 'center';
        messageDiv.innerHTML = `
            <div>Visual not available for: ${visualData.type}</div>
            <div style="margin-top: 10px; color: #ccc; font-size: 14px;">
                Problem: ${visualData.problem.question} = ${visualData.problem.answer}
            </div>
        `;
        visualDiv.appendChild(messageDiv);
        
        container.appendChild(visualDiv);
        
        this.currentVisualizer = {
            visualData: visualData,
            container: visualDiv
        };
    }

    showHint() {
        if (!this.currentVisualizer || !this.currentVisualizer.iframe) {
            this.showFeedback('No visual available to show hint', 'warning');
            return;
        }

        try {
            const iframeWindow = this.currentVisualizer.iframe.contentWindow;
            const visualData = this.currentVisualizer.visualData;
            
            if (visualData.type === 'number_line' && iframeWindow.numberLineVisualizer) {
                iframeWindow.numberLineVisualizer.showHint();
            } else if (visualData.type === 'area_model' && iframeWindow.areaModelsVisualizer) {
                iframeWindow.areaModelsVisualizer.showHint();
            } else if (visualData.type === 'quotative' && iframeWindow.quotativeVisualizer) {
                iframeWindow.quotativeVisualizer.showHint();
            }
            
            this.showFeedback('Hint displayed in visual module', 'info');
        } catch (error) {
            console.error('Error showing hint:', error);
            this.showFeedback('Error showing hint', 'error');
        }
    }

    animateVisual() {
        if (!this.currentVisualizer || !this.currentVisualizer.iframe) {
            this.showFeedback('No visual available to animate', 'warning');
            return;
        }

        try {
            const iframeWindow = this.currentVisualizer.iframe.contentWindow;
            const visualData = this.currentVisualizer.visualData;
            
            if (visualData.type === 'number_line' && iframeWindow.numberLineVisualizer) {
                iframeWindow.numberLineVisualizer.animate();
            } else if (visualData.type === 'area_model' && iframeWindow.areaModelsVisualizer) {
                iframeWindow.areaModelsVisualizer.animateDecomposition();
            } else if (visualData.type === 'quotative' && iframeWindow.quotativeVisualizer) {
                iframeWindow.quotativeVisualizer.animate();
            }
            
            this.showFeedback('Animation started in visual module', 'info');
        } catch (error) {
            console.error('Error starting animation:', error);
            this.showFeedback('Error starting animation', 'error');
        }
    }

    resetVisual() {
        if (!this.currentVisualizer || !this.currentVisualizer.iframe) {
            this.showFeedback('No visual available to reset', 'warning');
            return;
        }

        try {
            const iframeWindow = this.currentVisualizer.iframe.contentWindow;
            const visualData = this.currentVisualizer.visualData;
            
            if (visualData.type === 'number_line' && iframeWindow.numberLineVisualizer) {
                iframeWindow.numberLineVisualizer.loadProblem(visualData.data);
            } else if (visualData.type === 'area_model' && iframeWindow.areaModelsVisualizer) {
                iframeWindow.areaModelsVisualizer.loadProblem(visualData.data);
            } else if (visualData.type === 'quotative' && iframeWindow.quotativeVisualizer) {
                iframeWindow.quotativeVisualizer.loadProblem(visualData.data);
            }
            
            this.showFeedback('Visual module reset', 'info');
        } catch (error) {
            console.error('Error resetting visual:', error);
            this.showFeedback('Error resetting visual', 'error');
        }
    }

    setControlsEnabled(enabled) {
        const buttons = ['showHintBtn', 'animateBtn', 'resetBtn'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !enabled;
            }
        });
    }

    showFeedback(message, type = 'info') {
        const feedbackArea = document.getElementById('feedbackArea');
        const colors = {
            'info': '#00ff00',
            'hint': '#ffff00',
            'warning': '#ff6600',
            'error': '#ff4444'
        };
        
        feedbackArea.innerHTML = `<div style="color: ${colors[type] || colors.info};">${message}</div>`;
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }
}

// Global functions for HTML buttons
function generateProblem() {
    visualController.generateProblem();
}

function showHint() {
    visualController.showHint();
}

function animateVisual() {
    visualController.animateVisual();
}

function resetVisual() {
    visualController.resetVisual();
}

// Initialize the visual controller when the page loads
let visualController;
document.addEventListener('DOMContentLoaded', () => {
    visualController = new VisualController();
});
