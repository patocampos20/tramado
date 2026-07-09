import { Project } from '../types';
import { getTechnicalSymbols } from './symbols';

export interface TileDef {
  startCol: number; // in project coordinates
  startRow: number;
  cols: number;     // number of cells in this tile
  rows: number;
  cellSize: number;
}

export async function exportTile(project: Project, tile: TileDef): Promise<string | null> {
  return new Promise(async (resolve) => {
    const { gaugeW, gaugeH, showGrid, bgColor, showSymbols, cellRenderMode, showRowNumbers, showColNumbers, direccion_filas = 'BOTTOM_TO_TOP', direccion_columnas = 'RIGHT_TO_LEFT', startRow = 1, startCol = 1 } = project.canvas;
    
    const cw = tile.cellSize * gaugeW;
    const ch = tile.cellSize * gaugeH;
    
    const padL = showRowNumbers ? 40 : 0;
    const padR = showRowNumbers ? 40 : 0;
    const padT = showColNumbers ? 40 : 0;
    const padB = showColNumbers ? 40 : 0;
    
    // Exact dimensions for this tile
    const actualCols = Math.min(tile.cols, project.canvas.cols - tile.startCol);
    const actualRows = Math.min(tile.rows, project.canvas.rows - tile.startRow);
    
    if (actualCols <= 0 || actualRows <= 0) return resolve(null);

    const canvas = document.createElement('canvas');
    canvas.width = padL + actualCols * cw + padR;
    canvas.height = padT + actualRows * ch + padB;
    const ctx = canvas.getContext('2d');
    if (!ctx) return resolve(null);

    // Background
    ctx.fillStyle = bgColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(padL, padT);

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
    for (let r = 0; r < actualRows; r++) {
      const projR = tile.startRow + r;
      for (let c = 0; c < actualCols; c++) {
        const projC = tile.startCol + c;
        const colorId = getEffectiveCellColor(projC, projR);
        if (colorId) {
          const color = project.colors.find(x => x.id === colorId);
          if (color) {
            const renderMode = cellRenderMode || (showSymbols ? 'symbols' : 'color');
            const drawColor = renderMode === 'color' || renderMode === 'color+symbols';
            const drawInitials = renderMode === 'initials';
            const drawSymbols = renderMode === 'symbols' || renderMode === 'color+symbols';

            if (drawColor) {
              ctx.fillStyle = color.hex;
            } else {
              ctx.fillStyle = '#ffffff';
            }
            ctx.fillRect(c * cw, r * ch, cw, ch);
            
            ctx.strokeStyle = drawColor ? "rgba(0,0,0,0.15)" : "#000000";
            ctx.lineWidth = drawColor ? 0.5 : 1.0;
            ctx.strokeRect(c * cw, r * ch, cw, ch);
            
            if (drawSymbols && ch > 8 && cw > 8) {
              ctx.fillStyle = drawColor ? color.symbolColor : '#000000';
              ctx.font = `600 ${Math.min(cw, ch) * 0.7}px 'JetBrains Mono', monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(color.symbol, c * cw + cw/2, r * ch + ch/2);
            } else if (drawInitials && ch > 8 && cw > 8) {
              ctx.fillStyle = drawColor ? color.symbolColor : '#000000';
              ctx.font = `600 ${Math.min(cw, ch) * 0.45}px 'JetBrains Mono', monospace`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const initText = color.initials || color.name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase()).join('').substring(0, 3);
              ctx.fillText(initText, c * cw + cw/2, r * ch + ch/2);
            }
          }
        }
      }
    }

    // Draw Placed Structural Symbols
    if (project.placedSymbols) {
      for (const ps of project.placedSymbols) {
        if (ps.col >= tile.startCol && ps.col < tile.startCol + actualCols &&
            ps.row >= tile.startRow && ps.row < tile.startRow + actualRows) {
          const def = getTechnicalSymbols(project.craft).find(d => d.id === ps.defId);
          if (!def) continue;

          const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w * 10} ${def.h * 10}" width="${def.w * cw}" height="${def.h * ch}">${def.svgPath}</svg>`;
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          
          await new Promise<void>(res => {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, (ps.col - tile.startCol) * cw, (ps.row - tile.startRow) * ch, def.w * cw, def.h * ch);
              URL.revokeObjectURL(url);
              res();
            };
            img.onerror = () => res();
            img.src = url;
          });
        }
      }
    }

    // Grid
    if (showGrid) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.strokeStyle = '#000000';
      for (let c = 0; c <= actualCols; c++) {
        const projC = tile.startCol + c;
        ctx.lineWidth = projC % 10 === 0 ? 1.5 : 0.5;
        ctx.globalAlpha = projC % 10 === 0 ? 0.8 : 0.4;
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, actualRows * ch); ctx.stroke();
      }
      for (let r = 0; r <= actualRows; r++) {
        const projR = tile.startRow + r;
        ctx.lineWidth = projR % 10 === 0 ? 1.5 : 0.5;
        ctx.globalAlpha = projR % 10 === 0 ? 0.8 : 0.4;
        ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(actualCols * cw, r * ch); ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Border around this specific tile
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, actualCols * cw, actualRows * ch);

    // Rulers
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const globalRows = project.canvas.rows;
    const globalCols = project.canvas.cols;

    if (showRowNumbers) {
      for (let r = 0; r < actualRows; r++) {
        const projR = tile.startRow + r;
        const displayR = direccion_filas === 'TOP_TO_BOTTOM' ? startRow + projR : startRow + (globalRows - 1 - projR);
        ctx.fillText(displayR.toString(), -20, r * ch + ch/2);
        ctx.fillText(displayR.toString(), actualCols * cw + 20, r * ch + ch/2);
      }
    }
    
    if (showColNumbers) {
      for (let c = 0; c < actualCols; c++) {
        const projC = tile.startCol + c;
        const displayC = direccion_columnas === 'LEFT_TO_RIGHT' ? startCol + projC : startCol + (globalCols - 1 - projC);
        ctx.fillText(displayC.toString(), c * cw + cw/2, -20);
        ctx.fillText(displayC.toString(), c * cw + cw/2, actualRows * ch + 20);
      }
    }

    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      resolve(URL.createObjectURL(blob));
    }, 'image/png', 0.95);
  });
}
