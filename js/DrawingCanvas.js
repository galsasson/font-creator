export class DrawingCanvas {
    constructor(canvas, character) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.character = character;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.strokeWidth = 3;
        this.paths = [];
        this.currentPath = [];
        
        this.setupCanvas();
        this.bindEvents();
    }
    
    setupCanvas() {
        this.canvas.width = 80;
        this.canvas.height = 80;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.clear();
    }
    
    bindEvents() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        
        if (e.type === 'touchstart') {
            this.startDrawing(mouseEvent);
        } else {
            this.draw(mouseEvent);
        }
    }
    
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'pen') {
            this.currentPath = [{x: pos.x, y: pos.y}];
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        }
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'pen') {
            this.currentPath.push({x: pos.x, y: pos.y});
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = this.strokeWidth;
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, this.strokeWidth * 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    stopDrawing() {
        if (this.isDrawing && this.currentTool === 'pen' && this.currentPath.length > 0) {
            this.paths.push({
                points: [...this.currentPath],
                width: this.strokeWidth
            });
        }
        this.isDrawing = false;
        this.currentPath = [];
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    setTool(tool) {
        this.currentTool = tool;
        this.canvas.style.cursor = tool === 'eraser' ? 'grab' : 'crosshair';
    }
    
    setStrokeWidth(width) {
        this.strokeWidth = width;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.paths = [];
        this.drawGrid();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        
        // Draw center lines
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.moveTo(0, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
        this.ctx.stroke();
    }
    
    getCharacterData() {
        return {
            character: this.character,
            paths: this.paths,
            canvas: this.canvas,
            imageData: this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
        };
    }
    
    isEmpty() {
        return this.paths.length === 0;
    }
}