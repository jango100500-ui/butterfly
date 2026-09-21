import React, { useState } from 'react';

export interface CardItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'file';
  startX: number;
  startY: number;
  driftX: number;
  rotStart: number;
  rotEnd: number;
}

interface DropZoneProps {
  children: React.ReactNode;
}

const styles = {
  wrapper: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  nativeInput: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 4,
    WebkitTapHighlightColor: 'transparent',
  },
  card: {
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
  const [cards, setCards] = useState<CardItem[]>([]);

  const handleFiles = (files: FileList | null, originX?: number, originY?: number) => {
    if (!files || files.length === 0) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const defaultX = originX && originX > 0 ? originX : screenW / 2;
    const defaultY = originY && originY > 0 ? originY : screenH / 2 - 30;

    const newCards: CardItem[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      const mime = file.type || '';

      const isVideo = mime.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)/i);
      const isImage = mime.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp|heic)/i);
      const itemType: 'image' | 'video' | 'file' = isVideo ? 'video' : isImage ? 'image' : 'file';

      const cardW = 200;
      const cardH = 200;

      const clampedX = Math.max(16, Math.min(screenW - cardW - 16, defaultX - cardW / 2));
      const clampedY = Math.max(80, Math.min(screenH - cardH - 120, defaultY - cardH / 2));

      const drift = (Math.random() - 0.5) * 50;
      const rStart = (Math.random() - 0.5) * 6;
      const rEnd = rStart + (Math.random() - 0.5) * 12;

      return {
        id: Math.random().toString(),
        url,
        name: file.name,
        type: itemType,
        startX: clampedX,
        startY: clampedY,
        driftX: drift,
        rotStart: rStart,
        rotEnd: rEnd,
      };
    });

    setCards((prev) => [...prev, ...newCards]);
  };

  const removeCard = (id: string, url: string) => {
    URL.revokeObjectURL(url);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes floatAndFall {
          0% {
            opacity: 0;
            transform: translate3d(var(--x), var(--y), 0) scale(0.65) rotate(var(--r-start));
          }
          14% {
            opacity: 1;
            transform: translate3d(var(--x), var(--y), 0) scale(1.02) rotate(var(--r-start));
          }
          20% {
            opacity: 1;
            transform: translate3d(var(--x), var(--y), 0) scale(1.0) rotate(var(--r-start));
          }
          45% {
            opacity: 1;
            transform: translate3d(var(--x), calc(var(--y) - 8px), 0) scale(1.0) rotate(var(--r-start));
          }
          100% {
            opacity: 1;
            transform: translate3d(calc(var(--x) + var(--drift)), calc(100vh + 300px), 0) scale(1.0) rotate(var(--r-end));
          }
        }
      `}</style>

      <input
        type="file"
        multiple
        accept="image/*,video/*,*/*"
        style={styles.nativeInput}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        onDrop={(e) => {
          handleFiles(e.dataTransfer.files, e.clientX, e.clientY);
        }}
      />

      {children}

      {cards.map((card) => {
        const customVars = {
          '--x': `${card.startX}px`,
          '--y': `${card.startY}px`,
          '--drift': `${card.driftX}px`,
          '--r-start': `${card.rotStart}deg`,
          '--r-end': `${card.rotEnd}deg`,
        } as React.CSSProperties;

        return (
          <div
            key={card.id}
            style={{
              ...styles.card,
              ...customVars,
              top: 0,
              left: 0,
              animation: 'floatAndFall 2.4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
            }}
            onAnimationEnd={() => removeCard(card.id, card.url)}
          >
            {card.type === 'image' && (
              <img src={card.url} alt={card.name} style={styles.image} />
            )}

            {card.type === 'video' && (
              <video
                src={card.url}
                autoPlay
                muted
                loop
                playsInline
                style={styles.video}
              />
            )}

            {card.type === 'file' && (
              <div style={styles.fileBox}>
                <div style={styles.fileIcon}>📄</div>
                <span style={styles.fileName}>{card.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
