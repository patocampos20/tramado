import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { uid, buildStarterPalette, makeColor, contrastFor } from '../utils/color';
import type { Project, CanvasConfig, ColorEntry, CraftType, ToolId, Viewport, SelectionRect } from '../types';

// ─── Craft gauge defaults ─────────────────────────────────────────────────────
export const GAUGE_DEFAULTS: Record<string, { w: number; h: number }> = {
  crochet_colorwork: { w: 1.0, h: 1.2 },
  crochet_c2c:       { w: 1.0, h: 1.0 },
  crochet_filet:     { w: 1.0, h: 1.0 },
  crochet_mosaic:    { w: 1.0, h: 1.3 },
  crochet_tunisian:  { w: 1.0, h: 0.85 },
  cross_stitch:      { w: 1.0, h: 1.0 },
  knitting:          { w: 1.0, h: 0.75 },
  diamond_painting:  { w: 1.0, h: 1.0 },
  hama_beads:        { w: 1.0, h: 1.0 },
  macrame:           { w: 1.0, h: 1.5 },
  latch_hook:        { w: 1.0, h: 1.0 },
  quilt:             { w: 1.0, h: 1.0 },
  embroidery:        { w: 1.0, h: 1.0 },
  custom:            { w: 1.0, h: 1.0 },
};

function makeCanvas(cols = 40, rows = 40, craft: CraftType = 'crochet_colorwork'): CanvasConfig {
  const g = GAUGE_DEFAULTS[craft] ?? { w: 1, h: 1 };
  return {
    cols, rows, cellSize: 18,
    showGrid: true, gridColor: '#aaaaaa', bgColor: '#f5f5f0',
    gaugeW: g.w, gaugeH: g.h,
    showSymbols: true, showRowNumbers: true, showColNumbers: false,
    tipo_tejido: 'PLANO_RS_FRENTE', direccion_filas: 'BOTTOM_TO_TOP', direccion_columnas: 'RIGHT_TO_LEFT', startRow: 1, startCol: 1,
    mirrorH: false, mirrorV: false,
  };
}

function newProject(name: string, craft: CraftType, cols = 40, rows = 40): Project {
  return {
    id: uid(), name, craft,
    createdAt: Date.now(), updatedAt: Date.now(),
    canvas: makeCanvas(cols, rows, craft),
    colors: buildStarterPalette(),
    cells: {},
    placedSymbols: [],
    dirty: false,
  };
}

// ─── Snapshot for undo/redo ───────────────────────────────────────────────────
type Snap = Record<string, string>;

interface State {
  project: Project;
  activeColorId: string | null;
  activeSymbolDefId: string | null;
  activeTool: ToolId;
  viewport: Viewport;
  selection: SelectionRect | null;
  cursorCol: number;
  cursorRow: number;
  history: Snap[];
  histIdx: number;
  
  // Layers
  activeLayerId: string; // 'main' or layer ID
  addLayer: (name: string) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  setActiveLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;

  // Tracker (Seguidor de tejido)
  trackerActive: boolean;
  trackerCol: number;
  trackerRow: number;
  toggleTracker: () => void;
  moveTracker: (dc: number, dr: number) => void;
  setTrackerPos: (c: number, r: number) => void;
  // UI panels
  showColorEditor: boolean;
  editingColorId: string | null;
  showSettings: boolean;
  showImageImport: boolean;
  showExport: boolean;
  showLegend: boolean;
  showWrittenInstructions: boolean;

  // Actions
  createProject: (name: string, craft: CraftType, cols: number, rows: number) => void;
  loadProject: (p: Project) => void;
  setActiveColor: (id: string) => void;
  setActiveSymbol: (defId: string) => void;
  setTool: (t: ToolId) => void;
  paintCell: (col: number, row: number) => void;
  eraseCell: (col: number, row: number) => void;
  fillFlood: (col: number, row: number) => void;
  fillGlobal: (col: number, row: number) => void;
  placeSymbol: (col: number, row: number) => void;
  removeSymbol: (id: string) => void;
  pushSnap: () => void;
  undo: () => void;
  redo: () => void;
  setZoom: (z: number) => void;
  pan: (dx: number, dy: number) => void;
  setCursor: (c: number, r: number) => void;
  setSelection: (s: SelectionRect | null) => void;
  // Colors
  addColor: () => void;
  removeColor: (id: string, mergeIntoId?: string) => void;
  updateColor: (id: string, patch: Partial<ColorEntry>) => void;
  moveColorUp: (id: string) => void;
  moveColorDown: (id: string) => void;
  // Canvas
  resizeCanvas: (cols: number, rows: number, centerContent?: boolean) => void;
  scaleCanvas: (cols: number, rows: number) => void;
  setGauge: (w: number, h: number) => void;
  toggleGrid: () => void;
  toggleSymbols: () => void;
  setCellRenderMode: (mode: 'color' | 'initials' | 'symbols') => void;
  toggleMirrorH: () => void;
  toggleMirrorV: () => void;
  toggleRowNumbers: () => void;
  toggleColNumbers: () => void;
  updateCanvasConfig: (patch: Partial<CanvasConfig>) => void;
  // Copy/paste selection
  copySelection: () => void;
  cutSelection: () => void;
  pasteClipboard: (col: number, row: number) => void;
  mirrorSelectionH: () => void;
  mirrorSelectionV: () => void;
  rotateSelection90: () => void;
  moveSelection: (dc: number, dr: number) => void;
  scaleSelection: (factor: number) => void;
  clearSelection: () => void;
  rasterizeText: (text: string, col: number, row: number, options: { fontSize: number, fontFamily: string, fontWeight: string }) => void;
  // Vector Guides
  addVectorGuide: (path: string) => void;
  deleteVectorGuide: (id: string) => void;
  clearVectorGuides: () => void;
  showVectorGuides: boolean;
  toggleVectorGuides: () => void;
  // UI
  openColorEditor: (id: string) => void;
  closeColorEditor: () => void;
  toggleSettings: () => void;
  toggleImageImport: () => void;
  toggleExport: () => void;
  setShowLegend: (b: boolean) => void;
  setShowWrittenInstructions: (b: boolean) => void;
  showPrintView: boolean;
  setShowPrintView: (b: boolean) => void;
  openPrintView: () => void;
  showGarmentGenerator: boolean;
  setShowGarmentGenerator: (b: boolean) => void;
  updateNotes: (notes: string) => void;
}

export const useStore = create<State>()(
  persist(
    immer((set, get) => {
      const init = newProject('Mi patrón', 'crochet_colorwork', 40, 40);
      return {
    project: init,
    activeColorId: init.colors[2]?.id ?? null, // start with red
    activeSymbolDefId: null,
    activeTool: 'draw',
    viewport: { x: 40, y: 40, zoom: 1 },
    selection: null,
    cursorCol: -1,
    cursorRow: -1,
    history: [{}],
    histIdx: 0,
    activeLayerId: 'main',
    trackerActive: false,
    trackerCol: 0,
    trackerRow: 0,
    showColorEditor: false,
    editingColorId: null,
    showSettings: false,
    showImageImport: false,
    showExport: false,
    showLegend: false,
    showWrittenInstructions: false,
    showPrintView: false,
    showGarmentGenerator: false,
    showVectorGuides: true,

    createProject: (name, craft, cols, rows) => set(s => {
      const p = newProject(name, craft, cols, rows);
      s.project = p;
      s.activeColorId = p.colors[2]?.id ?? null;
      s.activeSymbolDefId = null;
      s.viewport = { x: 40, y: 40, zoom: 1 };
      s.history = [{}]; s.histIdx = 0;
      s.selection = null;
      s.activeLayerId = 'main';
      s.trackerActive = false;
      s.trackerCol = 0;
      s.trackerRow = 0;
    }),

    loadProject: p => set(s => {
      s.project = p;
      s.activeColorId = p.colors[0]?.id ?? null;
      s.activeSymbolDefId = null;
      s.viewport = { x: 40, y: 40, zoom: 1 };
      s.history = [p.cells]; s.histIdx = 0;
      s.selection = null;
      s.activeLayerId = 'main';
      s.trackerActive = false;
      s.trackerCol = 0;
      s.trackerRow = 0;
    }),

    setActiveColor: id => set(s => { s.activeColorId = id; s.activeSymbolDefId = null; s.activeTool = 'draw'; }),
    setActiveSymbol: defId => set(s => { s.activeSymbolDefId = defId; s.activeColorId = null; s.activeTool = 'stamp'; }),
    setTool: t => set(s => { s.activeTool = t; }),

    addLayer: name => set(s => {
      if (!s.project.layers) s.project.layers = [];
      s.project.layers.push({ id: uid(), name, visible: true, locked: false, opacity: 1, cells: {} });
    }),
    removeLayer: id => set(s => {
      if (!s.project.layers) return;
      s.project.layers = s.project.layers.filter(x => x.id !== id);
      if (s.activeLayerId === id) s.activeLayerId = 'main';
    }),
    toggleLayerVisibility: id => set(s => {
      if (id === 'main') return;
      const l = s.project.layers?.find(x => x.id === id);
      if (l) l.visible = !l.visible;
    }),
    toggleLayerLock: id => set(s => {
      if (id === 'main') return;
      const l = s.project.layers?.find(x => x.id === id);
      if (l) l.locked = !l.locked;
    }),
    setActiveLayer: id => set(s => {
      if (id === 'main' || s.project.layers?.find(x => x.id === id)) s.activeLayerId = id;
    }),
    setLayerOpacity: (id, op) => set(s => {
      if (id === 'main') return;
      const l = s.project.layers?.find(x => x.id === id);
      if (l) l.opacity = op;
    }),

    paintCell: (col, row) => set(s => {
      const { activeColorId, project, activeLayerId } = s;
      if (!activeColorId) return;
      const targetCells = activeLayerId === 'main' ? project.cells : project.layers?.find(x => x.id === activeLayerId)?.cells;
      if (!targetCells) return;
      const { cols, rows, mirrorH, mirrorV } = project.canvas;
      const paint = (c: number, r: number) => {
        if (c < 0 || r < 0 || c >= cols || r >= rows) return;
        targetCells[`${c},${r}`] = activeColorId;
      };
      paint(col, row);
      if (mirrorH) paint(cols - 1 - col, row);
      if (mirrorV) paint(col, rows - 1 - row);
      if (mirrorH && mirrorV) paint(cols - 1 - col, rows - 1 - row);
      s.project.dirty = true;
    }),

    eraseCell: (col, row) => set(s => {
      // First try to erase symbol at this cell
      const symIdx = s.project.placedSymbols.findIndex(sym => sym.col === col && sym.row === row);
      if (symIdx >= 0) {
        s.project.placedSymbols.splice(symIdx, 1);
        s.project.dirty = true;
        return;
      }
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (targetCells) delete targetCells[`${col},${row}`];
      s.project.dirty = true;
    }),

    placeSymbol: (col, row) => set(s => {
      const defId = s.activeSymbolDefId;
      if (!defId) return;
      // Remove any existing symbol at this exact coordinate
      s.project.placedSymbols = s.project.placedSymbols.filter(sym => !(sym.col === col && sym.row === row));
      s.project.placedSymbols.push({ id: uid(), defId, col, row });
      s.project.dirty = true;
    }),

    removeSymbol: id => set(s => {
      s.project.placedSymbols = s.project.placedSymbols.filter(sym => sym.id !== id);
      s.project.dirty = true;
    }),

    fillFlood: (col, row) => set(s => {
      const { activeColorId, project, activeLayerId } = s;
      if (!activeColorId) return;
      const targetCells = activeLayerId === 'main' ? project.cells : project.layers?.find(x => x.id === activeLayerId)?.cells;
      if (!targetCells) return;
      const { cols, rows } = project.canvas;
      const target = targetCells[`${col},${row}`] ?? '';
      if (target === activeColorId) return;
      const visited = new Set<string>();
      const q = [[col, row]];
      while (q.length) {
        const [c, r] = q.shift()!;
        const k = `${c},${r}`;
        if (visited.has(k) || c < 0 || r < 0 || c >= cols || r >= rows) continue;
        if ((targetCells[k] ?? '') !== target) continue;
        visited.add(k);
        targetCells[k] = activeColorId;
        q.push([c+1,r],[c-1,r],[c,r+1],[c,r-1]);
      }
      s.project.dirty = true;
    }),

    fillGlobal: (col, row) => set(s => {
      const { activeColorId, project, activeLayerId } = s;
      if (!activeColorId) return;
      const targetCells = activeLayerId === 'main' ? project.cells : project.layers?.find(x => x.id === activeLayerId)?.cells;
      if (!targetCells) return;
      const target = targetCells[`${col},${row}`] ?? '';
      if (target === activeColorId) return;
      for (const k of Object.keys(targetCells)) {
        if (targetCells[k] === target) targetCells[k] = activeColorId;
      }
      s.project.dirty = true;
    }),

    pushSnap: () => set(s => {
      const snap = { 
        cells: { ...s.project.cells }, 
        placedSymbols: [...(s.project.placedSymbols || [])],
        layers: s.project.layers ? s.project.layers.map(l => ({ ...l, cells: { ...l.cells } })) : undefined
      };
      s.history = s.history.slice(0, s.histIdx + 1);
      s.history.push(snap as any);
      if (s.history.length > 80) s.history.shift();
      else s.histIdx++;
    }),

    undo: () => set(s => {
      if (s.histIdx <= 0) return;
      s.histIdx--;
      const snap = s.history[s.histIdx] as any;
      s.project.cells = { ...(snap.cells || snap) }; // fallback for old history
      s.project.placedSymbols = [...(snap.placedSymbols || [])];
      if (snap.layers) s.project.layers = snap.layers.map((l: any) => ({ ...l, cells: { ...l.cells } }));
      s.project.dirty = true;
    }),

    redo: () => set(s => {
      if (s.histIdx >= s.history.length - 1) return;
      s.histIdx++;
      const snap = s.history[s.histIdx] as any;
      s.project.cells = { ...(snap.cells || snap) };
      s.project.placedSymbols = [...(snap.placedSymbols || [])];
      if (snap.layers) s.project.layers = snap.layers.map((l: any) => ({ ...l, cells: { ...l.cells } }));
      s.project.dirty = true;
    }),

    setZoom: z => set(s => { s.viewport.zoom = Math.min(Math.max(z, 0.05), 20); }),
    pan: (dx, dy) => set(s => { s.viewport.x += dx; s.viewport.y += dy; }),
    setCursor: (c, r) => set(s => { s.cursorCol = c; s.cursorRow = r; }),
    setSelection: sel => set(s => { s.selection = sel; }),

    toggleTracker: () => set(st => { 
      st.trackerActive = !st.trackerActive; 
      if (st.trackerActive && (st.trackerCol < 0 || st.trackerCol >= st.project.canvas.cols || Math.abs(st.trackerRow) >= st.project.canvas.rows)) {
        st.trackerCol = 0;
        st.trackerRow = st.project.canvas.rows - 1; // Start at bottom for typical reading
      }
    }),
    moveTracker: (dc, dr) => set(st => {
      st.trackerCol = Math.max(0, Math.min(st.project.canvas.cols - 1, st.trackerCol + dc));
      st.trackerRow = Math.max(0, Math.min(st.project.canvas.rows - 1, st.trackerRow + dr));
    }),
    setTrackerPos: (c, r) => set(st => {
      st.trackerCol = Math.max(0, Math.min(st.project.canvas.cols - 1, c));
      st.trackerRow = Math.max(0, Math.min(st.project.canvas.rows - 1, r));
    }),

    addColor: () => set(s => {
      const idx = s.project.colors.length;
      const presets = ['#e53935','#8e24aa','#1e88e5','#00897b','#43a047','#f4511e','#6d4c41'];
      const hex = presets[idx % presets.length];
      const c = makeColor(hex, `Color ${idx + 1}`, idx);
      s.project.colors.push(c);
    }),

    removeColor: (id, mergeIntoId) => set(s => {
      if (mergeIntoId) {
        for (const k of Object.keys(s.project.cells)) {
          if (s.project.cells[k] === id) s.project.cells[k] = mergeIntoId;
        }
      }
      s.project.colors = s.project.colors.filter(c => c.id !== id);
      if (s.activeColorId === id) s.activeColorId = s.project.colors[0]?.id ?? null;
    }),

    updateColor: (id, patch) => set(s => {
      const c = s.project.colors.find(x => x.id === id);
      if (c) Object.assign(c, patch);
    }),

    moveColorUp: id => set(s => {
      const i = s.project.colors.findIndex(c => c.id === id);
      if (i > 0) { const tmp = s.project.colors[i-1]; s.project.colors[i-1] = s.project.colors[i]; s.project.colors[i] = tmp; }
    }),

    moveColorDown: id => set(s => {
      const i = s.project.colors.findIndex(c => c.id === id);
      if (i < s.project.colors.length - 1) { const tmp = s.project.colors[i+1]; s.project.colors[i+1] = s.project.colors[i]; s.project.colors[i] = tmp; }
    }),

    resizeCanvas: (cols, rows, centerContent = false) => set(s => {
      s.project.canvas.cols = cols;
      s.project.canvas.rows = rows;
      
      if (centerContent) {
        let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
        
        // Check main cells
        for (const k of Object.keys(s.project.cells)) {
          const [c, r] = k.split(',').map(Number);
          if (c < minC) minC = c; if (c > maxC) maxC = c;
          if (r < minR) minR = r; if (r > maxR) maxR = r;
        }

        // Check layers
        if (s.project.layers) {
          s.project.layers.forEach(layer => {
            for (const k of Object.keys(layer.cells)) {
              const [c, r] = k.split(',').map(Number);
              if (c < minC) minC = c; if (c > maxC) maxC = c;
              if (r < minR) minR = r; if (r > maxR) maxR = r;
            }
          });
        }
        
        if (s.project.placedSymbols) {
          for (const ps of s.project.placedSymbols) {
            if (ps.col < minC) minC = ps.col;
            if (ps.col > maxC) maxC = ps.col; // simplistic, not accounting for symbol width
            if (ps.row < minR) minR = ps.row;
            if (ps.row > maxR) maxR = ps.row;
          }
        }

        if (minC === Infinity) return;

        const contentW = maxC - minC + 1;
        const contentH = maxR - minR + 1;
        
        const newMinC = Math.floor((cols - contentW) / 2);
        const newMinR = Math.floor((rows - contentH) / 2);
        
        const deltaC = newMinC - minC;
        const deltaR = newMinR - minR;
        
        if (deltaC !== 0 || deltaR !== 0) {
          const newCells: Record<string, string> = {};
          for (const k of Object.keys(s.project.cells)) {
            const [c, r] = k.split(',').map(Number);
            newCells[`${c + deltaC},${r + deltaR}`] = s.project.cells[k];
          }
          s.project.cells = newCells;
          
          if (s.project.layers) {
            s.project.layers = s.project.layers.map(layer => {
              const newLayerCells: Record<string, string> = {};
              for (const k of Object.keys(layer.cells)) {
                const [c, r] = k.split(',').map(Number);
                newLayerCells[`${c + deltaC},${r + deltaR}`] = layer.cells[k];
              }
              return { ...layer, cells: newLayerCells };
            });
          }

          if (s.project.placedSymbols) {
            s.project.placedSymbols.forEach(ps => { ps.col += deltaC; ps.row += deltaR; });
          }
        }
      }
    }),

    scaleCanvas: (cols, rows) => set(s => {
      const oldCols = s.project.canvas.cols;
      const oldRows = s.project.canvas.rows;
      if (oldCols === cols && oldRows === rows) return;

      const newCells: Record<string, string> = {};
      const scaleX = oldCols / cols;
      const scaleY = oldRows / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const oldC = Math.floor(c * scaleX);
          const oldR = Math.floor(r * scaleY);
          const colorId = s.project.cells[`${oldC},${oldR}`];
          if (colorId) {
            newCells[`${c},${r}`] = colorId;
          }
        }
      }

      if (s.project.layers) {
        s.project.layers = s.project.layers.map(layer => {
          const newLayerCells: Record<string, string> = {};
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const oldC = Math.floor(c * scaleX);
              const oldR = Math.floor(r * scaleY);
              const colorId = layer.cells[`${oldC},${oldR}`];
              if (colorId) {
                newLayerCells[`${c},${r}`] = colorId;
              }
            }
          }
          return { ...layer, cells: newLayerCells };
        });
      }

      s.project.canvas.cols = cols;
      s.project.canvas.rows = rows;
      s.project.cells = newCells;
      
      // Scaling placed symbols is complex, we just clamp them
      if (s.project.placedSymbols) {
        s.project.placedSymbols.forEach(ps => {
          ps.col = Math.floor(ps.col / scaleX);
          ps.row = Math.floor(ps.row / scaleY);
        });
      }
    }),

    setGauge: (w, h) => set(s => { s.project.canvas.gaugeW = w; s.project.canvas.gaugeH = h; }),
    toggleGrid: () => set(s => { s.project.canvas.showGrid = !s.project.canvas.showGrid; }),
    toggleSymbols: () => set(s => { s.project.canvas.showSymbols = !s.project.canvas.showSymbols; }),
    setCellRenderMode: mode => set(s => { s.project.canvas.cellRenderMode = mode; }),
    toggleMirrorH: () => set(s => { s.project.canvas.mirrorH = !s.project.canvas.mirrorH; }),
    toggleMirrorV: () => set(s => { s.project.canvas.mirrorV = !s.project.canvas.mirrorV; }),
    toggleRowNumbers: () => set(s => { s.project.canvas.showRowNumbers = !s.project.canvas.showRowNumbers; }),
    toggleColNumbers: () => set(s => { s.project.canvas.showColNumbers = !s.project.canvas.showColNumbers; }),
    updateCanvasConfig: patch => set(s => { Object.assign(s.project.canvas, patch); }),

    _clipboard: null as any,
    copySelection: () => set(s => {
      if (!s.selection) return;
      const { c1, r1, c2, r2 } = s.selection;
      const clip: Record<string, string> = {};
      for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) {
        const v = s.project.cells[`${c},${r}`];
        if (v) clip[`${c-c1},${r-r1}`] = v;
      }
      (s as any)._clipboard = { data: clip, w: c2 - c1 + 1, h: r2 - r1 + 1 };
    }),

    cutSelection: () => set(s => {
      if (!s.selection) return;
      s.copySelection();
      s.clearSelection();
    }),

    pasteClipboard: (col, row) => set(s => {
      const clip = (s as any)._clipboard;
      if (!clip) return;
      for (const [k, v] of Object.entries(clip.data)) {
        const [dc, dr] = k.split(',').map(Number);
        s.project.cells[`${col+dc},${row+dr}`] = v as string;
      }
      s.project.dirty = true;
    }),

    mirrorSelectionH: () => set(s => {
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      const sel = s.selection;
      if (!sel || !targetCells) return;
      const minC = Math.min(sel.c1, sel.c2);
      const maxC = Math.max(sel.c1, sel.c2);
      const minR = Math.min(sel.r1, sel.r2);
      const maxR = Math.max(sel.r1, sel.r2);
      const w = maxC - minC;
      const patch: Record<string, string> = {};
      const toRemove: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        for (let r = minR; r <= maxR; r++) {
          const k = `${c},${r}`;
          if (k in targetCells) {
            patch[`${minC + (w - (c - minC))},${r}`] = targetCells[k];
            toRemove.push(k);
          }
        }
      }
      for (const k of toRemove) delete targetCells[k];
      Object.assign(targetCells, patch);
      s.project.dirty = true;
    }),

    mirrorSelectionV: () => set(s => {
      const sel = s.selection;
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (!sel || !targetCells) return;
      const h = Math.abs(sel.r2 - sel.r1);
      const minR = Math.min(sel.r1, sel.r2);
      const patch: Record<string, string> = {};
      const toRemove: string[] = [];
      for (let r = minR; r <= minR + h; r++) {
        for (let c = Math.min(sel.c1, sel.c2); c <= Math.max(sel.c1, sel.c2); c++) {
          const k = `${c},${r}`;
          if (k in targetCells) {
            patch[`${c},${minR + (minR + h - r)}`] = targetCells[k];
            toRemove.push(k);
          }
        }
      }
      for (const k of toRemove) delete targetCells[k];
      Object.assign(targetCells, patch);
      s.project.dirty = true;
    }),

    rotateSelection90: () => set(s => {
      const sel = s.selection;
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (!sel || !targetCells) return;
      const minC = Math.min(sel.c1, sel.c2);
      const maxC = Math.max(sel.c1, sel.c2);
      const minR = Math.min(sel.r1, sel.r2);
      const maxR = Math.max(sel.r1, sel.r2);
      const w = maxC - minC + 1;
      const h = maxR - minR + 1;
      const patch: Record<string, string> = {};
      const data: string[] = [];
      
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          data.push(targetCells[`${minC + c},${minR + r}`]);
          delete targetCells[`${minC + c},${minR + r}`];
        }
      }
      
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const val = data[r * w + c];
          if (val) {
            const newC = h - 1 - r;
            const newR = c;
            const targetC = minC + newC;
            const targetR = minR + newR;
            if (targetC >= 0 && targetR >= 0 && targetC < s.project.canvas.cols && targetR < s.project.canvas.rows) {
              patch[`${targetC},${targetR}`] = val;
            }
          }
        }
      }
      Object.assign(targetCells, patch);
      s.selection = { c1: minC, r1: minR, c2: minC + h - 1, r2: minR + w - 1 };
      s.project.dirty = true;
    }),

    moveSelection: (dc, dr) => set(s => {
      const sel = s.selection;
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (!sel || !targetCells) return;
      const minC = Math.min(sel.c1, sel.c2);
      const maxC = Math.max(sel.c1, sel.c2);
      const minR = Math.min(sel.r1, sel.r2);
      const maxR = Math.max(sel.r1, sel.r2);

      const patch: Record<string, string> = {};
      const toRemove: string[] = [];
      
      // Prevent moving out of bounds
      if (minC + dc < 0 || minR + dr < 0 || maxC + dc >= s.project.canvas.cols || maxR + dr >= s.project.canvas.rows) return;

      for (let c = minC; c <= maxC; c++) {
        for (let r = minR; r <= maxR; r++) {
          const k = `${c},${r}`;
          if (k in targetCells) {
            toRemove.push(k);
            patch[`${c + dc},${r + dr}`] = targetCells[k];
          }
        }
      }
      for (const k of toRemove) delete targetCells[k];
      Object.assign(targetCells, patch);
      s.selection = { c1: minC + dc, r1: minR + dr, c2: maxC + dc, r2: maxR + dr };
      s.project.dirty = true;
    }),

    scaleSelection: (factor) => set(s => {
      const sel = s.selection;
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (!sel || !targetCells) return;
      const minC = Math.min(sel.c1, sel.c2);
      const maxC = Math.max(sel.c1, sel.c2);
      const minR = Math.min(sel.r1, sel.r2);
      const maxR = Math.max(sel.r1, sel.r2);
      
      const w = maxC - minC + 1;
      const h = maxR - minR + 1;
      
      const newW = Math.max(1, Math.round(w * factor));
      const newH = Math.max(1, Math.round(h * factor));
      
      const originalCanvas = document.createElement('canvas');
      originalCanvas.width = w;
      originalCanvas.height = h;
      const ctx = originalCanvas.getContext('2d');
      if (!ctx) return;
      
      const toRemove: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        for (let r = minR; r <= maxR; r++) {
          const k = `${c},${r}`;
          const cId = targetCells[k];
          if (cId) {
            toRemove.push(k);
            const color = s.project.colors.find(x => x.id === cId);
            if (color) {
              ctx.fillStyle = color.hex;
              ctx.fillRect(c - minC, r - minR, 1, 1);
            }
          }
        }
      }
      
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = newW;
      scaledCanvas.height = newH;
      const sCtx = scaledCanvas.getContext('2d');
      if (!sCtx) return;
      
      // Interpolación suave para redibujar la forma matemáticamente
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      sCtx.drawImage(originalCanvas, 0, 0, newW, newH);
      
      const imgData = sCtx.getImageData(0, 0, newW, newH).data;
      const patch: Record<string, string> = {};
      
      // Precalcular la paleta en RGB para buscar el color más cercano
      const palette = s.project.colors.map(c => {
         const hex = c.hex.replace('#', '');
         return {
           id: c.id,
           r: parseInt(hex.substring(0,2), 16),
           g: parseInt(hex.substring(2,4), 16),
           b: parseInt(hex.substring(4,6), 16)
         };
      });

      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          const idx = (y * newW + x) * 4;
          const a = imgData[idx + 3];
          if (a > 100) { // Si el pixel no es transparente
            const pr = imgData[idx];
            const pg = imgData[idx+1];
            const pb = imgData[idx+2];
            
            // Buscar el color más cercano en la paleta del proyecto
            let bestId = palette[0]?.id || '';
            let minDist = Infinity;
            for (const pc of palette) {
              const dist = Math.pow(pr - pc.r, 2) + Math.pow(pg - pc.g, 2) + Math.pow(pb - pc.b, 2);
              if (dist < minDist) {
                minDist = dist;
                bestId = pc.id;
              }
            }
            
            const targetC = minC + x;
            const targetR = minR + y;
            if (bestId && targetC >= 0 && targetR >= 0 && targetC < s.project.canvas.cols && targetR < s.project.canvas.rows) {
              patch[`${targetC},${targetR}`] = bestId;
            }
          }
        }
      }
      
      for (const k of toRemove) delete targetCells[k];
      Object.assign(targetCells, patch);
      s.selection = { c1: minC, r1: minR, c2: minC + newW - 1, r2: minR + newH - 1 };
      s.project.dirty = true;
    }),

    clearSelection: () => set(s => {
      const targetCells = s.activeLayerId === 'main' ? s.project.cells : s.project.layers?.find(x => x.id === s.activeLayerId)?.cells;
      if (!s.selection || !targetCells) return;
      const { c1, r1, c2, r2 } = s.selection;
      for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) delete targetCells[`${c},${r}`];
      s.project.dirty = true;
    }),

    rasterizeText: (text, col, row, options) => set(s => {
      const colorId = s.activeColorId || s.project.colors[0]?.id;
      if (!colorId) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      const { fontSize, fontFamily, fontWeight } = options;
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      
      const metrics = ctx.measureText(text);
      const w = Math.max(1, Math.ceil(metrics.width || fontSize * text.length));
      
      // Fallbacks for ascent/descent
      const ascent = metrics.actualBoundingBoxAscent !== undefined ? metrics.actualBoundingBoxAscent : fontSize;
      const descent = metrics.actualBoundingBoxDescent !== undefined ? metrics.actualBoundingBoxDescent : (fontSize * 0.2);
      const h = Math.max(1, Math.ceil(ascent + descent));
      
      canvas.width = w + 10; 
      canvas.height = h + 10;
      
      // Setup font again because changing canvas size clears context
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = 'black';
      // Use standard baseline to avoid top-clipping issues on some browsers
      ctx.textBaseline = 'alphabetic';
      // Draw at y = ascent + 5 to ensure it's fully inside the canvas
      ctx.fillText(text, 5, Math.ceil(ascent) + 5);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for(let i = 0; i < canvas.width; i++) {
        for(let j = 0; j < canvas.height; j++) {
          const alpha = imgData.data[(j * canvas.width + i) * 4 + 3];
          if (alpha > 10) {
             const tc = col + i - 5;
             const tr = row + j - 5 - Math.ceil(ascent); // Adjust offset for alphabetic baseline
             if (tc >= 0 && tr >= 0 && tc < s.project.canvas.cols && tr < s.project.canvas.rows) {
                // Mutate directly to avoid Immer proxy issues
                if (s.activeLayerId === 'main') {
                  s.project.cells[`${tc},${tr}`] = colorId;
                } else {
                  const layer = s.project.layers?.find(x => x.id === s.activeLayerId);
                  if (layer) layer.cells[`${tc},${tr}`] = colorId;
                }
             }
          }
        }
      }
      s.project.dirty = true;
    }),

    openColorEditor: id => set(s => { s.showColorEditor = true; s.editingColorId = id; }),
    closeColorEditor: () => set(s => { s.showColorEditor = false; s.editingColorId = null; }),
    toggleSettings: () => set(s => { s.showSettings = !s.showSettings; }),
    toggleImageImport: () => set(s => { s.showImageImport = !s.showImageImport; }),
    toggleExport: () => set(s => { s.showExport = !s.showExport; }),
    setShowLegend: (b: boolean) => set(s => { s.showLegend = b; }),
    setShowWrittenInstructions: (b: boolean) => set(s => { s.showWrittenInstructions = b; }),
    setShowPrintView: (b: boolean) => set(s => { s.showPrintView = b; }),
    openPrintView: () => set(s => { s.showPrintView = true; }),
    setShowGarmentGenerator: (b: boolean) => set(s => { s.showGarmentGenerator = b; }),

    addVectorGuide: (path) => set(s => {
      if (!s.project.vectorGuides) s.project.vectorGuides = [];
      s.project.vectorGuides.push({ id: uid(), path, color: '#000000', strokeWidth: 2 });
      s.project.dirty = true;
    }),
    deleteVectorGuide: (id) => set(s => {
      if (s.project.vectorGuides) {
        s.project.vectorGuides = s.project.vectorGuides.filter(g => g.id !== id);
        s.project.dirty = true;
      }
    }),
    clearVectorGuides: () => set(s => {
      s.project.vectorGuides = [];
      s.project.dirty = true;
    }),
    toggleVectorGuides: () => set(s => { s.showVectorGuides = !s.showVectorGuides; }),
    updateNotes: (notes: string) => set(s => { s.project.notes = notes; s.project.dirty = true; }),
  };
}), {
  name: 'tramado-storage',
  partialize: (state) => ({ project: state.project }) // Only persist the project data
}));
