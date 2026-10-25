import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { IconUpload } from '@tabler/icons-react';
import { openFileObjects } from '../platform/fileLoader.ts';

export function DropZone({ children }: { children: ReactNode }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (event: DragEvent) => {
      event.preventDefault();
      // Check if dragging files from outside
      if (event.dataTransfer?.types.includes('Files')) {
        dragCounter++;
        setIsDraggingOver(true);
      }
    };

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer?.types.includes('Files')) {
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          setIsDraggingOver(false);
        }
      }
    };

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault();
      dragCounter = 0;
      setIsDraggingOver(false);

      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        await openFileObjects(event.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {children}
      {isDraggingOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'var(--scrim)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            color: '#ffffff',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          >
            <IconUpload size={36} stroke={2} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 600 }}>
            Drop log files here
          </span>
          <span style={{ fontSize: '13px', opacity: 0.85 }}>
            Open files directly in new tabs
          </span>
        </div>
      )}
    </div>
  );
}
