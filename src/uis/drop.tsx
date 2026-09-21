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
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  itemCard: {
    position: 'absolute' as const,
    width: '180px',
    maxHeight: '220px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.06)',
    border: '1.5px solid rgba(255, 255, 255, 0.9)',
    background: '#FFFFFF',
    pointerEvents: 'none' as const,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    willChange: 'transform, opacity',
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
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: '#F2F2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  }
};

export const DropZone: React.FC<DropZoneProps> = ({ children }) => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const itemsRef = useRef<FallingItem[]>([]);
  itemsRef.current = items;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);
    const mime = file.type;

    const itemType: 'image' | 'video' | 'file' = mime.startsWith('video/')
      ? 'video'
      : mime.startsWith('image/')
      ? 'image'
      : 'file';

    const cardWidth = 180;
    const cardHeight = 180;

    const dropX = e.clientX;
    const dropY = e.clientY;

    const clampedX = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, dropX - cardWidth / 2));
    const clampedY = Math.max(70, Math.min(window.innerHeight - cardHeight - 110, dropY - cardHeight / 2));

    const newItem: FallingItem = {
      id: Math.random().toString(),
      url,
      name: file.name,
      type: itemType,
      x: clampedX,
      y: clampedY,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -2.8,
      rot: (Math.random() - 0.5) * 4,
      vRot: (Math.random() - 0.5) * 0.45,
      scale: 0.78,
      opacity: 0.0,
    };

    setItems((prev) => [...prev, newItem]);
  };

  useEffect(() => {
    let rafId: number;

    const updatePhysics = () => {
      if (itemsRef.current.length > 0) {
        setItems((prevItems) => {
          const nextItems = prevItems
            .map((item) => {
              const nextVy = item.vy + 0.58;
              const nextY = item.y + nextVy;
              const nextX = item.x + item.vx;
              const nextRot = item.rot + item.vRot;
              const nextOpacity = Math.min(1.0, item.opacity + 0.14);
              const nextScale = Math.min(1.0, item.scale + 0.05);

              return {
                ...item,
                x: nextX,
                y: nextY,
                vy: nextVy,
                rot: nextRot,
                opacity: nextOpacity,
                scale: nextScale,
              };
            })
            .filter((item) => {
              const isAlive = item.y < window.innerHeight + 260;
              if (!isAlive) {
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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
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
