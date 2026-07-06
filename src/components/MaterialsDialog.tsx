import React, { useState, useMemo } from 'react';
import { useStore } from '../store';

export const MaterialsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = useStore(s => s.project);
  
  const [cmPerStitch, setCmPerStitch] = useState(5);
  const [metersPerSkein, setMetersPerSkein] = useState(250);
  const [pricePerSkein, setPricePerSkein] = useState(3.50);

  // Compute stats
  const stats = useMemo(() => {
    // Count cells per color
    const counts: Record<string, number> = {};
    Object.values(project.cells).forEach(colorId => {
      counts[colorId] = (counts[colorId] || 0) + 1;
    });

    let totalStitches = 0;
    let totalCost = 0;
    let totalSkeins = 0;

    const rows = project.colors.map(col => {
      const stitches = counts[col.id] || 0;
      totalStitches += stitches;
      
      const metersNeeded = (stitches * cmPerStitch) / 100;
      const safeMeters = metersNeeded * 1.1; // +10% safety margin
      const skeinsNeeded = Math.ceil(safeMeters / metersPerSkein);
      
      totalSkeins += skeinsNeeded;
      
      const cost = skeinsNeeded * pricePerSkein;
      totalCost += cost;

      return { ...col, stitches, safeMeters, skeinsNeeded, cost };
    });

    // Only show colors that have at least 1 stitch
    const activeRows = rows.filter(r => r.stitches > 0);

    return { rows: activeRows, totalStitches, totalCost, totalSkeins };
  }, [project.cells, project.colors, cmPerStitch, metersPerSkein, pricePerSkein]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="dlg dlg-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="dlg-header">
          <h2>Calculadora de Materiales</h2>
          <button className="dlg-close" onClick={onClose}>✕</button>
        </div>
        <div className="dlg-body">
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
            Calcula automáticamente cuántos ovillos necesitas basándote en tu patrón real. 
            El cálculo incluye un margen de seguridad del 10% para esconder hilos y muestras.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15, marginBottom: 20, background: 'var(--surface-2)', padding: 15, borderRadius: 8 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Longitud por punto (cm)</label>
              <input type="number" step="0.5" min="0" className="form-input" value={cmPerStitch} onChange={e => setCmPerStitch(Math.max(0, +e.target.value))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Metros por ovillo</label>
              <input type="number" min="1" className="form-input" value={metersPerSkein} onChange={e => setMetersPerSkein(Math.max(1, +e.target.value))} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Precio por ovillo ($)</label>
              <input type="number" step="0.5" min="0" className="form-input" value={pricePerSkein} onChange={e => setPricePerSkein(Math.max(0, +e.target.value))} />
            </div>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '8px 0' }}>Hilo</th>
                <th>Puntos Totales</th>
                <th>Metros (+10%)</th>
                <th>Ovillos a comprar</th>
                <th>Costo Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 16, height: 16, background: r.hex, border: '1px solid #000', borderRadius: 2 }} />
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                  </td>
                  <td>{r.stitches.toLocaleString()}</td>
                  <td>{r.safeMeters.toFixed(1)} m</td>
                  <td><b>{r.skeinsNeeded}</b></td>
                  <td style={{ color: 'var(--accent)' }}>${r.cost.toFixed(2)}</td>
                </tr>
              ))}
              {stats.rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)' }}>
                    El lienzo está vacío. Dibuja o importa un patrón primero.
                  </td>
                </tr>
              )}
            </tbody>
            {stats.rows.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', background: 'var(--surface-2)' }}>
                  <td style={{ padding: '10px 8px' }}>Total Proyecto</td>
                  <td>{stats.totalStitches.toLocaleString()}</td>
                  <td>-</td>
                  <td>{stats.totalSkeins} ovillos</td>
                  <td style={{ color: 'var(--accent)' }}>${stats.totalCost.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="dlg-footer">
          <button className="btn btn-accent" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
};
