import React, { useState } from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '0 32px',
    textAlign: 'center' as const,
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '320px',
    transform: 'translateY(-24px)',
  },
  imageWrapper: {
    width: '240px',
    height: '240px',
    position: 'relative' as const,
    marginBottom: '20px',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain' as const,
    transition: 'opacity 0.25s ease-out',
  },
  skeleton: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: '28px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#000000',
    marginBottom: '8px',
    letterSpacing: '-0.4px',
    lineHeight: 1.25,
  },
  subtitle: {
    fontSize: '16px',
    fontWeight: 400,
    color: '#8E8E93',
    lineHeight: 1.4,
    letterSpacing: '-0.2px',
  }
};

export const Empty: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.imageWrapper}>
          {!isLoaded && <div className="shimmer" style={styles.skeleton} />}
          <img
            src="/mocs/empty.png"
            alt="Empty Inbox"
            style={{ ...styles.image, opacity: isLoaded ? 1 : 0 }}
            onLoad={() => setIsLoaded(true)}
          />
        </div>
        <h1 style={styles.title}>
          Это твой личный инбокс
        </h1>
        <p style={styles.subtitle}>
          Бросай сюда всё, что хочешь — фото, видео, тексты, ссылки, файлы
        </p>
      </div>
    </div>
  );
};
