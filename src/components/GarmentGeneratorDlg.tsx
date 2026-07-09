import React, { useState } from 'react';
import { useStore } from '../store';

// Helper: Bresenham Line
function bresenham(x0: number, y0: number, x1: number, y1: number): number[][] {
  const pts = [];
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, e2;
  while (true) {
    pts.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return pts;
}

function isInsidePolygons(px: number, py: number, polygons: number[][][]) {
  for (const poly of polygons) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

export const GarmentGeneratorDlg: React.FC<{ onClose: () => void, onCreated: () => void }> = ({ onClose, onCreated }) => {
  // Construcción
  const [garmentType, setGarmentType] = useState('pullover'); // pullover, cardigan, vest, butterfly, poncho, kimono
  const [chestCm, setChestCm] = useState(100);
  const [lengthCm, setLengthCm] = useState(60);
  const [armholeCm, setArmholeCm] = useState(22);
  const [placketCm, setPlacketCm] = useState(3); // para cardigan
  const [butterflyInc, setButterflyInc] = useState(1); // 1 = 1x fila, 2 = 1x cada 2 filas
  
  // Cuello
  const [neckType, setNeckType] = useState('round'); // round, vneck, high, turtle, smoking
  const [neckWidthCm, setNeckWidthCm] = useState(18);
  const [neckDropCm, setNeckDropCm] = useState(10);
  const [neckHighCm, setNeckHighCm] = useState(6); // alto/tortuga
  const [lapelWidthCm, setLapelWidthCm] = useState(6); // smoking

  // Mangas
  const [sleeveType, setSleeveType] = useState('straight'); // straight, bell, balloon, raglan, drop
  const [sleeveLengthCm, setSleeveLengthCm] = useState(50);
  const [bicepsCm, setBicepsCm] = useState(36);
  const [cuffCm, setCuffCm] = useState(24);

  // Tensión
  const [sts10, setSts10] = useState(20);
  const [rows10, setRows10] = useState(28);
  const [loading, setLoading] = useState(false);

  const createProject = useStore(s => s.createProject);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const pts1 = sts10 / 10;
      const rows1 = rows10 / 10;
      
      const W = Math.round((chestCm / 2) * pts1);
      const H = Math.round(lengthCm * rows1);
      const armhole = Math.round(armholeCm * rows1);
      const nw = Math.round(neckWidthCm * pts1);
      const nd = Math.round(neckDropCm * rows1);
      const nHigh = Math.round(neckHighCm * rows1);
      const lapel = Math.round(lapelWidthCm * pts1);
      
      const sw = Math.round(bicepsCm * pts1);
      const sl = Math.round(sleeveLengthCm * rows1);
      const cuff = Math.round(cuffCm * pts1);
      const placket = Math.round(placketCm * pts1);
      const indent = Math.round(4 * pts1);

      let totalCols = W;
      let totalRows = H;
      if (neckType === 'high') totalRows += nHigh;
      if (neckType === 'turtle') totalRows += nHigh * 2;

      // Add space for sleeves if needed, but standard is generating the pieces side by side or separately.
      // To keep it simple, we generate them side by side in a large canvas.
      totalCols = W * 3; // Space for body and 2 sleeves (if any)
      
      const polys: number[][][] = [];
      const cx = W / 2; // Center of body piece
      let bodyXOffset = W; // Put body in the middle of canvas

      // Generators
      const buildNeck = (xCenter: number, yTop: number, isHalf: ''|'left'|'right' = ''): number[][] => {
        const nPts = [];
        if (neckType === 'round') {
          // Semi-circle approximation
          if (isHalf === 'left') {
            for(let i = 0; i <= 10; i++) {
              const t = (i/10) * (Math.PI/2);
              nPts.push([xCenter - (nw/2)*Math.cos(t), yTop + nd - nd*Math.sin(t)]);
            }
          } else if (isHalf === 'right') {
            for(let i = 0; i <= 10; i++) {
              const t = Math.PI/2 + (i/10) * (Math.PI/2);
              nPts.push([xCenter - (nw/2)*Math.cos(t), yTop + nd - nd*Math.sin(t)]);
            }
          } else {
            for(let i = 0; i <= 20; i++) {
              const t = (i/20) * Math.PI;
              nPts.push([xCenter - (nw/2)*Math.cos(t), yTop + nd - nd*Math.sin(t)]);
            }
          }
        } else if (neckType === 'vneck') {
           if (isHalf === 'left') { nPts.push([xCenter - nw/2, yTop], [xCenter, yTop + nd]); }
           else if (isHalf === 'right') { nPts.push([xCenter, yTop + nd], [xCenter + nw/2, yTop]); }
           else { nPts.push([xCenter - nw/2, yTop], [xCenter, yTop + nd], [xCenter + nw/2, yTop]); }
        } else if (neckType === 'high' || neckType === 'turtle') {
           const h = neckType === 'turtle' ? nHigh * 2 : nHigh;
           if (isHalf === 'left') { nPts.push([xCenter - nw/2, yTop], [xCenter - nw/2, yTop - h], [xCenter, yTop - h], [xCenter, yTop]); }
           else if (isHalf === 'right') { nPts.push([xCenter, yTop], [xCenter, yTop - h], [xCenter + nw/2, yTop - h], [xCenter + nw/2, yTop]); }
           else { nPts.push([xCenter - nw/2, yTop], [xCenter - nw/2, yTop - h], [xCenter + nw/2, yTop - h], [xCenter + nw/2, yTop]); }
        } else if (neckType === 'smoking') {
           if (isHalf === 'left') { nPts.push([xCenter - nw/2, yTop], [xCenter - nw/2 - lapel, yTop + nd/2], [xCenter, yTop + nd]); }
           else if (isHalf === 'right') { nPts.push([xCenter, yTop + nd], [xCenter + nw/2 + lapel, yTop + nd/2], [xCenter + nw/2, yTop]); }
           else { nPts.push([xCenter - nw/2, yTop], [xCenter - nw/2 - lapel, yTop + nd/2], [xCenter, yTop + nd], [xCenter + nw/2 + lapel, yTop + nd/2], [xCenter + nw/2, yTop]); }
        }
        return nPts;
      };

      const yOffset = (neckType === 'high' || neckType === 'turtle') ? (neckType === 'turtle' ? nHigh * 2 : nHigh) : 0;

      if (garmentType === 'pullover' || garmentType === 'vest' || garmentType === 'poncho' || garmentType === 'kimono') {
        const poly = [];
        poly.push([bodyXOffset, H + yOffset], [bodyXOffset + W, H + yOffset]); // Bottom
        
        if (garmentType === 'vest') {
           poly.push([bodyXOffset + W, yOffset + armhole + indent]);
           poly.push([bodyXOffset + W - indent*2, yOffset + armhole]);
           poly.push([bodyXOffset + W - indent*2, yOffset]); // Left armhole deeper
        } else if (garmentType === 'poncho') {
           poly.push([bodyXOffset + W + W/2, yOffset]); // Wide shoulders
        } else if (garmentType === 'kimono') {
           poly.push([bodyXOffset + W + sl, H + yOffset]); // Kimono sleeve bottom
           poly.push([bodyXOffset + W + sl, yOffset]); // Kimono sleeve top
        } else {
           // Pullover
           poly.push([bodyXOffset + W, yOffset + armhole]); // Right side
           if (sleeveType === 'raglan') {
             poly.push([bodyXOffset + W - indent, yOffset + armhole]); // Raglan indent
             poly.push([bodyXOffset + cx + nw/2, yOffset]); // Diagonal to neck
           } else {
             poly.push([bodyXOffset + W - indent, yOffset + armhole - indent]); // Armhole curve
             poly.push([bodyXOffset + W - indent, yOffset]); // Right shoulder
           }
        }

        if (sleeveType !== 'raglan') {
          poly.push([bodyXOffset + cx + nw/2, yOffset]);
        }
        poly.push(...buildNeck(bodyXOffset + cx, yOffset, ''));
        if (sleeveType !== 'raglan') {
          poly.push([bodyXOffset + indent, yOffset]);
        }

        if (garmentType === 'vest') {
           poly.push([bodyXOffset + indent*2, yOffset]);
           poly.push([bodyXOffset + indent*2, yOffset + armhole]);
           poly.push([bodyXOffset, yOffset + armhole + indent]);
        } else if (garmentType === 'poncho') {
           poly.push([bodyXOffset - W/2, yOffset]);
        } else if (garmentType === 'kimono') {
           poly.push([bodyXOffset - sl, yOffset]);
           poly.push([bodyXOffset - sl, H + yOffset]);
        } else {
           if (sleeveType === 'raglan') {
             poly.push([bodyXOffset + indent, yOffset + armhole]);
           } else {
             poly.push([bodyXOffset + indent, yOffset + armhole - indent]);
             poly.push([bodyXOffset, yOffset + armhole]);
           }
        }
        polys.push(poly);
      } else if (garmentType === 'cardigan') {
        // Left
        const L = [];
        L.push([bodyXOffset, H + yOffset], [bodyXOffset + cx - placket/2, H + yOffset]); // Bottom
        L.push([bodyXOffset + cx - placket/2, yOffset + nd]); // Center front
        L.push(...buildNeck(bodyXOffset + cx, yOffset, 'left'));
        L.push([bodyXOffset + indent, yOffset]);
        L.push([bodyXOffset + indent, yOffset + armhole - indent], [bodyXOffset, yOffset + armhole]); // Armhole
        polys.push(L);

        // Right
        const R = [];
        R.push([bodyXOffset + cx + placket/2, H + yOffset], [bodyXOffset + W, H + yOffset]); // Bottom
        R.push([bodyXOffset + W, yOffset + armhole], [bodyXOffset + W - indent, yOffset + armhole - indent], [bodyXOffset + W - indent, yOffset]); // Armhole
        R.push(...buildNeck(bodyXOffset + cx, yOffset, 'right'));
        R.push([bodyXOffset + cx + placket/2, yOffset + nd]); // Center front
        polys.push(R);
      } else if (garmentType === 'butterfly') {
        const poly = [];
        const shortH = Math.round(H * 0.6);
        poly.push([bodyXOffset, shortH + yOffset], [bodyXOffset + W, shortH + yOffset]); // Short bottom
        // Diagonal sides for butterfly
        const flare = butterflyInc * armhole;
        poly.push([bodyXOffset + W + flare, yOffset]); 
        poly.push(...buildNeck(bodyXOffset + cx, yOffset, ''));
        poly.push([bodyXOffset - flare, yOffset]);
        polys.push(poly);
      }

      // Mangas independientes (Solo si no es chaleco, poncho o kimono y si no es butterfly)
      if (garmentType !== 'vest' && garmentType !== 'poncho' && garmentType !== 'kimono' && garmentType !== 'butterfly') {
        // Sleeve 1 (Right)
        const S1 = [];
        const s1X = bodyXOffset + W + 10;
        if (sleeveType === 'bell') {
           S1.push([s1X, yOffset + sl], [s1X + sw*1.5, yOffset + sl]); // Wide cuff
           S1.push([s1X + sw/2 + cuff/2, yOffset + sl/2]); // Curve in
           S1.push([s1X + sw, yOffset]);
           S1.push([s1X, yOffset]);
        } else if (sleeveType === 'balloon') {
           S1.push([s1X + sw/2 - cuff/2, yOffset + sl], [s1X + sw/2 + cuff/2, yOffset + sl]); // Tight cuff
           S1.push([s1X + sw, yOffset + sl - 10], [s1X + sw, yOffset]); // Balloon out
           S1.push([s1X, yOffset]);
        } else {
           // Straight / Raglan / Drop
           S1.push([s1X + sw/2 - cuff/2, yOffset + sl], [s1X + sw/2 + cuff/2, yOffset + sl]);
           S1.push([s1X + sw, yOffset + armhole/2], [s1X + sw, yOffset]);
           if (sleeveType === 'raglan') S1.push([s1X + sw/2, yOffset - 10]); // Raglan top peak
           S1.push([s1X, yOffset]);
        }
        polys.push(S1);
        
        // Sleeve 2 (Left)
        const S2 = [];
        const s2X = bodyXOffset - sw - 10;
        if (sleeveType === 'bell') {
           S2.push([s2X, yOffset + sl], [s2X + sw*1.5, yOffset + sl]); 
           S2.push([s2X + sw, yOffset]);
           S2.push([s2X, yOffset]);
        } else if (sleeveType === 'balloon') {
           S2.push([s2X + sw/2 - cuff/2, yOffset + sl], [s2X + sw/2 + cuff/2, yOffset + sl]);
           S2.push([s2X + sw, yOffset], [s2X, yOffset]);
        } else {
           S2.push([s2X + sw/2 - cuff/2, yOffset + sl], [s2X + sw/2 + cuff/2, yOffset + sl]);
           S2.push([s2X + sw, yOffset]);
           if (sleeveType === 'raglan') S2.push([s2X + sw/2, yOffset - 10]);
           S2.push([s2X, yOffset], [s2X, yOffset + armhole/2]);
        }
        polys.push(S2);
      }

      // Render
      const boundary = new Set<string>();
      for (const poly of polys) {
        for (let i = 0; i < poly.length; i++) {
          const p1 = poly[i];
          const p2 = poly[(i + 1) % poly.length];
          const line = bresenham(Math.round(p1[0]), Math.round(p1[1]), Math.round(p2[0]), Math.round(p2[1]));
          for (const [x, y] of line) {
            if (x >= 0 && x < totalCols && y >= 0 && y < totalRows) {
              boundary.add(`${x},${y}`);
            }
          }
        }
      }

      const fill = new Set<string>();
      for (let y = 0; y < totalRows; y++) {
        for (let x = 0; x < totalCols; x++) {
          if (boundary.has(`${x},${y}`)) continue;
          if (isInsidePolygons(x, y, polys)) {
             fill.add(`${x},${y}`);
          }
        }
      }

      createProject(`Molde: ${garmentType.toUpperCase()}`, 'knitting', totalCols, totalRows);
      const state = useStore.getState();
      
      const proj = { ...state.project, cells: {} as Record<string, string>, vectorGuides: [] };
      const borderColorId = 'color_border_000';
      const fillColorId = 'color_fill_crema';
      proj.colors = [
        { id: borderColorId, hex: '#000000', name: 'Contorno Molde', symbol: '■', symbolColor: '#ffffff', count: 0 },
        { id: fillColorId, hex: '#ded7c3', name: 'Relleno Molde', symbol: '·', symbolColor: '#000000', count: 0 }
      ];

      boundary.forEach(key => { proj.cells[key] = borderColorId; });
      fill.forEach(key => { proj.cells[key] = fillColorId; });

      useStore.setState({ 
        project: proj,
        activeColorId: fillColorId,
        history: [proj.cells],
        histIdx: 0
      });

      setLoading(false);
      onCreated();
      onClose();
    }, 50);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="dlg-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>✨</span> Generador Paramétrico de Moldería
            </h2>
            <p>Construye tu prenda escalón por escalón sin dibujar manualmente.</p>
          </div>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="dlg-body" style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1, maxHeight: 600, overflowY: 'auto', paddingRight: 15 }}>
            
            <h3 style={{ fontSize: 14, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5, color: 'var(--accent)' }}>1. CONSTRUCCIÓN DE LA PRENDA</h3>
            <div className="form-group">
              <label className="form-label">Tipo de Prenda</label>
              <select className="form-input" value={garmentType} onChange={e => setGarmentType(e.target.value)}>
                <option value="pullover">Pullover (Suéter Clásico)</option>
                <option value="cardigan">Cárdigan (Delanteros Separados)</option>
                <option value="vest">Chaleco (Sin mangas)</option>
                <option value="butterfly">Mariposa Crochet</option>
                <option value="poncho">Poncho</option>
                <option value="kimono">Kimono (Cuerpo entero)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Contorno Pecho (cm)</label>
                <input type="number" className="form-input" value={chestCm} onChange={e => setChestCm(+e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Largo Total (cm)</label>
                <input type="number" className="form-input" value={lengthCm} onChange={e => setLengthCm(+e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Prof. Sisa (cm)</label>
                <input type="number" className="form-input" value={armholeCm} onChange={e => setArmholeCm(+e.target.value)} />
              </div>
            </div>

            {garmentType === 'cardigan' && (
              <div className="form-group">
                <label className="form-label">Ancho Tapeta Central (cm)</label>
                <input type="number" className="form-input" value={placketCm} onChange={e => setPlacketCm(+e.target.value)} />
              </div>
            )}

            {garmentType === 'butterfly' && (
              <div className="form-group">
                <label className="form-label">Frecuencia de Aumentos Mariposa</label>
                <select className="form-input" value={butterflyInc} onChange={e => setButterflyInc(+e.target.value)}>
                  <option value={1}>1 punto cada hilera</option>
                  <option value={0.5}>1 punto cada 2 hileras</option>
                  <option value={2}>2 puntos cada hilera</option>
                </select>
              </div>
            )}

            <h3 style={{ fontSize: 14, marginTop: 25, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5, color: 'var(--accent)' }}>2. SISTEMA DE CUELLOS</h3>
            <div className="form-group">
              <label className="form-label">Tipo de Cuello</label>
              <select className="form-input" value={neckType} onChange={e => setNeckType(e.target.value)}>
                <option value="round">Redondo (Cóncavo)</option>
                <option value="vneck">Cuello V</option>
                <option value="high">Alto (Rectangular)</option>
                <option value="turtle">Tortuga (Doble alto para doblez)</option>
                <option value="smoking">Smoking (Cuello V + Solapas)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ancho Cuello (cm)</label>
                <input type="number" className="form-input" value={neckWidthCm} onChange={e => setNeckWidthCm(+e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Profundidad (cm)</label>
                <input type="number" className="form-input" value={neckDropCm} onChange={e => setNeckDropCm(+e.target.value)} />
              </div>
              {(neckType === 'high' || neckType === 'turtle') && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Altura Extra (cm)</label>
                  <input type="number" className="form-input" value={neckHighCm} onChange={e => setNeckHighCm(+e.target.value)} />
                </div>
              )}
              {neckType === 'smoking' && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ancho Solapa (cm)</label>
                  <input type="number" className="form-input" value={lapelWidthCm} onChange={e => setLapelWidthCm(+e.target.value)} />
                </div>
              )}
            </div>

            <h3 style={{ fontSize: 14, marginTop: 25, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5, color: 'var(--accent)' }}>3. SISTEMA DE MANGAS</h3>
            <div className="form-group">
              <label className="form-label">Tipo de Manga</label>
              <select className="form-input" value={sleeveType} onChange={e => setSleeveType(e.target.value)} disabled={garmentType === 'vest' || garmentType === 'poncho' || garmentType === 'kimono'}>
                <option value="straight">Recta Clásica</option>
                <option value="bell">Campana</option>
                <option value="balloon">Globo</option>
                <option value="raglan">Raglán</option>
                <option value="drop">Caída</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Largo Manga (cm)</label>
                <input type="number" className="form-input" value={sleeveLengthCm} onChange={e => setSleeveLengthCm(+e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ancho Bíceps (cm)</label>
                <input type="number" className="form-input" value={bicepsCm} onChange={e => setBicepsCm(+e.target.value)} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ancho Puño (cm)</label>
                <input type="number" className="form-input" value={cuffCm} onChange={e => setCuffCm(+e.target.value)} />
              </div>
            </div>

          </div>
          
          <div style={{ width: 250, background: 'var(--surface-2)', padding: 15, borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 14, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5, color: 'var(--accent)' }}>Tensión de la Muestra</h3>
            
            <div className="form-group">
              <label className="form-label">Puntos en 10 cm</label>
              <input type="number" className="form-input" value={sts10} onChange={e => setSts10(+e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Vueltas en 10 cm</label>
              <input type="number" className="form-input" value={rows10} onChange={e => setRows10(+e.target.value)} />
            </div>

            <div style={{ marginTop: 'auto', background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>ℹ️ El sistema dibujará 100% libre de curvas vectoriales y recalculará la geometría en puntos reales.</p>
              <button className="btn btn-accent" style={{ width: '100%', marginTop: 10 }} onClick={generate} disabled={loading}>
                {loading ? 'Calculando...' : '✂️ Generar Patrón'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
