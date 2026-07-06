import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { SYMBOLS, makeColor, contrastFor } from '../utils/color';
import { exportProjectToPng } from '../utils/export';
import { HelpDialog } from './HelpDialog';
import { MaterialsDialog } from './MaterialsDialog';
import { PrintView } from './PrintView';
import { GarmentGeneratorDlg } from './GarmentGeneratorDlg';
import type { ToolId, ColorEntry, CraftType } from '../types';

// ─── Simple Icons ─────────────────────────────────────────────────────────────
import { getTechnicalSymbols } from '../utils/symbols';
import { useAutoSave } from '../hooks/useAutoSave';

const IconStamp = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const IconDraw = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>;
const IconErase = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"/></svg>;
const IconFill = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11v10H5V11M2 11h20M7 11V7a5 5 0 0110 0v4"/></svg>; // simplified bucket
const IconSelect = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 4"/></svg>;
const IconPan = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0a2 2 0 00-2 2v-4a2 2 0 00-2-2v0a2 2 0 00-2 2v7"/><path d="M14 15v3a4 4 0 01-4 4H7a4 4 0 01-4-4v-5.83a2 2 0 013.13-1.66l2.87 1.43"/></svg>;
const IconLine = () => <svg width="14" height="14"><line x1="2" y1="12" x2="12" y2="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const IconRect = () => <svg width="14" height="14"><rect x="1" y="2" width="12" height="10" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
const IconEllipse = () => <svg width="14" height="14"><ellipse cx="7" cy="7" rx="6" ry="4" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
const IconText = () => <svg width="14" height="14"><text x="7" y="11" textAnchor="middle" fontSize="12" fill="currentColor" fontWeight="bold" fontFamily="sans-serif">T</text></svg>;
const IconWand = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></svg>;

const CRAFT_NAMES: Record<string, string> = {
  crochet_colorwork: 'Crochet Tapestry', crochet_c2c: 'C2C (Esquina a esquina)', crochet_filet: 'Crochet Filet',
  crochet_mosaic: 'Crochet Mosaico', crochet_tunisian: 'Crochet Tunecino', cross_stitch: 'Punto de cruz',
  knitting: 'Tejido (Jacquard)', diamond_painting: 'Pintura con diamantes', hama_beads: 'Cuentas Hama',
  macrame: 'Macramé', latch_hook: 'Punto alfombra', quilt: 'Acolchado', embroidery: 'Bordado', custom: 'Personalizado'
};

// ─── Grid Canvas ──────────────────────────────────────────────────────────────
const GridCanvas: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [sz, setSz] = useState({ w: 800, h: 600 });
  const ptr = useRef({ down: false, btn: 0, pan: false, isSelect: false, shape: 'none', sc: 0, sr: 0, lc: 0, lr: 0, px: 0, py: 0 });
  const [previewShape, setPreviewShape] = useState<{ type: string, c1: number, r1: number, c2: number, r2: number } | null>(null);

  const project = useStore(s => s.project);
  const viewport = useStore(s => s.viewport);
  const activeTool = useStore(s => s.activeTool);
  const selection = useStore(s => s.selection);

  const { paintCell, eraseCell, fillFlood, fillGlobal, placeSymbol, pushSnap, setZoom, pan, setCursor, setSelection, setActiveColor, rasterizeText } = useStore();
  const { cols, rows, cellSize, showGrid, gridColor, bgColor, gaugeW, gaugeH, showSymbols, mirrorH, mirrorV, showRowNumbers } = project.canvas;

  let vx = viewport.x;
  let vy = viewport.y;
  const zoom = viewport.zoom;
  const cw = cellSize * gaugeW * zoom;
  const ch = cellSize * gaugeH * zoom;

  // Centrado automático cuando el lienzo es más pequeño que el espacio de la pantalla
  if (sz.w > 0 && cols * cw < sz.w) vx = (sz.w - cols * cw) / 2;
  if (sz.h > 0 && rows * ch < sz.h) vy = (sz.h - rows * ch) / 2;

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new ResizeObserver(e => setSz({ w: e[0].contentRect.width, h: e[0].contentRect.height }));
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  const toSvg = useCallback((cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    return r ? { x: cx - r.left, y: cy - r.top } : { x: cx, y: cy };
  }, []);

  const toGrid = useCallback((sx: number, sy: number) => ({
    col: Math.floor((sx - vx) / cw), row: Math.floor((sy - vy) / ch)
  }), [vx, vy, cw, ch]);

  const toVertex = useCallback((sx: number, sy: number) => ({
    col: Math.round((sx - vx) / cw), row: Math.round((sy - vy) / ch)
  }), [vx, vy, cw, ch]);

  const generateSteppedPath = (c1: number, r1: number, c2: number, r2: number) => {
    let path = `M ${c1} ${r1}`;
    let c = c1, r = r1;
    const dc = Math.abs(c2 - c1), dr = Math.abs(r2 - r1);
    const sc = c1 < c2 ? 1 : -1, sr = r1 < r2 ? 1 : -1;
    let err = dc - dr;
    
    while (c !== c2 || r !== r2) {
      const e2 = 2 * err;
      if (e2 > -dr) {
        err -= dr;
        c += sc;
        path += ` L ${c} ${r}`;
      } else {
        err += dc;
        r += sr;
        path += ` L ${c} ${r}`;
      }
    }
    return path;
  };

  const drawBresenham = useCallback((c1: number, r1: number, c2: number, r2: number, isErase: boolean) => {
    const dx = Math.abs(c2 - c1);
    const dy = Math.abs(r2 - r1);
    const sx = c1 < c2 ? 1 : -1;
    const sy = r1 < r2 ? 1 : -1;
    let err = dx - dy;
    let cx = c1; let cy = r1;
    while (true) {
      if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) {
        if (isErase) eraseCell(cx, cy);
        else paintCell(cx, cy);
      }
      if (cx === c2 && cy === r2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }, [cols, rows, paintCell, eraseCell]);

  const drawRect = useCallback((c1: number, r1: number, c2: number, r2: number, isErase: boolean) => {
    const minC = Math.min(c1, c2); const maxC = Math.max(c1, c2);
    const minR = Math.min(r1, r2); const maxR = Math.max(r1, r2);
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
        if (c === minC || c === maxC || r === minR || r === maxR) {
          if (isErase) eraseCell(c, r); else paintCell(c, r);
        }
      }
    }
  }, [paintCell, eraseCell]);

  const drawEllipse = useCallback((c1: number, r1: number, c2: number, r2: number, isErase: boolean) => {
    const minC = Math.min(c1, c2); const maxC = Math.max(c1, c2);
    const minR = Math.min(r1, r2); const maxR = Math.max(r1, r2);
    const a = (maxC - minC) / 2; const b = (maxR - minR) / 2;
    const xc = minC + a; const yc = minR + b;
    for (let c = minC; c <= maxC; c++) {
      for (let r = minR; r <= maxR; r++) {
        const dx = c - xc; const dy = r - yc;
        const val = (dx * dx) / (a * a || 1) + (dy * dy) / (b * b || 1);
        if (val >= 0.7 && val <= 1.3) {
          if (isErase) eraseCell(c, r); else paintCell(c, r);
        }
      }
    }
  }, [paintCell, eraseCell]);

  const applyTool = useCallback((c: number, r: number, btn: number, isAlt: boolean, isShift: boolean) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return;
    if (activeTool === 'select' || ptr.current.isSelect) return; 

    if (btn === 1) { 
      const cid = project.cells[`${c},${r}`];
      if (cid) setActiveColor(cid);
      return;
    }

    if (activeTool === 'fill') { fillFlood(c, r); return; }
    if (activeTool === 'wand') { fillGlobal(c, r); return; }
    if (activeTool === 'erase' || btn === 2) { eraseCell(c, r); return; }
    if (activeTool === 'draw') { paintCell(c, r); return; }
    if (activeTool === 'stamp') { placeSymbol(c, r); return; }
  }, [cols, rows, activeTool, project.cells, paintCell, eraseCell, fillFlood, setActiveColor, placeSymbol]);

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const isPan = e.button === 1 || activeTool === 'pan' || (e.altKey && e.button === 0);
    const isSel = activeTool === 'select' || (e.shiftKey && e.button === 0);
    
    if (isPan) {
      ptr.current = { ...ptr.current, down: true, btn: e.button, pan: true, px: e.clientX, py: e.clientY };
      return;
    }
    
    const { x, y } = toSvg(e.clientX, e.clientY);
    const { col, row } = toGrid(x, y);

    if (isSel) {
      ptr.current = { ...ptr.current, down: true, btn: e.button, pan: false, isSelect: true, sc: col, sr: row, lc: col, lr: row };
      setSelection({ c1: col, r1: row, c2: col, r2: row });
      return;
    }

    /*
    if (activeTool === 'text') {
      if (textOptions.text.trim()) {
        pushSnap();
        store.rasterizeText(textOptions.text, col, row, { 
          fontSize: textOptions.fontSize, 
          fontFamily: textOptions.fontFamily, 
          fontWeight: textOptions.fontWeight 
        });
      }
      return;
    }
    */

    pushSnap();
    if (activeTool === 'line') {
      const { col: vc, row: vr } = toVertex(x, y);
      ptr.current = { ...ptr.current, down: true, btn: e.button, pan: false, isSelect: false, shape: 'line', sc: vc, sr: vr, lc: vc, lr: vr };
      setPreviewShape({ type: 'line', c1: vc, r1: vr, c2: vc, r2: vr });
      return;
    }

    if (activeTool === 'rect' || activeTool === 'ellipse') {
      ptr.current = { ...ptr.current, down: true, btn: e.button, pan: false, isSelect: false, shape: activeTool, sc: col, sr: row, lc: col, lr: row };
      setPreviewShape({ type: activeTool, c1: col, r1: row, c2: col, r2: row });
      return;
    }

    ptr.current = { ...ptr.current, down: true, btn: e.button, pan: false, isSelect: false, shape: 'none', lc: col, lr: row };
    applyTool(col, row, e.button, e.altKey, e.shiftKey);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const { x, y } = toSvg(e.clientX, e.clientY);
    const { col, row } = toGrid(x, y);
    setCursor(col, row);

    if (!ptr.current.down) return;
    if (ptr.current.pan) {
      pan((e.clientX - ptr.current.px) / zoom, (e.clientY - ptr.current.py) / zoom);
      ptr.current.px = e.clientX; ptr.current.py = e.clientY;
      return;
    }

    if (col === ptr.current.lc && row === ptr.current.lr) return;
    ptr.current.lc = col; ptr.current.lr = row;

    if (ptr.current.isSelect) {
      const { sc, sr } = ptr.current;
      setSelection({ c1: Math.min(sc, col), r1: Math.min(sr, row), c2: Math.max(sc, col), r2: Math.max(sr, row) });
      return;
    }

    if (ptr.current.shape !== 'none') {
      if (ptr.current.shape === 'line') {
        const { col: vc, row: vr } = toVertex(x, y);
        setPreviewShape({ type: 'line', c1: ptr.current.sc, r1: ptr.current.sr, c2: vc, r2: vr });
      } else {
        setPreviewShape({ type: ptr.current.shape, c1: ptr.current.sc, r1: ptr.current.sr, c2: col, r2: row });
      }
      return;
    }

    applyTool(col, row, ptr.current.btn, e.altKey, e.shiftKey);
  };

  const onUp = () => { 
    if (ptr.current.shape !== 'none' && previewShape) {
      if (previewShape.type === 'line') {
        const path = generateSteppedPath(previewShape.c1, previewShape.r1, previewShape.c2, previewShape.r2);
        useStore.getState().addVectorGuide(path);
      }
      else if (previewShape.type === 'rect') drawRect(previewShape.c1, previewShape.r1, previewShape.c2, previewShape.r2, ptr.current.btn === 2);
      else if (previewShape.type === 'ellipse') drawEllipse(previewShape.c1, previewShape.r1, previewShape.c2, previewShape.r2, ptr.current.btn === 2);
      setPreviewShape(null);
    }
    ptr.current.down = false; ptr.current.pan = false; ptr.current.isSelect = false; ptr.current.shape = 'none'; 
  };
  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const nz = Math.min(Math.max(zoom * f, 0.05), 20);
    const { x, y } = toSvg(e.clientX, e.clientY);
    pan((x - vx) * (1 - nz / zoom), (y - vy) * (1 - nz / zoom));
    setZoom(nz);
  };

  const cellRects: React.ReactNode[] = [];
  const symbolTexts: React.ReactNode[] = [];
  
  const renderLayerCells = (cells: Record<string, string>, opacity = 1) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cid = cells[`${c},${r}`];
        if (!cid) continue;
        const color = project.colors.find(x => x.id === cid);
        if (!color) continue;
        
        const x = vx + c * cw; const y = vy + r * ch;
        cellRects.push(
          <rect key={`c${c}-${r}-${color.id}-${opacity}`} x={x} y={y} width={cw} height={ch} fill={color.hex} 
                stroke="rgba(0,0,0,0.15)" strokeWidth={cw > 5 ? 0.5 : 0} opacity={opacity} />
        );
        
        if (showSymbols && ch > 8 && cw > 8) {
          symbolTexts.push(
            <text key={`s${c}-${r}-${color.id}-${opacity}`} x={x + cw/2} y={y + ch/2} fill={color.symbolColor}
              fontSize={Math.min(cw, ch) * 0.7} textAnchor="middle" dominantBaseline="central" pointerEvents="none"
              fontFamily="'JetBrains Mono', monospace" fontWeight="600" opacity={opacity}>
              {color.symbol}
            </text>
          );
        }
      }
    }
  };

  // Base layer
  renderLayerCells(project.cells, 1);
  // Additional layers
  if (project.layers) {
    project.layers.forEach(l => {
      if (l.visible) renderLayerCells(l.cells, l.opacity);
    });
  }

  const placedSymbolElements: React.ReactNode[] = [];
  if (project.placedSymbols) {
    project.placedSymbols.forEach(ps => {
      const def = getTechnicalSymbols(project.craft).find(d => d.id === ps.defId);
      if (!def) return;
      const x = vx + ps.col * cw;
      const y = vy + ps.row * ch;
      const width = def.w * cw;
      const height = def.h * ch;
      placedSymbolElements.push(
        <svg key={ps.id} x={x} y={y} width={width} height={height} viewBox={`0 0 ${def.w * 10} ${def.h * 10}`} 
             style={{ pointerEvents: 'none', color: '#000' }} 
             dangerouslySetInnerHTML={{ __html: def.svgPath }} />
      );
    });
  }

  const lines: React.ReactNode[] = [];
  if (showGrid && cw >= 3) {
    const minC = Math.max(0, Math.floor(-vx / cw));
    const maxC = Math.min(cols, Math.ceil((sz.w - vx) / cw));
    for (let c = minC; c <= maxC; c++) {
      let lw = 1.0; let op = 0.5;
      if (c % 10 === 0) { lw = 2.5; op = 0.9; }
      else if (c % 5 === 0) { lw = 1.5; op = 0.75; }
      lines.push(<line key={`vc${c}`} x1={vx+c*cw} y1={vy} x2={vx+c*cw} y2={vy+rows*ch} stroke={gridColor || "#000"} strokeWidth={lw} opacity={op} />);
    }
    const minR = Math.max(0, Math.floor(-vy / ch));
    const maxR = Math.min(rows, Math.ceil((sz.h - vy) / ch));
    for (let r = minR; r <= maxR; r++) {
      let lw = 1.0; let op = 0.5;
      if (r % 10 === 0) { lw = 2.5; op = 0.9; }
      else if (r % 5 === 0) { lw = 1.5; op = 0.75; }
      lines.push(<line key={`hr${r}`} x1={vx} y1={vy+r*ch} x2={vx+cols*cw} y2={vy+r*ch} stroke={gridColor || "#000"} strokeWidth={lw} opacity={op} />);
    }
  }

  // --- Tracker Crosshair ---
  const trackerActive = useStore(s => s.trackerActive);
  const trackerCol = useStore(s => s.trackerCol);
  const trackerRow = useStore(s => s.trackerRow);
  const trackerElements: React.ReactNode[] = [];

  if (trackerActive && trackerCol >= 0 && trackerRow >= 0 && trackerCol < cols && trackerRow < rows) {
    const tx = vx + trackerCol * cw;
    const ty = vy + trackerRow * ch;
    
    if (project.craft === 'crochet_c2c') {
      const currentTurn = trackerRow + trackerCol;
      const c2cCells = [];
      for (let r = 0; r < rows; r++) {
        const c = currentTurn - r;
        if (c >= 0 && c < cols) {
          c2cCells.push(<rect key={`c2c-${c}-${r}`} x={vx + c * cw} y={vy + r * ch} width={cw} height={ch} fill="var(--accent)" opacity={0.3} />);
        }
      }
      trackerElements.push(
        <g key="tracker-c2c" style={{ pointerEvents: 'none' }}>
          {c2cCells}
          <rect x={tx} y={ty} width={cw} height={ch} fill="none" stroke="var(--accent)" strokeWidth={3} />
          <rect x={tx} y={ty} width={cw} height={ch} fill="var(--accent)" opacity={0.6} />
        </g>
      );
    } else {
      trackerElements.push(
        <g key="tracker" style={{ pointerEvents: 'none' }}>
          {/* Fila actual sombreada */}
          <rect x={vx} y={ty} width={cols * cw} height={ch} fill="var(--accent)" opacity={0.2} />
          {/* Columna actual sombreada */}
          <rect x={tx} y={vy} width={cw} height={rows * ch} fill="var(--accent)" opacity={0.2} />
          {/* Celda actual resaltada fuerte */}
          <rect x={tx} y={ty} width={cw} height={ch} fill="none" stroke="var(--accent)" strokeWidth={3} />
          <rect x={tx} y={ty} width={cw} height={ch} fill="var(--accent)" opacity={0.4} />
        </g>
      );
    }
  }

  const shapes: React.ReactNode[] = [];
  if (previewShape) {
    if (previewShape.type === 'line') {
      const path = generateSteppedPath(previewShape.c1, previewShape.r1, previewShape.c2, previewShape.r2);
      shapes.push(
        <g key="prev-line" transform={`translate(${vx}, ${vy}) scale(${cw}, ${ch})`}>
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeDasharray="4" />
        </g>
      );
    } else if (previewShape.type === 'rect' || previewShape.type === 'ellipse') {
      const minC = Math.min(previewShape.c1, previewShape.c2); const maxC = Math.max(previewShape.c1, previewShape.c2);
      const minR = Math.min(previewShape.r1, previewShape.r2); const maxR = Math.max(previewShape.r1, previewShape.r2);
      const px = vx + minC * cw; const py = vy + minR * ch;
      const pw = (maxC - minC + 1) * cw; const ph = (maxR - minR + 1) * ch;
      if (previewShape.type === 'rect') {
        shapes.push(<rect key="prev-rect" x={px} y={py} width={pw} height={ph} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4" />);
      } else {
        shapes.push(<ellipse key="prev-ellipse" cx={px + pw/2} cy={py + ph/2} rx={pw/2} ry={ph/2} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4" />);
      }
    }
  }

  const rowNums: React.ReactNode[] = [];
  const { showColNumbers, tipo_tejido = 'PLANO_RS_FRENTE', direccion_filas = 'BOTTOM_TO_TOP', direccion_columnas = 'RIGHT_TO_LEFT', startRow = 1, startCol = 1 } = project.canvas;
  
  const skipInterval = cw < 20 ? (cw < 10 ? 10 : 5) : 1;

  if (showRowNumbers) {
    const minR = Math.max(0, Math.floor(-vy / ch));
    const maxR = Math.min(rows - 1, Math.ceil((sz.h - vy) / ch));
    for (let r = minR; r <= maxR; r++) {
      if (r % skipInterval !== 0 && r !== 0 && r !== rows - 1) continue;
      
      const displayR = direccion_filas === 'TOP_TO_BOTTOM' ? startRow + r : startRow + (rows - 1 - r);
      let renderLeft = false;
      let renderRight = false;
      let arrow = '';

      const isOddDisplayR = (displayR - startRow + 1) % 2 !== 0;

      if (tipo_tejido === 'CIRCULAR') {
        renderRight = true;
        arrow = '←';
      } else if (tipo_tejido === 'PLANO_RS_FRENTE') {
        if (isOddDisplayR) {
          renderRight = true;
          arrow = '←';
        } else {
          renderLeft = true;
          arrow = '→';
        }
      } else if (tipo_tejido === 'PLANO_WS_ESPALDA') {
        if (isOddDisplayR) {
          renderLeft = true;
          arrow = '→';
        } else {
          renderRight = true;
          arrow = '←';
        }
      }

      if (renderRight) {
        rowNums.push(
          <div key={`r${r}`} style={{ position:'absolute', top: vy + r * ch + ch / 2, left: vx + cols * cw + 10, transform: 'translateY(-50%)', display:'flex', alignItems:'center', fontSize: 10, color: '#888888' }}>
            {arrow} {displayR}
          </div>
        );
      }
      if (renderLeft) {
        rowNums.push(
          <div key={`l${r}`} style={{ position:'absolute', top: vy + r * ch + ch / 2, left: vx - 10, transform: 'translate(-100%, -50%)', display:'flex', alignItems:'center', fontSize: 10, color: '#888888' }}>
            {displayR} {arrow}
          </div>
        );
      }
    }
  }

  const colNums: React.ReactNode[] = [];
  if (showColNumbers) {
    // Franja de Contraste para la Regla Inferior
    colNums.push(
      <div key="bottom-ruler-bg" style={{ position: 'absolute', left: vx, top: vy + rows * ch, width: cols * cw, height: 26, background: '#F0F0F0', zIndex: 1 }} />
    );

    const minC = Math.max(0, Math.floor(-vx / cw));
    const maxC = Math.min(cols - 1, Math.ceil((sz.w - vx) / cw));
    for (let c = minC; c <= maxC; c++) {
      if (c % skipInterval !== 0 && c !== 0 && c !== cols - 1) continue;
      const displayC = direccion_columnas === 'LEFT_TO_RIGHT' ? startCol + c : startCol + (cols - 1 - c);
      colNums.push(
        <div key={`b${c}`} style={{ position:'absolute', left: vx + c * cw + cw / 2, top: vy + rows * ch + 13, transform: 'translate(-50%, -50%)', textAlign:'center', fontSize: 10, color: '#888888', zIndex: 2 }}>
          {displayC}
        </div>
      );
    }
  }

  const vectorElements: React.ReactNode[] = [];
  if (project.vectorGuides && useStore.getState().showVectorGuides) {
    project.vectorGuides.forEach(vg => {
      vectorElements.push(
        <g 
          key={vg.id} 
          transform={`translate(${vx}, ${vy}) scale(${cw}, ${ch})`}
          pointerEvents={activeTool === 'erase' ? 'stroke' : 'none'}
          cursor={activeTool === 'erase' ? 'pointer' : 'crosshair'}
          onPointerDown={(e) => {
            if (activeTool === 'erase') {
              e.stopPropagation();
              useStore.getState().deleteVectorGuide(vg.id);
            }
          }}
        >
          {activeTool === 'erase' && <path d={vg.path} fill="none" stroke="transparent" strokeWidth={15} vectorEffect="non-scaling-stroke" />}
          <path d={vg.path} fill="none" stroke={vg.color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </g>
      );
    });
  }

  const tw = cols * cw; const th = rows * ch;

  return (
    <div ref={wrapRef} className="canvas-wrap">
      <svg ref={svgRef} className="canvas-svg" width={sz.w} height={sz.h}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}>
        <rect x={vx} y={vy} width={tw} height={th} fill={bgColor} />
        {cellRects}
        {symbolTexts}
        {placedSymbolElements}
        {vectorElements}
        {lines}
        {trackerElements}
        {shapes}
        <rect x={vx} y={vy} width={tw} height={th} fill="none" stroke={gridColor} strokeWidth={2} />
        
        {selection && (
          <rect x={vx + selection.c1 * cw} y={vy + selection.r1 * ch}
            width={(selection.c2 - selection.c1 + 1) * cw} height={(selection.r2 - selection.r1 + 1) * ch}
            fill="rgba(108,95,199,0.2)" stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 4" pointerEvents="none" />
        )}
      </svg>
      {rowNums}
      {colNums}
      <div className="zoom-float">
        <button className="zoom-float-btn" onClick={() => setZoom(zoom / 1.25)}>-</button>
        <span className="zoom-float-pct">{Math.round(zoom * 100)}%</span>
        <button className="zoom-float-btn" onClick={() => setZoom(zoom * 1.25)}>+</button>
      </div>
    </div>
  );
};

// ─── Dialogs ──────────────────────────────────────────────────────────────────

import { ColorWheel } from './ColorWheel';

const ColorEditorDialog: React.FC<{ 
  colorId: string | 'new', 
  onClose: () => void 
}> = ({ colorId, onClose }) => {
  const store = useStore();
  const updateColor = store.updateColor;
  const project = store.project;
  
  // Initialize local draft
  const [draft, setDraft] = useState<any>(() => {
    if (colorId === 'new') {
      return { id: 'new', name: 'Nuevo Color', hex: '#888888', symbol: '', symbolColor: '#000000' };
    }
    const c = project.colors.find(x => x.id === colorId);
    return c ? { ...c } : null;
  });

  const [tab, setTab] = useState<'color'|'symbol'>('color');

  if (!draft) return null;

  const handleSave = () => {
    if (colorId === 'new') {
      const idx = project.colors.length;
      const c = makeColor(draft.hex, draft.name, idx);
      c.symbol = draft.symbol;
      c.symbolColor = draft.symbolColor;
      project.colors.push(c);
      store.setActiveColor(c.id);
    } else {
      updateColor(colorId, draft);
    }
    onClose();
  };

  const handleEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      alert("Tu navegador no soporta el cuentagotas global.");
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      setDraft({ ...draft, hex: result.sRGBHex, symbolColor: contrastFor(result.sRGBHex) });
    } catch(e) {
      // User canceled
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-sm" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <h2>Editar {tab === 'color' ? 'color' : 'símbolo'}</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <div className="color-editor-tabs">
            <div className={`color-editor-tab ${tab === 'color' ? 'active' : ''}`} onClick={() => setTab('color')}>Color</div>
            <div className={`color-editor-tab ${tab === 'symbol' ? 'active' : ''}`} onClick={() => setTab('symbol')}>Símbolo</div>
          </div>
          
          {tab === 'color' && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre / Código de hilo</label>
                <input className="form-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Color (Círculo Cromático)</label>
                  <button className="panel-icon-btn" onClick={handleEyeDropper} title="Capturar color de la pantalla (EyeDropper)" style={{ padding: '4px 8px', fontSize: 12, background: 'var(--accent)', color: 'white', borderRadius: 4 }}>
                    Pipeta Global 💧
                  </button>
                </div>
                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'center' }}>
                  <ColorWheel color={draft.hex} onChange={(hex) => setDraft({ ...draft, hex, symbolColor: contrastFor(hex) })} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                  <input type="color" value={draft.hex} onChange={e => setDraft({ ...draft, hex: e.target.value, symbolColor: contrastFor(e.target.value) })} style={{ width: 40, height: 40, padding: 0, border: 'none' }} />
                  <input className="form-input" value={draft.hex} onChange={e => setDraft({ ...draft, hex: e.target.value })} />
                </div>
              </div>
            </>
          )}

          {tab === 'symbol' && (
            <>
              <div className="form-group">
                <label className="form-label">Elegir símbolo</label>
                <div className="symbol-grid">
                  {SYMBOLS.map(sym => (
                    <div key={sym} className={`sym-btn ${draft.symbol === sym ? 'sel' : ''}`} onClick={() => setDraft({ ...draft, symbol: sym })}>
                      {sym}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color del símbolo</label>
                <input type="color" value={draft.symbolColor} onChange={e => setDraft({ ...draft, symbolColor: e.target.value })} style={{ width: 40, height: 40, padding: 0, border: 'none' }} />
              </div>
            </>
          )}
        </div>
        <div className="dlg-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handleSave}>Guardar en Paleta de Proyecto</button>
        </div>
      </div>
    </div>
  );
};

const SettingsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const p = useStore(s => s.project);
  const resizeCanvas = useStore(s => s.resizeCanvas);
  const setGauge = useStore(s => s.setGauge);
  const [cols, setCols] = useState(p.canvas.cols);
  const [rows, setRows] = useState(p.canvas.rows);
  const [gw, setGw] = useState(p.canvas.gaugeW);
  const [gh, setGh] = useState(p.canvas.gaugeH);

  const [cmW, setCmW] = useState((p.canvas.cols * p.canvas.gaugeW).toString());
  const [cmH, setCmH] = useState((p.canvas.rows * p.canvas.gaugeH).toString());

  const handleColsChange = (val: string) => {
    const c = parseInt(val) || 1;
    setCols(c); setCmW((c * gw).toString());
  };
  const handleRowsChange = (val: string) => {
    const r = parseInt(val) || 1;
    setRows(r); setCmH((r * gh).toString());
  };
  const handleCmWChange = (val: string) => {
    setCmW(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) setCols(Math.max(1, Math.round(num / gw)));
  };
  const handleCmHChange = (val: string) => {
    setCmH(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) setRows(Math.max(1, Math.round(num / gh)));
  };

  const [centerContent, setCenterContent] = useState(false);
  const [scaleContent, setScaleContent] = useState(true);

  const [swatchSts, setSwatchSts] = useState(20);
  const [swatchRows, setSwatchRows] = useState(28);
  const [swatchCmW, setSwatchCmW] = useState(10);
  const [swatchCmH, setSwatchCmH] = useState(10);

  const calcSwatch = () => {
    const newGw = Number((swatchCmW / swatchSts).toFixed(3));
    const newGh = Number((swatchCmH / swatchRows).toFixed(3));
    if (newGw) { setGw(newGw); setCmW((cols * newGw).toString()); }
    if (newGh) { setGh(newGh); setCmH((rows * newGh).toString()); }
  };

  const [tipo_tejido, setTipoTejido] = useState(p.canvas.tipo_tejido || 'PLANO_RS_FRENTE');
  const [direccion_filas, setDireccionFilas] = useState(p.canvas.direccion_filas || 'BOTTOM_TO_TOP');
  const [direccion_columnas, setDireccionColumnas] = useState(p.canvas.direccion_columnas || 'RIGHT_TO_LEFT');
  const [startRow, setStartRow] = useState(p.canvas.startRow || 1);
  const [startCol, setStartCol] = useState(p.canvas.startCol || 1);
  const updateCanvasConfig = useStore(s => s.updateCanvasConfig);
  const scaleCanvas = useStore(s => s.scaleCanvas);

  const apply = () => {
    if (scaleContent) {
      scaleCanvas(cols, rows);
    } else {
      resizeCanvas(cols, rows, centerContent);
    }
    setGauge(gw, gh);
    updateCanvasConfig({ tipo_tejido, direccion_filas, direccion_columnas, startRow, startCol });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-sm" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <h2>Ajustes del patrón</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <div className="form-group" style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
            <label className="form-label">📏 Muestra de Tensión (Calculadora)</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
              Tengo <input className="settings-num" type="number" value={swatchSts} onChange={e => setSwatchSts(+e.target.value)} /> pts
              en <input className="settings-num" type="number" value={swatchCmW} onChange={e => setSwatchCmW(+e.target.value)} /> cm de ancho.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, fontSize: 12 }}>
              Tengo <input className="settings-num" type="number" value={swatchRows} onChange={e => setSwatchRows(+e.target.value)} /> vueltas
              en <input className="settings-num" type="number" value={swatchCmH} onChange={e => setSwatchCmH(+e.target.value)} /> cm de alto.
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', fontSize: 12 }} onClick={calcSwatch}>Calcular Proporción Interna (Gauge)</button>
          </div>

          <div className="form-group">
            <label className="form-label">Tamaño del Lienzo</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <span style={{width: 50, fontSize: 11}}>Puntos:</span>
              <input className="settings-num" type="number" min="1" value={cols} onChange={e => handleColsChange(e.target.value)} />
              <span style={{ color: 'var(--text-3)' }}>×</span>
              <input className="settings-num" type="number" min="1" value={rows} onChange={e => handleRowsChange(e.target.value)} />
              <span style={{ fontSize: 11 }}>vueltas</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
              <span style={{width: 50, fontSize: 11}}>Físico:</span>
              <input className="settings-num" type="number" step="any" min="1" value={cmW} onChange={e => handleCmWChange(e.target.value)} /> cm
              <span style={{ color: 'var(--text-3)' }}>×</span>
              <input className="settings-num" type="number" step="any" min="1" value={cmH} onChange={e => handleCmHChange(e.target.value)} /> cm
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 4 }}>
                <input type="checkbox" checked={centerContent} onChange={e => { setCenterContent(e.target.checked); if (e.target.checked) setScaleContent(false); }} />
                Centrar diseño en el nuevo tamaño (Recortar bordes)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: 4 }}>
                <input type="checkbox" checked={scaleContent} onChange={e => { setScaleContent(e.target.checked); if (e.target.checked) setCenterContent(false); }} />
                Escalar patrón completo (Achicar/Agrandar dibujo)
              </label>
            </div>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border)', paddingTop: 15 }}>
            <label className="form-label" style={{ marginBottom: 10 }}>Coordenadas, Guías y Dirección del Tejido</label>
            
            <div style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px solid var(--border)' }}>
              <label className="form-label" style={{ fontSize: 12, marginBottom: 8 }}>Modo de tejido (afecta las flechas de lectura):</label>
              <select className="form-input" style={{ fontSize: 12 }} value={tipo_tejido} onChange={e => setTipoTejido(e.target.value as any)}>
                <option value="PLANO_RS_FRENTE">Plano (Frente/Derecho en Filas Impares)</option>
                <option value="PLANO_WS_ESPALDA">Plano (Espalda/Revés en Filas Impares)</option>
                <option value="CIRCULAR">Circular (Siempre hacia el mismo lado)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                  <input type="checkbox" checked={p.canvas.showRowNumbers} onChange={useStore.getState().toggleRowNumbers} />
                  Numerar Filas
                </label>
                {p.canvas.showRowNumbers && (
                  <div style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <select className="form-input" style={{ fontSize: 11, padding: '4px 6px' }} value={direccion_filas} onChange={e => setDireccionFilas(e.target.value as any)}>
                      <option value="BOTTOM_TO_TOP">De Abajo hacia Arriba (↑)</option>
                      <option value="TOP_TO_BOTTOM">De Arriba hacia Abajo (↓)</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      Iniciar en:
                      <input className="settings-num" type="number" style={{ width: 50, padding: '2px 4px' }} value={startRow} onChange={e => setStartRow(+e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, marginBottom: 8, fontWeight: 600 }}>
                  <input type="checkbox" checked={p.canvas.showColNumbers} onChange={useStore.getState().toggleColNumbers} />
                  Numerar Columnas
                </label>
                {p.canvas.showColNumbers && (
                  <div style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <select className="form-input" style={{ fontSize: 11, padding: '4px 6px' }} value={direccion_columnas} onChange={e => setDireccionColumnas(e.target.value as any)}>
                      <option value="RIGHT_TO_LEFT">Derecha a Izquierda (←)</option>
                      <option value="LEFT_TO_RIGHT">Izquierda a Derecha (→)</option>
                    </select>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                      Iniciar en:
                      <input className="settings-num" type="number" style={{ width: 50, padding: '2px 4px' }} value={startCol} onChange={e => setStartCol(+e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={apply}>Aplicar cambios</button>
        </div>
      </div>
    </div>
  );
};

const FileMenuDialog: React.FC<{ onClose: () => void, onHome: () => void }> = ({ onClose, onHome }) => {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-sm" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <h2>Archivo</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <div className="export-option" onClick={() => { onClose(); onHome(); }}>
            <div className="export-option-icon">✨</div>
            <div>
              <div className="export-option-label">Nuevo Proyecto en Blanco</div>
              <div className="export-option-desc">Ir al inicio para crear un lienzo vacío desde cero.</div>
            </div>
          </div>

          <div className="export-option" onClick={() => { 
            onClose(); 
            useStore.setState({ showGarmentGenerator: true }); 
          }}>
            <div className="export-option-icon">👕</div>
            <div>
              <div className="export-option-label">Generador de Prendas</div>
              <div className="export-option-desc">Calcula medidas paramétricas y genera la cuadrícula exacta para un suéter, gorro, o bufanda.</div>
            </div>
          </div>
          
          <label className="export-option" style={{ cursor: 'pointer' }}>
            <div className="export-option-icon">📂</div>
            <div>
              <div className="export-option-label">Abrir Proyecto (.tramado)</div>
              <div className="export-option-desc">Carga un archivo previamente guardado desde tu dispositivo.</div>
            </div>
            <input type="file" accept=".tramado" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const state = useStore.getState();
                  const p = JSON.parse(ev.target?.result as string);
                  if (p && p.id && p.canvas) {
                    useStore.setState({ project: p, activeColorId: p.colors[0]?.id ?? null, history: [p.cells], histIdx: 0 });
                    onClose();
                  }
                } catch(e) { alert("Archivo inválido"); }
              };
              reader.readAsText(file);
            }} />
          </label>

          <label className="export-option" style={{ cursor: 'pointer' }}>
            <div className="export-option-icon">📥</div>
            <div>
              <div className="export-option-label">Insertar Patrón en esta Prenda</div>
              <div className="export-option-desc">Importa un .tramado existente y lo centra matemáticamente calculando puntos laterales y vueltas de inicio.</div>
            </div>
            <input type="file" accept=".tramado" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const p = JSON.parse(ev.target?.result as string);
                  if (p && p.id && p.canvas && p.cells) {
                    const state = useStore.getState();
                    const targetProject = state.project;
                    
                    // 1. Unir colores
                    const colorMap: Record<string, string> = {};
                    const newColors = [...targetProject.colors];
                    for (const ic of p.colors) {
                      const existing = newColors.find(c => c.hex === ic.hex);
                      if (existing) {
                        colorMap[ic.id] = existing.id;
                      } else {
                        const newId = Math.random().toString(36).substr(2, 9);
                        colorMap[ic.id] = newId;
                        newColors.push({ ...ic, id: newId });
                      }
                    }

                    // 2. Calcular Bounding Box del patrón
                    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
                    Object.keys(p.cells).forEach(k => {
                      const [c, r] = k.split(',').map(Number);
                      if (c < minC) minC = c; if (c > maxC) maxC = c;
                      if (r < minR) minR = r; if (r > maxR) maxR = r;
                    });
                    
                    if (minC === Infinity) { alert("El patrón está vacío."); return; }

                    const pCols = maxC - minC + 1;
                    const pRows = maxR - minR + 1;

                    // 3. Centrar en el lienzo
                    const tCols = targetProject.canvas.cols;
                    const tRows = targetProject.canvas.rows;
                    
                    const offsetX = Math.floor((tCols - pCols) / 2) - minC;
                    // En Tramado, la fila 0 es arriba y tRows-1 es abajo.
                    // Para que se vea como en la prenda, calculamos desde abajo.
                    // Centrarlo verticalmente o ponerlo en la mitad inferior:
                    const offsetY = Math.floor((tRows - pRows) / 2) - minR;
                    
                    // Insertar como Capa Nueva Automática
                    const newLayerId = 'layer_' + Math.random().toString(36).substr(2, 9);
                    const newLayer = {
                      id: newLayerId,
                      name: 'Patrón Importado: ' + p.name,
                      visible: true,
                      locked: false,
                      opacity: 1,
                      cells: {} as Record<string, string>
                    };

                    Object.entries(p.cells).forEach(([k, cId]) => {
                       const [c, r] = k.split(',').map(Number);
                       const mappedColor = colorMap[cId as string];
                       if (mappedColor) {
                          newLayer.cells[`${c + offsetX},${r + offsetY}`] = mappedColor;
                       }
                    });

                    // 4. Reporte
                    const leftMargin = Math.floor((tCols - pCols) / 2);
                    const rightMargin = tCols - leftMargin - pCols;
                    
                    const marginAbove = Math.floor((tRows - pRows) / 2);
                    const marginBelow = tRows - marginAbove - pRows;

                    const report = `UBICACIÓN DEL GRÁFICO "${p.name}"\n` + 
                                   `- Área: ${pCols} pts ancho x ${pRows} vtas alto.\n` +
                                   `- Centrado H: ${leftMargin} pts a la izquierda, ${rightMargin} pts a la derecha.\n` + 
                                   `- Centrado V: El gráfico comienza a ${marginBelow} vueltas desde la base, y finaliza dejando ${marginAbove} vueltas hasta el hombro.\n` +
                                   `NOTA: Se creó una capa nueva llamada "Patrón Importado: ${p.name}".`;

                    const newNotes = targetProject.notes ? targetProject.notes + '\n\n' + report : report;

                    // Asegurar que el proyecto tiene la propiedad layers inicializada
                    const existingLayers = targetProject.layers || [];
                    const newLayers = [...existingLayers, newLayer];

                    const newProject = { 
                      ...targetProject, 
                      colors: newColors, 
                      layers: newLayers, 
                      notes: newNotes 
                    };

                    const newHistory = state.history.slice(0, state.histIdx + 1);
                    // Guardar snapshot para deshacer. El snapshot necesita cells, layers, etc.
                    newHistory.push({
                      cells: { ...newProject.cells },
                      layers: newProject.layers.map(l => ({ ...l, cells: { ...l.cells } }))
                    } as any);

                    useStore.setState({ 
                      project: newProject,
                      history: newHistory, 
                      histIdx: newHistory.length - 1,
                      activeLayerId: newLayerId,
                      selection: { c1: minC + offsetX, r1: minR + offsetY, c2: maxC + offsetX, r2: maxR + offsetY },
                      activeTool: 'select'
                    });
                    
                    alert('Gráfico centrado exitosamente.\n\n' + report);
                    onClose();
                  }
                } catch(e) { alert("Archivo inválido"); }
              };
              reader.readAsText(file);
            }} />
          </label>

          <div className="export-option" onClick={async () => {
            const state = useStore.getState();
            const data = JSON.stringify(state.project, null, 2);
            if ((window as any).require) {
              try {
                const { ipcRenderer } = (window as any).require('electron');
                const path = await ipcRenderer.invoke('save-file-dialog', data, `${state.project.name}.tramado`);
                if (path) onClose();
                return;
              } catch (e) {
                console.warn('Native save failed, falling back to web download', e);
              }
            }
            // Fallback for Web/Dev
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${state.project.name}.tramado`;
            a.click();
            onClose();
          }}>
            <div className="export-option-icon">💾</div>
            <div>
              <div className="export-option-label">Guardar copia (.tramado)</div>
              <div className="export-option-desc">Descarga una copia de seguridad para compartir o guardar. (Nota: La app ya autoguarda tu progreso localmente).</div>
            </div>
          </div>
          
          <div className="export-option" onClick={() => {
            const state = useStore.getState();
            state.openPrintView();
            onClose();
          }}>
            <div className="export-option-icon">📖</div>
            <div>
              <div className="export-option-label">Exportar PDF Editorial (Premium)</div>
              <div className="export-option-desc">Genera una revista completa con portada, leyenda, cálculo de materiales, esquema e instrucciones escritas.</div>
            </div>
          </div>
          
          <div className="export-option" onClick={() => {
            const state = useStore.getState();
            exportProjectToPng(state.project).then(onClose);
          }}>
            <div className="export-option-icon">📄</div>
            <div>
              <div className="export-option-label">Exportar a PNG / SVG</div>
              <div className="export-option-desc">Exporta únicamente el gráfico en alta resolución con la leyenda básica debajo.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WrittenInstructionsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const p = useStore(s => s.project);
  const [baseStitch, setBaseStitch] = useState(
    p.craft === 'knitting' ? 'pto derecho (k)' : 
    ['crochet_colorwork', 'crochet_filet', 'crochet_mosaic', 'crochet_tunisian'].includes(p.craft) ? 'pto bajo (pb)' : 
    p.craft === 'crochet_c2c' ? 'bloque C2C (3pa)' :
    ['cross_stitch', 'embroidery'].includes(p.craft) ? 'cruces' : 'puntos'
  );

  const generateInstructions = () => {
    const lines = [];
    const { tipo_tejido, direccion_filas, direccion_columnas, startRow } = p.canvas;
    
    // Determine start and step based on direccion_filas
    const goUp = direccion_filas === 'BOTTOM_TO_TOP';
    const startIdx = goUp ? p.canvas.rows - 1 : 0;
    const endIdx = goUp ? -1 : p.canvas.rows;
    const step = goUp ? -1 : 1;

    let displayR = startRow;
    let prevMin = -1;
    let prevMax = -1;

    for (let r = startIdx; r !== endIdx; r += step) {
      // Determine read direction for this row
      // If CIRCULAR, always read in the same direction (default Right to Left).
      // If PLANO_RS_FRENTE, odd rows (Right Side) read Right to Left, even read Left to Right.
      // If PLANO_WS_ESPALDA, odd rows read Left to Right, even read Right to Left.
      let isRightToLeft = direccion_columnas === 'RIGHT_TO_LEFT';
      if (tipo_tejido !== 'CIRCULAR') {
        const isOddRow = (displayR % 2 !== 0);
        if (tipo_tejido === 'PLANO_RS_FRENTE') {
          isRightToLeft = isOddRow ? (direccion_columnas === 'RIGHT_TO_LEFT') : (direccion_columnas !== 'RIGHT_TO_LEFT');
        } else {
          isRightToLeft = isOddRow ? (direccion_columnas !== 'RIGHT_TO_LEFT') : (direccion_columnas === 'RIGHT_TO_LEFT');
        }
      }
      
      const counts: { color: string, count: number }[] = [];
      let minC = Infinity, maxC = -Infinity;
      
      for (let i = 0; i < p.canvas.cols; i++) {
        const c = isRightToLeft ? (p.canvas.cols - 1 - i) : i;
        
        let colorId = undefined;
        if (p.layers && p.layers.length > 0) {
          for (let l = p.layers.length - 1; l >= 0; l--) {
            if (p.layers[l].visible && p.layers[l].cells[`${c},${r}`]) {
              colorId = p.layers[l].cells[`${c},${r}`];
              break;
            }
          }
        }
        if (!colorId) colorId = p.cells[`${c},${r}`];

        if (!colorId) continue;
        if (i < minC) minC = i;
        if (i > maxC) maxC = i;

        const colorObj = p.colors.find(x => x.id === colorId);
        const colorName = colorObj?.name || 'Color Desconocido';
        const isCrossStitch = ['cross_stitch', 'embroidery'].includes(p.craft);
        const displayName = isCrossStitch ? `[Símbolo ${colorObj?.symbol || '?'}] ${colorName}` : colorName;
        
        if (counts.length > 0 && counts[counts.length - 1].color === displayName) {
          counts[counts.length - 1].count++;
        } else {
          counts.push({ color: displayName, count: 1 });
        }
      }
      
      if (counts.length > 0) {
        let prefix = "";
        // Smart Decreases/Increases detection (basic heuristic)
        if (prevMin !== -1 && prevMax !== -1) {
          // Note: i is iteration index (0 to cols-1). minC and maxC are in terms of iteration index.
          const leftDiff = minC - prevMin;
          const rightDiff = prevMax - maxC;
          
          if (leftDiff > 0 && rightDiff > 0) prefix = `<span style="color:var(--amber);font-size:11px;padding-right:6px">▼ Disminuir ${leftDiff}pt al inicio y ${rightDiff}pt al final.</span>`;
          else if (leftDiff > 0) prefix = `<span style="color:var(--amber);font-size:11px;padding-right:6px">▼ Disminuir ${leftDiff}pt al inicio.</span>`;
          else if (rightDiff > 0) prefix = `<span style="color:var(--amber);font-size:11px;padding-right:6px">▼ Disminuir ${rightDiff}pt al final.</span>`;
          
          if (leftDiff < 0 && rightDiff < 0) prefix = `<span style="color:var(--green);font-size:11px;padding-right:6px">▲ Aumentar ${Math.abs(leftDiff)}pt al inicio y ${Math.abs(rightDiff)}pt al final.</span>`;
        }

        prevMin = minC;
        prevMax = maxC;

        const formattedCounts = counts.map(x => {
          return `<span style="color:var(--text-2)">${x.color}</span> <b>${x.count}</b> ${baseStitch}`;
        }).join(', ');
        
        lines.push(
          <div key={r} className="instr-row" style={{ fontSize: 13, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>
            <b style={{ display: 'inline-block', width: 65, color: 'var(--accent)' }}>Vta {displayR}</b> 
            <span style={{ color: 'var(--text-3)', fontSize: 11, marginRight: 10 }} title={isRightToLeft ? 'Leer de derecha a izquierda' : 'Leer de izquierda a derecha'}>
              {isRightToLeft ? '(←)' : '(→)'}
            </span>
            <span dangerouslySetInnerHTML={{ __html: prefix + formattedCounts }} />.
          </div>
        );
      }
      displayR++;
    }
    return lines.length ? lines : <div className="instr-row" style={{ padding: 20, textAlign: 'center', color: 'var(--text-3)' }}>El patrón está vacío. Dibuja en el lienzo para generar las instrucciones.</div>;
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="dlg-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>📝</span> Traductor Textual de Patrones
            </h2>
            <p>Genera instrucciones escritas dinámicas según tu tipo de tejido.</p>
          </div>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        
        <div style={{ padding: '0 20px', display: 'flex', gap: 15, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          <div className="form-group" style={{ margin: '15px 0', flex: 1 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Tipo de Construcción</label>
            <div style={{ fontSize: 12, padding: '8px 10px', background: 'var(--surface-1)', borderRadius: 6, color: 'var(--text-2)' }}>
              Se hereda de ⚙️ Ajustes: <b>{p.canvas.tipo_tejido === 'CIRCULAR' ? 'Circular' : 'Plano'}</b>
            </div>
          </div>
          <div className="form-group" style={{ margin: '15px 0', flex: 1 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Nombre de la Puntada Base</label>
            <input className="form-input" value={baseStitch} onChange={e => setBaseStitch(e.target.value)} placeholder="Ej: pb, k, cruces..." />
          </div>
        </div>

        <div className="dlg-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {generateInstructions()}
        </div>
      </div>
    </div>
  );
};

const MergeColorDialog: React.FC<{ targetColorId: string, onClose: () => void }> = ({ targetColorId, onClose }) => {
  const p = useStore(s => s.project);
  const removeColor = useStore(s => s.removeColor);
  const [mergeIntoId, setMergeIntoId] = useState<string>('');

  const target = p.colors.find(x => x.id === targetColorId);
  const others = p.colors.filter(x => x.id !== targetColorId);

  const handle = () => {
    removeColor(targetColorId, mergeIntoId || undefined);
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-sm" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <h2>Eliminar hilo en uso</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 14 }}>
            El hilo <b>{target?.name}</b> se está utilizando en el lienzo. Puedes reemplazar sus puntos con otro hilo o simplemente eliminarlos.
          </p>
          <div className="form-group">
            <label className="form-label">Acción</label>
            <select className="form-input" value={mergeIntoId} onChange={e => setMergeIntoId(e.target.value)}>
              <option value="">Simplemente eliminar puntos (borrar)</option>
              {others.map(c => <option key={c.id} value={c.id}>Reemplazar con: {c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" onClick={handle}>Confirmar</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Editor Screen ───────────────────────────────────────────────────────
const EditorScreen: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const store = useStore();
  const p = store.project;
  
  const techSyms = getTechnicalSymbols(p.craft);
  const hasTechSyms = techSyms.length > 0;

  // ── Auto-Save ────────────────────────────────────────────────────────────────
  const { performAutoSave } = useAutoSave();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleManualAutoSave = useCallback(async () => {
    setAutoSaveStatus('saving');
    performAutoSave();
    setTimeout(() => setAutoSaveStatus('saved'), 400);
    setTimeout(() => setAutoSaveStatus('idle'), 2500);
  }, [performAutoSave]);

  // Keybindings
  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (store.showColorEditor || store.showSettings || store.showImageImport || store.showExport) return;

      if (store.trackerActive) {
        if (e.key === 'ArrowUp') { e.preventDefault(); store.moveTracker(0, -1); }
        if (e.key === 'ArrowDown') { e.preventDefault(); store.moveTracker(0, 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); store.moveTracker(-1, 0); }
        if (e.key === 'ArrowRight') { e.preventDefault(); store.moveTracker(1, 0); }
      }

      const k = e.key.toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (k === 'z') { e.preventDefault(); if (e.shiftKey) store.redo(); else store.undo(); }
        if (k === 'y') { e.preventDefault(); store.redo(); }
        if (k === 'c') { e.preventDefault(); store.copySelection(); }
        if (k === 'v') { e.preventDefault(); store.pasteClipboard(store.cursorCol, store.cursorRow); }
      } else {
        if (k === 'd') store.setTool('draw');
        if (k === 'e') store.setTool('erase');
        if (k === 'f') store.setTool('fill');
        if (k === 'w') store.setTool('wand');
        if (k === 'l') store.setTool('line');
        if (k === 's') store.setTool('select');
        if (k === 'h') store.setTool('pan');
        if (k === 't' && hasTechSyms) store.setTool('stamp');
        if (k === 'g') store.toggleGrid();
        if (e.key === 'Delete' || e.key === 'Backspace') store.clearSelection();
      }
    };
    window.addEventListener('keydown', cb);
    return () => window.removeEventListener('keydown', cb);
  }, [store]);

  // Derived counts
  const { counts, totalPainted } = useMemo(() => {
    const c: Record<string, number> = {};
    let total = 0;
    for (const v of Object.values(p.cells)) {
      c[v] = (c[v] || 0) + 1;
      total++;
    }
    return { counts: c, totalPainted: total };
  }, [p.cells]);

  const [mergeColorId, setMergeColorId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [leftTab, setLeftTab] = useState<'colors' | 'symbols' | 'layers' | 'notes'>('colors');
  const [zenMode, setZenMode] = useState(false);

  const [textOptions, setTextOptions] = useState({
    text: 'TRAMADO',
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: 'bold'
  });

  return (
    <div className="editor">
      {/* Topbar */}
      <div className="editor-topbar">
        <div className="topbar-brand" onClick={onHome}><span className="topbar-brand-em">🧶</span> Inicio</div>
        <div className="topbar-sep" />
        <button className="topbar-btn" onClick={() => setShowHelp(true)}>❓ Ayuda</button>
        <button className="topbar-btn" onClick={store.undo} disabled={store.histIdx <= 0}>↩ Deshacer</button>
        <button className="topbar-btn" onClick={store.redo} disabled={store.histIdx >= store.history.length - 1}>↪ Rehacer</button>
        
        <div className="topbar-title">
          {p.dirty && <span className="topbar-dirty">●</span>}
          {p.name}
          <span className="topbar-craft-badge">{CRAFT_NAMES[p.craft] || p.craft}</span>
        </div>
        
        <div className="topbar-spacer" />
        
        <button className="topbar-btn" onClick={() => setShowMaterials(true)}>🧶 Hilos y Costos</button>
        <button className="topbar-btn" onClick={() => store.setShowWrittenInstructions(!store.showWrittenInstructions)}>📝 Instrucciones</button>
        <button className="topbar-btn" onClick={() => setZenMode(!zenMode)}>{zenMode ? '🗗 Salir Pantalla Completa' : '🖥️ Pantalla Completa'}</button>
        <button className="topbar-btn" onClick={store.toggleSettings}>⚙️ Ajustes</button>
        <button className="topbar-btn" onClick={store.toggleTracker} style={store.trackerActive ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}} title="Seguidor de Tejido (Flechas del Teclado para mover)">{store.trackerActive ? '🎯 Seguidor ACTIVO' : '🎯 Seguidor'}</button>
        <button className="topbar-btn" onClick={store.openPrintView} title="Imprimir Patrón">🖨️ Imprimir</button>
        <button 
          className="topbar-btn" 
          onClick={handleManualAutoSave} 
          title="Guardar respaldo manual ahora"
          style={autoSaveStatus === 'saved' ? { background: '#a6e3a1', color: '#1e1e2e', borderColor: '#a6e3a1' } : autoSaveStatus === 'saving' ? { opacity: 0.6 } : {}}
        >
          {autoSaveStatus === 'saving' ? '⏳' : autoSaveStatus === 'saved' ? '✅ Guardado' : '💾 Respaldo'}
        </button>
        <button className="topbar-btn primary" onClick={store.toggleExport}>📂 Archivo</button>
      </div>

      {/* Left Panel: Colors & Symbols */}
      {!zenMode && (
      <div className="left-panel">
        <div className="panel-head" style={{ paddingBottom: 0, flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span>Paleta</span>
            <button className="panel-icon-btn" onClick={store.toggleSymbols} title="Mostrar símbolos (S)">S</button>
          </div>
          <div className="color-editor-tabs" style={{ marginBottom: 10 }}>
            <div className={`color-editor-tab ${leftTab === 'colors' ? 'active' : ''}`} onClick={() => setLeftTab('colors')}>Hilos</div>
            {hasTechSyms && <div className={`color-editor-tab ${leftTab === 'symbols' ? 'active' : ''}`} onClick={() => setLeftTab('symbols')}>Técnicos</div>}
            <div className={`color-editor-tab ${leftTab === 'layers' ? 'active' : ''}`} onClick={() => setLeftTab('layers')}>Capas</div>
            <div className={`color-editor-tab ${leftTab === 'notes' ? 'active' : ''}`} onClick={() => setLeftTab('notes')}>Notas</div>
          </div>
        </div>
        
        <div className="color-list">
          {leftTab === 'colors' && p.colors.map(c => (
            <div key={c.id} className={`color-row ${store.activeColorId === c.id ? 'active' : ''}`}
              onClick={() => store.setActiveColor(c.id)} onDoubleClick={() => store.openColorEditor(c.id)}>
              <div className="color-swatch-box" style={{ background: c.hex, color: c.symbolColor }}>
                {store.project.canvas.showSymbols ? c.symbol : ''}
              </div>
              <div className="color-row-info">
                <div className="color-row-name">{c.name}</div>
                <div className="color-row-count">
                  {counts[c.id] || 0} celdas 
                  {totalPainted > 0 && <span style={{ color: 'var(--text-3)', marginLeft: 4 }}>({(((counts[c.id] || 0) / totalPainted) * 100).toFixed(1)}%)</span>}
                </div>
              </div>
              <div className="color-row-actions">
                <button className="panel-icon-btn" onClick={e => { e.stopPropagation(); store.openColorEditor(c.id); }}>✎</button>
                <button className="panel-icon-btn" onClick={e => { 
                  e.stopPropagation(); 
                  if (counts[c.id] > 0) setMergeColorId(c.id);
                  else store.removeColor(c.id);
                }}>✕</button>
              </div>
            </div>
          ))}

          {leftTab === 'symbols' && hasTechSyms && techSyms.map(sym => (
            <div key={sym.id} className={`color-row ${store.activeSymbolDefId === sym.id ? 'active' : ''}`}
              onClick={() => store.setActiveSymbol(sym.id)}>
              <div className="color-swatch-box" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox={`0 0 ${sym.w * 10} ${sym.h * 10}`} style={{ color: '#000' }} dangerouslySetInnerHTML={{ __html: sym.svgPath }} />
              </div>
              <div className="color-row-info">
                <div className="color-row-name">{sym.name}</div>
                <div className="color-row-count">{sym.w}×{sym.h} celdas</div>
              </div>
            </div>
          ))}
          {leftTab === 'layers' && (
            <>
              {/* Base Layer */}
              <div className={`color-row ${store.activeLayerId === 'main' ? 'active' : ''}`} onClick={() => store.setActiveLayer('main')}>
                <div className="color-swatch-box" style={{ background: '#eee' }}>1</div>
                <div className="color-row-info">
                  <div className="color-row-name">Diseño Base</div>
                </div>
              </div>
              
              {/* Additional Layers */}
              {p.layers?.map(l => (
                <div key={l.id} className={`color-row ${store.activeLayerId === l.id ? 'active' : ''}`} onClick={() => store.setActiveLayer(l.id)}>
                  <div className="color-swatch-box" style={{ background: '#ddd' }}>L</div>
                  <div className="color-row-info">
                    <div className="color-row-name" style={{ color: l.visible ? 'inherit' : '#999' }}>{l.name}</div>
                  </div>
                  <div className="color-row-actions">
                    <button className="panel-icon-btn" onClick={e => { e.stopPropagation(); store.toggleLayerVisibility(l.id); }}>{l.visible ? '👁' : '🚫'}</button>
                    <button className="panel-icon-btn" onClick={e => { e.stopPropagation(); store.removeLayer(l.id); }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ padding: 10 }}>
                <button className="add-color-btn" onClick={() => {
                  const n = prompt('Nombre de la nueva capa (ej. Guías, Notas):');
                  if (n) store.addLayer(n);
                }}>+ Añadir Capa Extra</button>
              </div>
            </>
          )}
          {leftTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 10, background: 'var(--surface-1)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                Escribe aquí tus instrucciones manuales, apuntes o recordatorios de aumentos y disminuciones para este patrón.
              </div>
              <textarea 
                className="form-input" 
                style={{ flex: 1, resize: 'none', fontSize: 13, lineHeight: 1.5, fontFamily: 'sans-serif' }}
                placeholder="Escribe tus notas aquí..."
                value={p.notes || ''}
                onChange={e => store.updateNotes(e.target.value)}
              />
            </div>
          )}
        </div>
        
        {leftTab === 'colors' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button className="add-color-btn" onClick={() => store.openColorEditor('new')}>+ Añadir nuevo hilo/color</button>
            <div style={{ display: 'flex', gap: 5 }}>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: 11 }} onClick={() => {
                const json = JSON.stringify(store.project.colors, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mi_paleta.json';
                a.click();
              }}>Exportar Paleta</button>
              <button className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: 11 }} onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    try {
                      const colors = JSON.parse(re.target?.result as string);
                      if (Array.isArray(colors)) {
                        colors.forEach(c => store.project.colors.push(c));
                      }
                    } catch (err) { alert('Archivo de paleta inválido'); }
                  };
                  reader.readAsText(file);
                };
                input.click();
              }}>Importar Paleta</button>
            </div>
          </div>
        )}

        {/* Tools */}
        <div className="tool-section">
          <div className="tool-section-label">Herramientas</div>
          <div className="tool-grid">
            <button className={`tool-btn ${store.activeTool === 'draw' ? 'active' : ''}`} onClick={() => store.setTool('draw')} title="Dibujar (D)"><IconDraw />Dibuja</button>
            {hasTechSyms && <button className={`tool-btn ${store.activeTool === 'stamp' ? 'active' : ''}`} onClick={() => {
              if (!store.activeSymbolDefId) store.setActiveSymbol(techSyms[0].id);
              else store.setTool('stamp');
            }} title="Sellar Símbolo (T)"><IconStamp />Sellar</button>}
            <button className={`tool-btn ${store.activeTool === 'erase' ? 'active' : ''}`} onClick={() => store.setTool('erase')} title="Borrar (E)"><IconErase />Borra</button>
            <button className={`tool-btn ${store.activeTool === 'fill' ? 'active' : ''}`} onClick={() => store.setTool('fill')} title="Rellenar (F)"><IconFill />Rellena</button>
            <button className={`tool-btn ${store.activeTool === 'wand' ? 'active' : ''}`} onClick={() => store.setTool('wand')} title="Reemplazar Color (W)"><IconWand />Varita</button>
            {/* <button className={`tool-btn ${store.activeTool === 'text' ? 'active' : ''}`} onClick={() => store.setTool('text')} title="Rasterizar Texto"><IconText />Texto</button> */}
            <button className={`tool-btn ${store.activeTool === 'line' ? 'active' : ''}`} onClick={() => store.setTool('line')} title="Línea Recta (L)"><IconLine />Línea</button>
            <button className={`tool-btn ${store.activeTool === 'rect' ? 'active' : ''}`} onClick={() => store.setTool('rect')} title="Rectángulo"><IconRect />Rectán.</button>
            <button className={`tool-btn ${store.activeTool === 'ellipse' ? 'active' : ''}`} onClick={() => store.setTool('ellipse')} title="Elipse"><IconEllipse />Elipse</button>
            <button className={`tool-btn ${store.activeTool === 'select' ? 'active' : ''}`} onClick={() => store.setTool('select')} title="Seleccionar (S)"><IconSelect />Elige</button>
            <button className={`tool-btn ${store.activeTool === 'pan' ? 'active' : ''}`} onClick={() => store.setTool('pan')} title="Mover (H)"><IconPan />Mover</button>
          </div>
          <div className="mirror-row" style={{ flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`mirror-btn ${p.canvas.mirrorH ? 'on' : ''}`} onClick={store.toggleMirrorH}>Espejo H</button>
              <button className={`mirror-btn ${p.canvas.mirrorV ? 'on' : ''}`} onClick={store.toggleMirrorV}>Espejo V</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className={`mirror-btn ${store.showVectorGuides ? 'on' : ''}`} onClick={store.toggleVectorGuides} style={{ flex: 1, borderColor: store.showVectorGuides ? 'var(--accent)' : 'var(--border)' }}>{store.showVectorGuides ? '👁 Contorno ON' : '🚫 Contorno OFF'}</button>
              <button className="mirror-btn" onClick={store.clearVectorGuides} title="Borrar todos los contornos vectoriales">🗑 Limpiar</button>
            </div>
          </div>
        </div>

        {/* Tracker UI in Left Panel */}
        {store.trackerActive && (
          <div className="tracker-ui" style={{ marginTop: 'auto', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', padding: '15px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 12, color: 'var(--accent)' }}>🎯 Seguidor de Tejido</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px' }} onClick={() => {
                if (p.craft === 'crochet_c2c') {
                  if (store.trackerRow - 1 >= 0) store.moveTracker(0, -1);
                  else store.moveTracker(-1, 0);
                } else {
                  store.moveTracker(0, -1);
                }
              }}>↑ Subir</button>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px' }} onClick={() => {
                if (p.craft === 'crochet_c2c') {
                  if (store.trackerRow + 1 < p.canvas.rows) store.moveTracker(0, 1);
                  else store.moveTracker(1, 0);
                } else {
                  store.moveTracker(0, 1);
                }
              }}>↓ Bajar</button>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px' }} onClick={() => {
                if (p.craft === 'crochet_c2c') store.moveTracker(-1, 1);
                else store.moveTracker(-1, 0);
              }}>← Izq</button>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px' }} onClick={() => {
                if (p.craft === 'crochet_c2c') store.moveTracker(1, -1);
                else store.moveTracker(1, 0);
              }}>Der →</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Ir a Vuelta:</span>
              <input type="number" className="form-input" style={{ width: 50, padding: '2px', textAlign: 'center', fontSize: 11 }} 
                     value={p.craft === 'crochet_c2c' ? store.trackerRow + store.trackerCol : p.canvas.rows - store.trackerRow} 
                     onChange={e => {
                       const v = Number(e.target.value);
                       if (p.craft === 'crochet_c2c') {
                         const maxC = p.canvas.cols - 1;
                         store.setTrackerPos(Math.min(v, maxC), Math.max(0, v - maxC));
                       } else {
                         store.setTrackerPos(store.trackerCol, p.canvas.rows - v);
                       }
                     }} />
            </div>
          </div>
        )}
      </div>
      )}

      {/* Canvas */}
      <GridCanvas />

      {/* Statusbar */}
      {!zenMode && (
      <div className="statusbar">
        <div className="statusbar-tool">Modo: {store.activeTool.toUpperCase()}</div>
        <div className="statusbar-item">Col: <span>{store.cursorCol + 1}</span></div>
        <div className="statusbar-item">Fila: <span>{p.canvas.rows - store.cursorRow}</span></div>
        <div className="statusbar-spacer" />
        <div className="statusbar-item">Grid: <span style={{ cursor:'pointer' }} onClick={store.toggleGrid}>{p.canvas.showGrid ? 'ON' : 'OFF'}</span></div>
        <div className="statusbar-item">Filas #: <span style={{ cursor:'pointer' }} onClick={store.toggleRowNumbers}>{p.canvas.showRowNumbers ? 'ON' : 'OFF'}</span></div>
      </div>
      )}

      {/* Tracker UI moved to left panel */}

      {/* Overlays */}
      {store.selection && !zenMode && (
        <div className="selection-toolbar" style={{ top: 50, left: 220 }}>
          <span>Sección: {store.selection.c2 - store.selection.c1 + 1}×{store.selection.r2 - store.selection.r1 + 1}</span>
          <div className="topbar-sep" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, width: 70, marginRight: 10 }}>
            <div />
            <button className="sel-btn" style={{ padding: 2 }} onClick={() => store.moveSelection(0, -1)}>▲</button>
            <div />
            <button className="sel-btn" style={{ padding: 2 }} onClick={() => store.moveSelection(-1, 0)}>◀</button>
            <button className="sel-btn" style={{ padding: 2 }} onClick={() => store.moveSelection(0, 1)}>▼</button>
            <button className="sel-btn" style={{ padding: 2 }} onClick={() => store.moveSelection(1, 0)}>▶</button>
          </div>
          <div className="topbar-sep" />
          <button className="sel-btn" onClick={store.copySelection} title="Copiar (Ctrl+C)">Copiar</button>
          <button className="sel-btn" onClick={store.cutSelection} title="Cortar (Ctrl+X)">Cortar</button>
          <div className="topbar-sep" />
          <button className="sel-btn" onClick={store.rotateSelection90} title="Rotar 90°">Rotar 90°</button>
          <button className="sel-btn" onClick={store.mirrorSelectionH} title="Espejo Horizontal">↔ Espejo</button>
          <button className="sel-btn" onClick={store.mirrorSelectionV} title="Espejo Vertical">↕ Espejo</button>
          <div className="topbar-sep" />
          <button className="sel-btn" onClick={() => store.scaleSelection(1.1)} title="Agrandar un 10%">🔍 +</button>
          <button className="sel-btn" onClick={() => store.scaleSelection(0.9)} title="Achicar un 10%">🔍 -</button>
          <div className="topbar-sep" />
          <button className="sel-btn danger" onClick={store.clearSelection} title="Borrar (Supr)">Borrar</button>
          <button className="sel-btn" onClick={() => store.setSelection(null)}>✕ Deseleccionar</button>
        </div>
      )}

      {store.showColorEditor && store.editingColorId && <ColorEditorDialog colorId={store.editingColorId} onClose={store.closeColorEditor} />}
      {store.showSettings && <SettingsDialog onClose={store.toggleSettings} />}
      {store.showExport && <FileMenuDialog onClose={store.toggleExport} onHome={onHome} />}
      {store.showWrittenInstructions && <WrittenInstructionsDialog onClose={() => store.setShowWrittenInstructions(false)} />}
      {mergeColorId && <MergeColorDialog targetColorId={mergeColorId} onClose={() => setMergeColorId(null)} />}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
      {showMaterials && <MaterialsDialog onClose={() => setShowMaterials(false)} />}
      {store.showPrintView && <PrintView onClose={() => store.setShowPrintView(false)} />}
      
      {/* Floating Text Tool Menu (Deactivated per user request)
      {store.activeTool === 'text' && (
        <div style={{
          position: 'fixed',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--r-md)',
          padding: '10px 15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          zIndex: 1000
        }}>
          ...
        </div>
      )}
      */}
    </div>
  );
};

export default EditorScreen;
