import React from 'react';
import { Glass } from './glass';

const styles = {
  headerWrapper: {
    position: 'absolute' as const,
    top: '12px',
    right: '20px',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'none' as const,
  },
  filterButton: {
    position: 'relative' as const,
    width: '44px',
    height: '44px',
    borderRadius: '22px',
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
  },
  icon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain' as const,
    position: 'relative' as const,
    zIndex: 2,
  }
};

export const Head: React.FC = () => {
  return (
    <header style={styles.headerWrapper}>
      <button style={styles.filterButton}>
        <Glass radius={22} noShadow />
        <img
          src="/mocs/filter.png"
          alt="Filter"
          style={styles.icon}
        />
      </button>
    </header>
  );
};
