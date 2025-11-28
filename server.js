const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(express.static('public'));
app.use('/background_images', express.static('background_images'));
app.use('/output_images', express.static('output_images'));

const FONT_DIR = path.join(__dirname, 'Font');
const BG_DIR = path.join(__dirname, 'background_images');
const OUTPUT_DIR = path.join(__dirname, 'output_images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

// Register fonts
const availableFonts = [];
if (fs.existsSync(FONT_DIR)) {
    fs.readdirSync(FONT_DIR).forEach(file => {
        if (file.toLowerCase().endsWith('.ttf') || file.toLowerCase().endsWith('.otf') || file.toLowerCase().endsWith('.ttc')) {
            const fontPath = path.join(FONT_DIR, file);
            // Use filename as family name for simplicity
            registerFont(fontPath, { family: file });
            availableFonts.push(file);
        }
    });
}

// API to get available fonts
app.get('/api/fonts', (req, res) => {
    res.json(availableFonts);
});

// API to get available backgrounds
app.get('/api/backgrounds', (req, res) => {
    if (fs.existsSync(BG_DIR)) {
        const files = fs.readdirSync(BG_DIR).filter(file => {
            return file.toLowerCase().endsWith('.png') || 
                   file.toLowerCase().endsWith('.jpg') || 
                   file.toLowerCase().endsWith('.jpeg');
        });
        res.json(files);
    } else {
        res.json([]);
    }
});

// Helper to calculate wrapped text
function calculateWrappedText(ctx, text, maxWidth, fontSize) {
    const lines = [];
    const paragraphs = text.split('\n');
    
    // Estimate line height (simple approximation)
    const lineHeight = fontSize * 1.2;

    for (const paragraph of paragraphs) {
        let currentLine = '';
        for (const char of paragraph) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
    }
    
    return {
        lines,
        totalHeight: lines.length * lineHeight,
        lineHeight
    };
}

// API to generate image
app.post('/api/generate', async (req, res) => {
    try {
        const { 
            text, 
            bgImage, 
            fontFile, 
            fontSize = 100, 
            textColor = '#ffffff', 
            useOutline = false, 
            outlineWidth = 2,
            useBold = false
        } = req.body;

        if (!bgImage) {
            return res.status(400).json({ error: 'Background image is required' });
        }
        
        console.log(`Received request for bgImage: ${bgImage}`);


        const bgPath = path.join(BG_DIR, bgImage);
        if (!fs.existsSync(bgPath)) {
            return res.status(404).json({ error: 'Background image not found' });
        }

        // Load background
        // Read file into buffer first to avoid path encoding issues in canvas native bindings
        const imageBuffer = await fs.promises.readFile(bgPath);
        const image = await loadImage(imageBuffer);
        
        // Create canvas (fixed size 900x900 as per Python code)
        const width = 900;
        const height = 900;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw background with cover mode
        const imgAspectRatio = image.width / image.height;
        const canvasAspectRatio = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas - fit to height, crop sides
            drawHeight = height;
            drawWidth = image.width * (height / image.height);
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas - fit to width, crop top/bottom
            drawWidth = width;
            drawHeight = image.height * (width / image.width);
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

        if (text) {
            // Text Drawing Logic
            const drawAreaW = 800;
            const drawAreaBottomY = 880;
            const drawAreaLimitH = 300; // Limit text to bottom area

            let currentSize = parseInt(fontSize);
            const minSize = 20;
            let finalLines = [];
            let finalLineHeight = 0;
            
            // Font loading
            // In node-canvas, we use the family name we registered
            const fontFamily = fontFile || (availableFonts.length > 0 ? availableFonts[0] : 'sans-serif');
            
            // Auto-sizing loop
            while (currentSize >= minSize) {
                // Set font
                const fontWeight = useBold ? 'bold' : 'normal';
                ctx.font = `${fontWeight} ${currentSize}px "${fontFamily}"`;
                
                const { lines, totalHeight, lineHeight } = calculateWrappedText(ctx, text, drawAreaW, currentSize);
                
                if (totalHeight <= drawAreaLimitH) {
                    finalLines = lines;
                    finalLineHeight = lineHeight;
                    break;
                }
                
                currentSize -= 5;
            }

            // If still too big, use min size
            if (finalLines.length === 0) {
                 const fontWeight = useBold ? 'bold' : 'normal';
                 currentSize = minSize;
                 ctx.font = `${fontWeight} ${currentSize}px "${fontFamily}"`;
                 const result = calculateWrappedText(ctx, text, drawAreaW, currentSize);
                 finalLines = result.lines;
                 finalLineHeight = result.lineHeight;
            }

            // Draw text
            const totalH = finalLines.length * finalLineHeight;
            let startY = drawAreaBottomY - totalH; // Bottom align
            // Adjust for baseline (canvas draws text from baseline, not top-left of box usually, but we calculated Y as top)
            // Actually measureText gives actual bounding box, but simplified approach:
            // ctx.textBaseline = 'top';
            ctx.textBaseline = 'top'; // Easier to handle

            // Helper to draw with outline
            const drawTextLine = (line, x, y) => {
                if (useOutline) {
                    ctx.lineWidth = parseInt(outlineWidth) * 2; // Stroke is centered, so *2 for visual width
                    ctx.strokeStyle = '#000000';
                    ctx.strokeText(line, x, y);
                }
                ctx.fillStyle = textColor;
                ctx.fillText(line, x, y);
            };

            for (let i = 0; i < finalLines.length; i++) {
                const line = finalLines[i];
                const metrics = ctx.measureText(line);
                const lineW = metrics.width;
                const x = (width - lineW) / 2; // Center horizontally
                const y = startY + (i * finalLineHeight);
                
                drawTextLine(line, x, y);
            }
        }

        // Save image with optimized compression
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const filename = `${timestamp}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);
        
        // Use higher quality PNG compression
        const buffer = canvas.toBuffer('image/png', {
            compressionLevel: 0, // 0 = no compression (best quality), 9 = max compression
            filters: canvas.PNG_FILTER_NONE
        });
        fs.writeFileSync(outputPath, buffer);

        res.json({ 
            success: true, 
            imageUrl: `/output_images/${filename}`,
            filename: filename
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`External access: http://your-public-ip:${PORT} (replace with your actual public IP)`);
});
