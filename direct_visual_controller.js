// Direct Visual Controller - No iframes, direct integration
class DirectVisualController {
    constructor() {
        this.currentVisualizer = null;
        this.currentVisualData = null;
        this.visualContainer = null;
        
        this.initializeContainer();
        this.setupEventListeners();
    }

    initializeContainer() {
        this.visualContainer = document.getElementById('visualContainer');
        if (!this.visualContainer) {
            console.error('Visual container not found');
            return;
        }
        
        this.showMessage('Select a problem type and level to generate a visual');
    }

    setupEventListeners() {
        // Listen for problem generation
        document.addEventListener('problemGenerated', (event) => {
            this.handleProblemGenerated(event.detail);
        });
    }

    handleProblemGenerated(problemData) {
        console.log('Handling problem generated:', problemData);
        
        try {
            const visualData = this.generateVisualData(problemData);
            if (visualData) {
                this.renderVisual(visualData);
            } else {
                this.showMessage('Visual not available for this problem type', 'warning');
            }
        } catch (error) {
            console.error('Error handling problem:', error);
            this.showMessage('Error generating visual', 'error');
        }
    }

    generateVisualData(problem) {
        console.log('Generating visual data for:', problem);
        
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
            
            // Use quotative for small numbers, area model when one number is over 10
            if (a <= 10 && b <= 10) {
                console.log('Small multiplication - using quotative model');
                visualData = this.createQuotativeData(a, b, problem);
            } else {
                console.log('Large multiplication (one number > 10) - using area model');
                visualData = this.createAreaModelData(a, b, problem);
            }
        } else if (divisionMatch) {
            const a = parseInt(divisionMatch[1]);
            const b = parseInt(divisionMatch[2]);
            console.log('Division match:', { a, b });
            
            // Use area model approach for large division (dividend > 10 * divisor)
            if (a > 10 * b) {
                console.log('Large division - using area model approach');
                visualData = this.createDivisionAreaModelData(a, b, problem);
            } else {
                console.log('Small division - using quotative model');
                visualData = this.createQuotativeData(a, b, problem);
            }
        }
        
        if (visualData) {
            console.log('Created visual data:', visualData);
            this.currentVisualData = visualData;
            return visualData;
        } else {
            console.log('No matching problem type found');
            return null;
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

    createDivisionAreaModelData(a, b, problem) {
        // Calculate partial quotients using the distributive method
        const quotient = Math.floor(a / b);
        const remainder = a % b;
        
        // Find the largest "nice" number (multiple of 10) that fits
        let partialQuotient = 10;
        while (partialQuotient * b <= a) {
            partialQuotient *= 10;
        }
        partialQuotient = Math.floor(partialQuotient / 10);
        
        // Calculate the steps
        const firstProduct = partialQuotient * b;
        const remainderAfterFirst = a - firstProduct;
        const secondQuotient = Math.floor(remainderAfterFirst / b);
        const secondProduct = secondQuotient * b;
        const finalRemainder = remainderAfterFirst - secondProduct;
        
        // Create partial products for visualization
        const partialProducts = [
            {
                region: "first_partial",
                length: partialQuotient,
                width: b,
                area: firstProduct,
                coordinates: this.generateCoordinates(partialQuotient, b),
                label: `${partialQuotient} × ${b}`
            }
        ];
        
        if (secondQuotient > 0) {
            partialProducts.push({
                region: "second_partial", 
                length: secondQuotient,
                width: b,
                area: secondProduct,
                coordinates: this.generateCoordinates(secondQuotient, b),
                label: `${secondQuotient} × ${b}`
            });
        }
        
        return {
            type: 'division_area_model',
            data: {
                type: "division_area_model",
                strategy: "partial_quotients",
                dividend: a,
                divisor: b,
                quotient: quotient,
                remainder: finalRemainder,
                partial_quotients: [
                    { quotient: partialQuotient, product: firstProduct, remainder: remainderAfterFirst },
                    { quotient: secondQuotient, product: secondProduct, remainder: finalRemainder }
                ],
                dimensions: { length: quotient, width: b },
                total_area: a,
                coordinates: this.generateCoordinates(quotient, b),
                partial_products: partialProducts,
                show_grid: true,
                show_partial_products: true,
                show_labels: true,
                highlight_regions: true,
                problem_statement: `${a} ÷ ${b} = ? (using partial quotients)`,
                context_description: `${partialQuotient} × ${b} = ${firstProduct}, remainder ${remainderAfterFirst}. ${secondQuotient} × ${b} = ${secondProduct}. Total: ${partialQuotient} + ${secondQuotient} = ${quotient}`
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
        // Determine if this is multiplication or division based on problem type
        const isDivision = problem.question && problem.question.includes('÷');
        
        if (isDivision) {
            // For division: a ÷ b = c means c groups of b items each, totaling a items
            const quotient = a / b;
            const numberOfGroups = Math.floor(quotient);
            const remainder = a % b;
            const totalItems = a;
            const groupSize = b;
            
            const groups = [];
            const remainderItems = [];

            // Create groups (numberOfGroups groups of groupSize items each)
            for (let i = 0; i < numberOfGroups; i++) {
                const group = [];
                for (let j = 0; j < groupSize; j++) {
                    group.push(i * groupSize + j + 1);
                }
                groups.push(group);
            }

            // Create remainder items
            for (let i = 0; i < remainder; i++) {
                remainderItems.push(numberOfGroups * groupSize + i + 1);
            }

            return {
                type: 'quotative',
                data: {
                    type: "quotative",
                    measurement_type: "groups",
                    total_amount: totalItems,
                    group_size: groupSize,
                    number_of_groups: numberOfGroups,
                    groups: groups,
                    remainder_items: remainderItems,
                    remainder_count: remainder,
                    units: { total_unit: "items", group_unit: "items" },
                    show_units: true,
                    show_remainder: remainder > 0,
                    highlight_groups: true,
                    show_labels: true,
                    problem_statement: `${a} ÷ ${b} = ? (How many groups of ${b} can be made from ${a} items?)`,
                    context_description: `${numberOfGroups} groups of ${groupSize} items each${remainder > 0 ? ` + ${remainder} remainder` : ''} = ${totalItems} total items`
                },
                problem: problem
            };
        } else {
            // For multiplication: a groups of b items each
            const totalItems = a * b;
            const groups = [];
            const remainderItems = [];

            // Create groups (a groups of b items each)
            for (let i = 0; i < a; i++) {
                const group = [];
                for (let j = 0; j < b; j++) {
                    group.push(i * b + j + 1);
                }
                groups.push(group);
            }

            return {
                type: 'quotative',
                data: {
                    type: "quotative",
                    measurement_type: "groups",
                    total_amount: totalItems,
                    group_size: b,
                    number_of_groups: a,
                    groups: groups,
                    remainder_items: remainderItems,
                    remainder_count: 0,
                    units: { total_unit: "items", group_unit: "items" },
                    show_units: true,
                    show_remainder: false,
                    highlight_groups: true,
                    show_labels: true,
                    problem_statement: `${a} × ${b} = ? (${a} groups of ${b} items each)`,
                    context_description: `${a} groups of ${b} items each = ${totalItems} total items`
                },
                problem: problem
            };
        }
    }

    renderVisual(visualData) {
        console.log('Rendering visual:', visualData.type);
        
        if (visualData.type === 'number_line') {
            this.renderNumberLine(visualData);
        } else if (visualData.type === 'area_model') {
            this.renderAreaModel(visualData);
        } else if (visualData.type === 'division_area_model') {
            this.renderDivisionAreaModel(visualData);
        } else if (visualData.type === 'quotative') {
            this.renderQuotative(visualData);
        } else {
            this.showMessage(`Visual type ${visualData.type} not implemented`, 'warning');
        }
    }

    renderNumberLine(visualData) {
        console.log('Rendering number line');
        
        this.visualContainer.innerHTML = `
            <div class="visual-module-container">
                <div class="problem-statement" id="problemStatement">${visualData.data.problem_statement}</div>
                <canvas id="numberLineCanvas" class="visual-canvas"></canvas>
                <div class="visual-controls">
                    <button onclick="directVisualController.showHint()">💡 Show Hint</button>
                    <button onclick="directVisualController.animateVisual()">▶️ Animate</button>
                    <button onclick="directVisualController.resetVisual()">🔄 Reset</button>
                </div>
                <div class="visual-info" id="infoDisplay">Number line visualization loaded</div>
            </div>
        `;
        
        // Initialize the visualizer
        this.currentVisualizer = new NumberLineVisualizer('numberLineCanvas');
        this.currentVisualizer.loadProblem(visualData.data);
        
        this.showMessage('Number line visual loaded', 'info');
    }

    renderDivisionAreaModel(visualData) {
        console.log('Rendering division area model');
        
        this.visualContainer.innerHTML = `
            <div class="visual-module-container">
                <div class="problem-statement" id="problemStatement">${visualData.data.problem_statement}</div>
                <canvas id="divisionAreaModelCanvas" class="visual-canvas"></canvas>
                <div class="visual-controls">
                    <button onclick="directVisualController.showHint()">💡 Show Hint</button>
                    <button onclick="directVisualController.animateVisual()">▶️ Animate</button>
                    <button onclick="directVisualController.resetVisual()">🔄 Reset</button>
                </div>
                <div class="visual-info">
                    <div id="infoDisplay" class="info-display">Division area model visualization loaded</div>
                    <div id="contextDescription" class="context-description">${visualData.data.context_description || ''}</div>
                </div>
            </div>
        `;
        
        // Initialize the division area model visualizer
        setTimeout(() => {
            if (window.DivisionAreaModelVisualizer) {
                this.currentVisualizer = new window.DivisionAreaModelVisualizer('divisionAreaModelCanvas');
                this.currentVisualizer.loadProblem(visualData.data);
            } else {
                console.error('DivisionAreaModelVisualizer not found');
            }
        }, 100);
    }

    renderAreaModel(visualData) {
        console.log('Rendering area model');
        
        this.visualContainer.innerHTML = `
            <div class="visual-module-container">
                <div class="problem-statement" id="problemStatement">${visualData.data.problem_statement}</div>
                <canvas id="areaModelCanvas" class="visual-canvas"></canvas>
                <div class="visual-controls">
                    <button onclick="directVisualController.showHint()">💡 Show Hint</button>
                    <button onclick="directVisualController.animateVisual()">▶️ Animate</button>
                    <button onclick="directVisualController.resetVisual()">🔄 Reset</button>
                </div>
                <div class="visual-info" id="infoDisplay">Area model visualization loaded</div>
            </div>
        `;
        
        // Initialize the visualizer
        this.currentVisualizer = new AreaModelVisualizer('areaModelCanvas');
        this.currentVisualizer.loadProblem(visualData.data);
        
        this.showMessage('Area model visual loaded', 'info');
    }

    renderQuotative(visualData) {
        console.log('Rendering quotative');
        
        this.visualContainer.innerHTML = `
            <div class="visual-module-container">
                <div class="problem-statement" id="problemStatement">${visualData.data.problem_statement}</div>
                <canvas id="quotativeCanvas" class="visual-canvas"></canvas>
                <div class="visual-controls">
                    <button onclick="directVisualController.showHint()">💡 Show Hint</button>
                    <button onclick="directVisualController.animateVisual()">▶️ Animate</button>
                    <button onclick="directVisualController.resetVisual()">🔄 Reset</button>
                </div>
                <div class="visual-info" id="infoDisplay">Quotative visualization loaded</div>
            </div>
        `;
        
        // Initialize the visualizer
        this.currentVisualizer = new QuotativeVisualizer('quotativeCanvas');
        this.currentVisualizer.loadProblem(visualData.data);
        
        this.showMessage('Quotative visual loaded', 'info');
    }

    showHint() {
        if (!this.currentVisualizer || !this.currentVisualizer.showHint) {
            this.showMessage('No visual available to show hint', 'warning');
            return;
        }

        this.currentVisualizer.showHint();
        this.showMessage('Hint displayed', 'info');
    }

    animateVisual() {
        if (!this.currentVisualizer || !this.currentVisualizer.animate) {
            this.showMessage('No visual available to animate', 'warning');
            return;
        }

        this.currentVisualizer.animate();
        this.showMessage('Animation started', 'info');
    }

    resetVisual() {
        if (!this.currentVisualizer || !this.currentVisualData) {
            this.showMessage('No visual available to reset', 'warning');
            return;
        }

        // Reload the same data
        this.renderVisual(this.currentVisualData);
        this.showMessage('Visual reset', 'info');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('messageDisplay');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.className = `message ${type}`;
        }
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Helper methods for data generation
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
        return [
            `Draw a rectangle with length ${length} and width ${width}`,
            `Count the total number of squares`,
            `Area = Length × Width = ${length} × ${width} = ${length * width}`
        ];
    }

    generateCoordinates(length, width) {
        const coordinates = [];
        for (let i = 0; i < length; i++) {
            for (let j = 0; j < width; j++) {
                coordinates.push([i, j]);
            }
        }
        return coordinates;
    }

    generatePartialProducts(length, width) {
        // Generate proper partial products with coordinates for animation
        const partialProducts = [];
        
        // Break down into partial products based on place values
        if (length > 10 || width > 10) {
            // For large numbers, break down by place values
            if (length > 10) {
                // Break length into tens and ones
                const tensLength = Math.floor(length / 10) * 10;
                const onesLength = length % 10;
                
                if (tensLength > 0) {
                    // Tens × width region
                    const tensCoordinates = [];
                    for (let i = 0; i < tensLength; i++) {
                        for (let j = 0; j < width; j++) {
                            tensCoordinates.push([i, j]);
                        }
                    }
                    partialProducts.push({
                        region: "tens_tens",
                        length: tensLength,
                        width: width,
                        area: tensLength * width,
                        coordinates: tensCoordinates,
                        label: `${tensLength} × ${width}`
                    });
                }
                
                if (onesLength > 0) {
                    // Ones × width region
                    const onesCoordinates = [];
                    for (let i = tensLength; i < length; i++) {
                        for (let j = 0; j < width; j++) {
                            onesCoordinates.push([i, j]);
                        }
                    }
                    partialProducts.push({
                        region: "ones_tens",
                        length: onesLength,
                        width: width,
                        area: onesLength * width,
                        coordinates: onesCoordinates,
                        label: `${onesLength} × ${width}`
                    });
                }
            } else if (width > 10) {
                // Break width into tens and ones
                const tensWidth = Math.floor(width / 10) * 10;
                const onesWidth = width % 10;
                
                if (tensWidth > 0) {
                    // Length × tens region
                    const tensCoordinates = [];
                    for (let i = 0; i < length; i++) {
                        for (let j = 0; j < tensWidth; j++) {
                            tensCoordinates.push([i, j]);
                        }
                    }
                    partialProducts.push({
                        region: "tens_tens",
                        length: length,
                        width: tensWidth,
                        area: length * tensWidth,
                        coordinates: tensCoordinates,
                        label: `${length} × ${tensWidth}`
                    });
                }
                
                if (onesWidth > 0) {
                    // Length × ones region
                    const onesCoordinates = [];
                    for (let i = 0; i < length; i++) {
                        for (let j = tensWidth; j < width; j++) {
                            onesCoordinates.push([i, j]);
                        }
                    }
                    partialProducts.push({
                        region: "tens_ones",
                        length: length,
                        width: onesWidth,
                        area: length * onesWidth,
                        coordinates: onesCoordinates,
                        label: `${length} × ${onesWidth}`
                    });
                }
            }
        } else {
            // For small numbers, just show the whole area as one partial product
            const coordinates = [];
            for (let i = 0; i < length; i++) {
                for (let j = 0; j < width; j++) {
                    coordinates.push([i, j]);
                }
            }
            partialProducts.push({
                region: "main",
                length: length,
                width: width,
                area: length * width,
                coordinates: coordinates,
                label: `${length} × ${width}`
            });
        }
        
        return partialProducts;
    }
}

// Global instance
let directVisualController;
