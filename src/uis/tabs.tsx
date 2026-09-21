import React, { useEffect, useRef, useState } from 'react';
import { Glass } from './glass';

const PHYSICS = {
  pos: { k: 380, d: 38, m: 1 },
  scale: { k: 420, d: 24, m: 1 }
};

const styles = {
  navWrapper: {
    position: 'absolute' as const,
    bottom: '24px',
    left: '0',
    width: '100%',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none' as const,
    zIndex: 10,
  },
  tabBar: {
    position: 'relative' as const,
    borderRadius: '33px',
    display: 'flex',
    padding: '4px',
    pointerEvents: 'auto' as const,
    width: '152px',
    height: '66px',
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(25px) saturate(180%)',
    WebkitBackdropFilter: 'blur(25px) saturate(180%)',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)',
  },
  tabItem: {
    position: 'relative' as const,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    flex: 1,
    cursor: 'pointer',
    outline: 'none',
    height: '100%',
    padding: 0,
  },
  slider: {
    position: 'absolute' as const,
    top: '4px',
    left: '4px',
    height: 'calc(100% - 8px)',
    borderRadius: '27px',
    zIndex: 3,
    pointerEvents: 'none' as const,
    transformOrigin: 'center center',
    boxSizing: 'border-box' as const,
    willChange: 'transform, left, width, background-color, border-color',
    transition: 'background-color 0.18s ease-out, border-color 0.18s ease-out',
    border: '1px solid transparent',
  },
  glassLayer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 'inherit',
    pointerEvents: 'none' as const,
    transition: 'opacity 0.18s ease-out',
  },
  icon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain' as const,
    filter: 'brightness(0)',
    transition: 'transform 0.18s ease-out, opacity 0.2s ease',
  },
  avatarSkeleton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxSizing: 'border-box' as const,
    transition: 'transform 0.18s ease-out, opacity 0.2s ease',
  },
  searchButton: {
    position: 'relative' as const,
    width: '66px',
    height: '66px',
    borderRadius: '33px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    pointerEvents: 'auto' as const,
    outline: 'none',
    padding: 0,
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(25px) saturate(180%)',
    WebkitBackdropFilter: 'blur(25px) saturate(180%)',
    border: '1.5px solid rgba(255, 255, 255, 0.95)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)',
  }
};

export const Tabs: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const state = useRef({
    x: 0, tx: 0, vx: 0,
    w: 0, tw: 0, vw: 0,
    sx: 1, tsx: 1, vsx: 0,
    sy: 1, tsy: 1, vsy: 0,
    isMoving: false,
    intensity: 1,
    currentIndex: 0
  });

  const spring = (current: number, target: number, velocity: number, config: { k: number; d: number; m: number }) => {
    const force = -config.k * (current - target);
    const damping = -config.d * velocity;
    const acceleration = (force + damping) / config.m;
    velocity += acceleration * 0.016;
    current += velocity * 0.016;
    return [current, velocity];
  };

  const setTarget = (idx: number, instant = false) => {
    const el = tabRefs.current[idx];
    if (!el || !sliderRef.current) return;

    const diff = Math.abs(idx - (state.current.currentIndex || 0));
    setActiveIndex(idx);

    state.current.tx = el.offsetLeft;
    state.current.tw = el.offsetWidth;
    state.current.currentIndex = idx;

    if (instant) {
      state.current.x = state.current.tx;
      state.current.w = state.current.tw;
      state.current.sx = 1;
      state.current.sy = 1;
      sliderRef.current.style.left = `${state.current.x}px`;
      sliderRef.current.style.width = `${state.current.w}px`;
      sliderRef.current.style.transform = `scale(1, 1)`;
      setIsFlying(false);
    } else {
      state.current.intensity = diff > 1 ? 1 : 0.6;
      state.current.isMoving = true;
      setIsFlying(true);
    }
  };

  useEffect(() => {
    setTarget(0, true);

    let rafId: number;

    const update = () => {
      const s = state.current;
      const slider = sliderRef.current;

      if (slider) {
        const dist = Math.abs(s.x - s.tx);
        const vel = Math.abs(s.vx);

        if (s.isMoving) {
          if (dist > 6) {
            s.tsy = 1 + (0.27 * s.intensity);
            s.tsx = 1 - (0.10 * s.intensity);
            setIsFlying(true);
          } else if (dist <= 6 && dist > 0.5) {
            s.tsy = 1 - (0.05 * s.intensity);
            s.tsx = 1 + (0.08 * s.intensity);
          } else {
            s.tsx = 1;
            s.tsy = 1;
            if (vel < 0.2 && Math.abs(s.vsx) < 0.2) {
              s.isMoving = false;
              setIsFlying(false);
            }
          }
        }

        [s.x, s.vx] = spring(s.x, s.tx, s.vx, PHYSICS.pos);
        [s.w, s.vw] = spring(s.w, s.tw, s.vw, PHYSICS.pos);
        [s.sx, s.vsx] = spring(s.sx, s.tsx, s.vsx, PHYSICS.scale);
        [s.sy, s.vsy] = spring(s.sy, s.tsy, s.vsy, PHYSICS.scale);

        slider.style.left = `${s.x}px`;
        slider.style.width = `${s.w}px`;
        slider.style.transform = `scale(${s.sx}, ${s.sy})`;
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <nav style={styles.navWrapper}>
      <div style={styles.tabBar}>
        <Glass radius={33} noShadow />

        <div
          ref={sliderRef}
          style={{
            ...styles.slider,
            backgroundColor: isFlying ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.065)',
            borderColor: isFlying ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
            backdropFilter: isFlying ? 'blur(8px) contrast(120%)' : 'none',
            WebkitBackdropFilter: isFlying ? 'blur(8px) contrast(120%)' : 'none',
          }}
        >
          <div style={{ ...styles.glassLayer, opacity: isFlying ? 1 : 0 }}>
            <Glass radius={27} noShadow />
          </div>
        </div>

        <button
          ref={(el) => (tabRefs.current[0] = el)}
          style={styles.tabItem}
          onClick={() => setTarget(0)}
        >
          <img
            src="/mocs/house.png"
            alt="Home"
            style={{
              ...styles.icon,
              opacity: activeIndex === 0 ? 1 : 0.35,
              transform: isFlying && activeIndex !== 0 ? 'scale(0.92)' : 'scale(1)',
            }}
          />
        </button>

        <button
          ref={(el) => (tabRefs.current[1] = el)}
          style={styles.tabItem}
          onClick={() => setTarget(1)}
        >
          <div
            className="shimmer"
            style={{
              ...styles.avatarSkeleton,
              opacity: activeIndex === 1 ? 1 : 0.35,
              transform: isFlying && activeIndex !== 1 ? 'scale(0.92)' : 'scale(1)',
            }}
          />
        </button>
      </div>

      <button style={styles.searchButton}>
        <Glass radius={33} noShadow />
        <img
          src="/mocs/search.png"
          alt="Search"
          style={{ ...styles.icon, position: 'relative', zIndex: 2 }}
        />
      </button>
    </nav>
  );
};
