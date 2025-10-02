// Visual Module Classes for Math Mode Integration
// Complete implementations from direct_visual_launcher.html

class DirectVisualController {
    constructor() {
        this.canvas = document.getElementById('visualCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.problemData = null;
        this.currentVisualizer = null;
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    loadProblem(problemData) {
        this.problemData = problemData;
        
        // Determine which visualizer to use based on operation
        if (problemData.operation === 'addition' || problemData.operation === 'subtraction') {
            this.currentVisualizer = new NumberLineVisualizer('visualCanvas');
        } else if (problemData.operation === 'multiplication') {
            this.currentVisualizer = new AreaModelVisualizer('visualCanvas');
        } else if (problemData.operation === 'division') {
            if (problemData.partial_quotients) {
                this.currentVisualizer = new DivisionAreaModelVisualizer('visualCanvas');
            } else {
                this.currentVisualizer = new QuotativeVisualizer('visualCanvas');
            }
        }
        
        if (this.currentVisualizer) {
            this.currentVisualizer.loadProblem(problemData);
        }
    }
    
    animate() {
        if (this.currentVisualizer) {
            this.currentVisualizer.animate();
        }
    }
    
    showHint() {
        if (this.currentVisualizer) {
            this.currentVisualizer.showHint();
        }
    }
    
    reset() {
        if (this.currentVisualizer) {
            this.currentVisualizer.reset();
        }
    }
}

// Complete NumberLineVisualizer (from direct_visual_launcher.html)
class NumberLineVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.problemData = null;
        this.animationId = null;
        this.currentStep = 0;
        this.isAnimating = false;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    loadProblem(problemData) {
        this.problemData = problemData;
        this.currentStep = 0;
        this.isAnimating = false;
        
        document.getElementById('problemStatement').textContent = problemData.problem_statement;
        this.drawNumberLine();
        this.showInfo();
    }

    drawNumberLine() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);
        
        if (!this.problemData) return;
        
        // Draw number line
        const padding = 50;
        const lineY = height / 2;
        const lineStartX = padding;
        const lineEndX = width - padding;
        
        // Calculate scale
        const minVal = Math.min(this.problemData.start_position, this.problemData.result_position) - 2;
        const maxVal = Math.max(this.problemData.start_position, this.problemData.result_position) + 2;
        const range = maxVal - minVal;
        const scale = (lineEndX - lineStartX) / range;
        
        // Draw line
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineY);
        ctx.lineTo(lineEndX, lineY);
        ctx.stroke();
        
        // Draw ticks and labels with adaptive spacing
        let labelInterval = 1;
        
        // Determine labeling interval based on range
        if (range > 50) {
            labelInterval = 10; // Label every 10th number
        } else if (range > 20) {
            labelInterval = 5; // Label every 5th number
        } else if (range > 10) {
            labelInterval = 2; // Label every 2nd number
        }
        
        for (let i = minVal; i <= maxVal; i++) {
            const x = lineStartX + (i - minVal) * scale;
            ctx.beginPath();
            ctx.moveTo(x, lineY - 15);
            ctx.lineTo(x, lineY + 15);
            ctx.stroke();
            
            // Only label numbers at the specified interval
            if (i % labelInterval === 0) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 14px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(i.toString(), x, lineY + 35);
            }
        }
        
        // Draw start position
        const startX = lineStartX + (this.problemData.start_position - minVal) * scale;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(startX, lineY, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw ribbons if animation is active
        if (this.isAnimating) {
            this.drawRibbons(startX, lineY, scale, minVal);
        }
        
        // Draw result circle only after ribbons are complete
        if (this.isAnimating && this.currentStep >= this.getRibbonSegments().length) {
            const resultX = lineStartX + (this.problemData.result_position - minVal) * scale;
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(resultX, lineY, 12, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    getRibbonSegments() {
        const start = this.problemData.start_position;
        const change = this.problemData.change_amount;
        const operation = this.problemData.operation;
        
        const segments = [];
        let currentPos = start;
        let remainingChange = Math.abs(change);
        
        // Decompose by place value (highest place first)
        const digits = remainingChange.toString().split('').map(Number);
        
        for (let i = 0; i < digits.length; i++) {
            const placeValue = Math.pow(10, digits.length - 1 - i);
            const digit = digits[i];
            const segmentLength = digit * placeValue;
            
            if (segmentLength > 0) {
                const endPos = operation === 'addition' 
                    ? currentPos + segmentLength - 1  // -1 to get the actual end position
                    : currentPos - segmentLength + 1; // +1 to get the actual end position
                    
                // Calculate the intermediate result for labeling
                const intermediateResult = operation === 'addition' 
                    ? currentPos + segmentLength
                    : currentPos - segmentLength;
                    
                segments.push({
                    start: currentPos,
                    length: segmentLength,
                    end: endPos,
                    intermediateResult: intermediateResult,
                    calculation: `${currentPos} ${operation === 'addition' ? '+' : '-'} ${segmentLength} = ${intermediateResult}`
                });
                
                currentPos = operation === 'addition' ? endPos + 1 : endPos - 1;
            }
        }
        
        return segments;
    }

    drawRibbons(startX, lineY, scale, minVal) {
        const ctx = this.ctx;
        const segments = this.getRibbonSegments();
        const ribbonColor = '#ff6600'; // Consistent orange color
        const lineWidth = 12;
        const halfLineWidth = lineWidth / 2; // 6px
        
        ctx.save();
        ctx.strokeStyle = ribbonColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        
        let currentX = startX;
        
        for (let i = 0; i < Math.min(this.currentStep, segments.length); i++) {
            const segment = segments[i];
            const segmentLength = segment.length;
            
            // Calculate segment start and end with gaps for discrete appearance
            const totalGap = 2 + halfLineWidth; // 8px total
            
            let segmentStartX, segmentEndX;
            if (this.problemData.operation === 'addition') {
                // Addition: move right, gaps at start and end
                segmentStartX = currentX + totalGap; // 8px gap at start
                segmentEndX = currentX + (segmentLength * scale) - totalGap; // 8px gap at end
            } else {
                // Subtraction: move left, gaps at start and end
                segmentStartX = currentX - totalGap; // 8px gap at start (left side)
                segmentEndX = currentX - (segmentLength * scale) + totalGap; // 8px gap at end (right side)
            }
            
            // Draw ribbon segment directly on the number line backbone
            ctx.beginPath();
            ctx.moveTo(segmentStartX, lineY);
            ctx.lineTo(segmentEndX, lineY);
            ctx.stroke();
            
            // Draw calculation label
            const labelX = (segmentStartX + segmentEndX) / 2;
            const labelY = lineY - 30;
            
            ctx.fillStyle = ribbonColor;
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(segment.calculation, labelX, labelY);
            
            // Move to next segment position (without gaps)
            currentX = currentX + (segmentLength * scale * (this.problemData.operation === 'addition' ? 1 : -1));
        }
        
        ctx.restore();
    }

    animate() {
        if (!this.problemData || this.isAnimating) return;
        
        this.isAnimating = true;
        this.currentStep = 0;
        this.animateMovement();
    }

    animateMovement() {
        if (!this.isAnimating) return;
        
        this.drawNumberLine();
        
        this.currentStep++;
        const segments = this.getRibbonSegments();
        
        if (this.currentStep <= segments.length) {
            // Still animating segments
            setTimeout(() => this.animateMovement(), 1000); // 1 second per segment
        } else if (this.currentStep === segments.length + 1) {
            // Show result circle
            this.drawNumberLine();
            setTimeout(() => {
                this.isAnimating = false;
                this.currentStep = 0;
            }, 1000);
        }
    }

    showHint() {
        if (!this.problemData) return;
        
        const hint = this.problemData.operation === 'addition' 
            ? `Start at ${this.problemData.start_position} and move ${this.problemData.change_amount} steps to the right`
            : `Start at ${this.problemData.start_position} and move ${this.problemData.change_amount} steps to the left`;
        
        this.showInfo(hint);
    }

    showInfo(message) {
        const infoDiv = document.getElementById('infoDisplay');
        if (infoDiv) {
            infoDiv.innerHTML = message || 'Number line visualization loaded';
        }
    }

    reset() {
        this.isAnimating = false;
        this.currentStep = 0;
        this.drawNumberLine();
        this.showInfo();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawNumberLine();
        });
    }
}

// Complete AreaModelVisualizer (from direct_visual_launcher.html)
class AreaModelVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.problemData = null;
        this.showPartialProducts = false;
        this.isAnimating = false;
        this.animationStep = 0;
        
        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    loadProblem(problemData) {
        this.problemData = problemData;
        this.showPartialProducts = false;
        this.isAnimating = false;
        this.animationStep = 0;
        
        document.getElementById('problemStatement').textContent = problemData.problem_statement;
        this.drawAreaModel();
        this.showInfo();
        this.showDecompositionSteps();
    }

    drawAreaModel() {
        if (!this.problemData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        MathVisualUtils.drawGrid(ctx, width, height, 20, '#00ff00', 0.1);

        // Calculate area model parameters
        const padding = 40;
        const modelWidth = width - 2 * padding;
        const modelHeight = height - 2 * padding;

        const length = this.problemData.dimensions.length;
        const width_dim = this.problemData.dimensions.width;

        // Scale to fit canvas
        const maxDimension = Math.max(length, width_dim);
        const scale = Math.min(modelWidth / maxDimension, modelHeight / maxDimension) * 0.8;
        
        const scaledLength = length * scale;
        const scaledWidth = width_dim * scale;
        
        const startX = padding + (modelWidth - scaledLength) / 2;
        const startY = padding + (modelHeight - scaledWidth) / 2;

        // Draw main rectangle
        this.drawRectangle(startX, startY, scaledLength, scaledWidth, '#00ff00', 2);

        // Draw grid lines inside rectangle
        this.drawInternalGrid(startX, startY, scaledLength, scaledWidth, length, width_dim);

        // Draw labels
        this.drawLabels(startX, startY, scaledLength, scaledWidth, length, width_dim);

        // Draw partial products if enabled
        if (this.showPartialProducts && this.problemData.partial_products) {
            this.drawPartialProducts(startX, startY, scaledLength, scaledWidth, length, width_dim);
        }
    }

    drawRectangle(x, y, width, height, color, lineWidth) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    }

    drawInternalGrid(startX, startY, scaledLength, scaledWidth, length, width_dim) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;

        const cellWidth = scaledLength / length;
        const cellHeight = scaledWidth / width_dim;

        // Vertical lines
        for (let i = 1; i < length; i++) {
            const x = startX + i * cellWidth;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, startY + scaledWidth);
            ctx.stroke();
        }

        // Horizontal lines
        for (let i = 1; i < width_dim; i++) {
            const y = startY + i * cellHeight;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + scaledLength, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawLabels(startX, startY, scaledLength, scaledWidth, length, width_dim) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.fillStyle = '#00ff00';
        ctx.font = '14px Courier New, monospace';
        ctx.textAlign = 'center';

        // Draw dimension labels
        const centerX = startX + scaledLength / 2;
        const centerY = startY + scaledWidth / 2;

        MathVisualUtils.drawGlowText(ctx, `${length}`, centerX, startY - 20, 14);
        MathVisualUtils.drawGlowText(ctx, `${width_dim}`, startX - 20, centerY, 14);
        MathVisualUtils.drawGlowText(ctx, `Area = ${length} × ${width_dim} = ${this.problemData.total_area}`, 
            centerX, startY + scaledWidth + 20, 14);

        ctx.restore();
    }

    drawPartialProducts(startX, startY, scaledLength, scaledWidth, length, width_dim) {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.strokeStyle = '#ffff00';
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.lineWidth = 2;

        const cellWidth = scaledLength / length;
        const cellHeight = scaledWidth / width_dim;

        for (const partial of this.problemData.partial_products) {
            if (partial.coordinates && partial.coordinates.length > 0) {
                const regionX = startX + partial.coordinates[0][0] * cellWidth;
                const regionY = startY + partial.coordinates[0][1] * cellHeight;
                const regionWidth = partial.length * cellWidth;
                const regionHeight = partial.width * cellHeight;

                // Draw highlight
                ctx.fillRect(regionX, regionY, regionWidth, regionHeight);
                ctx.strokeRect(regionX, regionY, regionWidth, regionHeight);

                // Draw area label
                const labelX = regionX + regionWidth / 2;
                const labelY = regionY + regionHeight / 2;
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(`${partial.area}`, labelX, labelY);
            }
        }

        ctx.restore();
    }

    showHint() {
        if (!this.problemData) return;

        const hint = this.getHint();
        this.showInfo(hint);
    }

    getHint() {
        if (this.problemData.strategy === 'standard') {
            return `Find the area of a rectangle that is ${this.problemData.dimensions.length} units long and ${this.problemData.dimensions.width} units wide`;
        } else if (this.problemData.strategy === 'partial_products') {
            return `Break ${this.problemData.dimensions.length} × ${this.problemData.dimensions.width} into smaller rectangles and add their areas`;
        } else {
            return `Use the distributive property: break one dimension into two parts`;
        }
    }

    animate() {
        if (!this.problemData || this.isAnimating || !this.problemData.partial_products) return;
        
        this.isAnimating = true;
        this.animationStep = 0;
        this.showInfo('Starting decomposition animation...');
        
        // Animate step by step
        this.animateStep();
    }

    animateStep() {
        if (!this.isAnimating) return;
        
        // Check if we've completed all partial products
        if (this.animationStep >= this.problemData.partial_products.length) {
            // Final step: show the addition of partial products
            this.drawAreaModel();
            this.showFinalCalculation();
            this.isAnimating = false;
            this.showInfo('Animation complete - final calculation shown');
            return;
        }

        // Clear and redraw
        this.drawAreaModel();

        // Highlight current partial product
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        const padding = 40;
        const modelWidth = width - 2 * padding;
        const modelHeight = height - 2 * padding;

        const length = this.problemData.dimensions.length;
        const width_dim = this.problemData.dimensions.width;
        const maxDimension = Math.max(length, width_dim);
        const scale = Math.min(modelWidth / maxDimension, modelHeight / maxDimension) * 0.8;
        
        const scaledLength = length * scale;
        const scaledWidth = width_dim * scale;
        const startX = padding + (modelWidth - scaledLength) / 2;
        const startY = padding + (modelHeight - scaledWidth) / 2;

        const cellWidth = scaledLength / length;
        const cellHeight = scaledWidth / width_dim;

        const partial = this.problemData.partial_products[this.animationStep];
        
        // Highlight current step
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        
        if (partial.coordinates && partial.coordinates.length > 0) {
            const regionX = startX + partial.coordinates[0][0] * cellWidth;
            const regionY = startY + partial.coordinates[0][1] * cellHeight;
            const regionWidth = partial.length * cellWidth;
            const regionHeight = partial.width * cellHeight;
            
            ctx.fillRect(regionX, regionY, regionWidth, regionHeight);
            ctx.strokeRect(regionX, regionY, regionWidth, regionHeight);

            // Show step info with dark background
            const labelX = regionX + regionWidth / 2;
            const labelY = regionY + regionHeight / 2;
            const text = `${partial.length} × ${partial.width} = ${partial.area}`;
            
            // Draw dark background behind text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(labelX - 40, labelY - 10, 80, 20);
            
            MathVisualUtils.drawGlowText(ctx, text, 
                labelX, labelY, 14, '#ffffff');
        } else {
            // Fallback: highlight entire rectangle for this partial product
            const regionWidth = partial.length * cellWidth;
            const regionHeight = partial.width * cellHeight;
            const regionX = startX;
            const regionY = startY;
            
            ctx.fillRect(regionX, regionY, regionWidth, regionHeight);
            ctx.strokeRect(regionX, regionY, regionWidth, regionHeight);

            // Show step info with dark background
            const labelX = regionX + regionWidth / 2;
            const labelY = regionY + regionHeight / 2;
            const text = `${partial.length} × ${partial.width} = ${partial.area}`;
            
            // Draw dark background behind text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(labelX - 40, labelY - 10, 80, 20);
            
            MathVisualUtils.drawGlowText(ctx, text, 
                labelX, labelY, 14, '#ffffff');
        }

        ctx.restore();

        // Update info
        this.showInfo(`Step ${this.animationStep + 1}: ${partial.length} × ${partial.width} = ${partial.area}`);

        this.animationStep++;
        setTimeout(() => this.animateStep(), 3000); // Slower timing (3 seconds instead of 1.5)
    }

    showFinalCalculation() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width / window.devicePixelRatio;
        const height = canvas.height / window.devicePixelRatio;
        
        // Draw final calculation at the bottom
        const totalArea = this.problemData.total_area;
        const partialProducts = this.problemData.partial_products;
        
        // Create addition string
        const additions = partialProducts.map(p => p.area.toString()).join(' + ');
        const finalText = `${additions} = ${totalArea}`;
        
        // Position at bottom center
        const textX = width / 2;
        const textY = height - 20;
        
        // Draw dark background behind text
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const textWidth = ctx.measureText(finalText).width;
        ctx.fillRect(textX - textWidth/2 - 10, textY - 15, textWidth + 20, 30);
        
        // Draw white text
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(finalText, textX, textY);
        ctx.restore();
    }

    showInfo(message) {
        const infoDiv = document.getElementById('infoDisplay');
        if (infoDiv) {
            infoDiv.innerHTML = message || 'Area model visualization loaded';
        }
    }

    showDecompositionSteps() {
        const stepsDiv = document.getElementById('decompositionSteps');
        if (stepsDiv && this.problemData.decomposition_steps) {
            stepsDiv.innerHTML = this.problemData.decomposition_steps.map(step => 
                `<div class="step">${step}</div>`
            ).join('');
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawAreaModel();
        });
    }
}

class DivisionAreaModelVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.problemData = null;
    }
    
    loadProblem(problemData) {
        this.problemData = problemData;
        document.getElementById('problemStatement').textContent = problemData.problem_statement;
        this.showInfo('Division area model visualization - coming soon!');
    }
    
    animate() { this.showInfo('Division area model animation - coming soon!'); }
    showHint() { this.showInfo('Division area model hint - coming soon!'); }
    reset() { this.showInfo('Division area model reset - coming soon!'); }
    
    showInfo(message) {
        const infoDiv = document.getElementById('infoDisplay');
        if (infoDiv) {
            infoDiv.innerHTML = message || 'Division area model visualization loaded';
        }
    }
}

class QuotativeVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.problemData = null;
    }
    
    loadProblem(problemData) {
        this.problemData = problemData;
        document.getElementById('problemStatement').textContent = problemData.problem_statement;
        this.showInfo('Quotative visualization - coming soon!');
    }
    
    animate() { this.showInfo('Quotative animation - coming soon!'); }
    showHint() { this.showInfo('Quotative hint - coming soon!'); }
    reset() { this.showInfo('Quotative reset - coming soon!'); }
    
    showInfo(message) {
        const infoDiv = document.getElementById('infoDisplay');
        if (infoDiv) {
            infoDiv.innerHTML = message || 'Quotative visualization loaded';
        }
    }
}