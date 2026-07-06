import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';

// ─── Constantes ───────────────────────────────────────────────────────────────
const AUTOSAVE_STORAGE_KEY = 'tramado_autosave_history';
const MAX_SLOTS = 10;
const AUTOSAVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos
const CHANGE_BURST_LIMIT = 20; // Guardar tras 20 cambios acumulados

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface AutoSaveSlot {
  id: string;
  timestamp: number;           // Date.now()
  label: string;               // "patron_autosave_2026-07-06_17-45"
  projectName: string;
  projectData: string;         // JSON serializado del proyecto
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatLabel(): string {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  return `patron_autosave_${y}-${mo}-${d}_${h}-${mi}`;
}

/** Lee el historial desde localStorage */
export function getAutoSaveHistory(): AutoSaveSlot[] {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AutoSaveSlot[];
  } catch {
    return [];
  }
}

/** Último respaldo (el más reciente) */
export function getLatestAutoSave(): AutoSaveSlot | null {
  const history = getAutoSaveHistory();
  if (history.length === 0) return null;
  return history[history.length - 1];
}

/** Guarda un slot nuevo manteniendo máx. 10, eliminando el más antiguo si es necesario */
function writeAutoSaveSlot(projectData: string, projectName: string) {
  let history = getAutoSaveHistory();

  const slot: AutoSaveSlot = {
    id: String(Date.now()),
    timestamp: Date.now(),
    label: formatLabel(),
    projectName,
    projectData,
  };

  history.push(slot);

  // Rotación: si supera MAX_SLOTS, eliminar el más antiguo
  if (history.length > MAX_SLOTS) {
    history = history.slice(history.length - MAX_SLOTS);
  }

  try {
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('[AutoSave] Error escribiendo en localStorage:', e);
  }

  return slot;
}

// ─── Hook Principal ───────────────────────────────────────────────────────────
export function useAutoSave() {
  const project = useStore(s => s.project);
  const changeCountRef = useRef(0);
  const lastSavedSnapshotRef = useRef<string>('');

  const performAutoSave = useCallback(() => {
    const state = useStore.getState();
    const snapshot = JSON.stringify(state.project);

    // Evitar guardar si no hubo cambios reales
    if (snapshot === lastSavedSnapshotRef.current) return;
    lastSavedSnapshotRef.current = snapshot;

    const slot = writeAutoSaveSlot(snapshot, state.project.name);
    changeCountRef.current = 0;

    console.info(`[AutoSave] ✅ Guardado automático: ${slot.label} (${slot.projectName})`);
  }, []);

  // ── Temporizador cada 2 minutos ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(performAutoSave, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [performAutoSave]);

  // ── Detector de ráfaga de cambios ──────────────────────────────────────────
  useEffect(() => {
    changeCountRef.current += 1;

    // Guardar inmediatamente si alcanzamos el límite de ráfaga
    if (changeCountRef.current >= CHANGE_BURST_LIMIT) {
      performAutoSave();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.cells, project.colors, project.placedSymbols]);

  return { performAutoSave };
}
