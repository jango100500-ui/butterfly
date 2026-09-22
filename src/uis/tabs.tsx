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
    background: 'transparent',
    touchAction: 'none' as const,
  },
  tabBarBg: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    background: 'rgba(255, 255, 255, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    pointerEvents: 'none' as const,
  },
  tabItem: {
    position: 'relative' as const,
    zIndex: 2,
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
    touchAction: 'none' as const,
  },
  slider: {
    position: 'absolute' as const,
    top: '4px',
    left: '4px',
    height: 'calc(100% - 8px)',
    borderRadius: '27px',
    zIndex: 1,
    pointerEvents: 'none' as const,
    transformOrigin: 'center center',
    boxSizing: 'border-box' as const,
    willChange: 'transform, left, width, opacity',
    backgroundColor: 'rgba(0, 0, 0, 0.065)',
  },
  lensOverlay: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: '33px',
    zIndex: 3,
    pointerEvents: 'none' as const,
    opacity: 0,
  },
  icon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain' as const,
    filter: 'brightness(0)',
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none' as const,
  },
  avatarSkeleton: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxSizing: 'border-box' as const,
    transition: 'opacity 0.2s ease',
    pointerEvents: 'none' as const,
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
    background: 'transparent',
    border: 'none',
  },
  searchBg: {
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    background: 'rgba(255, 255, 255, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    pointerEvents: 'none' as const,
  }
};

export const Tabs: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabBarRef = useRef<HTMLDivElement>(null);
  const pillCenterRef = useRef({ x: 38, y: 33 });
  const pillSizeRef = useRef({ w: 74, h: 58 });

  const sliderRef = useRef<HTMLDivElement>(null);
  const lensOverlayRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isDraggingRef = useRef(false);
  const wasDraggingRef = useRef(false);
  const longPressTimerRef = useRef<number | null>(null);
  const lastTouchXRef = useRef(0);

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
      sliderRef.current.style.opacity = '1';
      if (lensOverlayRef.current) lensOverlayRef.current.style.opacity = '0';
      pillCenterRef.current.x = state.current.x + state.current.w / 2;
      pillCenterRef.current.y = 33;
      pillSizeRef.current.w = state.current.w;
      pillSizeRef.current.h = 58;
    } else {
      state.current.intensity = diff > 1 ? 1 : 0.65;
      state.current.isMoving = true;
      sliderRef.current.style.opacity = '0';
      if (lensOverlayRef.current) lensOverlayRef.current.style.opacity = '1';
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = tabBarRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touchX = e.clientX - rect.left;
    lastTouchXRef.current = touchX;
    wasDraggingRef.current = false;

    const activeEl = tabRefs.current[state.current.currentIndex];
    if (!activeEl) return;

    const pillLeft = activeEl.offsetLeft;
    const pillRight = pillLeft + activeEl.offsetWidth;

    if (touchX >= pillLeft && touchX <= pillRight) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      longPressTimerRef.current = window.setTimeout(() => {
        isDraggingRef.current = true;
        wasDraggingRef.current = true;
        state.current.isMoving = true;

        if (sliderRef.current) sliderRef.current.style.opacity = '0';
        if (lensOverlayRef.current) lensOverlayRef.current.style.opacity = '1';

        state.current.tsy = 1.38;
        state.current.tsx = 1.08;
      }, 160);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) {
      if (longPressTimerRef.current) {
        const rect = tabBarRef.current?.getBoundingClientRect();
        if (rect) {
          const touchX = e.clientX - rect.left;
          if (Math.abs(touchX - lastTouchXRef.current) > 6) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }
      return;
    }

    const rect = tabBarRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touchX = e.clientX - rect.left;
    const dx = touchX - lastTouchXRef.current;
    lastTouchXRef.current = touchX;

    const targetX = Math.max(4, Math.min(148 - state.current.w, touchX - state.current.w / 2));
    state.current.tx = targetX;

    const speed = Math.min(15, Math.abs(dx));
    const stretch = (speed / 15) * 0.14;
    state.current.tsy = 1.38 - stretch;
    state.current.tsx = 1.08;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const rect = tabBarRef.current?.getBoundingClientRect();
      const touchX = rect ? e.clientX - rect.left : lastTouchXRef.current;
      const snapIndex = touchX < 76 ? 0 : 1;
      setTarget(snapIndex);

      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 120);
    }
  };

  useEffect(() => {
    setTarget(0, true);

    let rafId: number;

    const update = () => {
      const s = state.current;
      const slider = sliderRef.current;
      const lens = lensOverlayRef.current;

      if (slider) {
        const dist = Math.abs(s.x - s.tx);
        const vel = Math.abs(s.vx);

        if (s.isMoving && !isDraggingRef.current) {
          if (dist > 12) {
            slider.style.opacity = '0';
            if (lens) lens.style.opacity = '1';

            s.tsy = 1 + (0.38 * s.intensity);
            s.tsx = 1.06;
          } else if (dist <= 12 && dist > 0.5) {
            slider.style.opacity = '1';
            if (lens) lens.style.opacity = '0';

            s.tsy = 1 - (0.05 * s.intensity);
            s.tsx = 1.0;
          } else {
            s.tsx = 1.0;
            s.tsy = 1.0;
            if (vel < 0.3 && Math.abs(s.vsx) < 0.3) {
              s.isMoving = false;
              slider.style.opacity = '1';
              if (lens) lens.style.opacity = '0';
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

        pillCenterRef.current.x = s.x + s.w / 2;
        pillCenterRef.current.y = 33;
        pillSizeRef.current.w = s.w * s.sx;
        pillSizeRef.current.h = 58 * s.sy;
      }

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <nav style={styles.navWrapper}>
      <div
        ref={tabBarRef}
        style={styles.tabBar}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Glass radius={33} />
        <div style={styles.tabBarBg} />

        <div ref={sliderRef} style={styles.slider} />

        <div ref={lensOverlayRef} style={styles.lensOverlay}>
          <Glass
            radius={27}
            noShadow
            isPill
            centerRef={pillCenterRef}
            sizeRef={pillSizeRef}
          />
        </div>

        <button
          ref={(el) => (tabRefs.current[0] = el)}
          style={styles.tabItem}
          onClick={() => {
            if (!wasDraggingRef.current && !isDraggingRef.current) {
              setTarget(0);
            }
          }}
        >
          <img
            src="/mocs/house.png"
            alt="Home"
            style={{
              ...styles.icon,
              opacity: activeIndex === 0 ? 1 : 0.35,
            }}
          />
        </button>

        <button
          ref={(el) => (tabRefs.current[1] = el)}
          style={styles.tabItem}
          onClick={() => {
            if (!wasDraggingRef.current && !isDraggingRef.current) {
              setTarget(1);
            }
          }}
        >
          <div
            className="shimmer"
            style={{
              ...styles.avatarSkeleton,
              opacity: activeIndex === 1 ? 1 : 0.35,
            }}
          />
        </button>
      </div>

      <button style={styles.searchButton}>
        <Glass radius={33} />
        <div style={styles.searchBg} />
        <img
          src="/mocs/search.png"
          alt="Search"
          style={{ ...styles.icon, position: 'relative', zIndex: 2 }}
        />
      </button>
    </nav>
  );
};
