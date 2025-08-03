export class PreviewArea {
    constructor(textArea, canvas) {
        this.textArea = textArea;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.font = null;
        this.fontSize = 24;
        this.lineHeight = 1.5;
        this.padding = 20;
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        // Set canvas size to match textarea
        const rect = this.textArea.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Style canvas to match textarea
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.canvas.style.padding = '15px';
        this.canvas.style.border = '1px solid #ddd';
        this.canvas.style.borderRadius = '4px';
        this.canvas.style.backgroundColor = '#fff';
    }
    
    bindEvents() {
        // Update preview when text changes
        this.textArea.addEventListener('input', () => {
            if (this.font) {
                this.renderText();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            if (this.font) {
                this.renderText();
            }
        });
    }
    
    setFont(font) {
        this.font = font;
        this.textArea.disabled = false;
        this.textArea.style.display = 'none';
        this.canvas.style.display = 'block';
        this.renderText();
    }
    
    renderText() {
        if (!this.font) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const text = this.textArea.value;
        const lines = text.split('\n');
        
        let y = this.padding + this.fontSize;
        
        lines.forEach(line => {
            let x = this.padding;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                // Get glyph data from our font generator
                const glyphData = this.font.glyphs.get(char);
                
                if (glyphData) {
                    const scale = this.fontSize / this.font.unitsPerEm;
                    
                    // Draw the glyph paths
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';
                    
                    glyphData.paths.forEach(path => {
                        // Use the original stroke width from the drawing
                        const strokeWidth = path.strokeWidth || 3;
                        const scaledWidth = Math.max(1, (strokeWidth * scale));
                        this.ctx.lineWidth = scaledWidth;
                        
                        this.ctx.beginPath();
                        
                        // Convert font coordinates to canvas coordinates
                        const points = path.commands || [];
                        if (points.length > 0) {
                            points.forEach(cmd => {
                                if (cmd.type === 'M') { // moveTo
                                    const canvasX = x + (cmd.x * scale);
                                    const canvasY = y - (cmd.y * scale);
                                    this.ctx.moveTo(canvasX, canvasY);
                                } else if (cmd.type === 'L') { // lineTo
                                    const canvasX = x + (cmd.x * scale);
                                    const canvasY = y - (cmd.y * scale);
                                    this.ctx.lineTo(canvasX, canvasY);
                                } else if (cmd.type === 'Q') { // quadraticCurveTo
                                    const cpX = x + (cmd.x1 * scale);
                                    const cpY = y - (cmd.y1 * scale);
                                    const endX = x + (cmd.x2 * scale);
                                    const endY = y - (cmd.y2 * scale);
                                    this.ctx.quadraticCurveTo(cpX, cpY, endX, endY);
                                } else if (cmd.type === 'C') { // bezierCurveTo
                                    const cp1X = x + (cmd.x1 * scale);
                                    const cp1Y = y - (cmd.y1 * scale);
                                    const cp2X = x + (cmd.x2 * scale);
                                    const cp2Y = y - (cmd.y2 * scale);
                                    const endX = x + (cmd.x3 * scale);
                                    const endY = y - (cmd.y3 * scale);
                                    this.ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
                                }
                            });
                            
                            this.ctx.stroke();
                        }
                    });
                    
                    // Calculate advance
                    const advance = glyphData.advanceWidth * scale;
                    
                    // Apply kerning if next character exists
                    if (i < line.length - 1) {
                        const nextChar = line[i + 1];
                        const nextGlyphData = this.font.glyphs.get(nextChar);
                        if (nextGlyphData) {
                            // Simple kerning based on character pairs
                            const kerning = this.getKerning(char, nextChar);
                            x += advance + (kerning * scale);
                        } else {
                            x += advance;
                        }
                    } else {
                        x += advance;
                    }
                } else if (char === ' ') {
                    // Space character
                    x += this.fontSize * 0.3;
                }
                
                // Wrap text if needed
                if (x > this.canvas.width - this.padding) {
                    x = this.padding;
                    y += this.fontSize * this.lineHeight;
                }
            }
            
            y += this.fontSize * this.lineHeight;
        });
    }
    
    getKerning(char1, char2) {
        // Simple kerning table for common pairs
        const kerningPairs = {
            'AV': -80, 'AW': -60, 'AY': -90, 'Av': -40, 'Aw': -40, 'Ay': -40,
            'FA': -80, 'Fa': -40, 'Fe': -40, 'LT': -90, 'LV': -110, 'LW': -90,
            'LY': -120, 'Ly': -40, 'PA': -100, 'Pa': -30, 'Pe': -30,
            'TA': -90, 'Ta': -90, 'Te': -90, 'To': -90, 'Tr': -40, 'Tu': -90,
            'VA': -80, 'Va': -70, 'Ve': -70, 'Vo': -70, 'Vu': -40,
            'WA': -60, 'Wa': -50, 'We': -50, 'Wo': -50, 'Wu': -30,
            'YA': -90, 'Ya': -90, 'Ye': -90, 'Yo': -90, 'Yu': -70,
            'av': -20, 'aw': -20, 'ay': -20, 'ff': -20, 'ov': -20, 'ow': -20,
            'oy': -20, 'va': -20, 've': -20, 'vo': -20, 'wa': -20, 'we': -20,
            'wo': -20, 'ya': -20, 'ye': -20, 'yo': -20
        };
        
        const pair = char1 + char2;
        return kerningPairs[pair] || 0;
    }
    
    updateFontSize(size) {
        this.fontSize = size;
        if (this.font) {
            this.renderText();
        }
    }
    
    reset() {
        this.font = null;
        this.textArea.disabled = true;
        this.textArea.style.display = 'block';
        this.canvas.style.display = 'none';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}