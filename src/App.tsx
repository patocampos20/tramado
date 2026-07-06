import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import EditorScreen from './components/EditorScreen';
import { AutoSaveRecoveryModal } from './components/AutoSaveRecoveryModal';
import { useStore } from './store';
import { getLatestAutoSave, AutoSaveSlot } from './hooks/useAutoSave';
import './index.css';

type Screen = 'home' | 'editor';

// Clave para detectar cierre inesperado (bandera de sesión activa)
const SESSION_FLAG_KEY = 'tramado_session_active';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [recoverySlot, setRecoverySlot] = useState<AutoSaveSlot | null>(null);
  const loadProject = useStore(s => s.loadProject);

  // ── Detectar cierre inesperado al inicio ──────────────────────────────────
  useEffect(() => {
    const wasActive = sessionStorage.getItem(SESSION_FLAG_KEY);
    const latestSave = getLatestAutoSave();

    // Si había una sesión activa (flag no fue borrado limpiamente) y hay un autosave
    if (wasActive === 'true' && latestSave) {
      // Verificar que el autosave tiene menos de 24h de antigüedad
      const ageHours = (Date.now() - latestSave.timestamp) / 3600000;
      if (ageHours < 24) {
        setRecoverySlot(latestSave);
      }
    }

    // Marcar que hay una sesión activa
    sessionStorage.setItem(SESSION_FLAG_KEY, 'true');

    // Al cerrar limpiamente, borrar la bandera
    const handleBeforeUnload = () => {
      sessionStorage.removeItem(SESSION_FLAG_KEY);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Handler para abrir archivos .tramado vía doble clic (Electron) ─────────
  useEffect(() => {
    if ((window as any).require) {
      try {
        const { ipcRenderer } = (window as any).require('electron');

        const handleOpenFile = (_event: any, project: any) => {
          if (project && project.id && project.canvas) {
            loadProject(project);
            setScreen('editor');
          }
        };

        ipcRenderer.on('open-tramado-file', handleOpenFile);
        return () => {
          ipcRenderer.removeListener('open-tramado-file', handleOpenFile);
        };
      } catch (err) {
        console.warn('Electron IPC no disponible en entorno web');
      }
    }
  }, [loadProject]);

  // ── Recuperar desde un slot de auto-guardado ──────────────────────────────
  const handleRecover = (slot: AutoSaveSlot) => {
    try {
      const project = JSON.parse(slot.projectData);
      if (project && project.id && project.canvas) {
        loadProject(project);
        setScreen('editor');
      }
    } catch (e) {
      alert('Error al recuperar el diseño. El archivo puede estar dañado.');
    }
    setRecoverySlot(null);
  };

  const handleDismissRecovery = () => {
    setRecoverySlot(null);
  };

  return (
    <>
      {/* Modal de Recuperación (aparece antes que todo si hay cierre inesperado) */}
      {recoverySlot && (
        <AutoSaveRecoveryModal
          onRecover={handleRecover}
          onDismiss={handleDismissRecovery}
        />
      )}

      {screen === 'home'
        ? <HomeScreen onEnter={() => setScreen('editor')} />
        : <EditorScreen onHome={() => setScreen('home')} />
      }
    </>
  );
};

export default App;
