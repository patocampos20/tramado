import React, { useState } from 'react';
import { useStore, GAUGE_DEFAULTS } from '../store';
import { HelpDialog } from './HelpDialog';
import { GarmentGeneratorDlg } from './GarmentGeneratorDlg';
import type { CraftType } from '../types';

// ─── Craft definitions ────────────────────────────────────────────────────────
const CRAFTS: { group: string; items: { id: CraftType; em: string; name: string; desc: string }[] }[] = [
  {
    group: 'Crochet',
    items: [
      { id: 'crochet_colorwork', em: '🧶', name: 'Crochet Tapestry', desc: 'Dibujos en crochet, graphgan' },
      { id: 'crochet_c2c',       em: '⬡', name: 'Esquina a Esquina (C2C)', desc: 'Diagonal, 2-3 puntadas por bloque' },
      { id: 'crochet_filet',     em: '🕸', name: 'Crochet Filet', desc: 'Cuadros llenos y vacíos' },
      { id: 'crochet_mosaic',    em: '🔲', name: 'Crochet Mosaico', desc: 'Un color por vuelta, patrón alterno' },
      { id: 'crochet_tunisian',  em: '📐', name: 'Crochet Tunecino', desc: 'Tejido tunecino multicolor' },
    ],
  },
  {
    group: 'Otros tejidos',
    items: [
      { id: 'cross_stitch',      em: '✂️', name: 'Punto de cruz', desc: 'Bordado en cuadrícula Aida' },
      { id: 'knitting',          em: '🧵', name: 'Tejido (Jacquard / Intarsia)', desc: 'Patrones de agujas colorwork' },
      { id: 'embroidery',        em: '🪡', name: 'Bordado libre', desc: 'Símbolos de bordado sobre tela' },
    ],
  },
  {
    group: 'Manualidades con cuentas',
    items: [
      { id: 'diamond_painting',  em: '💎', name: 'Pintura con diamantes', desc: 'Resinas diamante sobre lienzo' },
      { id: 'hama_beads',        em: '🟡', name: 'Cuentas Hama / Perler', desc: 'Cuentas de planchado' },
      { id: 'latch_hook',        em: '🪝', name: 'Punto alfombra (Latch hook)', desc: 'Nudos sobre cañamazo' },
    ],
  },
  {
    group: 'Otros',
    items: [
      { id: 'macrame',           em: '🪢', name: 'Pixel macramé', desc: 'Diseños de nudos en cuadrícula' },
      { id: 'quilt',             em: '🏡', name: 'Acolchado / Patchwork', desc: 'Bloques de colores para costura' },
      { id: 'custom',            em: '✦',  name: 'Personalizado',   desc: 'Lienzo vacío sin restricciones' },
    ],
  },
];

// ─── New Project Dialog ───────────────────────────────────────────────────────
interface NewProjectDlgProps {
  initialCraft?: CraftType;
  onClose: () => void;
  onCreated: () => void;
}

export const NewProjectDlg: React.FC<NewProjectDlgProps> = ({ initialCraft = 'crochet_colorwork', onClose, onCreated }) => {
  const [name, setName] = useState('Mi patrón');
  const [craft, setCraft] = useState<CraftType>(initialCraft);
  const [cols, setCols] = useState(40);
  const [rows, setRows] = useState(40);
  const createProject = useStore(s => s.createProject);

  const handle = () => { createProject(name, craft, cols, rows); onCreated(); onClose(); };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <div>
            <h2>Nuevo patrón</h2>
            <p>Elige el tipo de labor y configura el lienzo</p>
          </div>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <div className="form-group">
            <label className="form-label">Nombre del proyecto</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
              autoFocus onKeyDown={e => e.key === 'Enter' && handle()} />
          </div>

          {CRAFTS.map(group => (
            <div key={group.group} className="form-group">
              <label className="form-label">{group.group}</label>
              <div className="craft-type-grid">
                {group.items.map(item => (
                  <div key={item.id} className={`craft-type-card ${craft === item.id ? 'active' : ''}`}
                    onClick={() => setCraft(item.id)}>
                    <b>{item.em} {item.name}</b>
                    <span style={{ fontSize: 10, color: 'inherit', opacity: 0.7 }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Tamaño del lienzo (columnas × filas)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="settings-num" type="number" min={4} max={500} value={cols} onChange={e => setCols(+e.target.value)} />
              <span style={{ color: 'var(--text-3)' }}>×</span>
              <input className="settings-num" type="number" min={4} max={500} value={rows} onChange={e => setRows(+e.target.value)} />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>celdas</span>
            </div>
          </div>
        </div>
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" onClick={handle}>Crear patrón →</button>
        </div>
      </div>
    </div>
  );
};

// ─── Image Import Dialog ──────────────────────────────────────────────────────
const ImageImportDlg: React.FC<{ onClose: () => void, onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [cols, setCols] = useState(50);
  const [maxColors, setMaxColors] = useState(15);
  const [craft, setCraft] = useState<CraftType>('crochet_colorwork');
  const [dithering, setDithering] = useState(false);
  const [smoothing, setSmoothing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{cells: Record<string,string>, colors: any[], rows: number} | null>(null);
  
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgObj(img);
    img.src = url;
  };

  React.useEffect(() => {
    if (!imgObj) return;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      const { convertImageToPattern } = await import('../utils/imageConverter');
      const g = GAUGE_DEFAULTS[craft] ?? { w: 1, h: 1 };
      
      setTimeout(() => {
        const result = convertImageToPattern(imgObj, cols, maxColors, { dithering, smoothing, gaugeW: g.w, gaugeH: g.h });
        setPreviewData(result);
        setPreviewLoading(false);
      }, 10);
    }, 400); // Debounce slider changes
  }, [imgObj, cols, maxColors, dithering, smoothing, craft]);

  React.useEffect(() => {
    if (!previewData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const { cells, colors, rows } = previewData;
    canvasRef.current.width = cols * 4;
    canvasRef.current.height = rows * 4;
    
    // O(1) map for performance
    const colorMap: Record<string, string> = {};
    for (const c of colors) colorMap[c.id] = c.hex;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const colorId = cells[`${c},${r}`];
        if (colorId && colorMap[colorId]) {
          ctx.fillStyle = colorMap[colorId];
          ctx.fillRect(c * 4, r * 4, 4, 4);
        }
      }
    }
  }, [previewData]);

  const convert = () => {
    if (!previewData) return;
    setLoading(true);
    setTimeout(() => {
      const { cells, colors, rows } = previewData;
      useStore.getState().createProject('Patrón importado', craft, cols, rows);
      const state = useStore.getState();
      const newP = {
        ...state.project,
        colors,
        cells,
        dirty: true,
      };
      useStore.setState({ project: newP, activeColorId: colors[0]?.id || null, history: [cells], histIdx: 0 });
      setLoading(false);
      onCreated();
      onClose();
    }, 50);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()}>
        <div className="dlg-header">
          <div>
            <h2>Importar Imagen</h2>
            <p>Convierte una foto en un patrón con colores reducidos</p>
          </div>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          {!imgObj ? (
            <div className="drop-zone" onClick={() => document.getElementById('imgImportFile')?.click()}>
              <div className="drop-zone-icon">📥</div>
              <div>Haz clic para seleccionar una imagen</div>
              <input type="file" id="imgImportFile" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', imageRendering: 'pixelated' }} />
                {previewLoading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', borderRadius: 'var(--r-md)' }}>
                    Calculando patrón...
                  </div>
                )}
              </div>
              <div style={{ width: 220, flexShrink: 0 }}>
                <div className="form-group">
                  <label className="form-label">Ancho del patrón (columnas)</label>
                  <input className="form-input" type="number" min={10} max={200} value={cols} onChange={e => setCols(+e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Máximo de colores (hilos)</label>
                  <input className="form-input" type="number" min={2} max={50} value={maxColors} onChange={e => setMaxColors(+e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de labor</label>
                  <select className="form-input" value={craft} onChange={e => setCraft(e.target.value as CraftType)}>
                    {CRAFTS.flatMap(g => g.items).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                
                <div className="form-group" style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, marginTop: 15 }}>
                  <label className="form-label" style={{ marginBottom: 10 }}>✨ Filtros Premium</label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, cursor: 'pointer', marginBottom: 8, lineHeight: 1.3 }}>
                    <input type="checkbox" checked={dithering} onChange={e => setDithering(e.target.checked)} style={{ marginTop: 2 }} />
                    <span><b>Tramado (Dithering):</b> Mezcla píxeles para simular degradados con pocos colores.</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, cursor: 'pointer', lineHeight: 1.3 }}>
                    <input type="checkbox" checked={smoothing} onChange={e => setSmoothing(e.target.checked)} style={{ marginTop: 2 }} />
                    <span><b>Suavizar bordes:</b> Elimina dientes de sierra antes de procesar fotos reales.</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" disabled={!previewData || loading || previewLoading} onClick={convert}>
            {loading ? 'Procesando...' : 'Convertir a patrón →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Home Screen ─────────────────────────────────────────────────────────────
interface HomeProps { onEnter: () => void; }

export const HomeScreen: React.FC<HomeProps> = ({ onEnter }) => {
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showGarment, setShowGarment] = useState(false);
  const [initCraft, setInitCraft] = useState<CraftType>('crochet_colorwork');
  const createProject = useStore(s => s.createProject);
  const savedProject = useStore(s => s.project);

  const openCraft = (craft: CraftType) => { setInitCraft(craft); setShowNew(true); };
  const quickStart = () => { createProject('Mi patrón', 'crochet_colorwork', 40, 40); onEnter(); };

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-brand">
          <span className="home-brand-icon">🧶</span>
          Tramado
        </div>
        <div className="home-nav-spacer" />
        <button className="home-nav-link" onClick={() => setShowHelp(true)}>Ayuda / Manual</button>
      </nav>

      <div className="home-hero">
        <h1 className="home-title">¿Qué quieres crear hoy?</h1>
        <p className="home-sub">Diseña patrones de crochet, punto de cruz, diamond painting y más — sin complicaciones.</p>
      </div>

      <div className="home-section-label">Tipo de labor</div>
      <div className="craft-grid">
        {CRAFTS.flatMap(g => g.items).map(item => (
          <div key={item.id} className="craft-card" onClick={() => openCraft(item.id)}>
            <div className="craft-card-em">{item.em}</div>
            <div className="craft-card-name">{item.name}</div>
            <div className="craft-card-desc">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="home-section-label" style={{ paddingTop: 16 }}>Acciones rápidas</div>
      <div className="home-actions">
        <button className="home-btn primary" onClick={quickStart}>✦ Empezar rápido (crochet)</button>
        <button className="home-btn" onClick={() => setShowNew(true)}>+ Nuevo proyecto</button>
        <button className="home-btn" onClick={() => setShowImport(true)}>🖼 Importar imagen</button>
        <button className="home-btn" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowGarment(true)}>✨ Generador de Prendas</button>
        
        <input type="file" id="openFile" style={{display:'none'}} accept=".tramado" onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const p = JSON.parse(ev.target?.result as string);
              if (p.id && p.canvas) {
                useStore.getState().loadProject(p);
                onEnter();
              }
            } catch(err) { alert('Archivo no válido'); }
          };
          reader.readAsText(file);
        }} />
        <button className="home-btn" onClick={async () => {
          if ((window as any).require) {
            try {
              const { ipcRenderer } = (window as any).require('electron');
              await ipcRenderer.invoke('open-file-dialog');
              // The event listener in App.tsx will handle the actual loading when main.cjs sends the file data back
              return;
            } catch (err) {}
          }
          document.getElementById('openFile')?.click();
        }}>📂 Abrir archivo .tramado</button>
      </div>

      <div className="home-section-label">Proyectos recientes</div>
      <div className="recent-list">
        {savedProject && savedProject.dirty ? (
          <div className="craft-type-card active" style={{ display: 'flex', alignItems: 'center', gap: 15 }} onClick={onEnter}>
            <div style={{ fontSize: 24 }}>📁</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <b>{savedProject.name}</b>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Última modificación: {new Date(savedProject.updatedAt).toLocaleString()}</div>
            </div>
            <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: 12 }}>Continuar →</button>
          </div>
        ) : (
          <div className="recent-empty">Aún no tienes proyectos guardados. ¡Crea el primero o empieza rápido!</div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingBottom: 20, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
        {/* @ts-ignore */}
        Tramado v{__APP_VERSION__} — Desarrollado por <b>Patricio Campos</b>
      </div>

      {showNew && <NewProjectDlg initialCraft={initCraft} onClose={() => setShowNew(false)} onCreated={onEnter} />}
      {showImport && <ImageImportDlg onClose={() => setShowImport(false)} onCreated={onEnter} />}
      {showGarment && <GarmentGeneratorDlg onClose={() => setShowGarment(false)} onCreated={onEnter} />}
      {showHelp && <HelpDialog onClose={() => setShowHelp(false)} />}
    </div>
  );
};
