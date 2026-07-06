import React, { useState } from 'react';
import { AutoSaveSlot, getAutoSaveHistory } from '../hooks/useAutoSave';

interface Props {
  onRecover: (slot: AutoSaveSlot) => void;
  onDismiss: () => void;
}

export const AutoSaveRecoveryModal: React.FC<Props> = ({ onRecover, onDismiss }) => {
  const history = getAutoSaveHistory();
  const latest = history[history.length - 1];
  const [showAll, setShowAll] = useState(false);

  if (!latest) return null;

  const latestDate = new Date(latest.timestamp);
  const timeAgo = formatTimeAgo(latest.timestamp);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface-1, #1e1e2e)',
        border: '1px solid var(--border, #383850)',
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: '90%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        color: 'var(--text-1, #cdd6f4)',
      }}>
        {/* Ícono + Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'linear-gradient(135deg, #f38ba8 0%, #cba6f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0
          }}>
            🛡️
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Diseño Recuperable Encontrado
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2, #a6adc8)' }}>
              Detectamos un guardado automático reciente de tu labor
            </p>
          </div>
        </div>

        {/* Info del respaldo */}
        <div style={{
          background: 'var(--surface-2, #181825)',
          border: '1px solid var(--border, #383850)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>📐 {latest.projectName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2, #a6adc8)', marginTop: 4 }}>
                {latest.label}
              </div>
            </div>
            <div style={{
              background: 'rgba(203, 166, 247, 0.15)',
              color: '#cba6f7',
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0
            }}>
              {timeAgo}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2, #a6adc8)', marginTop: 8 }}>
            🕐 {latestDate.toLocaleString()}
          </div>
        </div>

        {/* Mostrar historial */}
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-2, #a6adc8)', fontSize: 12,
            marginBottom: showAll ? 8 : 16, padding: 0,
            textDecoration: 'underline'
          }}
        >
          {showAll ? '▲ Ocultar historial' : `▼ Ver todos los respaldos (${history.length})`}
        </button>

        {showAll && (
          <div style={{
            maxHeight: 160, overflowY: 'auto',
            border: '1px solid var(--border, #383850)',
            borderRadius: 8, marginBottom: 16,
          }}>
            {[...history].reverse().map((slot, i) => (
              <div
                key={slot.id}
                style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border, #383850)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                  background: i === 0 ? 'rgba(203,166,247,0.08)' : 'transparent',
                }}
                onClick={() => onRecover(slot)}
              >
                <span style={{ fontSize: 11, color: 'var(--text-2, #a6adc8)', minWidth: 20 }}>
                  #{history.length - i}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{slot.projectName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-2, #a6adc8)' }}>
                    {new Date(slot.timestamp).toLocaleString()}
                  </div>
                </div>
                {i === 0 && (
                  <span style={{ fontSize: 10, color: '#cba6f7', fontWeight: 600 }}>
                    MÁS RECIENTE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onDismiss}
            style={{
              flex: 1, padding: '10px 0',
              background: 'var(--surface-2, #181825)',
              border: '1px solid var(--border, #383850)',
              borderRadius: 8, cursor: 'pointer',
              color: 'var(--text-2, #a6adc8)', fontSize: 13, fontWeight: 600,
            }}
          >
            Descartar y Continuar
          </button>
          <button
            onClick={() => onRecover(latest)}
            style={{
              flex: 2, padding: '10px 0',
              background: 'linear-gradient(135deg, #cba6f7 0%, #89b4fa 100%)',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#1e1e2e', fontSize: 13, fontWeight: 700,
            }}
          >
            ✨ Recuperar último diseño
          </button>
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Hace menos de 1 min';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} días`;
}
