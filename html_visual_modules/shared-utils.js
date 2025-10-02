/*!
 * Math Blaster Visual Modules - Shared JavaScript Utilities
 * Common functions for all visual math components
 */

class MathVisualUtils {
    /**
     * Create a canvas element with proper styling
     */
    static createCanvas(width = 400, height = 300, className = 'math-visual-canvas') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.className = className;
        return canvas;
    }

    /**
     * Get canvas context with proper settings
     */
    static getCanvasContext(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        return ctx;
    }

    /**
     * Draw a grid on canvas
     */
    static drawGrid(ctx, width, height, gridSize = 20, color = '#00ff00', opacity = 0.3) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw text with glow effect
     */
    static drawGlowText(ctx, text, x, y, fontSize = 16, color = '#00ff00') {
        ctx.save();
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }

    /**
     * Draw a highlighted rectangle
     */
    static drawHighlightRect(ctx, x, y, width, height, color = '#00ff00', opacity = 0.3) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    }

    /**
     * Draw an arrow
     */
    static drawArrow(ctx, startX, startY, endX, endY, color = '#00ff00', lineWidth = 3) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Animate a value over time
     */
    static animateValue(start, end, duration, callback) {
        const startTime = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (end - start) * easeProgress;
            
            callback(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    /**
     * Create a pulsing effect
     */
    static createPulseEffect(element, duration = 1000) {
        element.classList.add('math-highlight');
        setTimeout(() => {
            element.classList.remove('math-highlight');
        }, duration);
    }

    /**
     * Validate numeric input
     */
    static validateNumericInput(value) {
        const num = parseInt(value);
        return !isNaN(num) && isFinite(num);
    }

    /**
     * Format number for display
     */
    static formatNumber(num) {
        return num.toString();
    }

    /**
     * Create feedback message element
     */
    static createFeedbackMessage(message, type = 'hint') {
        const feedback = document.createElement('div');
        feedback.className = `math-feedback ${type}`;
        feedback.textContent = message;
        return feedback;
    }

    /**
     * Show feedback with animation
     */
    static showFeedback(container, message, type = 'hint', duration = 3000) {
        // Remove existing feedback
        const existingFeedback = container.querySelector('.math-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Create and show new feedback
        const feedback = this.createFeedbackMessage(message, type);
        container.appendChild(feedback);

        // Auto-remove after duration
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, duration);
    }

    /**
     * Create control button
     */
    static createButton(text, onClick, className = 'math-btn') {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    }

    /**
     * Create answer input
     */
    static createAnswerInput(onSubmit, placeholder = 'Enter answer') {
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'math-answer-input';
        input.placeholder = placeholder;
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                onSubmit(input.value);
            }
        });
        
        return input;
    }

    /**
     * Scale coordinates to fit canvas
     */
    static scaleCoordinates(coords, canvasWidth, canvasHeight, padding = 40) {
        const minX = Math.min(...coords.map(c => c.x));
        const maxX = Math.max(...coords.map(c => c.x));
        const minY = Math.min(...coords.map(c => c.y));
        const maxY = Math.max(...coords.map(c => c.y));

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;

        const scaleX = (canvasWidth - 2 * padding) / rangeX;
        const scaleY = (canvasHeight - 2 * padding) / rangeY;
        const scale = Math.min(scaleX, scaleY);

        return coords.map(coord => ({
            x: padding + (coord.x - minX) * scale,
            y: padding + (coord.y - minY) * scale
        }));
    }

    /**
     * Debounce function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathVisualUtils;
}
