import { Project } from '../types';
import { getTechnicalSymbols } from './symbols';

export function exportProjectToPng(project: Project, download = true): Promise<Blob | null> {
  return new Promise(async (resolve) => {
    const { cols, rows, cellSize, gaugeW, gaugeH, showGrid, gridColor, bgColor, showSymbols, showRowNumbers, showColNumbers } = project.canvas;
    // Export with a slightly larger base cell size for high quality
    const cw = Math.max(cellSize, 20) * gaugeW;
    const ch = Math.max(cellSize, 20) * gaugeH;
    
    // Calculate legend height
    const legendCols = Math.max(1, Math.floor((cols * cw) / 200));
    const legendRows = Math.ceil(project.colors.length / legendCols);
    const legendHeight = download ? (legendRows * 30 + 60) : 0;
    
    const padL = showRowNumbers ? 40 : 0;
    const padR = showRowNumbers ? 40 : 0;
    const padT = showColNumbers ? 40 : 0;
    const padB = showColNumbers ? 40 : 0;
    
    const canvas = document.createElement('canvas');
    canvas.width = padL + cols * cw + padR;
    canvas.height = padT + rows * ch + padB + legendHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);

    // Background
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(padL, padT);

    // Helper to get effective cell color across all visible layers
    const getEffectiveCellColor = (c: number, r: number): string | undefined => {
      let colorId = project.cells[`${c},${r}`];
      if (project.layers) {
        for (const layer of project.layers) {
          if (layer.visible && layer.cells[`${c},${r}`]) {
            colorId = layer.cells[`${c},${r}`];
          }
        }
      }
      return colorId;
    };

    // Draw cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colorId = getEffectiveCellColor(c, r);
        if (colorId) {
          const color = project.colors.find(x => x.id === colorId);
          if (color) {
            ctx.fillStyle = color.hex;
            ctx.fillRect(c * cw, r * ch, cw, ch);
            ctx.strokeStyle = "rgba(0,0,0,0.15)";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(c * cw, r * ch, cw, ch);
            
            if (showSymbols && ch > 8 && cw > 8) {
              ctx.fillStyle = color.symbolColor;
              ctx.font = `600 ${Math.min(cw, ch) * 0.7}px 'JetBrains Mono', monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(color.symbol, c * cw + cw/2, r * ch + ch/2);
            }
          }
        }
      }
    }

    // Draw Placed Structural Symbols
    if (project.placedSymbols) {
      for (const ps of project.placedSymbols) {
        const def = getTechnicalSymbols(project.craft).find(d => d.id === ps.defId);
        if (!def) continue;

        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w * 10} ${def.h * 10}" width="${def.w * cw}" height="${def.h * ch}">${def.svgPath}</svg>`;
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        await new Promise<void>(res => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, ps.col * cw, ps.row * ch, def.w * cw, def.h * ch);
            URL.revokeObjectURL(url);
            res();
          };
          img.onerror = () => res();
          img.src = url;
        });
      }
    }

    // Grid
    if (showGrid) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.strokeStyle = '#000000';
      for (let c = 0; c <= cols; c++) {
        ctx.lineWidth = c % 10 === 0 ? 1.5 : 0.5;
        ctx.globalAlpha = c % 10 === 0 ? 0.8 : 0.4;
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, rows * ch); ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.lineWidth = r % 10 === 0 ? 1.5 : 0.5;
        ctx.globalAlpha = r % 10 === 0 ? 0.8 : 0.4;
        ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(cols * cw, r * ch); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, cols * cw, rows * ch);

    // Rulers
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const { direccion_filas = 'BOTTOM_TO_TOP', direccion_columnas = 'RIGHT_TO_LEFT', startRow = 1, startCol = 1 } = project.canvas;

    if (showRowNumbers) {
      for (let r = 0; r < rows; r++) {
        const displayR = direccion_filas === 'TOP_TO_BOTTOM' ? startRow + r : startRow + (rows - 1 - r);
        ctx.fillText(displayR.toString(), -20, r * ch + ch/2);
        ctx.fillText(displayR.toString(), cols * cw + 20, r * ch + ch/2);
      }
    }
    
    if (showColNumbers) {
      for (let c = 0; c < cols; c++) {
        const displayC = direccion_columnas === 'LEFT_TO_RIGHT' ? startCol + c : startCol + (cols - 1 - c);
        ctx.fillText(displayC.toString(), c * cw + cw/2, -20);
        ctx.fillText(displayC.toString(), c * cw + cw/2, rows * ch + 20);
      }
    }

    ctx.restore();

    // Draw Legend only if downloading full image
    if (download) {
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Patrón: ${project.name}`, 15, padT + rows * ch + padB + 20);

    let lx = 15, ly = padT + rows * ch + padB + 60;
    for (let i = 0; i < project.colors.length; i++) {
      const col = project.colors[i];
      // Color box
      ctx.fillStyle = col.hex;
      ctx.fillRect(lx, ly, 24, 24);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx, ly, 24, 24);
      
      // Symbol
      ctx.fillStyle = col.symbolColor;
      ctx.font = `bold 14px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(col.symbol, lx + 12, ly + 12);
      
      // Text
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.font = '14px sans-serif';
      ctx.fillText(col.name, lx + 36, ly + 12);
      
      lx += 200;
      if (lx > canvas.width - 150) {
        lx = 15;
        ly += 30;
      }
    }
  }

    // Export to file
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      
      if (download) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\\s+/g, '_')}_pattern.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      resolve(blob);
    }, 'image/png');
  });
}
