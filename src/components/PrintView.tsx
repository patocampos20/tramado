import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { exportTile, TileDef } from '../utils/tiling';

type PaperSize = 'A4' | 'Carta' | 'Oficio' | 'A3';
type Orientation = 'Portrait' | 'Landscape';

interface PaperDim { w: number; h: number; }
const PAPER_DIMS: Record<PaperSize, PaperDim> = {
  A4: { w: 794, h: 1123 },
  Carta: { w: 816, h: 1056 },
  Oficio: { w: 816, h: 1344 },
  A3: { w: 1123, h: 1587 },
};

export const PrintView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const p = useStore(s => s.project);
  
  // Tiling Settings
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('Portrait');
  const [overlap, setOverlap] = useState<number>(0);
  const [cropArea, setCropArea] = useState<boolean>(true); // true = Used Area, false = Full Canvas
  const [printInstructions, setPrintInstructions] = useState<boolean>(true); // Text instructions
  const [cellSizePx, setCellSizePx] = useState<number>(20); // Zoom scale per cell
  const [author, setAuthor] = useState<string>('Autor anónimo');
  
  const [tiles, setTiles] = useState<(TileDef & { url: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate used area if cropped
  const bounds = useMemo(() => {
    let minC = 0, minR = 0, maxC = p.canvas.cols - 1, maxR = p.canvas.rows - 1;
    if (cropArea) {
      let bMinC = Infinity, bMaxC = -Infinity, bMinR = Infinity, bMaxR = -Infinity;
      
      const checkCells = (cells: Record<string, string>) => {
        for (const k of Object.keys(cells)) {
          const [c, r] = k.split(',').map(Number);
          if (c < bMinC) bMinC = c; if (c > bMaxC) bMaxC = c;
          if (r < bMinR) bMinR = r; if (r > bMaxR) bMaxR = r;
        }
      };
      
      checkCells(p.cells);
      if (p.layers) {
        for (const l of p.layers) {
          if (l.visible) checkCells(l.cells);
        }
      }
      
      if (bMinC === Infinity) {
        // Empty canvas, fallback to small box
        minC = 0; maxC = Math.min(10, p.canvas.cols - 1);
        minR = 0; maxR = Math.min(10, p.canvas.rows - 1);
      } else {
        minC = bMinC; maxC = bMaxC; minR = bMinR; maxR = bMaxR;
      }
    }
    return { minC, maxC, minR, maxR, w: maxC - minC + 1, h: maxR - minR + 1 };
  }, [p.cells, p.layers, p.canvas.cols, p.canvas.rows, cropArea]);

  // Generate tiles layout
  const layout = useMemo(() => {
    const dim = PAPER_DIMS[paperSize];
    const pageW = orientation === 'Portrait' ? dim.w : dim.h;
    const pageH = orientation === 'Portrait' ? dim.h : dim.w;
    
    // Printable area (leave margins for headers/footers/rulers)
    const availW = pageW - 140; 
    const availH = pageH - 220; 
    
    // How many cells fit on one page
    const gw = p.canvas.gaugeW || 1;
    const gh = p.canvas.gaugeH || 1;
    const cellsW = Math.max(1, Math.floor(availW / (cellSizePx * gw)));
    const cellsH = Math.max(1, Math.floor(availH / (cellSizePx * gh)));
    
    const tileDefs: TileDef[] = [];
    
    const stepC = Math.max(1, cellsW - overlap);
    const stepR = Math.max(1, cellsH - overlap);
    
    let gridCols = 0;
    let gridRows = 0;

    for (let r = bounds.minR; r <= bounds.maxR; r += stepR) {
      gridRows++;
      gridCols = 0;
      for (let c = bounds.minC; c <= bounds.maxC; c += stepC) {
        gridCols++;
        tileDefs.push({ startCol: c, startRow: r, cols: cellsW, rows: cellsH, cellSize: cellSizePx });
      }
    }
    
    return { tileDefs, gridCols, gridRows };
  }, [paperSize, orientation, overlap, cellSizePx, bounds, p.canvas.gaugeW, p.canvas.gaugeH]);

  // Generate tile images
  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    
    const generate = async () => {
      setLoading(true);
      setError(null);
      setTiles([]);
      
      const newTiles: (TileDef & { url: string })[] = [];
      try {
        for (const t of layout.tileDefs) {
          if (!active) break;
          // small yield to prevent freezing UI
          await new Promise(r => setTimeout(r, 10));
          const url = await exportTile(p, t);
          if (url) {
            objectUrls.push(url);
            newTiles.push({ ...t, url });
          }
        }
        if (active) setTiles(newTiles);
      } catch (err) {
        if (active) setError('Error al generar las páginas.');
      } finally {
        if (active) setLoading(false);
      }
    };
    
    generate();
    
    return () => {
      active = false;
      objectUrls.forEach(u => URL.revokeObjectURL(u));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const handlePrint = useCallback(() => { window.print(); }, []);

  // Material counts
  const counts: Record<string, number> = {};
  const getEffectiveCellColor = (c: number, r: number): string | undefined => {
    let colorId = p.cells[`${c},${r}`];
    if (p.layers) {
      for (const layer of p.layers) {
        if (layer.visible && layer.cells[`${c},${r}`]) colorId = layer.cells[`${c},${r}`];
      }
    }
    return colorId;
  };
  for (let r = 0; r < p.canvas.rows; r++) {
    for (let c = 0; c < p.canvas.cols; c++) {
      const cid = getEffectiveCellColor(c, r);
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    }
  }
  const activeColors = p.colors.filter(c => counts[c.id] > 0);

  // Generate Written Instructions
  const instructions = useMemo(() => {
    if (!printInstructions) return [];
    const lines = [];
    const { tipo_tejido, direccion_filas, direccion_columnas, startRow } = p.canvas;
    
    const goUp = direccion_filas === 'BOTTOM_TO_TOP';
    const startIdx = goUp ? p.canvas.rows - 1 : 0;
    const endIdx = goUp ? -1 : p.canvas.rows;
    const step = goUp ? -1 : 1;

    let displayR = startRow;
    let prevMin = -1;
    let prevMax = -1;

    const baseStitch = p.craft === 'knitting' ? 'pto derecho (k)' : 
                       ['crochet_colorwork', 'crochet_filet', 'crochet_mosaic', 'crochet_tunisian'].includes(p.craft) ? 'pto bajo (pb)' : 
                       p.craft === 'crochet_c2c' ? 'bloque C2C (3pa)' :
                       ['cross_stitch', 'embroidery'].includes(p.craft) ? 'cruces' : 'puntos';

    for (let r = startIdx; r !== endIdx; r += step) {
      let isRightToLeft = direccion_columnas === 'RIGHT_TO_LEFT';
      if (tipo_tejido !== 'CIRCULAR') {
        const isOddRow = (displayR % 2 !== 0);
        if (tipo_tejido === 'PLANO_RS_FRENTE') {
          isRightToLeft = isOddRow ? (direccion_columnas === 'RIGHT_TO_LEFT') : (direccion_columnas !== 'RIGHT_TO_LEFT');
        } else {
          isRightToLeft = isOddRow ? (direccion_columnas !== 'RIGHT_TO_LEFT') : (direccion_columnas === 'RIGHT_TO_LEFT');
        }
      }
      
      const rowCounts: { color: string, count: number }[] = [];
      let minC = Infinity, maxC = -Infinity;
      
      for (let i = 0; i < p.canvas.cols; i++) {
        const c = isRightToLeft ? (p.canvas.cols - 1 - i) : i;
        const colorId = getEffectiveCellColor(c, r);

        if (!colorId) continue;
        if (i < minC) minC = i;
        if (i > maxC) maxC = i;

        const colorObj = p.colors.find(x => x.id === colorId);
        const colorName = colorObj?.name || 'Color';
        const isCrossStitch = ['cross_stitch', 'embroidery'].includes(p.craft);
        const displayName = isCrossStitch ? `[Símbolo ${colorObj?.symbol || '?'}] ${colorName}` : colorName;

        if (rowCounts.length > 0 && rowCounts[rowCounts.length - 1].color === displayName) {
          rowCounts[rowCounts.length - 1].count++;
        } else {
          rowCounts.push({ color: displayName, count: 1 });
        }
      }
      
      if (rowCounts.length > 0) {
        let prefix = "";
        if (prevMin !== -1 && prevMax !== -1) {
          const leftDiff = minC - prevMin;
          const rightDiff = prevMax - maxC;
          if (leftDiff > 0 && rightDiff > 0) prefix = `(▼ -${leftDiff}pt inicio, -${rightDiff}pt final) `;
          else if (leftDiff > 0) prefix = `(▼ -${leftDiff}pt inicio) `;
          else if (rightDiff > 0) prefix = `(▼ -${rightDiff}pt final) `;
          if (leftDiff < 0 && rightDiff < 0) prefix = `(▲ +${Math.abs(leftDiff)}pt inicio, +${Math.abs(rightDiff)}pt final) `;
        }
        prevMin = minC;
        prevMax = maxC;

        lines.push({
          row: displayR,
          dir: isRightToLeft ? '←' : '→',
          prefix,
          counts: rowCounts.map(x => `${x.color} ${x.count} ${baseStitch}`).join(', ')
        });
      }
      displayR++;
    }
    return lines;
  }, [p, printInstructions]);

  return (
    <>
      <div className="print-toolbar no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
        background: '#1a1a2e', color: '#fff', padding: '10px 20px',
        display: 'flex', alignItems: 'flex-start', gap: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        minHeight: 80
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 'bold', fontSize: 16 }}>🖨️ Ajustes de Impresión Tiling</span>
            <span style={{ flex: 1 }} />
            {!loading && !error && (
              <button onClick={handlePrint} style={{
                background: '#6c63ff', color: '#fff', border: 'none',
                borderRadius: 6, padding: '8px 18px', fontWeight: 'bold',
                cursor: 'pointer', fontSize: 14
              }}>🖨️ Imprimir PDF</button>
            )}
            <button onClick={onClose} style={{
              background: '#444', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontSize: 14
            }}>✕ Cerrar</button>
          </div>
          
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Tamaño de Hoja</span>
              <select value={paperSize} onChange={e => setPaperSize(e.target.value as PaperSize)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4 }}>
                <option value="A4">A4</option>
                <option value="Carta">Carta</option>
                <option value="Oficio">Oficio</option>
                <option value="A3">A3</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Orientación</span>
              <select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4 }}>
                <option value="Portrait">Vertical</option>
                <option value="Landscape">Horizontal</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Área a Imprimir</span>
              <select value={cropArea ? 'used' : 'full'} onChange={e => setCropArea(e.target.value === 'used')} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4 }}>
                <option value="used">Solo Área Utilizada</option>
                <option value="full">Lienzo Completo</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Superposición (Celdas)</span>
              <select value={overlap} onChange={e => setOverlap(Number(e.target.value))} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4 }}>
                <option value={0}>Sin superposición</option>
                <option value={1}>1 celda</option>
                <option value={2}>2 celdas</option>
                <option value={3}>3 celdas</option>
                <option value={5}>5 celdas</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Escala (Tamaño Celda)</span>
              <input type="range" min={10} max={40} value={cellSizePx} onChange={e => setCellSizePx(Number(e.target.value))} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Autor</span>
              <input type="text" value={author} onChange={e => setAuthor(e.target.value)} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4, width: 140 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ color: '#aaa' }}>Instrucciones Escritas</span>
              <select value={printInstructions ? 'yes' : 'no'} onChange={e => setPrintInstructions(e.target.value === 'yes')} style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '4px 8px', borderRadius: 4 }}>
                <option value="yes">Imprimir Texto</option>
                <option value="no">Solo Gráficos</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="print-layout" style={{ paddingTop: 130 }}>
        {/* Cover Page */}
        <div className="print-page" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 40, marginTop: 30 }}>
            <h1 style={{ fontSize: 36, margin: 0 }}>{p.name}</h1>
            <p style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
              Patrón de Diseño Textil — Tramado Pattern Studio v1.3.0
            </p>
          </div>

          <div style={{ marginBottom: 30 }}>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8 }}>Resumen del Proyecto</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.9 }}>
              <li><b>Autor:</b> {author}</li>
              <li><b>Fecha:</b> {new Date().toLocaleDateString()}</li>
              <li><b>Tipo de Labor:</b> {p.craft || '—'}</li>
              <li><b>Área Total:</b> {bounds.w} columnas × {bounds.h} filas</li>
              <li><b>Total de celdas pintadas:</b> {Object.keys(p.cells).length} (Aprox)</li>
              <li><b>Esquema de Impresión:</b> {layout.gridCols} columnas × {layout.gridRows} filas ({layout.tileDefs.length} páginas de patrón)</li>
              {p.notes && <li><b>Notas:</b> {p.notes}</li>}
            </ul>
          </div>

          <div>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8 }}>Leyenda y Materiales</h2>
            {activeColors.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Sin colores activos en este patrón.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#eee', textAlign: 'left' }}>
                    <th style={{ padding: 8, border: '1px solid #ccc' }}>Color</th>
                    <th style={{ padding: 8, border: '1px solid #ccc' }}>Símbolo</th>
                    <th style={{ padding: 8, border: '1px solid #ccc' }}>Nombre</th>
                    <th style={{ padding: 8, border: '1px solid #ccc' }}>Puntos Totales</th>
                  </tr>
                </thead>
                <tbody>
                  {activeColors.map(c => (
                    <tr key={c.id}>
                      <td style={{ padding: 8, border: '1px solid #ccc', textAlign: 'center' }}>
                        <div style={{ width: 20, height: 20, background: c.hex, border: '1px solid #000', margin: '0 auto', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                      </td>
                      <td style={{ padding: 8, border: '1px solid #ccc', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>{c.symbol}</td>
                      <td style={{ padding: 8, border: '1px solid #ccc' }}>{c.name}</td>
                      <td style={{ padding: 8, border: '1px solid #ccc' }}>{counts[c.id]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div style={{ marginTop: 40 }}>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8 }}>Esquema de Páginas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${layout.gridCols}, 1fr)`, gap: 4, marginTop: 10, maxWidth: Math.min(layout.gridCols * 80, 1000) }}>
               {Array.from({ length: layout.tileDefs.length }).map((_, i) => (
                 <div key={i} style={{ border: '1px solid #666', background: '#f5f5f5', textAlign: 'center', padding: '10px 0', fontSize: 12, fontWeight: 'bold' }}>
                   Pág. {i + 1}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Pattern Pages */}
        {loading ? (
           <div style={{ padding: 60, textAlign: 'center', fontSize: 18, color: '#666' }}>
             ⏳ Procesando {layout.tileDefs.length} páginas para Tiling...
           </div>
        ) : (
          tiles.map((t, idx) => {
            const pageNum = idx + 1;
            const totalPages = tiles.length;
            
            // Calc layout position (Col X, Row Y)
            const gridRow = Math.floor(idx / layout.gridCols) + 1;
            const gridCol = (idx % layout.gridCols) + 1;
            
            return (
              <div key={idx} className="print-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100vh', pageBreakAfter: 'always', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: 6, marginBottom: 20, fontSize: 12, color: '#444' }}>
                  <div><b>{p.name}</b> — {author}</div>
                  <div>Patrón: Col {gridCol} / Fila {layout.gridRows - gridRow + 1}</div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={t.url} style={{ maxWidth: '100%', maxHeight: '100%', border: '1px solid #000' }} alt={`Tile ${idx}`} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #ccc', paddingTop: 6, marginTop: 20, fontSize: 12, color: '#444' }}>
                  <div>
                     {new Date().toLocaleDateString()} | {p.craft || 'Labor'} | {activeColors.length} Colores | Escala: {cellSizePx}px
                  </div>
                  <div>Página {pageNum} de {totalPages}</div>
                </div>
              </div>
            );
          })
        )}

        {/* Written Instructions Page(s) */}
        {!loading && printInstructions && instructions.length > 0 && (
          <div className="print-page" style={{ position: 'relative', marginTop: 20 }}>
            <h2 style={{ borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 20 }}>Instrucciones Escritas (Paso a Paso)</h2>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              {instructions.map((inst, i) => (
                <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 6 }}>
                  <b style={{ display: 'inline-block', width: 65, color: '#000' }}>Vta {inst.row}</b> 
                  <span style={{ color: '#666', fontSize: 11, marginRight: 10 }}>({inst.dir})</span>
                  {inst.prefix && <span style={{ color: '#d32f2f', fontWeight: 'bold', marginRight: 6 }}>{inst.prefix}</span>}
                  <span>{inst.counts}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
