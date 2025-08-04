export class FontGenerator {
    constructor() {
        this.unitsPerEm = 1000;
        this.ascender = 800;
        this.descender = -200;
        this.capHeight = 700;
        this.xHeight = 500;
        this.glyphs = new Map();
    }
    
    addCharacter(charData) {
        const { character, canvas, imageData } = charData;
        
        // Calculate bounding box
        const bounds = this.calculateBounds(imageData);
        if (!bounds) return; // Empty character
        
        // Convert canvas bitmap to font paths
        const fontPaths = this.convertToFontPaths(null, canvas, bounds);
        
        // Calculate metrics
        const metrics = this.calculateMetrics(character, bounds, canvas);
        
        this.glyphs.set(character, {
            paths: fontPaths,
            bounds: bounds,
            metrics: metrics,
            advanceWidth: metrics.advanceWidth
        });
    }
    
    calculateBounds(imageData) {
        const { data, width, height } = imageData;
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasContent = false;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 0) { // Alpha channel
                    hasContent = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        return hasContent ? { minX, minY, maxX, maxY } : null;
    }
    
    convertToFontPaths(paths, canvas, bounds) {
        const scale = this.unitsPerEm / canvas.height;
        const fontPaths = [];
        
        // Get the image data from the canvas
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data, width, height } = imageData;
        
        // Convert bitmap to paths
        const bitmapPaths = this.bitmapToPaths(data, width, height, bounds, scale);
        
        return bitmapPaths;
    }
    
    bitmapToPaths(imageData, width, height, bounds, scale) {
        const paths = [];
        const visited = new Set();
        
        // Find all connected components (drawn areas)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = imageData[idx + 3];
                
                if (alpha > 128 && !visited.has(`${x},${y}`)) {
                    // Found a new connected component
                    const component = this.floodFill(imageData, width, height, x, y, visited);
                    if (component.length > 0) {
                        const path = this.componentToPath(component, bounds, scale);
                        if (path.commands.length > 0) {
                            paths.push(path);
                        }
                    }
                }
            }
        }
        
        return paths;
    }
    
    floodFill(imageData, width, height, startX, startY, visited) {
        const component = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            const idx = (y * width + x) * 4;
            const alpha = imageData[idx + 3];
            
            if (alpha > 128) {
                component.push({x, y});
                
                // Add neighbors
                const neighbors = [
                    {x: x + 1, y: y},
                    {x: x - 1, y: y},
                    {x: x, y: y + 1},
                    {x: x, y: y - 1}
                ];
                
                for (const neighbor of neighbors) {
                    if (neighbor.x >= 0 && neighbor.x < width && 
                        neighbor.y >= 0 && neighbor.y < height) {
                        stack.push(neighbor);
                    }
                }
            }
        }
        
        return component;
    }
    
    componentToPath(component, bounds, scale) {
        if (component.length === 0) return { commands: [] };
        
        // Create a bitmap representation of the component
        const bitmap = this.createBitmap(component);
        
        // Trace the contour of the component
        const contour = this.traceContour(bitmap);
        
        // Convert contour to font path
        const commands = this.contourToPath(contour, bounds, scale);
        
        return { commands, strokeWidth: 1 };
    }
    
    createBitmap(component) {
        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        component.forEach(pixel => {
            minX = Math.min(minX, pixel.x);
            minY = Math.min(minY, pixel.y);
            maxX = Math.max(maxX, pixel.x);
            maxY = Math.max(maxY, pixel.y);
        });
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const bitmap = Array(height).fill().map(() => Array(width).fill(false));
        
        // Fill the bitmap
        component.forEach(pixel => {
            const x = pixel.x - minX;
            const y = pixel.y - minY;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                bitmap[y][x] = true;
            }
        });
        
        return { bitmap, minX, minY, width, height };
    }
    
    traceContour(bitmapData) {
        const { bitmap, minX, minY, width, height } = bitmapData;
        const contour = [];
        
        // Find the first pixel on the left edge
        let startX = 0, startY = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (bitmap[y][x]) {
                    startX = x;
                    startY = y;
                    break;
                }
            }
            if (startX > 0) break;
        }
        
        if (startX === 0) return contour;
        
        // Trace the contour using a simple algorithm
        let x = startX, y = startY;
        const directions = [
            {dx: 1, dy: 0},   // right
            {dx: 0, dy: 1},   // down
            {dx: -1, dy: 0},  // left
            {dx: 0, dy: -1}   // up
        ];
        let dir = 0;
        
        do {
            contour.push({x: x + minX, y: y + minY});
            
            // Try to turn left
            const leftDir = (dir + 3) % 4;
            const leftDx = directions[leftDir].dx;
            const leftDy = directions[leftDir].dy;
            
            if (y + leftDy >= 0 && y + leftDy < height && 
                x + leftDx >= 0 && x + leftDx < width && 
                bitmap[y + leftDy][x + leftDx]) {
                dir = leftDir;
                x += leftDx;
                y += leftDy;
            } else {
                // Try to go straight
                const dx = directions[dir].dx;
                const dy = directions[dir].dy;
                
                if (y + dy >= 0 && y + dy < height && 
                    x + dx >= 0 && x + dx < width && 
                    bitmap[y + dy][x + dx]) {
                    x += dx;
                    y += dy;
                } else {
                    // Turn right
                    dir = (dir + 1) % 4;
                }
            }
        } while (!(x === startX && y === startY) && contour.length < width * height);
        
        return contour;
    }
    
    contourToPath(contour, bounds, scale) {
        if (contour.length < 3) return [];
        
        const commands = [];
        
        // Convert contour points to font coordinates
        const fontPoints = contour.map(point => ({
            x: (point.x - bounds.minX) * scale,
            y: (bounds.maxY - point.y) * scale // Flip Y
        }));
        
        // Create path from points
        commands.push({ type: 'M', x: fontPoints[0].x, y: fontPoints[0].y });
        
        for (let i = 1; i < fontPoints.length; i++) {
            commands.push({ type: 'L', x: fontPoints[i].x, y: fontPoints[i].y });
        }
        
        commands.push({ type: 'Z' }); // closePath
        
        return commands;
    }
    
    calculateMetrics(character, bounds, canvas) {
        const scale = this.unitsPerEm / canvas.height;
        const charWidth = (bounds.maxX - bounds.minX) * scale;
        
        // Base advance width on character type
        let advanceWidth;
        if (character === 'i' || character === 'l' || character === '1' || character === 'I') {
            advanceWidth = charWidth + 100; // Narrow characters
        } else if (character === 'm' || character === 'w' || character === 'M' || character === 'W') {
            advanceWidth = charWidth + 200; // Wide characters
        } else {
            advanceWidth = charWidth + 150; // Normal characters
        }
        
        // Calculate side bearings
        const leftBearing = 50;
        const rightBearing = advanceWidth - charWidth - leftBearing;
        
        return {
            advanceWidth: Math.round(advanceWidth),
            leftBearing: leftBearing,
            rightBearing: rightBearing
        };
    }
    
    generateFont(fontName, author) {
        // For preview purposes, return our custom font data structure
        // For actual font file generation, we'll use opentype.js
        return {
            glyphs: this.glyphs,
            unitsPerEm: this.unitsPerEm,
            familyName: fontName,
            author: author
        };
    }
    
    createNotdefPath() {
        const path = new opentype.Path();
        const width = 600;
        const height = 800;
        
        // Draw a rectangle with an X
        path.moveTo(100, 0);
        path.lineTo(500, 0);
        path.lineTo(500, height);
        path.lineTo(100, height);
        path.closePath();
        
        // Draw X
        path.moveTo(150, 50);
        path.lineTo(450, height - 50);
        path.moveTo(450, 50);
        path.lineTo(150, height - 50);
        
        return path;
    }
    
    addKerning(font) {
        const kerningPairs = [];
        
        // Common kerning pairs
        const commonPairs = [
            ['A', 'V', -80], ['A', 'W', -60], ['A', 'Y', -90],
            ['A', 'v', -40], ['A', 'w', -40], ['A', 'y', -40],
            ['F', 'A', -80], ['F', 'a', -40], ['F', 'e', -40],
            ['L', 'T', -90], ['L', 'V', -110], ['L', 'W', -90],
            ['L', 'Y', -120], ['L', 'y', -40],
            ['P', 'A', -100], ['P', 'a', -30], ['P', 'e', -30],
            ['T', 'A', -90], ['T', 'a', -90], ['T', 'e', -90],
            ['T', 'o', -90], ['T', 'r', -40], ['T', 'u', -90],
            ['V', 'A', -80], ['V', 'a', -70], ['V', 'e', -70],
            ['V', 'o', -70], ['V', 'u', -40],
            ['W', 'A', -60], ['W', 'a', -50], ['W', 'e', -50],
            ['W', 'o', -50], ['W', 'u', -30],
            ['Y', 'A', -90], ['Y', 'a', -90], ['Y', 'e', -90],
            ['Y', 'o', -90], ['Y', 'u', -70],
            ['a', 'v', -20], ['a', 'w', -20], ['a', 'y', -20],
            ['f', 'f', -20], ['o', 'v', -20], ['o', 'w', -20],
            ['o', 'y', -20], ['v', 'a', -20], ['v', 'e', -20],
            ['v', 'o', -20], ['w', 'a', -20], ['w', 'e', -20],
            ['w', 'o', -20], ['y', 'a', -20], ['y', 'e', -20],
            ['y', 'o', -20]
        ];
        
        // Only add kerning for pairs where both glyphs exist
        commonPairs.forEach(([left, right, value]) => {
            if (this.glyphs.has(left) && this.glyphs.has(right)) {
                kerningPairs.push({
                    left: left.charCodeAt(0),
                    right: right.charCodeAt(0),
                    value: value
                });
            }
        });
        
        if (kerningPairs.length > 0) {
            font.kerningPairs = kerningPairs;
        }
    }
    
    downloadTTF(fontName, author) {
        const font = this.createOpentypeFont(fontName, author);
        const buffer = font.toArrayBuffer();
        this.download(buffer, `${fontName}.ttf`, 'font/ttf');
    }
    
    downloadOTF(fontName, author) {
        const font = this.createOpentypeFont(fontName, author);
        const buffer = font.toArrayBuffer();
        this.download(buffer, `${fontName}.otf`, 'font/otf');
    }
    
    createOpentypeFont(fontName, author) {
        // Create notdef glyph (required)
        const notdefGlyph = new opentype.Glyph({
            name: '.notdef',
            unicode: 0,
            advanceWidth: 600,
            path: this.createNotdefPath()
        });
        
        const glyphs = [notdefGlyph];
        
        // Create glyphs for all characters
        this.glyphs.forEach((glyphData, character) => {
            try {
                const path = new opentype.Path();
                
                // Convert our custom path format to opentype.js paths
                glyphData.paths.forEach(p => {
                    if (p.commands && p.commands.length > 0) {
                        p.commands.forEach(cmd => {
                            if (cmd.type === 'M') {
                                path.moveTo(cmd.x, cmd.y);
                            } else if (cmd.type === 'L') {
                                path.lineTo(cmd.x, cmd.y);
                            } else if (cmd.type === 'Q') {
                                path.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2);
                            } else if (cmd.type === 'C') {
                                path.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x3, cmd.y3);
                            } else if (cmd.type === 'Z') {
                                path.closePath();
                            }
                        });
                    }
                });
                
                // Only add glyph if path has valid content
                if (path.commands && path.commands.length > 0) {
                    const glyph = new opentype.Glyph({
                        name: character,
                        unicode: character.charCodeAt(0),
                        advanceWidth: glyphData.advanceWidth,
                        path: path
                    });
                    
                    glyphs.push(glyph);
                }
            } catch (error) {
                console.warn(`Failed to create glyph for character '${character}':`, error);
            }
        });
        
        // Sort glyphs by unicode
        glyphs.sort((a, b) => a.unicode - b.unicode);
        
        // Create the font
        const font = new opentype.Font({
            familyName: fontName,
            styleName: 'Regular',
            unitsPerEm: this.unitsPerEm,
            ascender: this.ascender,
            descender: this.descender,
            designer: author,
            designerURL: '',
            manufacturer: 'MyFont Creator',
            manufacturerURL: '',
            license: 'Free for personal and commercial use',
            licenseURL: '',
            version: '1.0',
            description: 'Custom font created with MyFont',
            copyright: `Copyright ${new Date().getFullYear()} ${author}`,
            glyphs: glyphs
        });
        
        // Add kerning pairs
        this.addKerning(font);
        
        return font;
    }
    
    download(buffer, filename, mimeType) {
        const blob = new Blob([buffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
}