import { DrawingCanvas } from './DrawingCanvas.js';
import { FontGenerator } from './FontGenerator.js';
import { PreviewArea } from './PreviewArea.js';
import { DrawingTools } from './DrawingTools.js';

class App {
    constructor() {
        this.characters = this.getCharacterSet();
        this.drawingCanvases = new Map();
        this.drawingTools = new DrawingTools();
        this.fontGenerator = new FontGenerator();
        this.previewArea = null;
        
        this.init();
    }
    
    getCharacterSet() {
        // Basic Latin characters and numbers
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        const lowercase = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const numbers = '0123456789'.split('');
        const basic = '.,-!?'.split('');
        
        return [...uppercase, ...lowercase, ...numbers, ...basic];
    }
    
    init() {
        this.createCharacterGrid();
        this.setupPreviewArea();
        this.bindEvents();
        
        // Update todo
        this.updateTodoStatus(1, 'completed');
    }
    
    createCharacterGrid() {
        const grid = document.getElementById('characters-grid');
        
        this.characters.forEach(char => {
            const charBox = document.createElement('div');
            charBox.className = 'char-box';
            
            const label = document.createElement('div');
            label.className = 'char-label';
            label.textContent = char;
            
            const canvas = document.createElement('canvas');
            canvas.className = 'char-canvas';
            canvas.dataset.character = char;
            
            charBox.appendChild(label);
            charBox.appendChild(canvas);
            grid.appendChild(charBox);
            
            // Create drawing canvas instance
            const drawingCanvas = new DrawingCanvas(canvas, char);
            this.drawingCanvases.set(char, drawingCanvas);
            this.drawingTools.registerCanvas(drawingCanvas);
        });
        
        // Update todos
        this.updateTodoStatus(2, 'completed');
        this.updateTodoStatus(3, 'completed');
    }
    
    setupPreviewArea() {
        const textArea = document.getElementById('preview-text');
        const canvas = document.getElementById('preview-canvas');
        this.previewArea = new PreviewArea(textArea, canvas);
    }
    
    bindEvents() {
        // Create font button
        const createBtn = document.getElementById('create-font');
        createBtn.addEventListener('click', () => {
            this.createFont();
        });
        
        // Export buttons
        document.getElementById('download-ttf').addEventListener('click', () => {
            const fontName = document.getElementById('font-name').value || 'MyCustomFont';
            const author = document.getElementById('font-author').value || 'Anonymous';
            this.fontGenerator.downloadTTF(fontName, author);
        });
        
        document.getElementById('download-otf').addEventListener('click', () => {
            const fontName = document.getElementById('font-name').value || 'MyCustomFont';
            const author = document.getElementById('font-author').value || 'Anonymous';
            this.fontGenerator.downloadOTF(fontName, author);
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.drawingTools.selectTool('pen');
                        break;
                    case '2':
                        e.preventDefault();
                        this.drawingTools.selectTool('eraser');
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.clearAll();
                        }
                        break;
                }
            }
        });
    }
    
    createFont() {
        // Clear previous font data
        this.fontGenerator.glyphs.clear();
        
        // Collect character data
        let hasCharacters = false;
        this.drawingCanvases.forEach((canvas, char) => {
            if (!canvas.isEmpty()) {
                hasCharacters = true;
                this.fontGenerator.addCharacter(canvas.getCharacterData());
            }
        });
        
        if (!hasCharacters) {
            alert('Please draw at least one character before creating the font.');
            return;
        }
        
        // Generate and preview font
        const fontName = document.getElementById('font-name').value || 'MyCustomFont';
        const author = document.getElementById('font-author').value || 'Anonymous';
        const font = this.fontGenerator.generateFont(fontName, author);
        
        // Enable preview
        this.previewArea.setFont(font);
        
        // Enable export buttons
        document.getElementById('download-ttf').disabled = false;
        document.getElementById('download-otf').disabled = false;
        
        // Update todos
        this.updateTodoStatus(4, 'completed');
        this.updateTodoStatus(5, 'completed');
        this.updateTodoStatus(6, 'completed');
    }
    
    clearAll() {
        if (confirm('Clear all drawings? This cannot be undone.')) {
            this.drawingTools.clearAll();
            this.previewArea.reset();
            document.getElementById('download-ttf').disabled = true;
            document.getElementById('download-otf').disabled = true;
        }
    }
    
    updateTodoStatus(id, status) {
        // This is a placeholder for todo updates
        console.log(`Todo ${id} status: ${status}`);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    console.log('MyFont Creator initialized');
    console.log('Keyboard shortcuts:');
    console.log('- Ctrl/Cmd + 1: Select pen tool');
    console.log('- Ctrl/Cmd + 2: Select eraser tool');
    console.log('- Ctrl/Cmd + Shift + C: Clear all');
});