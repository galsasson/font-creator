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
        const { character, paths, canvas, imageData } = charData;
        
        // Calculate bounding box
        const bounds = this.calculateBounds(imageData);
        if (!bounds) return; // Empty character
        
        // Convert canvas paths to font paths
        const fontPaths = this.convertToFontPaths(paths, canvas, bounds);
        
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
        
        paths.forEach(path => {
            if (path.points.length < 2) return;
            
            const commands = [];
            const firstPoint = path.points[0];
            
            // Normalize and scale coordinates
            const x0 = (firstPoint.x - bounds.minX) * scale;
            const y0 = (bounds.maxY - firstPoint.y) * scale; // Flip Y coordinate
            
            commands.push({ type: 'M', x: x0, y: y0 }); // moveTo
            
            // Convert to smooth curves
            for (let i = 1; i < path.points.length; i++) {
                const point = path.points[i];
                const x = (point.x - bounds.minX) * scale;
                const y = (bounds.maxY - point.y) * scale;
                
                if (i < path.points.length - 1) {
                    // Use quadratic curves for smoother lines
                    const nextPoint = path.points[i + 1];
                    const nextX = (nextPoint.x - bounds.minX) * scale;
                    const nextY = (bounds.maxY - nextPoint.y) * scale;
                    
                    const cpX = x;
                    const cpY = y;
                    const endX = (x + nextX) / 2;
                    const endY = (y + nextY) / 2;
                    
                    commands.push({ 
                        type: 'Q', 
                        x1: cpX, y1: cpY, 
                        x2: endX, y2: endY 
                    }); // quadraticCurveTo
                } else {
                    commands.push({ type: 'L', x: x, y: y }); // lineTo
                }
            }
            
            fontPaths.push({ 
                commands: commands,
                strokeWidth: path.width || 3 // Preserve original stroke width
            });
        });
        
        return fontPaths;
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
            const path = new opentype.Path();
            
            // Convert our custom path format to opentype.js paths
            glyphData.paths.forEach(p => {
                if (p.commands) {
                    p.commands.forEach(cmd => {
                        if (cmd.type === 'M') {
                            path.moveTo(cmd.x, cmd.y);
                        } else if (cmd.type === 'L') {
                            path.lineTo(cmd.x, cmd.y);
                        } else if (cmd.type === 'Q') {
                            path.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2);
                        } else if (cmd.type === 'C') {
                            path.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x3, cmd.y3);
                        }
                    });
                }
            });
            
            const glyph = new opentype.Glyph({
                name: character,
                unicode: character.charCodeAt(0),
                advanceWidth: glyphData.advanceWidth,
                path: path
            });
            
            glyphs.push(glyph);
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