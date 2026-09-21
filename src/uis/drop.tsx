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
  hoverFrames: number;
}

interface DropZoneProps {
  children: React.ReactNode;
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  itemCard: {
    position: 'absolute' as const,
    width: '180px',
    maxHeight: '220px',
    borderRadius: '22px',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18), 0 6px 16px rgba(0, 0, 0, 0.08)',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
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
    maxHeight: '220px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  video: {
    width: '100%',
    height: '100%',
    maxHeight: '220px',
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
    fontSize: '13px',
    fontWeight: 600,
    color: '#000000',
    marginTop: '8px',
    wordBreak: 'break-word' as const,
    maxWidth: '140px',
  },
  fileIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: '#F2F2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  }
};

export const DropZone: React.FC<DropZoneProps> = ({ children }) => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const itemsRef = useRef<FallingItem[]>([]);
  itemsRef.current = items;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const spawnItemFromUrl = (url: string, name: string, mime: string, clientX: number, clientY: number) => {
    const itemType: 'image' | 'video' | 'file' = mime.startsWith('video/')
      ? 'video'
      : mime.startsWith('image/') || url.match(/\.(jpeg|jpg|gif|png|webp)/i)
      ? 'image'
      : 'file';

    const cardWidth = 180;
    const cardHeight = 180;

    const posX = clientX > 0 ? clientX : window.innerWidth / 2;
    const posY = clientY > 0 ? clientY : window.innerHeight / 2 - 40;

    const clampedX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, posX - cardWidth / 2));
    const clampedY = Math.max(70, Math.min(window.innerHeight - cardHeight - 110, posY - cardHeight / 2));

    const newItem: FallingItem = {
      id: Math.random().toString(),
      url,
      name,
      type: itemType,
      x: clampedX,
      y: clampedY,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.2,
      rot: (Math.random() - 0.5) * 3,
      vRot: (Math.random() - 0.5) * 0.25,
      scale: 0.95,
      opacity: 1.0,
      hoverFrames: 60,
    };

    setItems((prev) => [...prev, newItem]);
  };

  const spawnItemFromFile = (file: File, clientX: number, clientY: number) => {
    const url = URL.createObjectURL(file);
    spawnItemFromUrl(url, file.name, file.type, clientX, clientY);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.clientX || 0;
    const clientY = e.clientY || 0;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            spawnItemFromFile(file, clientX, clientY);
            return;
          }
        }
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      spawnItemFromFile(e.dataTransfer.files[0], clientX, clientY);
      return;
    }

    const uri = e.dataTransfer.getData('text/uri-list');
    if (uri) {
      spawnItemFromUrl(uri, 'image.jpg', 'image/jpeg', clientX, clientY);
      return;
    }

    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src\s*=\s*"([^"]+)"/i);
      if (match && match[1]) {
        spawnItemFromUrl(match[1], 'image.jpg', 'image/jpeg', clientX, clientY);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 40;
    spawnItemFromFile(files[0], centerX, centerY);

    e.target.value = '';
  };

  useEffect(() => {
    let rafId: number;

    const updatePhysics = () => {
      if (itemsRef.current.length > 0) {
        setItems((prevItems) => {
          const nextItems = prevItems
            .map((item) => {
              if (item.hoverFrames > 0) {
                const nextHover = item.hoverFrames - 1;
                const nextY = item.y + item.vy * 0.12;
                const nextRot = item.rot + item.vRot * 0.15;

                return {
                  ...item,
                  y: nextY,
                  rot: nextRot,
                  hoverFrames: nextHover,
                };
              }

              const nextVy = item.vy + 0.52;
              const nextY = item.y + nextVy;
              const nextX = item.x + item.vx;
              const nextRot = item.rot + item.vRot;

              return {
                ...item,
                x: nextX,
                y: nextY,
                vy: nextVy,
                rot: nextRot,
              };
            })
            .filter((item) => {
              const isAlive = item.y < window.innerHeight + 260;
              if (!isAlive && item.url.startsWith('blob:')) {
                URL.revokeObjectURL(item.url);
              }
              return isAlive;
            });

          return nextItems;
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
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
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
            <video
              src={item.url}
              autoPlay
              muted
              loop
              playsInline
              style={styles.video}
            />
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
