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
    position: 'absolute' as const,
    inset: 0,
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
    zIndex: 5, // Летит ПОВЕРХ фона, но ПОД таббаром
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

  const handleFiles = (files: FileList | null, clientX: number, clientY: number) => {
    if (!files || files.length === 0) return;

    const newItems: FallingItem[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      const mime = file.type;
      
      const itemType: 'image' | 'video' | 'file' = mime.startsWith('video/')
        ? 'video'
        : mime.startsWith('image/') ? 'image' : 'file';

      const cardWidth = 180;
      const cardHeight = 180;

      const posX = clientX > 0 ? clientX : window.innerWidth / 2;
      const posY = clientY > 0 ? clientY : window.innerHeight / 2 - 40;

      const clampedX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, posX - cardWidth / 2));
      const clampedY = Math.max(70, Math.min(window.innerHeight - cardHeight - 110, posY - cardHeight / 2));

      return {
        id: Math.random().toString(),
        url,
        name: file.name,
        type: itemType,
        x: clampedX,
        y: clampedY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -1.2,
        rot: (Math.random() - 0.5) * 3,
        vRot: (Math.random() - 0.5) * 0.25,
        scale: 0.95,
        opacity: 0.0,
        hoverFrames: 50, // Висит в воздухе ~0.8 секунды
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files, e.clientX, e.clientY);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2 - 40;
    handleFiles(e.target.files, centerX, centerY);
    e.target.value = ''; // Сбрасываем инпут
  };

  useEffect(() => {
    let rafId: number;

    const updatePhysics = () => {
      if (itemsRef.current.length > 0) {
        setItems((prevItems) => {
          return prevItems
            .map((item) => {
              // Плавное проявление
              const nextOpacity = Math.min(1.0, item.opacity + 0.15);

              // Парение в воздухе
              if (item.hoverFrames > 0) {
                return {
                  ...item,
                  y: item.y + item.vy * 0.12,
                  rot: item.rot + item.vRot * 0.15,
                  opacity: nextOpacity,
                  hoverFrames: item.hoverFrames - 1,
                };
              }

              // Падение с гравитацией
              const nextVy = item.vy + 0.55;
              const nextY = item.y + nextVy;
              const nextX = item.x + item.vx;
              const nextRot = item.rot + item.vRot;

              return {
                ...item,
                x: nextX,
                y: nextY,
                vy: nextVy,
                rot: nextRot,
                opacity: nextOpacity,
              };
            })
            .filter((item) => {
              const isAlive = item.y < window.innerHeight + 200;
              if (!isAlive) {
                URL.revokeObjectURL(item.url); // Чистим память
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
      {/* Нативный скрытый инпут. Работает как швейцарские часы на iOS */}
      <input
        id="file-upload"
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={onInputChange}
      />

      {children}

      {/* Рендеринг падающих файлов */}
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
