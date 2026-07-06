import React, { useState } from 'react';
import { useStore } from '../store';

export const GarmentGeneratorDlg: React.FC<{ onClose: () => void, onCreated: () => void }> = ({ onClose, onCreated }) => {
  const [garmentType, setGarmentType] = useState('front');

  // Medidas Suéter
  const [chestCm, setChestCm] = useState(100);
  const [lengthCm, setLengthCm] = useState(60);
  const [armholeCm, setArmholeCm] = useState(22);
  const [neckWidthCm, setNeckWidthCm] = useState(18);
  const [neckDropCm, setNeckDropCm] = useState(10);
  
  // Medidas Manga
  const [cuffCm, setCuffCm] = useState(24);
  const [bicepsCm, setBicepsCm] = useState(40);
  const [sleeveLengthCm, setSleeveLengthCm] = useState(50);

  // Medidas Rectángulo (Bufanda/Manta)
  const [rectWidthCm, setRectWidthCm] = useState(30);
  const [rectLengthCm, setRectLengthCm] = useState(150);

  // Medidas Gorro
  const [hatCircumferenceCm, setHatCircumferenceCm] = useState(56);
  const [hatHeightCm, setHatHeightCm] = useState(25);

  const [sts10, setSts10] = useState(20);
  const [rows10, setRows10] = useState(28);
  const [loading, setLoading] = useState(false);

  const createProject = useStore(s => s.createProject);

  const generate = () => {
    setLoading(true);
    
    setTimeout(() => {
      let totalCols = 0;
      let totalRows = 0;
      let path = '';
      let projectName = 'Molde Generado';

      if (garmentType === 'front' || garmentType === 'back') {
        totalCols = Math.round((chestCm / 2 / 10) * sts10);
        totalRows = Math.round((lengthCm / 10) * rows10);
        projectName = garmentType === 'front' ? 'Molde: Delantero' : 'Molde: Espalda';
        
        const armholeRows = Math.round((armholeCm / 10) * rows10);
        const actualNeckDrop = garmentType === 'front' ? neckDropCm : Math.max(2, neckDropCm / 4); // Espalda tiene menos caída
        const neckRows = Math.round((actualNeckDrop / 10) * rows10);
        const neckRadiusCols = Math.round((neckWidthCm / 2 / 10) * sts10);
        const armholeIndentCols = Math.round((4 / 10) * sts10);
        const centerCol = totalCols / 2;

        path = `M 0 ${totalRows} L ${totalCols} ${totalRows} L ${totalCols} ${armholeRows} `;
        path += `Q ${totalCols} ${armholeRows / 2} ${totalCols - armholeIndentCols} 0 `; 
        path += `L ${centerCol + neckRadiusCols} 0 `;
        path += `C ${centerCol + neckRadiusCols / 2} ${neckRows * 1.5}, ${centerCol - neckRadiusCols / 2} ${neckRows * 1.5}, ${centerCol - neckRadiusCols} 0 `;
        path += `L ${armholeIndentCols} 0 `;
        path += `Q 0 ${armholeRows / 2} 0 ${armholeRows} Z`;
        
      } else if (garmentType === 'raglan') {
        totalCols = Math.round((chestCm / 2 / 10) * sts10);
        totalRows = Math.round((lengthCm / 10) * rows10);
        projectName = 'Molde: Suéter (Ranglán)';
        
        const armholeRows = Math.round((armholeCm / 10) * rows10);
        const neckRows = Math.round((neckDropCm / 10) * rows10);
        const neckRadiusCols = Math.round((neckWidthCm / 2 / 10) * sts10);
        const armholeIndentCols = Math.round((4 / 10) * sts10);
        const centerCol = totalCols / 2;

        path = `M 0 ${totalRows} L ${totalCols} ${totalRows} L ${totalCols} ${armholeRows} `;
        path += `L ${totalCols - armholeIndentCols} ${armholeRows} `; // Sisa recta horizontal
        path += `L ${centerCol + neckRadiusCols} 0 `; // Diagonal Ranglán
        path += `C ${centerCol + neckRadiusCols / 2} ${neckRows * 1.5}, ${centerCol - neckRadiusCols / 2} ${neckRows * 1.5}, ${centerCol - neckRadiusCols} 0 `;
        path += `L ${armholeIndentCols} ${armholeRows} `; // Diagonal Ranglán
        path += `L 0 ${armholeRows} Z`; // Sisa recta horizontal

      } else if (garmentType === 'circular') {
        totalCols = Math.round((chestCm / 10) * sts10); // Sin dividir por 2
        totalRows = Math.round((lengthCm / 10) * rows10);
        projectName = 'Molde: Circular (Tubo)';
        
        path = `M 0 0 L ${totalCols} 0 L ${totalCols} ${totalRows} L 0 ${totalRows} Z`;
        
      } else if (garmentType === 'sleeve') {
        totalCols = Math.round((bicepsCm / 10) * sts10);
        totalRows = Math.round((sleeveLengthCm / 10) * rows10);
        projectName = 'Molde: Manga';

        const cuffCols = Math.round((cuffCm / 10) * sts10);
        const diffCols = (totalCols - cuffCols) / 2;

        path = `M ${diffCols} ${totalRows} L ${totalCols - diffCols} ${totalRows} `; // Puño (abajo)
        path += `L ${totalCols} 0 L 0 0 Z`; // Bíceps (arriba)
        
      } else if (garmentType === 'scarf') {
        totalCols = Math.round((rectWidthCm / 10) * sts10);
        totalRows = Math.round((rectLengthCm / 10) * rows10);
        projectName = 'Molde: Rectángulo / Bufanda';
        path = `M 0 0 L ${totalCols} 0 L ${totalCols} ${totalRows} L 0 ${totalRows} Z`;
        
      } else if (garmentType === 'hat') {
        // Gorro: mitad de circunferencia (plano)
        totalCols = Math.round((hatCircumferenceCm / 2 / 10) * sts10);
        totalRows = Math.round((hatHeightCm / 10) * rows10);
        projectName = 'Molde: Gorro';
        
        // Curva en el 1/3 superior
        const curveStartRow = Math.round(totalRows * 0.33); 
        path = `M 0 ${totalRows} L ${totalCols} ${totalRows} L ${totalCols} ${curveStartRow} `;
        // Curva parabólica hacia el centro arriba
        path += `Q ${totalCols} 0 ${totalCols / 2} 0 Q 0 0 0 ${curveStartRow} Z`;
      }

      createProject(projectName, 'knitting', totalCols, totalRows);
      const state = useStore.getState();

      useStore.setState({ 
        project: { 
          ...state.project, 
          cells: {}, // Dejamos el lienzo completamente limpio
          vectorGuides: [{ id: 'guia-molde', path, color: '#d32f2f', strokeWidth: 0.3 }]
        },
        history: [{}],
        histIdx: 0
      });

      setLoading(false);
      onCreated();
      onClose();
    }, 50);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="dlg-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--accent)' }}>✨</span> Generador de Prendas
            </h2>
            <p>Calcula y genera un molde paramétrico exacto basado en tu muestra de tensión.</p>
          </div>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="dlg-body">
          <div style={{ display: 'flex', gap: 30 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5 }}>1. Tipo de Prenda y Medidas (cm)</h3>
              
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">¿Qué deseas generar?</label>
                <select className="form-input" value={garmentType} onChange={e => setGarmentType(e.target.value)}>
                  <option value="front">Suéter / Chaleco (Clásico Delantero)</option>
                  <option value="back">Suéter / Chaleco (Clásico Espalda)</option>
                  <option value="raglan">Suéter / Chaleco (Ranglán)</option>
                  <option value="circular">Suéter Circular (Tubo cerrado)</option>
                  <option value="sleeve">Manga</option>
                  <option value="scarf">Bufanda / Manta (Rectángulo)</option>
                  <option value="hat">Gorro</option>
                </select>
              </div>

              {(garmentType === 'front' || garmentType === 'back' || garmentType === 'raglan' || garmentType === 'circular') && (
                <>
                  <div className="form-group">
                    <label className="form-label">{garmentType === 'circular' ? 'Contorno Total Pecho (cm)' : 'Contorno de Pecho (cm)'}</label>
                    <input type="number" className="form-input" value={chestCm} onChange={e => setChestCm(+e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Largo Total</label>
                    <input type="number" className="form-input" value={lengthCm} onChange={e => setLengthCm(+e.target.value)} />
                  </div>
                  {garmentType !== 'circular' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Alto de Sisa</label>
                        <input type="number" className="form-input" value={armholeCm} onChange={e => setArmholeCm(+e.target.value)} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Ancho Cuello</label>
                        <input type="number" className="form-input" value={neckWidthCm} onChange={e => setNeckWidthCm(+e.target.value)} />
                      </div>
                      {(garmentType === 'front' || garmentType === 'raglan') && (
                        <div className="form-group" style={{ flex: 1 }}>
                          <label className="form-label">Caída Cuello</label>
                          <input type="number" className="form-input" value={neckDropCm} onChange={e => setNeckDropCm(+e.target.value)} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {garmentType === 'sleeve' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Largo de Manga</label>
                    <input type="number" className="form-input" value={sleeveLengthCm} onChange={e => setSleeveLengthCm(+e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Contorno Bíceps (Arriba)</label>
                      <input type="number" className="form-input" value={bicepsCm} onChange={e => setBicepsCm(+e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Contorno Puño (Abajo)</label>
                      <input type="number" className="form-input" value={cuffCm} onChange={e => setCuffCm(+e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {garmentType === 'scarf' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Ancho (cm)</label>
                    <input type="number" className="form-input" value={rectWidthCm} onChange={e => setRectWidthCm(+e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Largo (cm)</label>
                    <input type="number" className="form-input" value={rectLengthCm} onChange={e => setRectLengthCm(+e.target.value)} />
                  </div>
                </>
              )}

              {garmentType === 'hat' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Contorno de Cabeza (cm)</label>
                    <input type="number" className="form-input" value={hatCircumferenceCm} onChange={e => setHatCircumferenceCm(+e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Altura del Gorro (cm)</label>
                    <input type="number" className="form-input" value={hatHeightCm} onChange={e => setHatHeightCm(+e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {/* Muestra de tensión */}
            <div style={{ width: 250 }}>
              <h3 style={{ fontSize: 14, marginBottom: 15, borderBottom: '1px solid var(--border)', paddingBottom: 5 }}>2. Muestra de Tensión (10x10 cm)</h3>
              <div className="form-group">
                <label className="form-label">Puntos (Ancho)</label>
                <input type="number" className="form-input" value={sts10} onChange={e => setSts10(+e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Vueltas (Alto)</label>
                <input type="number" className="form-input" value={rows10} onChange={e => setRows10(+e.target.value)} />
              </div>
              <div style={{ marginTop: 20, padding: 15, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>
                El lienzo se creará matemáticamente usando tus medidas y muestra. La guía vectorial en rojo limitará tu zona de trabajo exacto.
              </div>
            </div>
          </div>
        </div>

        <div className="dlg-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-accent" onClick={generate} disabled={loading}>
            {loading ? 'Calculando...' : 'Generar Molde Base →'}
          </button>
        </div>
      </div>
    </div>
  );
};
