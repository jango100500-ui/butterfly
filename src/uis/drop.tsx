import React, { useEffect, useRef, useState } from 'react';

export interface FallingItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'file';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  scale: number;
  opacity: number;
}

interface DropZoneProps {
  children: React.ReactNode;
}

const styles = {
  container: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  itemCard: {
    position: 'absolute' as const,
    width: '200px',
    height: '200px',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(0, 0, 0, 0.08)',
    border: '2px solid rgba(255, 255, 255, 0.95)',
    background: '#FFFFFF',
    pointerEvents: 'none' as const,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, opacity',
    transformOrigin: 'center center',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  fileBox: {
    padding: '24px 16px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#000000',
    marginTop: '10px',
    wordBreak: 'break-word' as const,
    maxWidth: '160px',
  },
  fileIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#F2F2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
  }
};

export const DropZone: React.FC<DropZoneProps> = ({ children }) => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const itemsRef = useRef<FallingItem[]>([]);
  itemsRef.current = items;

  const spawnItem = (file: File | Blob, clientX: number, clientY: number, fileName = 'file') => {
    const url = URL.createObjectURL(file);
    const mime = file.type || '';

    const isVideo = mime.startsWith('video/') || fileName.match(/\.(mp4|mov|webm)/i);
    const isImage = mime.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|heic)/i);

    const itemType: 'image' | 'video' | 'file' = isVideo ? 'video' : isImage ? 'image' : 'file';

    const cardWidth = 200;
    const cardHeight = 200;

    const posX = clientX > 0 ? clientX : window.innerWidth / 2;
    const posY = clientY > 0 ? clientY : window.innerHeight / 2 - 40;

    const clampedX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, posX - cardWidth / 2));
    const clampedY = Math.max(70, Math.min(window.innerHeight - cardHeight - 110, posY - cardHeight / 2));

    const newItem: FallingItem = {
      id: Math.random().toString(),
      url,
      name: fileName,
      type: itemType,
      x: clampedX,
      y: clampedY,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -1.5,
      rot: (Math.random() - 0.5) * 4,
      vRot: (Math.random() - 0.5) * 0.25,
      scale: 0.65,
      opacity: 1.0,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX || 0;
    const clientY = e.clientY || 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        spawnItem(file, clientX, clientY, file.name);
      });
      return;
    }

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        const file = item.getAsFile();
        if (file) {
          spawnItem(file, clientX, clientY, file.name);
          return;
        }
      }
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 30;

    Array.from(files).forEach((file) => {
      spawnItem(file, centerX, centerY, file.name);
    });

    e.target.value = '';
  };

  useEffect(() => {
    let rafId: number;

    const updatePhysics = () => {
      if (itemsRef.current.length > 0) {
        setItems((prevItems) => {
          return prevItems
            .map((item) => {
              const nextScale = Math.min(1.0, item.scale + 0.04);
              const nextVy = item.vy + 0.42;
              const nextY = item.y + nextVy;
              const nextX = item.x + item.vx;
              const nextRot = item.rot + item.vRot;

              return {
                ...item,
                x: nextX,
                y: nextY,
                vy: nextVy,
                rot: nextRot,
                scale: nextScale,
              };
            })
            .filter((item) => {
              const isAlive = item.y < window.innerHeight + 300;
              if (!isAlive) {
                URL.revokeObjectURL(item.url);
              }
              return isAlive;
            });
        });
      }

      rafId = requestAnimationFrame(updatePhysics);
    };

    rafId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      style={styles.container}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDrop={onDrop}
    >
      <input
        id="file-upload"
        type="file"
        accept="image/*,video/*,*/*"
        multiple
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
        onChange={onInputChange}
      />

      {children}

      {items.map((item) => (
        <div
          key={item.id}
          style={{
            ...styles.itemCard,
            transform: `translate3d(${item.x}px, ${item.y}px, 0) rotate(${item.rot}deg) scale(${item.scale})`,
            opacity: item.opacity,
          }}
        >
          {item.type === 'image' && (
            <img src={item.url} alt={item.name} style={styles.image} />
          )}
          {item.type === 'video' && (
            <video src={item.url} autoPlay muted loop playsInline style={styles.video} />
          )}
          {item.type === 'file' && (
            <div style={styles.fileBox}>
              <div style={styles.fileIcon}>📄</div>
              <span style={styles.fileName}>{item.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
