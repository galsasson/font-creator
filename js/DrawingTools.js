export class DrawingTools {
    constructor() {
        this.currentTool = 'pen';
        this.strokeWidth = 3;
        this.canvases = [];
        
        this.bindEvents();
    }
    
    bindEvents() {
        // Tool selection
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                const toolType = tool.dataset.tool;
                this.selectTool(toolType);
            });
        });
        
        // Stroke width control
        const strokeSlider = document.getElementById('stroke-width');
        const widthValue = document.getElementById('width-value');
        
        strokeSlider.addEventListener('input', (e) => {
            this.strokeWidth = parseInt(e.target.value);
            widthValue.textContent = this.strokeWidth;
            this.updateCanvases();
        });
    }
    
    selectTool(toolType) {
        this.currentTool = toolType;
        
        // Update UI
        document.querySelectorAll('.tool').forEach(tool => {
            tool.classList.remove('active');
        });
        document.querySelector(`[data-tool="${toolType}"]`).classList.add('active');
        
        // Update all canvases
        this.updateCanvases();
    }
    
    registerCanvas(drawingCanvas) {
        this.canvases.push(drawingCanvas);
        drawingCanvas.setTool(this.currentTool);
        drawingCanvas.setStrokeWidth(this.strokeWidth);
    }
    
    updateCanvases() {
        this.canvases.forEach(canvas => {
            canvas.setTool(this.currentTool);
            canvas.setStrokeWidth(this.strokeWidth);
        });
    }
    
    clearAll() {
        this.canvases.forEach(canvas => {
            canvas.clear();
        });
    }
}