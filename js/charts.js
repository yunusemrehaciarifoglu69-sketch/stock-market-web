class ChartManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.data = [];
        this.symbol = '';

        // Layout
        this.width = 0;
        this.height = 0;
        this.padding = { top: 20, right: 60, bottom: 30, left: 0 };

        // Viewport State
        this.candleWidth = 10;
        this.spacing = 4;
        this.offset = 0; // Negative moves right (into history)

        // Interaction State
        this.isDragging = false;
        this.lastMouseX = 0;

        // Settings
        this.minCandleWidth = 2;
        this.maxCandleWidth = 50;
    }

    initMainChart(containerId, data, symbol) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (container.tagName !== 'CANVAS') {
            container.innerHTML = '';
            this.canvas = document.createElement('canvas');
            // Style for cursor
            this.canvas.style.cursor = 'crosshair';
            this.canvas.style.display = 'block';
            container.appendChild(this.canvas);
        } else {
            this.canvas = container;
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = data || [];
        this.symbol = symbol;

        // Reset View on new symbol
        if (this.symbol !== symbol) {
            this.offset = 0;
            this.candleWidth = 10;
        }

        this.fitToContainer(container);
        this.setupInteractions();
        this.draw();

        // Resize Listener
        // Remove old to prevent duplicates if class re-instantiated (though singleton usage is preferred)
        // For simplicity we create a closure bound handler
        this.resizeHandler = () => {
            this.fitToContainer(container);
            this.draw();
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    fitToContainer(container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    setupInteractions() {
        const c = this.canvas;

        // Mouse Down (Start Drag)
        c.onmousedown = (e) => {
            this.isDragging = true;
            this.lastMouseX = e.offsetX;
            c.style.cursor = 'grabbing';
        };

        // Mouse Move (Pan)
        c.onmousemove = (e) => {
            if (this.isDragging) {
                const delta = e.offsetX - this.lastMouseX;
                // Sensivity adjustment
                this.offset += delta / (this.candleWidth + this.spacing);
                this.lastMouseX = e.offsetX;
                this.draw();
            } else {
                // Hover effect (Crosshair) - TODO in draw
                this.draw(e.offsetX, e.offsetY);
            }
        };

        // Mouse Up
        c.onmouseup = () => {
            this.isDragging = false;
            c.style.cursor = 'crosshair';
        };
        c.onmouseleave = () => {
            this.isDragging = false;
            this.draw(); // Clear crosshair
        };

        // Wheel (Zoom)
        c.onwheel = (e) => {
            e.preventDefault();
            const zoomIntensity = 0.1;
            if (e.deltaY < 0) {
                // Zoom In
                this.candleWidth = Math.min(this.candleWidth * (1 + zoomIntensity), this.maxCandleWidth);
            } else {
                // Zoom Out
                this.candleWidth = Math.max(this.candleWidth * (1 - zoomIntensity), this.minCandleWidth);
            }
            this.draw();
        };
    }

    updateLastCandle(candle) {
        if (!this.data.length || !candle) return;
        // Check if time matches last candle, update it
        const last = this.data[this.data.length - 1];
        if (last && (last.time === candle.time || Math.abs(last.time - candle.time) < 60)) {
            this.data[this.data.length - 1] = candle;
        } else {
            // New candle
            this.data.push(candle);
        }
        this.draw();
    }

    draw(mouseX, mouseY) {
        if (!this.ctx) return;
        const ctx = this.ctx;

        // 1. Clear Background (Use Transparent or match theme)
        // Since we set container bg in CSS/JS, we can clear rect or fill with current bg color
        // For best theme support, let's read the computed background color of the container
        const computedStyle = getComputedStyle(this.canvas.parentElement);
        ctx.fillStyle = computedStyle.backgroundColor || '#050505';
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Visible Data Calculation
        const totalGap = this.candleWidth + this.spacing;
        const maxVisibleCandles = Math.ceil((this.width - this.padding.right) / totalGap);

        // Offset logic: 0 means showing the LATEST candles.
        // Positive offset moves future? No, usually we want to scroll back.
        // Let's say offset 0 = end of data aligned to right.
        // offset > 0 = scrolling into history.
        // We need to clamp offset so we don't scroll past end or beginning too much.

        // Let's implement right-to-left drawing.
        // Index N-1 is at (width - padding.right - candleWidth)

        // Prevent infinite scroll
        const maxOffset = Math.max(0, this.data.length - maxVisibleCandles);
        // this.offset can be float for smooth scroll
        // But for data slicing we need int.

        // Apply limit to offset (User dragging)
        // Allow slightly dragging past future (negative)
        if (this.offset < -5) this.offset = -5;
        if (this.offset > this.data.length) this.offset = this.data.length;

        // Determine which indices to render
        const endDataIdx = this.data.length - 1 - Math.floor(this.offset);
        const startDataIdx = endDataIdx - maxVisibleCandles - 1; // Extra 1 for clipping

        // Calculate Min/Max Price for Scale ONLY based on visible data
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        for (let i = Math.max(0, startDataIdx); i <= Math.min(this.data.length - 1, endDataIdx); i++) {
            const d = this.data[i];
            if (d.high > maxPrice) maxPrice = d.high;
            if (d.low < minPrice) minPrice = d.low;
        }

        if (minPrice === Infinity) { minPrice = 0; maxPrice = 100; } // Fallback

        // Dynamic Padding for price
        const priceRange = maxPrice - minPrice || 1;
        const paddingRatio = 0.1; // 10% padding top/bottom
        const plotHeight = this.height - this.padding.top - this.padding.bottom;
        const scaleY = plotHeight / (priceRange * (1 + 2 * paddingRatio));
        const adjustedMin = minPrice - (priceRange * paddingRatio);

        // 3. Draw Grid
        this.drawGrid(ctx, adjustedMin, maxPrice + (priceRange * paddingRatio), scaleY);

        // 4. Draw Candles with NEON GLOW
        // We draw from right to left to ensure alignment
        /*
          x = Width - PaddingRight - ((IndexFromEnd + OffsetFraction) * TotalGap) - CandleWidth
        */
        const offsetFraction = this.offset % 1; // Smooth fractional scroll

        for (let i = this.data.length - 1; i >= 0; i--) {
            // Distance from end
            const dist = (this.data.length - 1 - i) - this.offset;

            // X coordinate (Left side of candle)
            const x = this.width - this.padding.right - (dist * totalGap) - this.candleWidth;

            // Optimization: Skip if off screen
            if (x < -this.candleWidth) break; // Went off left side
            if (x > this.width) continue; // Still off right side (shouldn't happen with current logic but safe)

            const d = this.data[i];
            const yOpen = this.height - this.padding.bottom - (d.open - adjustedMin) * scaleY;
            const yClose = this.height - this.padding.bottom - (d.close - adjustedMin) * scaleY;
            const yHigh = this.height - this.padding.bottom - (d.high - adjustedMin) * scaleY;
            const yLow = this.height - this.padding.bottom - (d.low - adjustedMin) * scaleY;

            const isUp = d.close >= d.open;
            // Brighter Neon Colors
            const color = isUp ? '#00ff41' : '#ff003c';

            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            // Wick (No glow for wick to keep it sharp, or low glow)
            ctx.beginPath();
            ctx.moveTo(x + this.candleWidth / 2, yHigh);
            ctx.lineTo(x + this.candleWidth / 2, yLow);
            ctx.stroke();

            // Body with GLOW
            const bodyH = Math.max(Math.abs(yClose - yOpen), 1);
            const bodyY = Math.min(yOpen, yClose);

            ctx.save(); // Save state for glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 15; // Strong glow
            ctx.fillRect(x, bodyY, this.candleWidth, bodyH);
            ctx.restore(); // Restore to avoid affecting other elements
        }

        // 5. Draw Crosshair if hovering
        if (mouseX && mouseY && mouseX < this.width - this.padding.right) {
            this.drawCrosshair(ctx, mouseX, mouseY, adjustedMin, scaleY);
        }
    }

    drawGrid(ctx, min, max, scaleY) {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;

        // Horz Lines & Labels
        const steps = 6;
        const range = max - min;
        const stepVal = range / steps;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';

        for (let i = 0; i <= steps; i++) {
            const price = min + (stepVal * i);
            const y = this.height - this.padding.bottom - (price - min) * scaleY;

            // Line
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width - this.padding.right, y);
            ctx.stroke();

            // Label
            ctx.fillText(price.toFixed(2), this.width - this.padding.right + 8, y);
        }

        // Vertical Divider
        ctx.beginPath();
        ctx.moveTo(this.width - this.padding.right, 0);
        ctx.lineTo(this.width - this.padding.right, this.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
    }

    // INDICATOR CALCULATIONS
    calculateSMA(data, period) {
        const sma = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) {
                sma.push(null);
                continue;
            }
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            sma.push(sum / period);
        }
        return sma;
    }

    // DRAW SMA
    drawSMA(ctx, adjustedMin, scaleY, candlesToDraw) {
        const period = 20;
        const fullSMA = this.calculateSMA(this.data, period);

        const totalGap = this.candleWidth + this.spacing;
        const startDataIdx = this.data.length - 1 - Math.floor(this.offset) - candlesToDraw + 1; // Adjust for 0-based index and slice
        const safeStart = Math.max(0, startDataIdx);
        const visibleSMA = fullSMA.slice(safeStart, safeStart + candlesToDraw);

        ctx.beginPath();
        ctx.strokeStyle = '#f59e0b'; // Amber color for SMA
        ctx.lineWidth = 2;

        for (let i = 0; i < visibleSMA.length; i++) {
            const val = visibleSMA[i];
            if (val === null) continue;

            // Calculate x position relative to the visible chart area
            // The 'i' here is the index within the visibleSMA array
            // We need to map it back to the chart's x-coordinates
            const dataIdx = safeStart + i;
            const dist = (this.data.length - 1 - dataIdx) - this.offset;
            const x = this.width - this.padding.right - (dist * totalGap) - (this.candleWidth / 2);

            const y = this.height - this.padding.bottom - (val - adjustedMin) * scaleY;

            if (i === 0 || visibleSMA[i - 1] === null) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    drawBollingerBands(ctx, adjustedMin, scaleY, candlesToDraw) {
        const period = 20;
        const stdDevFactor = 2;
        const fullSMA = this.calculateSMA(this.data, period);

        // Calculate Bands
        const upper = [];
        const lower = [];

        for (let i = 0; i < this.data.length; i++) {
            if (i < period - 1) {
                upper.push(null); lower.push(null); continue;
            }
            // Standard Deviation
            let sumSq = 0;
            const mean = fullSMA[i];
            for (let j = 0; j < period; j++) {
                sumSq += Math.pow(this.data[i - j].close - mean, 2);
            }
            const sd = Math.sqrt(sumSq / period);
            upper.push(mean + (sd * stdDevFactor));
            lower.push(mean - (sd * stdDevFactor));
        }

        const totalGap = this.candleWidth + this.spacing;
        const startDataIdx = this.data.length - 1 - Math.floor(this.offset) - candlesToDraw + 1;
        const safeStart = Math.max(0, startDataIdx);
        const visUpper = upper.slice(safeStart, safeStart + candlesToDraw);
        const visLower = lower.slice(safeStart, safeStart + candlesToDraw);

        // helper to draw line
        const drawLine = (dataSet, color) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]); // Dashed line

            for (let i = 0; i < dataSet.length; i++) {
                const val = dataSet[i];
                if (val === null) continue;

                const dataIdx = safeStart + i;
                const dist = (this.data.length - 1 - dataIdx) - this.offset;
                const x = this.width - this.padding.right - (dist * totalGap) - (this.candleWidth / 2);

                const y = this.height - this.padding.bottom - (val - adjustedMin) * scaleY;
                if (i === 0 || dataSet[i - 1] === null) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]); // Reset
        };

        drawLine(visUpper, 'rgba(16, 185, 129, 0.5)'); // Greenish
        drawLine(visLower, 'rgba(239, 68, 68, 0.5)'); // Reddish
    }

    toggleIndicator(name) {
        if (name === 'sma') this.showSMA = !this.showSMA;
        if (name === 'bb') this.showBB = !this.showBB;
        this.draw(); // Redraw
    }

    drawCrosshair(ctx, x, y, min, scaleY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;

        // Vertical Line
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.height);
        ctx.stroke();

        // Horizontal Line
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.width, y);
        ctx.stroke();

        ctx.setLineDash([]);

        // Price Badge on Axis
        // Reverse calc: y = H - pb - (price-min)*S  =>  (H - pb - y)/S + min = price
        const priceAtCursor = (this.height - this.padding.bottom - y) / scaleY + min;

        const labelY = y;
        const labelX = this.width - this.padding.right;

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(labelX, labelY - 10, 50, 20);

        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(priceAtCursor.toFixed(2), labelX + 5, labelY);
    }

    createSparkline(ctx, data, isPos) {
        if (!data || data.length === 0) return;
        const prices = data.map(d => d.close);
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min || 1;
        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.strokeStyle = isPos ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2;
        prices.forEach((p, i) => {
            const x = (i / (prices.length - 1)) * w;
            const y = h - ((p - min) / range) * (h - 4) - 2;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
}
