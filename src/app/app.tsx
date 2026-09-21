import React from 'react';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    padding: '0 24px',
    textAlign: 'center' as const,
  },
  image: {
    width: '140px',
    height: '140px',
    objectFit: 'contain' as const,
    marginBottom: '24px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#000000',
    marginBottom: '8px',
    letterSpacing: '-0.4px',
  },
  subtitle: {
    fontSize: '15px',
    fontWeight: 400,
    color: '#8E8E93',
    lineHeight: 1.4,
    maxWidth: '280px',
  }
};

export const App: React.FC = () => {
  return (
    <main style={styles.container}>
      <img 
        src="/mocs/empty.png" 
        alt="Empty Inbox" 
        style={styles.image} 
      />
      <h1 style={styles.title}>
        Это твой личный инбокс
      </h1>
      <p style={styles.subtitle}>
        Бросай сюда всё, что хочешь — фото, видео, тексты, ссылки, файлы
      </p>
    </main>
  );
};
