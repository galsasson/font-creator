export class PreviewArea {
    constructor(textArea) {
        this.textArea = textArea;
        this.font = null;
        this.fontName = 'CustomFont';
        this.fontUrl = null;
        this.fontSize = 24; // Default font size
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // No canvas setup needed anymore
        });
        
        // Handle font size changes
        const fontSizeInput = document.getElementById('font-size');
        const fontSizeValue = document.getElementById('font-size-value');
        
        if (fontSizeInput && fontSizeValue) {
            fontSizeInput.addEventListener('input', (e) => {
                this.fontSize = parseInt(e.target.value);
                fontSizeValue.textContent = `${this.fontSize}px`;
                this.updateFontSize();
            });
        }
    }
    
    async setFont(font) {
        this.font = font;
        
        // Generate font URL and apply CSS
        await this.generateFontCSS();
    }
    
    async generateFontCSS() {
        if (!this.font) return;
        
        try {
            // Create a unique font name
            this.fontName = `CustomFont_${Date.now()}`;
            
            // Create a temporary FontGenerator to generate the font data
            const { FontGenerator } = await import('./FontGenerator.js');
            const tempFontGenerator = new FontGenerator();
            
            // Copy glyphs from the current font
            this.font.glyphs.forEach((glyphData, char) => {
                tempFontGenerator.glyphs.set(char, glyphData);
            });
            
            // Generate the font file
            const fontName = document.getElementById('font-name')?.value || 'MyCustomFont';
            const author = document.getElementById('font-author')?.value || 'Anonymous';
            const opentypeFont = tempFontGenerator.createOpentypeFont(fontName, author);
            const fontBuffer = opentypeFont.toArrayBuffer();
            
            // Convert to base64 URL
            const fontData = new Uint8Array(fontBuffer);
            const base64 = btoa(String.fromCharCode(...fontData));
            const fontUrl = `data:font/ttf;base64,${base64}`;
            
            // Create or update CSS @font-face rule
            this.createFontFaceCSS(fontUrl);
            
            // Apply font to textarea
            this.textArea.style.fontFamily = this.fontName;
            this.textArea.style.fontSize = `${this.fontSize}px`;
            this.textArea.style.lineHeight = '1.5';
            
            console.log('Font applied successfully:', this.fontName);
        } catch (error) {
            console.error('Error generating font CSS:', error);
            // Fallback to default font
            this.textArea.style.fontFamily = '';
            this.textArea.style.fontSize = '';
            this.textArea.style.lineHeight = '';
        }
    }
    
    createFontFaceCSS(fontUrl) {
        // Remove existing font-face rule if it exists
        const existingStyle = document.getElementById('custom-font-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // Create new style element
        const style = document.createElement('style');
        style.id = 'custom-font-style';
        style.textContent = `
            @font-face {
                font-family: '${this.fontName}';
                src: url('${fontUrl}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    updateFontSize() {
        if (this.textArea) {
            this.textArea.style.fontSize = `${this.fontSize}px`;
        }
    }
    
    reset() {
        this.font = null;
        this.fontSize = 24; // Reset to default
        this.textArea.style.fontFamily = '';
        this.textArea.style.fontSize = '';
        this.textArea.style.lineHeight = '';
        
        // Reset font size control
        const fontSizeInput = document.getElementById('font-size');
        const fontSizeValue = document.getElementById('font-size-value');
        if (fontSizeInput) {
            fontSizeInput.value = this.fontSize;
        }
        if (fontSizeValue) {
            fontSizeValue.textContent = `${this.fontSize}px`;
        }
        
        // Remove custom font CSS
        const existingStyle = document.getElementById('custom-font-style');
        if (existingStyle) {
            existingStyle.remove();
        }
    }
}